import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { syncTeamStatisticsForTeam } from "@/lib/actions/team-statistics";
import {
  DEFAULT_TEAM_STATS_MATCH_LIMIT,
  matchLimitToDisplayMinGames,
  parseTeamStatsMatchLimit,
} from "@/lib/types/team-statistics";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
  }

  const { teamId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const leagueId = searchParams.get("leagueId");
  const seasonParam = searchParams.get("season");
  const force = searchParams.get("force") === "true";

  if (!leagueId) {
    return NextResponse.json(
      { success: false, error: "leagueId é obrigatório" },
      { status: 400 }
    );
  }

  const maxFixturesParam = searchParams.get("maxFixturesPerRun");
  const maxFixturesPerRun = maxFixturesParam
    ? Number(maxFixturesParam)
    : 15;

  const displayMinGamesParam = searchParams.get("displayMinGames");
  const matchLimit = parseTeamStatsMatchLimit(
    searchParams.get("limit") ?? undefined
  );
  const displayMinGames = displayMinGamesParam
    ? Number(displayMinGamesParam)
    : matchLimitToDisplayMinGames(matchLimit);

  const result = await syncTeamStatisticsForTeam({
    teamId,
    leagueId,
    season: seasonParam ? Number(seasonParam) : undefined,
    force,
    displayMinGames: displayMinGames || DEFAULT_TEAM_STATS_MATCH_LIMIT,
    maxFixturesPerRun,
  });

  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
