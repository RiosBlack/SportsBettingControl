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
  ApiFootballLeagueByTeamItem,
  ApiFootballTeamFixture,
  ApiFootballTeamsResponse,
  TeamLeagueOption,
  DerivedStatKey,
  SyncTeamStatisticsResult,
  TeamMatchDerived,
  TeamMatchStats,
  TeamStatKey,
  TeamStatisticsPageData,
  TeamStatisticsMatchColumn,
  TeamStatisticsFullTableData,
  TeamStatisticsMatchInfo,
  TeamStatisticsTableRow,
} from "@/lib/types/team-statistics";
import {
  DEFAULT_TEAM_STATS_MATCH_LIMIT,
  DERIVED_LABELS,
  FULL_TABLE_STAT_ROWS,
  STAT_CATEGORIES,
} from "@/lib/types/team-statistics";
const FINISHED_STATUSES = ["FT", "AET", "PEN"];
const MAX_FIXTURE_STATS_PER_SYNC = 40;
const FIXTURE_SYNC_DELAY_MS = 1300;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
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

interface ApiFootballEnvelope<T> {
  response: T;
  errors?: Record<string, string>;
  results?: number;
}

function formatApiFootballErrors(errors?: Record<string, string>): string | undefined {
  if (!errors || Object.keys(errors).length === 0) return undefined;
  return Object.values(errors).join(" ");
}

function isSeasonAccessError(message?: string): boolean {
  if (!message) return false;
  return /season/i.test(message) && /(plan|access|try from)/i.test(message);
}

interface ApiFootballGetResult<T> {
  envelope: ApiFootballEnvelope<T> | null;
  rateLimited: boolean;
}

async function apiFootballGet<T>(path: string): Promise<ApiFootballGetResult<T>> {
  const apiKey = getApiKey();
  if (!apiKey) return { envelope: null, rateLimited: false };

  try {
    const response = await fetch(`https://v3.football.api-sports.io${path}`, {
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": "v3.football.api-sports.io",
      },
      cache: "no-store",
    });

    if (response.status === 429) {
      console.error(`API-Football ${path}: 429 rate limit`);
      return { envelope: null, rateLimited: true };
    }

    if (!response.ok) {
      console.error(`API-Football ${path}:`, response.status);
      return { envelope: null, rateLimited: false };
    }

    return {
      envelope: (await response.json()) as ApiFootballEnvelope<T>,
      rateLimited: false,
    };
  } catch (error) {
    console.error(`API-Football fetch error ${path}:`, error);
    return { envelope: null, rateLimited: false };
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
): Promise<{ stats: ApiFootballFixtureStatistics[]; rateLimited: boolean }> {
  const halfParam = half ? "&half=true" : "";
  const { envelope, rateLimited } = await apiFootballGet<
    ApiFootballFixtureStatisticsResponse["response"]
  >(`/fixtures/statistics?fixture=${fixtureApiId}${halfParam}`);
  return { stats: envelope?.response ?? [], rateLimited };
}

async function fetchFixtureEvents(
  fixtureApiId: number
): Promise<{ events: ApiFootballFixtureEvent[]; rateLimited: boolean }> {
  const { envelope, rateLimited } = await apiFootballGet<
    ApiFootballFixtureEventsResponse["response"]
  >(`/fixtures/events?fixture=${fixtureApiId}`);
  return { events: envelope?.response ?? [], rateLimited };
}

async function fetchTeamFixtures(
  teamApiId: number,
  leagueApiId: number,
  season: number,
  from?: string,
  to?: string
): Promise<{ fixtures: ApiFootballTeamFixture[]; apiError?: string }> {
  let path = `/fixtures?team=${teamApiId}&league=${leagueApiId}&season=${season}&status=FT`;
  if (from) path += `&from=${from}`;
  if (to) path += `&to=${to}`;

  const { envelope, rateLimited } = await apiFootballGet<ApiFootballTeamFixture[]>(path);
  if (rateLimited) {
    return { fixtures: [], apiError: "Limite da API-Football atingido (429). Tente novamente em alguns minutos." };
  }
  if (!envelope) {
    return { fixtures: [], apiError: "Falha ao conectar com API-Football" };
  }

  const apiError = formatApiFootballErrors(envelope.errors);
  return { fixtures: envelope.response ?? [], apiError };
}

