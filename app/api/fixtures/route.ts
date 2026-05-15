import { NextResponse } from "next/server";
import { getTodayFixtures, syncFixturesByLeagues } from "@/lib/actions/fixtures";
import { getUserFavoriteLeagues } from "@/lib/actions/favorites";
import { getTodayStart, parseDateKey } from "@/lib/date-time";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    let targetDate: Date = getTodayStart();
    if (dateParam) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        return NextResponse.json(
          { error: "Data inválida" },
          { status: 400 }
        );
      }
      targetDate = parseDateKey(dateParam);
      if (isNaN(targetDate.getTime())) {
        return NextResponse.json(
          { error: "Data inválida" },
          { status: 400 }
        );
      }
    }

    // Buscar ligas favoritas do usuário
    const favoriteLeagueIds = await getUserFavoriteLeagues();

    if (favoriteLeagueIds.length > 0) {
      // Sincronizar ligas selecionadas para a data solicitada
      await syncFixturesByLeagues(targetDate, favoriteLeagueIds, true);
    }

    const result = await getTodayFixtures(undefined, targetDate, favoriteLeagueIds);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to get fixtures" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data || [],
      noLeaguesSelected: result.noLeaguesSelected,
    });
  } catch (error: any) {
    console.error("Error in fixtures endpoint:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get fixtures" },
      { status: 500 }
    );
  }
}

