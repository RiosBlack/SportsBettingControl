import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  getTeamLeaguesForStats,
  getTeamStatisticsPage,
  syncTeamStatisticsForTeam,
} from "@/lib/actions/team-statistics";
import { TeamStatsPageClient } from "./_components/team-stats-page-client";

interface TeamStatsPageProps {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{
    leagueId?: string;
    statKey?: string;
    venue?: string;
    limit?: string;
    season?: string;
  }>;
}

export default async function TeamStatsPage({
  params,
  searchParams,
}: TeamStatsPageProps) {
  const { teamId } = await params;
  const query = await searchParams;

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) notFound();

  const leagues = await getTeamLeaguesForStats(teamId);
  const leagueId = query.leagueId ?? leagues[0]?.leagueId;

  if (!leagueId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p className="text-lg font-semibold text-white mb-2">
          Nenhuma estatística disponível
        </p>
        <p className="text-sm">
          Sincronize jogos das suas ligas favoritas para carregar estatísticas
          deste time.
        </p>
      </div>
    );
  }

  const statKey = query.statKey ?? "shotsTotal";
  const venue = (query.venue ?? "all") as "all" | "home" | "away";
  const limit = query.limit ? Number(query.limit) : 20;
  const season = query.season ? Number(query.season) : leagues[0]?.season;

  await syncTeamStatisticsForTeam({ teamId, leagueId, season });

  const statsResult = await getTeamStatisticsPage({
    teamId,
    leagueId,
    season,
    statKey,
    venue,
    limit,
  });

  return (
    <TeamStatsPageClient
      team={team}
      leagues={leagues}
      initialData={statsResult.success ? statsResult.data! : null}
      initialLeagueId={leagueId}
      initialStatKey={statKey}
      initialVenue={venue}
      initialLimit={limit}
      initialSeason={season}
    />
  );
}
