"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/get-user";
import { getUserFavoriteTeams } from "./favorites";
import {
  formatDateKey,
  formatMatchTime,
  getMatchDayFromUtc,
  getTodayStart,
  normalizeSelectedDate,
} from "@/lib/date-time";
import type {
  ApiFootballFixtureEvent,
  ApiFootballFixtureStatistics,
  ApiFootballFixtureStatisticsResponse,
  ApiFootballFixtureEventsResponse,
  ApiFootballTeamFixture,
  ApiFootballTeamsResponse,
  DerivedStatKey,
  SyncTeamStatisticsResult,
  TeamMatchDerived,
  TeamMatchStats,
  TeamStatKey,
  TeamStatisticsPageData,
  TeamStatisticsMatchColumn,
} from "@/lib/types/team-statistics";
import {
  DERIVED_LABELS,
  STAT_CATEGORIES,
} from "@/lib/types/team-statistics";
const FINISHED_STATUSES = ["FT", "AET", "PEN"];
const MAX_FIXTURE_STATS_PER_SYNC = 40;

const STAT_TYPE_MAP: Record<string, TeamStatKey> = {
  "Ball Possession": "possession",
  "Total Shots": "shotsTotal",
  "Shots on Goal": "shotsOnTarget",
  "Shots off Goal": "shotsOffTarget",
  "Blocked Shots": "shotsBlocked",
  "Corner Kicks": "corners",
  Fouls: "fouls",
  Offsides: "offsides",
  "Yellow Cards": "yellowCards",
  "Red Cards": "redCards",
  "Goalkeeper Saves": "saves",
  "Total passes": "passes",
  Passes: "passes",
  "Passes accurate": "passesAccurate",
  "Passes %": "passesAccurate",
  Crosses: "crosses",
  "Free Kicks": "freeKicks",
  "Throw-ins": "throwIns",
  "Goal Kicks": "goalKicks",
};

const HALF_STAT_OVERRIDES: Partial<Record<TeamStatKey, TeamStatKey>> = {
  shotsTotal: "shotsFirstHalf",
  corners: "cornersFirstHalf",
  fouls: "foulsFirstHalf",
  yellowCards: "cardsFirstHalf",
  redCards: "cardsFirstHalf",
};

function getApiKey(): string | null {
  return process.env.API_FOOTBALL_KEY ?? null;
}

async function apiFootballGet<T>(path: string): Promise<T | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const response = await fetch(`https://v3.football.api-sports.io${path}`, {
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": "v3.football.api-sports.io",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`API-Football ${path}:`, response.status);
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(`API-Football fetch error ${path}:`, error);
    return null;
  }
}

function parseStatValue(value: number | string | null): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  const cleaned = String(value).replace("%", "").trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeStatistics(
  items: { type: string; value: number | string | null }[],
  isFirstHalf = false
): TeamMatchStats {
  const stats: TeamMatchStats = {};

  for (const item of items) {
    const baseKey = STAT_TYPE_MAP[item.type];
    if (!baseKey) continue;

    const key =
      isFirstHalf && HALF_STAT_OVERRIDES[baseKey]
        ? HALF_STAT_OVERRIDES[baseKey]
        : baseKey;

    const value = parseStatValue(item.value);
    if (value === null) continue;

    if (key === "cardsFirstHalf" && baseKey === "redCards") {
      stats.cardsFirstHalf = (stats.cardsFirstHalf ?? 0) + value;
    } else if (key === "cardsFirstHalf" && baseKey === "yellowCards") {
      stats.cardsFirstHalf = (stats.cardsFirstHalf ?? 0) + value;
    } else {
      stats[key] = value;
    }
  }

  return stats;
}

function mergeStats(full: TeamMatchStats, half: TeamMatchStats): TeamMatchStats {
  const merged = { ...full, ...half };

  if (
    merged.corners != null &&
    merged.cornersFirstHalf != null &&
    merged.cornersSecondHalf == null
  ) {
    merged.cornersSecondHalf = Math.max(
      0,
      merged.corners - merged.cornersFirstHalf
    );
  }

  if (
    merged.yellowCards != null &&
    merged.redCards != null &&
    merged.cardsSecondHalf == null &&
    merged.cardsFirstHalf != null
  ) {
    const totalCards = merged.yellowCards + merged.redCards;
    merged.cardsSecondHalf = Math.max(0, totalCards - merged.cardsFirstHalf);
  }

  return merged;
}

