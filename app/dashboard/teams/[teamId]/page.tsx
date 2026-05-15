import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  getTeamLeaguesForStats,
  getTeamStatisticsFullTable,
  syncTeamStatisticsForTeam,
} from "@/lib/actions/team-statistics";
import { DEFAULT_TEAM_STATS_MATCH_LIMIT } from "@/lib/types/team-statistics";
import { TeamStatsPageClient } from "./_components/team-stats-page-client";

interface TeamStatsPageProps {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{
    leagueId?: string;
    venue?: string;
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

  const seasonParam = query.season ? Number(query.season) : undefined;
  const leagues = await getTeamLeaguesForStats(teamId, seasonParam);
  const leagueId = query.leagueId ?? leagues[0]?.leagueId;

  if (!leagueId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p className="text-lg font-semibold text-white mb-2">
          Nenhuma competição encontrada
        </p>
        <p className="text-sm">
          Não foi possível listar as ligas deste time na API-Football. Verifique
          a chave da API ou tente novamente mais tarde.
        </p>
      </div>
    );
  }

  const selectedLeague = leagues.find((l) => l.leagueId === leagueId) ?? leagues[0];
  const venue = (query.venue ?? "all") as "all" | "home" | "away";
  const season = seasonParam ?? selectedLeague?.season ?? leagues[0]?.season;

  const syncResult = await syncTeamStatisticsForTeam({
    teamId,
    leagueId,
    season,
    displayMinGames: DEFAULT_TEAM_STATS_MATCH_LIMIT,
    maxFixturesPerRun: 8,
  });
  const resolvedSeason = syncResult.season ?? season;

  const statsResult = await getTeamStatisticsFullTable({
    teamId,
    leagueId,
    season: resolvedSeason,
    venue,
    limit: DEFAULT_TEAM_STATS_MATCH_LIMIT,
  });

  const leaguesForClient = leagues.map((item) =>
    item.leagueId === leagueId ? { ...item, season: resolvedSeason } : item
  );

  return (
    <TeamStatsPageClient
      team={team}
      leagues={leaguesForClient}
      initialData={statsResult.success ? statsResult.data! : null}
      initialLeagueId={leagueId}
      initialVenue={venue}
      initialSeason={resolvedSeason}
      syncError={syncResult.error}
      syncWarning={syncResult.warning}
    />
  );
}
