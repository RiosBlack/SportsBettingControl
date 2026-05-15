import { NextRequest, NextResponse } from "next/server";
import { getTeamStatisticsFullTable } from "@/lib/actions/team-statistics";
import { DEFAULT_TEAM_STATS_MATCH_LIMIT } from "@/lib/types/team-statistics";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const searchParams = request.nextUrl.searchParams;

  const leagueId = searchParams.get("leagueId");
  if (!leagueId) {
    return NextResponse.json(
      { success: false, error: "leagueId é obrigatório" },
      { status: 400 }
    );
  }

  const season = searchParams.get("season");
  const venue = (searchParams.get("venue") ?? "all") as "all" | "home" | "away";
  const limit = searchParams.get("limit");

  const result = await getTeamStatisticsFullTable({
    teamId,
    leagueId,
    season: season ? Number(season) : undefined,
    venue,
    limit: limit ? Number(limit) : DEFAULT_TEAM_STATS_MATCH_LIMIT,
  });

  if (!result.success) {
    return NextResponse.json(result, { status: 404 });
  }

  return NextResponse.json(result);
}