function getScoredFirstTeamApiId(
  events: ApiFootballFixtureEvent[]
): number | null {
  const goalEvents = events
    .filter((e) => e.type === "Goal" && e.detail !== "Missed Penalty")
    .sort((a, b) => {
      const aMin = (a.time.elapsed ?? 0) + (a.time.extra ?? 0);
      const bMin = (b.time.elapsed ?? 0) + (b.time.extra ?? 0);
      return aMin - bMin;
    });

  return goalEvents[0]?.team.id ?? null;
}

function computeDerivedStats(params: {
  teamApiId: number;
  isHome: boolean;
  homeScore: number | null;
  awayScore: number | null;
  htHome: number | null;
  htAway: number | null;
  scoredFirstTeamApiId: number | null;
  teamStats: TeamMatchStats;
  opponentStats: TeamMatchStats;
}): TeamMatchDerived {
  const {
    teamApiId,
    isHome,
    homeScore,
    awayScore,
    htHome,
    htAway,
    scoredFirstTeamApiId,
    teamStats,
    opponentStats,
  } = params;

  const teamGoals = isHome ? (homeScore ?? 0) : (awayScore ?? 0);
  const oppGoals = isHome ? (awayScore ?? 0) : (homeScore ?? 0);
  const teamHt = isHome ? htHome : htAway;
  const oppHt = isHome ? htAway : htHome;

  const derived: TeamMatchDerived = {
    btts: homeScore != null && awayScore != null && homeScore > 0 && awayScore > 0,
    scoredFirst:
      scoredFirstTeamApiId != null ? scoredFirstTeamApiId === teamApiId : null,
    wonFirstHalf:
      teamHt != null && oppHt != null ? teamHt > oppHt : null,
    wonSecondHalf: null,
    mostFirstHalfCorners: null,
    mostSecondHalfCorners: null,
  };

  if (teamHt != null && oppHt != null && homeScore != null && awayScore != null) {
    const teamSecond = teamGoals - teamHt;
    const oppSecond = oppGoals - oppHt;
    derived.wonSecondHalf = teamSecond > oppSecond;
  }

  const teamFhCorners = teamStats.cornersFirstHalf;
  const oppFhCorners = opponentStats.cornersFirstHalf;
  if (teamFhCorners != null && oppFhCorners != null) {
    derived.mostFirstHalfCorners = teamFhCorners > oppFhCorners;
  }

  const teamShCorners = teamStats.cornersSecondHalf;
  const oppShCorners = opponentStats.cornersSecondHalf;
  if (teamShCorners != null && oppShCorners != null) {
    derived.mostSecondHalfCorners = teamShCorners > oppShCorners;
  }

  return derived;
}

function getCurrentSeason(): number {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  return month < 7 ? year - 1 : year;
}

async function ensureMatchFromApiFixture(
  fixture: ApiFootballTeamFixture
): Promise<string | null> {
  const league = await prisma.league.upsert({
    where: { apiId: fixture.league.id },
    update: {
      name: fixture.league.name,
      logo: fixture.league.logo,
      country: fixture.league.country,
    },
    create: {
      apiId: fixture.league.id,
      name: fixture.league.name,
      logo: fixture.league.logo,
      country: fixture.league.country,
      sport: "FUTEBOL",
    },
  });

  const homeTeam = await prisma.team.upsert({
    where: { apiId: fixture.teams.home.id },
    update: {
      name: fixture.teams.home.name,
      logo: fixture.teams.home.logo,
    },
    create: {
      apiId: fixture.teams.home.id,
      name: fixture.teams.home.name,
      logo: fixture.teams.home.logo,
      sport: "FUTEBOL",
    },
  });

  const awayTeam = await prisma.team.upsert({
    where: { apiId: fixture.teams.away.id },
    update: {
      name: fixture.teams.away.name,
      logo: fixture.teams.away.logo,
    },
    create: {
      apiId: fixture.teams.away.id,
      name: fixture.teams.away.name,
      logo: fixture.teams.away.logo,
      sport: "FUTEBOL",
    },
  });

  const utcDate = new Date(fixture.fixture.date);
  const matchDate = getMatchDayFromUtc(utcDate);
  const time = formatMatchTime(utcDate);

  const match = await prisma.match.upsert({
    where: { apiId: fixture.fixture.id },
    update: {
      date: matchDate,
      time,
      utcDate,
      status: fixture.fixture.status.short,
      season: fixture.league.season,
      homeScore: fixture.goals.home,
      awayScore: fixture.goals.away,
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      leagueId: league.id,
    },
    create: {
      apiId: fixture.fixture.id,
      sport: "FUTEBOL",
      date: matchDate,
      time,
      utcDate,
      status: fixture.fixture.status.short,
      season: fixture.league.season,
      homeScore: fixture.goals.home,
      awayScore: fixture.goals.away,
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      leagueId: league.id,
    },
  });

  return match.id;
}

