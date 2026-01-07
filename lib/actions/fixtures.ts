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
async function fetchFootballFixtures(date: string): Promise<ApiFootballResponse | null> {
  try {
    const apiKey = process.env.API_FOOTBALL_KEY;

    if (!apiKey) {
      console.error("API_FOOTBALL_KEY not configured");
      return null;
    }

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
async function fetchBasketballGames(date: string): Promise<ApiBasketballResponse | null> {
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
async function processFootballFixtures(
  data: ApiFootballResponse
): Promise<number> {
  let count = 0;

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
      const matchDate = new Date(utcDate);
      matchDate.setHours(0, 0, 0, 0);

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
      console.error(`Error processing football fixture ${fixture.fixture.id}:`, error);
    }
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
        utcDate.setHours(hours, minutes, 0, 0);
      }
      const matchDate = new Date(utcDate);
      matchDate.setHours(0, 0, 0, 0);

      // Extract time
      const time = game.time || utcDate.toLocaleTimeString("pt-BR", {
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
export async function syncDailyFixtures(): Promise<SyncFixturesResult> {
  try {
    // Verificar se já foi sincronizado hoje
    const needsSync = await shouldSyncToday();
    if (!needsSync) {
      return {
        success: true,
        footballCount: 0,
        basketballCount: 0,
        syncedAt: new Date(),
      };
    }

    const today = new Date().toISOString().split("T")[0];
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    // Buscar jogos de futebol
    const footballData = await fetchFootballFixtures(today);
    const footballCount = footballData
      ? await processFootballFixtures(footballData)
      : 0;

    // Buscar jogos de basquete
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
export async function getTodayFixtures(sport?: "FUTEBOL" | "BASQUETE"): Promise<{
  success: boolean;
  data?: Fixture[];
  error?: string;
}> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: any = {
      date: today,
    };

    if (sport) {
      where.sport = sport;
    }

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
    });

    const fixtures: Fixture[] = matches.map((match) => ({
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