function seasonsToTry(preferred: number): number[] {
  const seasons: number[] = [];
  for (let offset = 0; offset < 3; offset++) {
    const s = preferred - offset;
    if (s >= 2022) seasons.push(s);
  }
  return seasons;
}

async function fetchTeamFixturesForSeasons(
  teamApiId: number,
  leagueApiId: number,
  preferredSeason: number,
  upToDate: Date,
  fromDate?: string
): Promise<{
  fixtures: ApiFootballTeamFixture[];
  season: number;
  apiError?: string;
}> {
  const upToKey = formatDateKey(upToDate);
  let lastError: string | undefined;

  for (const season of seasonsToTry(preferredSeason)) {
    const { fixtures, apiError } = fromDate
      ? await fetchTeamFixtures(
          teamApiId,
          leagueApiId,
          season,
          fromDate,
          upToKey
        )
      : await fetchTeamFixtures(teamApiId, leagueApiId, season);

    if (apiError) lastError = apiError;

    if (isSeasonAccessError(apiError)) {
      continue;
    }

    const filtered = fromDate
      ? fixtures
      : fixtures.filter((f) => {
          const d = getMatchDayFromUtc(f.fixture.date);
          return d <= normalizeSelectedDate(upToDate);
        });

    if (filtered.length > 0 || !apiError) {
      return { fixtures: filtered, season, apiError };
    }
  }

  return {
    fixtures: [],
    season: preferredSeason,
    apiError: lastError,
  };
}

async function fetchLeagueTeams(
  leagueApiId: number,
  season: number
): Promise<number[]> {
  const { envelope } = await apiFootballGet<ApiFootballTeamsResponse["response"]>(
    `/teams?league=${leagueApiId}&season=${season}`
  );
  return envelope?.response.map((r) => r.team.id) ?? [];
}

async function processFixtureStatistics(
  fixture: ApiFootballTeamFixture
): Promise<{ success: boolean; rateLimited: boolean }> {
  const existing = await prisma.matchTeamStatistic.findFirst({
    where: { match: { apiId: fixture.fixture.id } },
  });
  if (existing) return { success: false, rateLimited: false };

  const fullResult = await fetchFixtureStatistics(fixture.fixture.id, false);
  if (fullResult.rateLimited) return { success: false, rateLimited: true };
  if (fullResult.stats.length < 2) return { success: false, rateLimited: false };

  const halfResult = await fetchFixtureStatistics(fixture.fixture.id, true);
  if (halfResult.rateLimited) return { success: false, rateLimited: true };

  const eventsResult = await fetchFixtureEvents(fixture.fixture.id);
  if (eventsResult.rateLimited) return { success: false, rateLimited: true };

  const fullStats = fullResult.stats;
  const halfStats = halfResult.stats;
  const events = eventsResult.events;
  const scoredFirstTeamApiId = getScoredFirstTeamApiId(events);

  const matchId = await ensureMatchFromApiFixture(fixture);
  if (!matchId) return { success: false, rateLimited: false };

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { homeTeam: true, awayTeam: true, league: true },
  });
  if (!match) return { success: false, rateLimited: false };

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

  return { success: true, rateLimited: false };
}

async function fetchTeamLeaguesFromApi(
  teamApiId: number,
  season: number
): Promise<{ items: ApiFootballLeagueByTeamItem[]; rateLimited: boolean; apiError?: string }> {
  const { envelope, rateLimited } = await apiFootballGet<ApiFootballLeagueByTeamItem[]>(
    `/leagues?team=${teamApiId}&season=${season}`
  );

  if (rateLimited) {
    return {
      items: [],
      rateLimited: true,
      apiError: "Limite da API-Football atingido (429).",
    };
  }

  if (!envelope) {
    return { items: [], rateLimited: false, apiError: "Falha ao buscar ligas do time." };
  }

  const apiError = formatApiFootballErrors(envelope.errors);
  return { items: envelope.response ?? [], rateLimited: false, apiError };
}

