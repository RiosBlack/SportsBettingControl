"use server";

import { prisma } from "@/lib/prisma";
import type {
  ApiFootballResponse,
  ApiBasketballResponse,
  SyncFixturesResult,
  Fixture,
} from "@/lib/types/fixtures";

// Verificar se precisa sincronizar hoje
export async function shouldSyncToday(): Promise<boolean> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastSync = await prisma.fixtureSync.findUnique({
      where: {
        date: today,
      },
    });

    return !lastSync;
  } catch (error) {
    console.error("Error checking sync status:", error);
    return true; // Em caso de erro, permite sincronizar
  }
}

// Buscar jogos de futebol da API-Football v3
// Retorna TODOS os jogos do dia, incluindo finalizados (FT), em andamento (LIVE) e não iniciados (NS)
async function fetchFootballFixtures(
  date: string
): Promise<ApiFootballResponse | null> {
  try {
    const apiKey = process.env.API_FOOTBALL_KEY;

    if (!apiKey) {
      console.error("API_FOOTBALL_KEY not configured");
      return null;
    }

    // Buscar todos os jogos do dia sem filtro de status
    // A API retorna todos os jogos quando apenas o parâmetro date é fornecido
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?date=${date}`,
      {
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": "v3.football.api-sports.io",
        },
        cache: "no-store",
      }
    );

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

// Buscar jogos de basquete da API-Sports (apenas NBA)
// NBA league ID: 12
async function fetchBasketballGames(
  date: string
): Promise<ApiBasketballResponse | null> {
  try {
    const apiKey = process.env.API_SPORTS_KEY;

    if (!apiKey) {
      console.error("API_SPORTS_KEY not configured");
      return null;
    }

    // Filtrar apenas jogos da NBA (league ID = 12)
    const response = await fetch(
      `https://v1.basketball.api-sports.io/games?date=${date}&league=12`,
      {
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": "v1.basketball.api-sports.io",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API-Sports error:", response.status, errorText);
      return null;
    }

    const data: ApiBasketballResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching basketball games:", error);
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

  // Processar TODOS os jogos retornados (sem filtros)
  for (const fixture of data.response) {
    try {
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

      // Parse date
      const utcDate = new Date(fixture.fixture.date);
      
      // Criar data de jogo usando apenas a parte da data (YYYY-MM-DD) em UTC
      // e converter para data local sem horas para evitar problemas de timezone
      const utcYear = utcDate.getUTCFullYear();
      const utcMonth = utcDate.getUTCMonth();
      const utcDay = utcDate.getUTCDate();
      
      // Criar data local com a mesma data (sem considerar timezone)
      const matchDate = new Date(utcYear, utcMonth, utcDay, 0, 0, 0, 0);

      // Extract time
      const time = utcDate.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Upsert Match
      await prisma.match.upsert({
        where: { apiId: fixture.fixture.id },
        update: {
          date: matchDate,
          time,
          utcDate,
          status: fixture.fixture.status.short,
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
          homeScore: fixture.goals.home,
          awayScore: fixture.goals.away,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          leagueId: league.id,
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

// Processar e salvar jogos de basquete (apenas NBA)
async function processBasketballGames(
  data: ApiBasketballResponse
): Promise<number> {
  let count = 0;

  // Filtrar apenas jogos da NBA (league ID = 12)
  const nbaGames = data.response.filter((game) => game.league.id === 12);

  for (const game of nbaGames) {
    try {
      // Upsert League
      const league = await prisma.league.upsert({
        where: { apiId: game.league.id },
        update: {
          name: game.league.name,
          logo: game.league.logo,
          country: game.country.name,
        },
        create: {
          apiId: game.league.id,
          name: game.league.name,
          logo: game.league.logo,
          country: game.country.name,
          sport: "BASQUETE",
        },
      });

      // Upsert Home Team
      const homeTeam = await prisma.team.upsert({
        where: { apiId: game.teams.home.id },
        update: {
          name: game.teams.home.name,
          logo: game.teams.home.logo,
        },
        create: {
          apiId: game.teams.home.id,
          name: game.teams.home.name,
          logo: game.teams.home.logo,
          sport: "BASQUETE",
        },
      });

      // Upsert Away Team
      const awayTeam = await prisma.team.upsert({
        where: { apiId: game.teams.away.id },
        update: {
          name: game.teams.away.name,
          logo: game.teams.away.logo,
        },
        create: {
          apiId: game.teams.away.id,
          name: game.teams.away.name,
          logo: game.teams.away.logo,
          sport: "BASQUETE",
        },
      });

      // Parse date
      const utcDate = new Date(game.date);
      if (game.time) {
        const [hours, minutes] = game.time.split(":").map(Number);
        utcDate.setUTCHours(hours, minutes, 0, 0);
      }
      
      // Criar data de jogo usando apenas a parte da data (YYYY-MM-DD) em UTC
      // e converter para data local sem horas para evitar problemas de timezone
      const utcYear = utcDate.getUTCFullYear();
      const utcMonth = utcDate.getUTCMonth();
      const utcDay = utcDate.getUTCDate();
      
      // Criar data local com a mesma data (sem considerar timezone)
      const matchDate = new Date(utcYear, utcMonth, utcDay, 0, 0, 0, 0);

      // Extract time
      const time =
        game.time ||
        utcDate.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });

      // Get scores
      const homeScore = game.scores.home.total;
      const awayScore = game.scores.away.total;

      // Upsert Match
      await prisma.match.upsert({
        where: { apiId: game.id },
        update: {
          date: matchDate,
          time,
          utcDate,
          status: game.status.short,
          homeScore,
          awayScore,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          leagueId: league.id,
        },
        create: {
          apiId: game.id,
          sport: "BASQUETE",
          date: matchDate,
          time,
          utcDate,
          status: game.status.short,
          homeScore,
          awayScore,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          leagueId: league.id,
        },
      });

      count++;
    } catch (error) {
      console.error(`Error processing basketball game ${game.id}:`, error);
    }
  }

  return count;
}

// Sincronizar jogos do dia
// Sempre busca e atualiza os jogos para garantir que todos sejam salvos
export async function syncDailyFixtures(
  force: boolean = false
): Promise<SyncFixturesResult> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    // Verificar se já foi sincronizado hoje (a menos que force seja true)
    if (!force) {
      const needsSync = await shouldSyncToday();
      if (!needsSync) {
        return {
          success: true,
          footballCount: 0,
          basketballCount: 0,
          syncedAt: new Date(),
        };
      }
    }

    // Buscar TODOS os jogos de futebol do dia
    const footballData = await fetchFootballFixtures(today);
    const footballCount = footballData
      ? await processFootballFixtures(footballData)
      : 0;

    // Buscar jogos de basquete (apenas NBA)
    const basketballData = await fetchBasketballGames(today);
    const basketballCount = basketballData
      ? await processBasketballGames(basketballData)
      : 0;

    // Registrar sincronização
    await prisma.fixtureSync.upsert({
      where: { date: todayDate },
      update: { syncedAt: new Date() },
      create: {
        date: todayDate,
        syncedAt: new Date(),
      },
    });

    return {
      success: true,
      footballCount,
      basketballCount,
      syncedAt: new Date(),
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
  sport?: "FUTEBOL" | "BASQUETE",
  targetDate?: Date
): Promise<{
  success: boolean;
  data?: Fixture[];
  error?: string;
}> {
  try {
    // Usar a data fornecida ou hoje como padrão
    const searchDate = targetDate ? new Date(targetDate) : new Date();

    // Extrair ano, mês e dia da data de busca usando UTC (mesma lógica usada ao salvar)
    // Isso garante que a busca seja feita pela data correta, independente do timezone
    const utcYear = searchDate.getUTCFullYear();
    const utcMonth = searchDate.getUTCMonth();
    const utcDay = searchDate.getUTCDate();

    // Criar data local com a mesma data UTC (mesma lógica usada ao salvar)
    const searchDateLocal = new Date(utcYear, utcMonth, utcDay, 0, 0, 0, 0);
    
    // Também buscar por data UTC equivalente (para jogos salvos antes da correção)
    const searchDateUTC = new Date(Date.UTC(utcYear, utcMonth, utcDay, 0, 0, 0, 0));

    const where: any = {
      OR: [
        { date: searchDateLocal },
        { date: searchDateUTC }
      ],
      // Não filtrar por status - retornar todos os jogos (NS, LIVE, FT, etc.)
    };

    if (sport) {
      where.sport = sport;
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

    // Log para debug
    if (process.env.NODE_ENV === "development") {
      console.log(
        `Found ${matches.length} matches for date ${utcYear}-${String(utcMonth + 1).padStart(2, "0")}-${String(utcDay).padStart(2, "0")} (searchDateLocal: ${searchDateLocal.toISOString().split("T")[0]}, searchDateUTC: ${searchDateUTC.toISOString().split("T")[0]})`
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
