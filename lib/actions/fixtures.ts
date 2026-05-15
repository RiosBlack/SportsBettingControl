"use server";

import { prisma } from "@/lib/prisma";
import type {
  ApiFootballResponse,
  SyncFixturesResult,
  Fixture,
} from "@/lib/types/fixtures";
import { getUserFavoriteLeagues } from "./favorites";
import { syncTeamStatistics } from "./team-statistics";
import {
  APP_TIMEZONE,
  formatDateKey,
  formatMatchTime,
  getMatchDayFromUtc,
  getTodayStart,
  normalizeSelectedDate,
} from "@/lib/date-time";

// Verificar se uma liga específica foi sincronizada para uma data específica
export async function isLeagueSyncedForDate(
  apiId: number,
  date: Date
): Promise<boolean> {
  try {
    const startOfDay = normalizeSelectedDate(date);

    const matchExists = await prisma.match.findFirst({
      where: {
        league: { apiId },
        date: startOfDay,
      },
    });

    return !!matchExists;
  } catch (error) {
    console.error("Error checking sync status:", error);
    return false;
  }
}

// Buscar jogos de futebol da API-Football v3
// Retorna TODOS os jogos do dia, incluindo finalizados (FT), em andamento (LIVE) e não iniciados (NS)
// Buscar jogos de futebol da API-Football v3
// Permite buscar por data e opcionalmente por liga específica
async function fetchFootballFixtures(
  date: string,
  apiLeagueId?: number
): Promise<ApiFootballResponse | null> {
  try {
    const apiKey = process.env.API_FOOTBALL_KEY;

    if (!apiKey) {
      console.error("API_FOOTBALL_KEY not configured");
      return null;
    }

    let url = `https://v3.football.api-sports.io/fixtures?date=${date}`;
    if (apiLeagueId) {
      url += `&league=${apiLeagueId}`;
    }

    const response = await fetch(url, {
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": "v3.football.api-sports.io",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API-Football error:", response.status, errorText);
      return null;
    }

    const data: ApiFootballResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching football fixtures:", error);
    return null;
  }
}

// Processar e salvar jogos de futebol
// Processa TODOS os jogos retornados pela API, sem filtros
async function processFootballFixtures(
  data: ApiFootballResponse
): Promise<number> {
  let count = 0;
  let errorCount = 0;

  // Log para debug: quantos jogos foram retornados pela API
  const totalFixtures = data.response.length;

  // Cache local para evitar upserts redundantes na mesma execução
  const processedLeagues = new Set<number>();
  const processedTeams = new Set<number>();
  const teamIdMap = new Map<number, string>();
  const leagueIdMap = new Map<number, string>();

  // Processar TODOS os jogos retornados (sem filtros)
  for (const fixture of data.response) {
    try {
      let leagueId = leagueIdMap.get(fixture.league.id);
      if (!processedLeagues.has(fixture.league.id)) {
        // Upsert League
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
        leagueId = league.id;
        leagueIdMap.set(fixture.league.id, league.id);
        processedLeagues.add(fixture.league.id);
      }

      let homeTeamId = teamIdMap.get(fixture.teams.home.id);
      if (!processedTeams.has(fixture.teams.home.id)) {
        // Upsert Home Team
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
        homeTeamId = homeTeam.id;
        teamIdMap.set(fixture.teams.home.id, homeTeam.id);
        processedTeams.add(fixture.teams.home.id);
      }

      let awayTeamId = teamIdMap.get(fixture.teams.away.id);
      if (!processedTeams.has(fixture.teams.away.id)) {
        // Upsert Away Team
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
        awayTeamId = awayTeam.id;
        teamIdMap.set(fixture.teams.away.id, awayTeam.id);
        processedTeams.add(fixture.teams.away.id);
      }

      const utcDate = new Date(fixture.fixture.date);
      const matchDate = getMatchDayFromUtc(utcDate);
      const time = formatMatchTime(utcDate);

      // Upsert Match
      await prisma.match.upsert({
        where: { apiId: fixture.fixture.id },
        update: {
          date: matchDate,
          time,
          utcDate,
          status: fixture.fixture.status.short,
          season: fixture.league.season,
          homeScore: fixture.goals.home,
          awayScore: fixture.goals.away,
          homeTeamId: homeTeamId!,
          awayTeamId: awayTeamId!,
          leagueId: leagueId!,
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
          homeTeamId: homeTeamId!,
          awayTeamId: awayTeamId!,
          leagueId: leagueId!,
        },
      });

      count++;
    } catch (error) {
      errorCount++;
      console.error(
        `Error processing football fixture ${fixture.fixture.id}:`,
        error
      );
      // Continuar processando os demais jogos mesmo se houver erro
    }
  }

  if (errorCount > 0) {
    console.error(
      `Processed ${count} fixtures out of ${totalFixtures}, ${errorCount} errors`
    );
  } else {
    console.log(`Successfully processed all ${count} fixtures`);
  }

  return count;
}

