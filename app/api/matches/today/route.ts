import { NextResponse } from "next/server";
import type { FootballDataResponse, Match } from "@/lib/types/matches";
import { formatDateKey, formatMatchTime } from "@/lib/date-time";

export async function GET() {
  try {
    const apiKey = process.env.FOOTBALL_DATA_API_KEY;

    if (!apiKey) {
      console.error("Football Data API key not configured");
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const today = formatDateKey();

    console.log("Fetching matches for date:", today);

    const response = await fetch(
      `https://api.football-data.org/v4/matches?dateFrom=${today}&dateTo=${today}`,
      {
        headers: {
          "X-Auth-Token": apiKey,
        },
        cache: "no-store", // Desabilitar cache para debug
      }
    );

    console.log("Football Data API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Football Data API error:", response.status, errorText);
      throw new Error(`Football Data API error: ${response.status} - ${errorText}`);
    }

    const data: FootballDataResponse = await response.json();

    // Formatar os dados
    const matches: Match[] = data.matches.map((match) => ({
      id: match.id.toString(),
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      homeLogo: match.homeTeam.crest,
      awayLogo: match.awayTeam.crest,
      competition: match.competition.name,
      time: formatMatchTime(match.utcDate),
      utcDate: match.utcDate,
    }));

    return NextResponse.json({
      date: today,
      matches,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch matches" },
      { status: 500 }
    );
  }
}