async function fetchFixtureStatistics(
  fixtureApiId: number,
  half = false
): Promise<ApiFootballFixtureStatistics[]> {
  const halfParam = half ? "&half=true" : "";
  const data = await apiFootballGet<ApiFootballFixtureStatisticsResponse>(
    `/fixtures/statistics?fixture=${fixtureApiId}${halfParam}`
  );
  return data?.response ?? [];
}

async function fetchFixtureEvents(
  fixtureApiId: number
): Promise<ApiFootballFixtureEvent[]> {
  const data = await apiFootballGet<ApiFootballFixtureEventsResponse>(
    `/fixtures/events?fixture=${fixtureApiId}`
  );
  return data?.response ?? [];
}

async function fetchTeamFixtures(
  teamApiId: number,
  leagueApiId: number,
  season: number,
  from?: string,
  to?: string
): Promise<ApiFootballTeamFixture[]> {
  let path = `/fixtures?team=${teamApiId}&league=${leagueApiId}&season=${season}&status=FT`;
  if (from) path += `&from=${from}`;
  if (to) path += `&to=${to}`;

  const data = await apiFootballGet<{ response: ApiFootballTeamFixture[] }>(path);
  return data?.response ?? [];
}

async function fetchLeagueTeams(
  leagueApiId: number,
  season: number
): Promise<number[]> {
  const data = await apiFootballGet<ApiFootballTeamsResponse>(
    `/teams?league=${leagueApiId}&season=${season}`
  );
  return data?.response.map((r) => r.team.id) ?? [];
}