// Sincronizar jogos do dia
// Sempre busca e atualiza os jogos para garantir que todos sejam salvos
// Sincronizar jogos de ligas específicas para uma data
export async function syncFixturesByLeagues(
  date: Date,
  leagueIds: string[],
  force: boolean = false
): Promise<SyncFixturesResult> {
  try {
    const targetDate = normalizeSelectedDate(date);
    const dateStr = formatDateKey(targetDate);

    // Buscar as ligas no banco para obter os apiIds
    const leagues = await prisma.league.findMany({
      where: {
        id: { in: leagueIds },
      },
    });

    let allSynced = true;
    if (!force) {
      const syncRecord = await prisma.fixtureSync.findUnique({
        where: { date: targetDate },
      });
      if (syncRecord) {
        // Check if synced in the last hour to allow periodic updates, 
        // or just consider it synced if the record exists. Over-syncing exhausts API limits.
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        if (syncRecord.syncedAt > oneHourAgo) {
          await syncTeamStatistics({
            leagueIds,
            upToDate: targetDate,
          });
          return { success: true, footballCount: 0, syncedAt: syncRecord.syncedAt };
        }
      } else {
        allSynced = false;
      }
    } else {
      allSynced = false;
    }

    if (allSynced) {
      return { success: true, footballCount: 0, syncedAt: new Date() };
    }

    let totalProcessed = 0;

    // Fazer UMA requisição para buscar todos os jogos da data para economizar cota da API
    const footballData = await fetchFootballFixtures(dateStr);
    
    if (footballData) {
      const allowedApiIds = new Set(leagues.map((l) => l.apiId));
      
      // Filtrar a resposta para manter apenas os jogos das ligas favoritas
      const filteredResponse = footballData.response.filter((fixture: any) =>
        allowedApiIds.has(fixture.league.id)
      );

      // Processar e salvar APENAS os jogos filtrados
      totalProcessed = await processFootballFixtures({
        ...footballData,
        response: filteredResponse,
      });

      // Update sync status
      await prisma.fixtureSync.upsert({
        where: { date: targetDate },
        update: { syncedAt: new Date() },
        create: { date: targetDate },
      });

      await syncTeamStatistics({
        leagueIds,
        upToDate: targetDate,
        priorityFixtureApiIds: filteredResponse.map(
          (fixture: { fixture: { id: number } }) => fixture.fixture.id
        ),
      });
    }

    return {
      success: true,
      footballCount: totalProcessed,
      syncedAt: new Date(),
    };
  } catch (error: any) {
    console.error("Error syncing selective fixtures:", error);
    return {
      success: false,
      error: error.message || "Failed to sync selective fixtures",
    };
  }
}

// Sincronizar jogos do dia (mantido por compatibilidade, mas atualizado para usar nova lógica se necessário)
export async function syncDailyFixtures(
  force: boolean = false
): Promise<SyncFixturesResult> {
  try {
    const today = getTodayStart();

    const favoriteLeagueIds = await getUserFavoriteLeagues();

    if (favoriteLeagueIds.length > 0) {
      return await syncFixturesByLeagues(today, favoriteLeagueIds, force);
    }

    return {
      success: true,
      footballCount: 0,
      syncedAt: new Date(),
      error: "Nenhuma liga favorita selecionada para sincronizar"
    };
  } catch (error: any) {
    console.error("Error syncing fixtures:", error);
    return {
      success: false,
      error: error.message || "Failed to sync fixtures",
    };
  }
}

// Buscar jogos do dia do banco
// Retorna TODOS os jogos do dia, incluindo finalizados, sem filtro de status
export async function getTodayFixtures(
  sport?: "FUTEBOL",
  targetDate?: Date,
  leagueIds?: string[]
): Promise<{
  success: boolean;
  data?: Fixture[];
  error?: string;
  noLeaguesSelected?: boolean;
}> {
  try {
    // Se leagueIds for fornecido mas estiver vazio, significa que o usuário não selecionou nada
    if (leagueIds && leagueIds.length === 0) {
      return {
        success: true,
        data: [],
        noLeaguesSelected: true,
      };
    }

    const searchDate = targetDate
      ? normalizeSelectedDate(targetDate)
      : getTodayStart();

    const where: { date: Date; sport?: string; leagueId?: { in: string[] } } = {
      date: searchDate,
    };

    if (sport) {
      where.sport = sport;
    }

    if (leagueIds && leagueIds.length > 0) {
      where.leagueId = { in: leagueIds };
    }

    // Buscar todos os jogos do dia sem filtro de status
    // Remover qualquer limite implícito
    const matches = await prisma.match.findMany({
      where,
      include: {
        homeTeam: true,
        awayTeam: true,
        league: true,
      },
      orderBy: {
        utcDate: "asc",
      },
      // Não usar take/limit - buscar TODOS os jogos
    });

    if (process.env.NODE_ENV === "development") {
      console.log(
        `Found ${matches.length} matches for ${formatDateKey(searchDate)} (${APP_TIMEZONE})`
      );
    }

    const fixtures: Fixture[] = matches.map((match: any) => ({
      id: match.id,
      apiId: match.apiId,
      sport: match.sport as "FUTEBOL" | "BASQUETE",
      date: match.date,
      time: match.time,
      utcDate: match.utcDate,
      status: match.status,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      homeTeam: {
        id: match.homeTeam.id,
        apiId: match.homeTeam.apiId,
        name: match.homeTeam.name,
        logo: match.homeTeam.logo,
      },
      awayTeam: {
        id: match.awayTeam.id,
        apiId: match.awayTeam.apiId,
        name: match.awayTeam.name,
        logo: match.awayTeam.logo,
      },
      league: {
        id: match.league.id,
        apiId: match.league.apiId,
        name: match.league.name,
        logo: match.league.logo,
        country: match.league.country,
      },
    }));

    return {
      success: true,
      data: fixtures,
    };
  } catch (error: any) {
    console.error("Error getting today fixtures:", error);
    return {
      success: false,
      error: error.message || "Failed to get fixtures",
    };
  }
}
