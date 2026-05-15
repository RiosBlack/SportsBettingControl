import { NextRequest, NextResponse } from "next/server";
import { getTeamStatisticsPage } from "@/lib/actions/team-statistics";

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
  const statKey = searchParams.get("statKey") ?? "shotsTotal";
  const venue = (searchParams.get("venue") ?? "all") as "all" | "home" | "away";
  const limit = searchParams.get("limit");

  const result = await getTeamStatisticsPage({
    teamId,
    leagueId,
    season: season ? Number(season) : undefined,
    statKey,
    venue,
    limit: limit ? Number(limit) : 20,
  });

  if (!result.success) {
    return NextResponse.json(result, { status: 404 });
  }

  return NextResponse.json(result);
}