async function processFixtureStatistics(
  fixture: ApiFootballTeamFixture
): Promise<boolean> {
  const existing = await prisma.matchTeamStatistic.findFirst({
    where: { match: { apiId: fixture.fixture.id } },
  });
  if (existing) return false;

  const fullStats = await fetchFixtureStatistics(fixture.fixture.id, false);
  if (fullStats.length < 2) return false;

  const halfStats = await fetchFixtureStatistics(fixture.fixture.id, true);
  const events = await fetchFixtureEvents(fixture.fixture.id);
  const scoredFirstTeamApiId = getScoredFirstTeamApiId(events);

  const matchId = await ensureMatchFromApiFixture(fixture);
  if (!matchId) return false;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { homeTeam: true, awayTeam: true, league: true },
  });
  if (!match) return false;

  const htHome = fixture.score.halftime.home;
  const htAway = fixture.score.halftime.away;

  const homeFull = normalizeStatistics(
    fullStats.find((s) => s.team.id === fixture.teams.home.id)?.statistics ?? []
  );
  const awayFull = normalizeStatistics(
    fullStats.find((s) => s.team.id === fixture.teams.away.id)?.statistics ?? []
  );
  const homeHalf = normalizeStatistics(
    halfStats.find((s) => s.team.id === fixture.teams.home.id)?.statistics ?? [],
    true
  );
  const awayHalf = normalizeStatistics(
    halfStats.find((s) => s.team.id === fixture.teams.away.id)?.statistics ?? [],
    true
  );

  const homeStats = mergeStats(homeFull, homeHalf);
  const awayStats = mergeStats(awayFull, awayHalf);

  homeStats.goals = fixture.goals.home;
  awayStats.goals = fixture.goals.away;
  if (htHome != null) homeStats.goalsFirstHalf = htHome;
  if (htAway != null) awayStats.goalsFirstHalf = htAway;
  if (htHome != null && fixture.goals.home != null) {
    homeStats.goalsSecondHalf = fixture.goals.home - htHome;
  }
  if (htAway != null && fixture.goals.away != null) {
    awayStats.goalsSecondHalf = fixture.goals.away - htAway;
  }

  const homeDerived = computeDerivedStats({
    teamApiId: fixture.teams.home.id,
    isHome: true,
    homeScore: fixture.goals.home,
    awayScore: fixture.goals.away,
    htHome,
    htAway,
    scoredFirstTeamApiId,
    teamStats: homeStats,
    opponentStats: awayStats,
  });

  const awayDerived = computeDerivedStats({
    teamApiId: fixture.teams.away.id,
    isHome: false,
    homeScore: fixture.goals.home,
    awayScore: fixture.goals.away,
    htHome,
    htAway,
    scoredFirstTeamApiId,
    teamStats: awayStats,
    opponentStats: homeStats,
  });

  const season = fixture.league.season;
  const matchDate = getMatchDayFromUtc(fixture.fixture.date);

  await prisma.$transaction([
    prisma.matchTeamStatistic.upsert({
      where: {
        matchId_teamId: {
          matchId: match.id,
          teamId: match.homeTeamId,
        },
      },
      update: {
        stats: homeStats,
        derived: homeDerived,
        season,
        isHome: true,
        opponentTeamId: match.awayTeamId,
        leagueId: match.leagueId,
      },
      create: {
        matchId: match.id,
        teamId: match.homeTeamId,
        opponentTeamId: match.awayTeamId,
        leagueId: match.leagueId,
        season,
        isHome: true,
        stats: homeStats,
        derived: homeDerived,
      },
    }),
    prisma.matchTeamStatistic.upsert({
      where: {
        matchId_teamId: {
          matchId: match.id,
          teamId: match.awayTeamId,
        },
      },
      update: {
        stats: awayStats,
        derived: awayDerived,
        season,
        isHome: false,
        opponentTeamId: match.homeTeamId,
        leagueId: match.leagueId,
      },
      create: {
        matchId: match.id,
        teamId: match.awayTeamId,
        opponentTeamId: match.homeTeamId,
        leagueId: match.leagueId,
        season,
        isHome: false,
        stats: awayStats,
        derived: awayDerived,
      },
    }),
    prisma.teamStatsSync.upsert({
      where: {
        teamId_leagueId_season: {
          teamId: match.homeTeamId,
          leagueId: match.leagueId,
          season,
        },
      },
      update: { lastMatchDate: matchDate, syncedAt: new Date() },
      create: {
        teamId: match.homeTeamId,
        leagueId: match.leagueId,
        season,
        lastMatchDate: matchDate,
      },
    }),
    prisma.teamStatsSync.upsert({
      where: {
        teamId_leagueId_season: {
          teamId: match.awayTeamId,
          leagueId: match.leagueId,
          season,
        },
      },
      update: { lastMatchDate: matchDate, syncedAt: new Date() },
      create: {
        teamId: match.awayTeamId,
        leagueId: match.leagueId,
        season,
        lastMatchDate: matchDate,
      },
    }),
  ]);

  return true;
}

interface PendingFixture {
  fixture: ApiFootballTeamFixture;
  priority: number;
}

function wasSyncedToday(syncedAt: Date, today: Date): boolean {
  return formatDateKey(syncedAt) === formatDateKey(today);
}