async function upsertLeaguesFromApiItems(
  items: ApiFootballLeagueByTeamItem[],
  preferredSeason: number
): Promise<TeamLeagueOption[]> {
  const options: TeamLeagueOption[] = [];

  for (const item of items) {
    const seasonEntry =
      item.seasons.find((s) => s.year === preferredSeason) ??
      item.seasons.find((s) => s.current) ??
      item.seasons[0];
    const season = seasonEntry?.year ?? preferredSeason;

    const league = await prisma.league.upsert({
      where: { apiId: item.league.id },
      update: {
        name: item.league.name,
        logo: item.league.logo,
        country: item.country.name,
      },
      create: {
        apiId: item.league.id,
        name: item.league.name,
        logo: item.league.logo,
        country: item.country.name,
        sport: "FUTEBOL",
      },
      select: { id: true, name: true, logo: true, apiId: true },
    });

    options.push({
      leagueId: league.id,
      season,
      league,
    });
  }

  return options.sort((a, b) => a.league.name.localeCompare(b.league.name));
}

interface PendingFixture {
  fixture: ApiFootballTeamFixture;
  priority: number;
}

function wasSyncedToday(syncedAt: Date, today: Date): boolean {
  return formatDateKey(syncedAt) === formatDateKey(today);
}

function buildSyncWarning(params: {
  statsCount: number;
  expectedFixtures: number;
  displayMinGames: number;
  displayReady: boolean;
  seasonComplete: boolean;
  rateLimited: boolean;
}): string | undefined {
  const { statsCount, expectedFixtures, displayMinGames, displayReady, seasonComplete, rateLimited } =
    params;

  if (seasonComplete) return undefined;

  const parts: string[] = [];
  if (displayReady) {
    parts.push(`${displayMinGames} jogos prontos para análise.`);
  }
  parts.push(`Salvando temporada: ${statsCount}/${expectedFixtures} jogos no banco.`);
  if (rateLimited) {
    parts.push('Limite da API atingido — clique em "Sincronizar stats" novamente em alguns minutos.');
  } else if (!displayReady) {
    parts.push('Sincronização em andamento — aguarde ou tente sincronizar novamente.');
  }

  return parts.join(" ");
}

