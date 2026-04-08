"use server";

import { getTodayFixtures, syncDailyFixtures } from "@/lib/actions/fixtures";
import type { MatchesData, Match } from "@/lib/types/matches";

// Obter jogos do dia do banco de dados
export async function getTodayMatches(): Promise<MatchesData | null> {
  try {
    // Buscar fixtures do banco de dados
    const result = await getTodayFixtures();

    if (!result.success || !result.data) {
      console.warn("Failed to get fixtures from database");
      return {
        date: new Date().toISOString().split("T")[0],
        matches: [],
        lastUpdated: new Date().toISOString(),
      };
    }

    // Converter fixtures para o formato Match esperado pelo MatchCombobox
    const matches: Match[] = result.data.map((fixture) => ({
      id: fixture.id,
      homeTeam: fixture.homeTeam.name,
      awayTeam: fixture.awayTeam.name,
      homeLogo: fixture.homeTeam.logo || "/placeholder-team.png",
      awayLogo: fixture.awayTeam.logo || "/placeholder-team.png",
      competition:
        fixture.league.name +
        (fixture.league.country ? ` - ${fixture.league.country}` : ""),
      time:
        fixture.time ||
        new Date(fixture.utcDate).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      utcDate: fixture.utcDate.toISOString(),
    }));

    return {
      date: new Date().toISOString().split("T")[0],
      matches,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error("Error getting matches from database:", error);
    // Retornar estrutura vazia ao invés de null
    return {
      date: new Date().toISOString().split("T")[0],
      matches: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}

/** Sincroniza jogos do dia (chamado após login). */
export async function syncTodayMatches(): Promise<void> {
  await syncDailyFixtures();
}

// Buscar jogos por nome do time
export async function searchMatchesByTeam(
  teamName: string
): Promise<MatchesData["matches"]> {
  const data = await getTodayMatches();
  if (!data || !data.matches) return [];

  const searchTerm = teamName.toLowerCase();
  return data.matches.filter(
    (match) =>
      match.homeTeam.toLowerCase().includes(searchTerm) ||
      match.awayTeam.toLowerCase().includes(searchTerm)
  );
}