/** Sync de estatísticas de um único time/liga (gatilho: clique no time). */
export async function syncTeamStatisticsForTeam(params: {
  teamId: string;
  leagueId: string;
  season?: number;
  force?: boolean;
  maxFixturesPerRun?: number;
}): Promise<SyncTeamStatisticsResult> {
  const {
    teamId,
    leagueId,
    season: seasonParam,
    force = false,
    maxFixturesPerRun = MAX_FIXTURE_STATS_PER_SYNC,
  } = params;

  if (!getApiKey()) {
    return { success: false, processed: 0, skipped: 0, error: "API_FOOTBALL_KEY não configurada" };
  }

  try {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    const league = await prisma.league.findUnique({ where: { id: leagueId } });

    if (!team || !league) {
      return { success: false, processed: 0, skipped: 0, error: "Time ou liga não encontrado" };
    }

    const season = seasonParam ?? getCurrentSeason();
    const today = getTodayStart();

    if (!force) {
      const syncRecord = await prisma.teamStatsSync.findUnique({
        where: {
          teamId_leagueId_season: { teamId, leagueId, season },
        },
      });
      if (syncRecord && wasSyncedToday(syncRecord.syncedAt, today)) {
        const existingCount = await prisma.matchTeamStatistic.count({
          where: { teamId, leagueId, season },
        });
        return {
          success: true,
          processed: 0,
          skipped: existingCount,
          cached: true,
        };
      }
    }

    const upToDate = today;
    const upToKey = formatDateKey(upToDate);

    const lastStat = await prisma.matchTeamStatistic.findFirst({
      where: { teamId, leagueId, season },
      orderBy: { match: { date: "desc" } },
      select: { match: { select: { date: true } } },
    });

    let fixtures: ApiFootballTeamFixture[];

    if (lastStat?.match.date) {
      const fromDate = formatDateKey(
        new Date(lastStat.match.date.getTime() + 86400000)
      );
      fixtures = await fetchTeamFixtures(
        team.apiId,
        league.apiId,
        season,
        fromDate,
        upToKey
      );
    } else {
      fixtures = await fetchTeamFixtures(team.apiId, league.apiId, season);
      fixtures = fixtures.filter((f) => {
        const d = getMatchDayFromUtc(f.fixture.date);
        return d <= normalizeSelectedDate(upToDate);
      });
    }

    const finished = fixtures.filter((f) =>
      FINISHED_STATUSES.includes(f.fixture.status.short)
    );

    let processed = 0;
    let skipped = 0;
    let apiCalls = 0;

    for (const fixture of finished) {
      if (apiCalls >= maxFixturesPerRun) break;

      const already = await prisma.matchTeamStatistic.findFirst({
        where: { match: { apiId: fixture.fixture.id }, teamId },
      });
      if (already) {
        skipped++;
        continue;
      }

      apiCalls += 3;
      const ok = await processFixtureStatistics(fixture);
      if (ok) processed++;
      else skipped++;
    }

    const lastMatch = await prisma.matchTeamStatistic.findFirst({
      where: { teamId, leagueId, season },
      orderBy: { match: { date: "desc" } },
      select: { match: { select: { date: true } } },
    });

    const lastMatchDate = lastMatch?.match.date ?? today;

    await prisma.teamStatsSync.upsert({
      where: {
        teamId_leagueId_season: { teamId, leagueId, season },
      },
      update: { lastMatchDate, syncedAt: new Date() },
      create: {
        teamId,
        leagueId,
        season,
        lastMatchDate,
      },
    });

    return { success: true, processed, skipped, cached: false };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Sync failed";
    console.error("syncTeamStatisticsForTeam error:", error);
    return { success: false, processed: 0, skipped: 0, error: message };
  }
}