/** Sync de estatísticas de um único time/liga (gatilho: clique no time). */
export async function syncTeamStatisticsForTeam(params: {
  teamId: string;
  leagueId: string;
  season?: number;
  force?: boolean;
  /** Mínimo de jogos para liberar a UI (exibição). */
  displayMinGames?: number;
  maxFixturesPerRun?: number;
}): Promise<SyncTeamStatisticsResult> {
  const {
    teamId,
    leagueId,
    season: seasonParam,
    force = false,
    displayMinGames = DEFAULT_TEAM_STATS_MATCH_LIMIT,
    maxFixturesPerRun = 8,
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

    const syncRecord = await prisma.teamStatsSync.findUnique({
      where: {
        teamId_leagueId_season: { teamId, leagueId, season },
      },
    });

    let statsInDb = await prisma.matchTeamStatistic.count({
      where: { teamId, leagueId, season },
    });

    const displayReady = statsInDb >= displayMinGames;
    const seasonAlreadyComplete = syncRecord?.seasonComplete === true;

    if (
      !force &&
      seasonAlreadyComplete &&
      syncRecord &&
      wasSyncedToday(syncRecord.syncedAt, today)
    ) {
      return {
        success: true,
        processed: 0,
        skipped: statsInDb,
        cached: true,
        season: syncRecord.season,
        displayReady: true,
        seasonComplete: true,
        statsCount: statsInDb,
        expectedFixtures: syncRecord.expectedFixtures ?? statsInDb,
      };
    }

    const needsSeasonSync = force || !seasonAlreadyComplete || statsInDb < displayMinGames;

    if (!force && !needsSeasonSync && syncRecord && wasSyncedToday(syncRecord.syncedAt, today)) {
      return {
        success: true,
        processed: 0,
        skipped: statsInDb,
        cached: true,
        season: syncRecord.season,
        displayReady,
        seasonComplete: seasonAlreadyComplete,
        statsCount: statsInDb,
        expectedFixtures: syncRecord.expectedFixtures ?? statsInDb,
      };
    }

    const lastStat =
      seasonAlreadyComplete && !force
        ? await prisma.matchTeamStatistic.findFirst({
            where: { teamId, leagueId, season },
            orderBy: { match: { date: "desc" } },
            select: { match: { select: { date: true } } },
          })
        : null;

    const fromDate =
      lastStat?.match.date && seasonAlreadyComplete && !force
        ? formatDateKey(new Date(lastStat.match.date.getTime() + 86400000))
        : undefined;

    const {
      fixtures,
      season: resolvedSeason,
      apiError,
    } = await fetchTeamFixturesForSeasons(
      team.apiId,
      league.apiId,
      season,
      today,
      fromDate
    );

    const finished = fixtures
      .filter((f) => FINISHED_STATUSES.includes(f.fixture.status.short))
      .sort(
        (a, b) =>
          new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime()
      );

    const expectedFixtures = finished.length;
    let processed = 0;
    let skipped = 0;
    let fixturesAttempted = 0;
    let rateLimited = false;

    for (const fixture of finished) {
      if (fixturesAttempted >= maxFixturesPerRun) break;

      const already = await prisma.matchTeamStatistic.findFirst({
        where: { match: { apiId: fixture.fixture.id }, teamId },
      });
      if (already) {
        skipped++;
        continue;
      }

      if (fixturesAttempted > 0) {
        await delay(FIXTURE_SYNC_DELAY_MS);
      }

      fixturesAttempted++;
      const result = await processFixtureStatistics(fixture);
      if (result.rateLimited) {
        rateLimited = true;
        skipped++;
        break;
      }
      if (result.success) {
        processed++;
        statsInDb++;
      } else {
        skipped++;
      }
    }

    const statsCount = await prisma.matchTeamStatistic.count({
      where: { teamId, leagueId, season: resolvedSeason },
    });

    if (processed === 0 && statsCount === 0) {
      if (syncRecord) {
        await prisma.teamStatsSync
          .delete({
            where: {
              teamId_leagueId_season: {
                teamId,
                leagueId,
                season: syncRecord.season,
              },
            },
          })
          .catch(() => undefined);
      }

      return {
        success: false,
        processed: 0,
        skipped,
        season: resolvedSeason,
        error:
          apiError ??
          "Nenhuma partida finalizada encontrada para este time/liga na API.",
      };
    }

    const lastMatch = await prisma.matchTeamStatistic.findFirst({
      where: { teamId, leagueId, season: resolvedSeason },
      orderBy: { match: { date: "desc" } },
      select: { match: { select: { date: true } } },
    });

    const lastMatchDate = lastMatch?.match.date ?? today;
    const isDisplayReady = statsCount >= displayMinGames;
    const isSeasonComplete =
      expectedFixtures > 0 && statsCount >= expectedFixtures && !rateLimited;

    await prisma.teamStatsSync.upsert({
      where: {
        teamId_leagueId_season: { teamId, leagueId, season: resolvedSeason },
      },
      update: {
        lastMatchDate,
        expectedFixtures,
        seasonComplete: isSeasonComplete,
        syncedAt: new Date(),
      },
      create: {
        teamId,
        leagueId,
        season: resolvedSeason,
        lastMatchDate,
        expectedFixtures,
        seasonComplete: isSeasonComplete,
      },
    });

    const warning = buildSyncWarning({
      statsCount,
      expectedFixtures,
      displayMinGames,
      displayReady: isDisplayReady,
      seasonComplete: isSeasonComplete,
      rateLimited,
    });

    return {
      success: true,
      processed,
      skipped,
      cached: false,
      season: resolvedSeason,
      displayReady: isDisplayReady,
      seasonComplete: isSeasonComplete,
      statsCount,
      expectedFixtures,
      warning,
    };
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
          const result = await fetchTeamFixtures(
            teamApiId,
            league.apiId,
            season,
            fromDate,
            upToKey
          );
          fixtures = result.fixtures;
        } else {
          const result = await fetchTeamFixtures(
            teamApiId,
            league.apiId,
            season
          );
          fixtures = result.fixtures.filter((f) => {
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
      const result = await processFixtureStatistics(fixture);
      if (result.success) processed++;
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

export async function getTeamStatisticsFullTable(params: {
  teamId: string;
  leagueId: string;
  season?: number;
  venue?: "all" | "home" | "away";
  limit?: number | "all";
}): Promise<{ success: boolean; data?: TeamStatisticsFullTableData; error?: string }> {
  try {
    const {
      teamId,
      leagueId,
      season = getCurrentSeason(),
      venue = "all",
      limit = DEFAULT_TEAM_STATS_MATCH_LIMIT,
    } = params;

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    const league = await prisma.league.findUnique({ where: { id: leagueId } });

    if (!team || !league) {
      return { success: false, error: "Time ou liga não encontrado" };
    }

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
          include: { homeTeam: true, awayTeam: true },
        },
        opponentTeam: true,
      },
      orderBy: { match: { date: "desc" } },
      ...(limit !== "all" ? { take: limit } : {}),
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

    const orderedRecords = [...records].reverse();

    const matches: TeamStatisticsMatchInfo[] = orderedRecords.map((record) => ({
      matchId: record.matchId,
      matchApiId: record.match.apiId,
      date: record.match.date,
      isHome: record.isHome,
      homeScore: record.match.homeScore,
      awayScore: record.match.awayScore,
      opponent: {
        id: record.opponentTeam.id,
        name: record.opponentTeam.name,
        logo: record.opponentTeam.logo,
      },
    }));

    const rows: TeamStatisticsTableRow[] = FULL_TABLE_STAT_ROWS.map((def) => {
      const isDerived = def.isDerived ?? false;
      const format = def.format ?? (isDerived ? "boolean" : "number");

      const values = orderedRecords.map((record) => {
        const opponent = opponentByMatch.get(record.matchId);
        const stats = record.stats as TeamMatchStats;
        const derived = record.derived as TeamMatchDerived;
        const oppStats = (opponent?.stats ?? {}) as TeamMatchStats;
        const oppDerived = (opponent?.derived ?? {}) as TeamMatchDerived;

        if (isDerived) {
          const key = def.key as DerivedStatKey;
          return {
            teamValue: derived[key] ?? null,
            opponentValue: oppDerived[key] ?? null,
          };
        }

        const key = def.key as TeamStatKey;
        return {
          teamValue: stats[key] ?? null,
          opponentValue: oppStats[key] ?? null,
        };
      });

      return {
        key: def.key,
        label: def.label,
        category: def.category,
        isDerived,
        format,
        values,
      };
    });

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
        matches,
        rows,
        totalMatches,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load";
    return { success: false, error: message };
  }
}

export async function getTeamLeaguesForStats(
  teamId: string,
  seasonParam?: number
): Promise<TeamLeagueOption[]> {
  const season = seasonParam ?? getCurrentSeason();
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return [];

  const syncRows = await prisma.teamStatsSync.findMany({
    where: { teamId, season },
    select: {
      leagueId: true,
      season: true,
      seasonComplete: true,
      expectedFixtures: true,
    },
  });
  const syncByLeague = new Map(syncRows.map((r) => [r.leagueId, r]));

  const statCounts = await prisma.matchTeamStatistic.groupBy({
    by: ["leagueId"],
    where: { teamId, season },
    _count: { id: true },
  });
  const countByLeague = new Map(statCounts.map((r) => [r.leagueId, r._count.id]));

  let apiOptions: TeamLeagueOption[] = [];
  if (getApiKey()) {
    const { items, rateLimited } = await fetchTeamLeaguesFromApi(team.apiId, season);
    if (items.length > 0) {
      apiOptions = await upsertLeaguesFromApiItems(items, season);
    } else if (!rateLimited) {
      for (const trySeason of seasonsToTry(season)) {
        if (trySeason === season) continue;
        const fallback = await fetchTeamLeaguesFromApi(team.apiId, trySeason);
        if (fallback.items.length > 0) {
          apiOptions = await upsertLeaguesFromApiItems(fallback.items, trySeason);
          break;
        }
      }
    }
  }

  if (apiOptions.length > 0) {
    return apiOptions.map((opt) => {
      const sync = syncByLeague.get(opt.leagueId);
      return {
        ...opt,
        season: sync?.season ?? opt.season,
        statsCount: countByLeague.get(opt.leagueId) ?? 0,
        seasonComplete: sync?.seasonComplete ?? false,
      };
    });
  }

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

    return leagueRecords.map((league) => {
      const sync = syncByLeague.get(league.id);
      return {
        leagueId: league.id,
        season: leagueSeasonMap.get(league.id) ?? season,
        statsCount: countByLeague.get(league.id) ?? 0,
        seasonComplete: sync?.seasonComplete ?? false,
        league,
      };
    });
  }

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
    season,
    statsCount: countByLeague.get(f.league.id) ?? 0,
    seasonComplete: syncByLeague.get(f.league.id)?.seasonComplete ?? false,
    league: f.league,
  }));
}
