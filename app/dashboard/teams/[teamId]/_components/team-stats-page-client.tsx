"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TeamStatsHeader } from "./team-stats-header";
import { TeamStatsFilters } from "./team-stats-filters";
import { TeamStatsFullTable } from "./team-stats-full-table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  buildTeamStatsSearchParams,
  matchLimitToDisplayMinGames,
  type TeamLeagueOption,
  type TeamStatsFiltersState,
  type TeamStatisticsFullTableData,
} from "@/lib/types/team-statistics";

interface TeamStatsPageClientProps {
  team: { id: string; name: string; logo: string | null };
  leagues: TeamLeagueOption[];
  initialData: TeamStatisticsFullTableData | null;
  initialFilters: TeamStatsFiltersState;
  syncError?: string;
  syncWarning?: string;
}

export function TeamStatsPageClient({
  team,
  leagues,
  initialData,
  initialFilters,
  syncError,
  syncWarning: initialSyncWarning,
}: TeamStatsPageClientProps) {
  const router = useRouter();
  const [data, setData] = useState<TeamStatisticsFullTableData | null>(initialData);
  const [filters, setFilters] = useState<TeamStatsFiltersState>(initialFilters);
  const [isLoading, setIsLoading] = useState(false);
  const [syncWarning, setSyncWarning] = useState(initialSyncWarning);

  useEffect(() => {
    setFilters(initialFilters);
  }, [
    initialFilters.leagueId,
    initialFilters.season,
    initialFilters.venue,
    initialFilters.matchLimit,
  ]);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    setSyncWarning(initialSyncWarning);
  }, [initialSyncWarning]);

  const updateUrl = useCallback(
    (state: TeamStatsFiltersState) => {
      const qs = buildTeamStatsSearchParams(state);
      router.replace(`/dashboard/teams/${team.id}?${qs.toString()}`, {
        scroll: false,
      });
    },
    [router, team.id]
  );

  const fetchStats = useCallback(
    async (state: TeamStatsFiltersState) => {
      setIsLoading(true);
      try {
        const qs = buildTeamStatsSearchParams(state);
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
    [team.id]
  );

  const handleLeagueChange = (newLeagueId: string, newSeason: number) => {
    setFilters((prev) => {
      const next: TeamStatsFiltersState = {
        ...prev,
        leagueId: newLeagueId,
        season: newSeason,
      };
      updateUrl(next);
      return next;
    });
    setSyncWarning(undefined);
    router.refresh();
  };

  const handleMatchLimitChange = (
    matchLimit: TeamStatsFiltersState["matchLimit"]
  ) => {
    setFilters((prev) => {
      const next: TeamStatsFiltersState = { ...prev, matchLimit };
      updateUrl(next);
      fetchStats(next);
      return next;
    });
  };

  const handleVenueChange = (venue: TeamStatsFiltersState["venue"]) => {
    setFilters((prev) => {
      const next: TeamStatsFiltersState = { ...prev, venue };
      updateUrl(next);
      fetchStats(next);
      return next;
    });
  };

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const qs = buildTeamStatsSearchParams(filters);
      qs.set("force", "true");
      qs.set("maxFixturesPerRun", "15");
      qs.set(
        "displayMinGames",
        String(matchLimitToDisplayMinGames(filters.matchLimit))
      );
      const syncRes = await fetch(`/api/teams/${team.id}/sync?${qs.toString()}`, {
        method: "POST",
      });
      const syncJson = await syncRes.json();
      const resolvedSeason = syncJson.season ?? filters.season;
      const next: TeamStatsFiltersState =
        resolvedSeason !== filters.season
          ? { ...filters, season: resolvedSeason }
          : filters;
      if (resolvedSeason !== filters.season) {
        setFilters(next);
        updateUrl(next);
      }
      setSyncWarning(syncJson.warning);
      if (syncJson.error) {
        setSyncWarning(syncJson.error);
      }
      await fetchStats(next);
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  const bannerMessage = syncError ?? syncWarning;

  const emptyState = !data && !isLoading;

  return (
    <div className="flex flex-col w-full bg-[#0a0a0a]">
      {data ? (
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
      ) : (
        <div className="border-b border-white/5 bg-[#0a0a0a] px-6 py-5">
          <h1 className="text-2xl font-black text-white">{team.name}</h1>
        </div>
      )}

      <div className="flex flex-col w-full min-w-0">
        {leagues.length > 0 && (
          <TeamStatsFilters
            leagues={leagues}
            filters={filters}
            isLoading={isLoading}
            onLeagueChange={handleLeagueChange}
            onMatchLimitChange={handleMatchLimitChange}
            onVenueChange={handleVenueChange}
            onSync={handleSync}
          />
        )}

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
        ) : emptyState ? (
          <div className="p-8 text-center">
            {leagues.length === 0 ? (
              <p className="text-muted-foreground">
                Nenhuma competição listada para filtrar.
              </p>
            ) : (
              <>
                <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                  Nenhuma partida com estatísticas na seleção atual. Ajuste a
                  liga, o mandante ou a quantidade de jogos, ou sincronize.
                </p>
                <button
                  type="button"
                  onClick={handleSync}
                  className="bg-[#a3e635] text-black font-bold px-6 py-2 rounded-lg"
                >
                  Sincronizar agora
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