export async function syncTeamStatistics(params: {
  leagueIds: string[];
  upToDate: Date;
  priorityFixtureApiIds?: number[];
  favoriteTeamIds?: string[];
  maxFixturesPerRun?: number;
}): Promise<SyncTeamStatisticsResult> {
  const {
    leagueIds,
    upToDate,
    priorityFixtureApiIds = [],
    favoriteTeamIds: favoriteTeamIdsParam,
    maxFixturesPerRun = MAX_FIXTURE_STATS_PER_SYNC,
  } = params;

  if (!getApiKey() || leagueIds.length === 0) {
    return { success: true, processed: 0, skipped: 0 };
  }

  try {
    const season = getCurrentSeason();
    const upToKey = formatDateKey(upToDate);
    const prioritySet = new Set(priorityFixtureApiIds);

    const leagues = await prisma.league.findMany({
      where: { id: { in: leagueIds } },
    });

    const favoriteTeamIds =
      favoriteTeamIdsParam ?? (await getUserFavoriteTeams());
    const favoriteTeams =
      favoriteTeamIds.length > 0
        ? await prisma.team.findMany({ where: { id: { in: favoriteTeamIds } } })
        : [];

    const favoriteTeamApiIds = new Set(favoriteTeams.map((t) => t.apiId));
    const pending: PendingFixture[] = [];
    const seenFixtureIds = new Set<number>();

    for (const league of leagues) {
      const teamApiIds = await fetchLeagueTeams(league.apiId, season);

      for (const favTeam of favoriteTeams) {
        if (!teamApiIds.includes(favTeam.apiId)) {
          teamApiIds.push(favTeam.apiId);
        }
      }

      const dbTeams = await prisma.team.findMany({
        where: { apiId: { in: teamApiIds } },
      });
      const teamByApiId = new Map(dbTeams.map((t) => [t.apiId, t]));

      for (const teamApiId of teamApiIds) {
        const dbTeam = teamByApiId.get(teamApiId);
        if (!dbTeam) continue;

        const lastStat = await prisma.matchTeamStatistic.findFirst({
          where: { teamId: dbTeam.id, leagueId: league.id, season },
          orderBy: { match: { date: "desc" } },
          select: { match: { select: { date: true } } },
        });

        let fixtures: ApiFootballTeamFixture[];

        if (lastStat?.match.date) {
          const fromDate = formatDateKey(
            new Date(lastStat.match.date.getTime() + 86400000)
          );
          fixtures = await fetchTeamFixtures(
            teamApiId,
            league.apiId,
            season,
            fromDate,
            upToKey
          );
        } else {
          fixtures = await fetchTeamFixtures(teamApiId, league.apiId, season);
          fixtures = fixtures.filter((f) => {
            const d = getMatchDayFromUtc(f.fixture.date);
            return d <= normalizeSelectedDate(upToDate);
          });
        }

        for (const fixture of fixtures) {
          if (!FINISHED_STATUSES.includes(fixture.fixture.status.short)) continue;
          if (seenFixtureIds.has(fixture.fixture.id)) continue;
          seenFixtureIds.add(fixture.fixture.id);

          let priority = 1;
          if (prioritySet.has(fixture.fixture.id)) priority = 3;
          else if (favoriteTeamApiIds.has(teamApiId)) priority = 2;

          pending.push({ fixture, priority });
        }
      }
    }

    pending.sort((a, b) => b.priority - a.priority);

    let processed = 0;
    let skipped = 0;
    let apiCalls = 0;

    for (const { fixture } of pending) {
      if (apiCalls >= maxFixturesPerRun) break;

      const already = await prisma.matchTeamStatistic.findFirst({
        where: { match: { apiId: fixture.fixture.id } },
      });
      if (already) {
        skipped++;
        continue;
      }

      apiCalls += 3;
      const ok = await processFixtureStatistics(fixture);
      if (ok) processed++;
      else skipped++;
    }

    return { success: true, processed, skipped };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Sync failed";
    console.error("syncTeamStatistics error:", error);
    return { success: false, processed: 0, skipped: 0, error: message };
  }
}

