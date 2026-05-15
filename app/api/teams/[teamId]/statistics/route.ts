import { NextRequest, NextResponse } from "next/server";
import { getTeamStatisticsFullTable } from "@/lib/actions/team-statistics";
import {
  DEFAULT_TEAM_STATS_MATCH_LIMIT,
  parseTeamStatsMatchLimit,
  type TeamStatsMatchLimit,
} from "@/lib/types/team-statistics";

function parseLimitParam(value: string | null): TeamStatsMatchLimit | number {
  if (!value) return DEFAULT_TEAM_STATS_MATCH_LIMIT;
  if (value === "all") return "all";
  const parsed = parseTeamStatsMatchLimit(value);
  return parsed;
}

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
  const limit = parseLimitParam(searchParams.get("limit"));

  const result = await getTeamStatisticsFullTable({
    teamId,
    leagueId,
    season: season ? Number(season) : undefined,
    venue,
    limit,
  });

  if (!result.success) {
    return NextResponse.json(result, { status: 404 });
  }

  return NextResponse.json(result);
}
