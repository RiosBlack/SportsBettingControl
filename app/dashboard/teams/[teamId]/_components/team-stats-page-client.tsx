"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { TeamStatsHeader } from "./team-stats-header";
import { TeamStatsFilters } from "./team-stats-filters";
import { TeamStatsFullTable } from "./team-stats-full-table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DEFAULT_TEAM_STATS_MATCH_LIMIT,
  type TeamLeagueOption,
  type TeamStatisticsFullTableData,
} from "@/lib/types/team-statistics";

interface TeamStatsPageClientProps {
  team: { id: string; name: string; logo: string | null };
  leagues: TeamLeagueOption[];
  initialData: TeamStatisticsFullTableData | null;
  initialLeagueId: string;
  initialVenue: "all" | "home" | "away";
  initialSeason: number;
  syncError?: string;
  syncWarning?: string;
}

export function TeamStatsPageClient({
  team,
  leagues,
  initialData,
  initialLeagueId,
  initialVenue,
  initialSeason,
  syncError,
  syncWarning: initialSyncWarning,
}: TeamStatsPageClientProps) {
  const router = useRouter();
  const [data, setData] = useState<TeamStatisticsFullTableData | null>(initialData);
  const [leagueId, setLeagueId] = useState(initialLeagueId);
  const [venue, setVenue] = useState(initialVenue);
  const [season, setSeason] = useState(initialSeason);
  const [isLoading, setIsLoading] = useState(false);
  const [syncWarning, setSyncWarning] = useState(initialSyncWarning);

  const displayLimit = DEFAULT_TEAM_STATS_MATCH_LIMIT;

  const fetchStats = useCallback(
    async (params: {
      leagueId: string;
      venue: "all" | "home" | "away";
      season: number;
    }) => {
      setIsLoading(true);
      try {
        const qs = new URLSearchParams({
          leagueId: params.leagueId,
          venue: params.venue,
          limit: String(displayLimit),
          season: String(params.season),
        });
        const res = await fetch(
          `/api/teams/${team.id}/statistics?${qs.toString()}`
        );
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        }
      } catch (error) {
        console.error("Failed to fetch team stats:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [team.id, displayLimit]
  );

  const updateUrl = useCallback(
    (params: {
      leagueId: string;
      venue: string;
      season: number;
    }) => {
      const qs = new URLSearchParams({
        leagueId: params.leagueId,
        venue: params.venue,
        season: String(params.season),
      });
      router.replace(`/dashboard/teams/${team.id}?${qs.toString()}`, {
        scroll: false,
      });
    },
    [router, team.id]
  );

  const handleLeagueChange = (newLeagueId: string, newSeason: number) => {
    setLeagueId(newLeagueId);
    setSeason(newSeason);
    setSyncWarning(undefined);
    updateUrl({ leagueId: newLeagueId, venue, season: newSeason });
    router.refresh();
  };

  const handleVenueChange = (newVenue: "all" | "home" | "away") => {
    setVenue(newVenue);
    const params = { leagueId, venue: newVenue, season };
    updateUrl(params);
    fetchStats(params);
  };

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const qs = new URLSearchParams({
        leagueId,
        season: String(season),
        force: "true",
        maxFixturesPerRun: "15",
      });
      const syncRes = await fetch(`/api/teams/${team.id}/sync?${qs.toString()}`, {
        method: "POST",
      });
      const syncJson = await syncRes.json();
      const resolvedSeason = syncJson.season ?? season;
      if (resolvedSeason !== season) {
        setSeason(resolvedSeason);
      }
      setSyncWarning(syncJson.warning);
      if (syncJson.error) {
        setSyncWarning(syncJson.error);
      }
      await fetchStats({ leagueId, venue, season: resolvedSeason });
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  const bannerMessage = syncError ?? syncWarning;

  if (!data && !isLoading) {
    return (
      <div className="flex flex-col h-full bg-[#0a0a0a]">
        <div className="p-8 text-center">
          <h1 className="text-2xl font-black text-white mb-2">{team.name}</h1>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            {bannerMessage ??
              "Carregando estatísticas ou aguardando sincronização..."}
          </p>
          <button
            type="button"
            onClick={handleSync}
            className="bg-[#a3e635] text-black font-bold px-6 py-2 rounded-lg"
          >
            Sincronizar agora
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-[#0a0a0a]">
      {data && (
        <TeamStatsHeader
          data={{
            team: data.team,
            league: data.league,
            season: data.season,
            nextFixture: data.nextFixture,
            totalMatches: data.totalMatches,
            columns: [],
            statKey: "shotsTotal",
            isDerived: false,
          }}
          displayedMatches={data.matches.length}
        />
      )}

      <div className="flex flex-col w-full min-w-0">
        <TeamStatsFilters
          leagues={leagues}
          leagueId={leagueId}
          venue={venue}
          season={season}
          isLoading={isLoading}
          onLeagueChange={handleLeagueChange}
          onVenueChange={handleVenueChange}
          onSync={handleSync}
        />

        {bannerMessage && (
          <p className="px-4 py-2 text-sm text-amber-400/90 border-b border-white/5">
            {bannerMessage}
          </p>
        )}

        {isLoading ? (
          <div className="flex-1 p-6 space-y-3">
            <Skeleton className="h-10 w-full bg-white/5" />
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full bg-white/5" />
            ))}
          </div>
        ) : data ? (
          <TeamStatsFullTable data={data} />
        ) : null}
      </div>
    </div>
  );
}