export async function getTeamStatisticsPage(params: {
  teamId: string;
  leagueId: string;
  season?: number;
  statKey: string;
  venue?: "all" | "home" | "away";
  limit?: number;
}): Promise<{ success: boolean; data?: TeamStatisticsPageData; error?: string }> {
  try {
    const {
      teamId,
      leagueId,
      season = getCurrentSeason(),
      statKey,
      venue = "all",
      limit = 20,
    } = params;

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    const league = await prisma.league.findUnique({ where: { id: leagueId } });

    if (!team || !league) {
      return { success: false, error: "Time ou liga não encontrado" };
    }

    const isDerived = statKey in DERIVED_LABELS;

    const where: {
      teamId: string;
      leagueId: string;
      season: number;
      isHome?: boolean;
    } = { teamId, leagueId, season };

    if (venue === "home") where.isHome = true;
    if (venue === "away") where.isHome = false;

    const records = await prisma.matchTeamStatistic.findMany({
      where,
      include: {
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
          },
        },
        opponentTeam: true,
      },
      orderBy: { match: { date: "desc" } },
      take: limit,
    });

    const opponentRecords = await prisma.matchTeamStatistic.findMany({
      where: {
        matchId: { in: records.map((r) => r.matchId) },
        teamId: { not: teamId },
      },
    });
    const opponentByMatch = new Map(
      opponentRecords.map((r) => [r.matchId, r])
    );

    const columns: TeamStatisticsMatchColumn[] = records
      .map((record) => {
        const opponent = opponentByMatch.get(record.matchId);
        const stats = record.stats as TeamMatchStats;
        const derived = record.derived as TeamMatchDerived;
        const oppStats = (opponent?.stats ?? {}) as TeamMatchStats;
        const oppDerived = (opponent?.derived ?? {}) as TeamMatchDerived;

        let teamValue: number | boolean | null = null;
        let opponentValue: number | boolean | null = null;

        if (isDerived) {
          const key = statKey as DerivedStatKey;
          teamValue = derived[key] ?? null;
          opponentValue = oppDerived[key] ?? null;
        } else {
          const key = statKey as TeamStatKey;
          teamValue = stats[key] ?? null;
          opponentValue = oppStats[key] ?? null;
        }

        return {
          matchId: record.matchId,
          matchApiId: record.match.apiId,
          date: record.match.date,
          isHome: record.isHome,
          teamValue,
          opponentValue,
          homeScore: record.match.homeScore,
          awayScore: record.match.awayScore,
          opponent: {
            id: record.opponentTeam.id,
            name: record.opponentTeam.name,
            logo: record.opponentTeam.logo,
          },
          venue: record.isHome ? ("home" as const) : ("away" as const),
        };
      })
      .reverse();

    const nextMatch = await prisma.match.findFirst({
      where: {
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
        leagueId,
        date: { gte: normalizeSelectedDate(new Date()) },
        status: { in: ["NS", "TBD", "1H", "2H", "HT", "LIVE"] },
      },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { utcDate: "asc" },
    });

    const totalMatches = await prisma.matchTeamStatistic.count({
      where: { teamId, leagueId, season },
    });

    return {
      success: true,
      data: {
        team: {
          id: team.id,
          apiId: team.apiId,
          name: team.name,
          logo: team.logo,
        },
        league: {
          id: league.id,
          apiId: league.apiId,
          name: league.name,
          logo: league.logo,
          country: league.country,
        },
        season,
        nextFixture: nextMatch
          ? {
              date: nextMatch.date,
              time: nextMatch.time,
              isHome: nextMatch.homeTeamId === teamId,
              opponent: {
                id:
                  nextMatch.homeTeamId === teamId
                    ? nextMatch.awayTeam.id
                    : nextMatch.homeTeam.id,
                name:
                  nextMatch.homeTeamId === teamId
                    ? nextMatch.awayTeam.name
                    : nextMatch.homeTeam.name,
                logo:
                  nextMatch.homeTeamId === teamId
                    ? nextMatch.awayTeam.logo
                    : nextMatch.homeTeam.logo,
              },
            }
          : null,
        columns,
        statKey: statKey as TeamStatisticsPageData["statKey"],
        isDerived,
        totalMatches,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load";
    return { success: false, error: message };
  }
}

export async function getTeamLeaguesForStats(teamId: string) {
  const statRows = await prisma.matchTeamStatistic.findMany({
    where: { teamId },
    select: { leagueId: true, season: true },
    orderBy: [{ season: "desc" }, { updatedAt: "desc" }],
  });

  const leagueSeasonMap = new Map<string, number>();
  for (const row of statRows) {
    if (!leagueSeasonMap.has(row.leagueId)) {
      leagueSeasonMap.set(row.leagueId, row.season);
    }
  }

  if (leagueSeasonMap.size > 0) {
    const leagueRecords = await prisma.league.findMany({
      where: { id: { in: [...leagueSeasonMap.keys()] } },
      select: { id: true, name: true, logo: true, apiId: true },
    });

    return leagueRecords.map((league) => ({
      leagueId: league.id,
      season: leagueSeasonMap.get(league.id) ?? getCurrentSeason(),
      league,
    }));
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return [];

  const user = await getCurrentUser();
  if (!user) return [];

  const favoriteLeagueIds = await prisma.favoriteLeague.findMany({
    where: { userId: user.dbUser.id },
    select: {
      league: { select: { id: true, name: true, logo: true, apiId: true } },
    },
  });

  return favoriteLeagueIds.map((f) => ({
    leagueId: f.league.id,
    season: getCurrentSeason(),
    league: f.league,
  }));
}
