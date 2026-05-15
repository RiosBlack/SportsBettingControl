"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TeamStatsHeader } from "./team-stats-header";
import { TeamStatsSidebar } from "./team-stats-sidebar";
import { TeamStatsFilters } from "./team-stats-filters";
import { TeamStatsGrid } from "./team-stats-grid";
import { Skeleton } from "@/components/ui/skeleton";
import {
  STAT_CATEGORIES,
  DERIVED_LABELS,
} from "@/lib/types/team-statistics";
import type {
  DerivedStatKey,
  TeamStatKey,
  TeamStatisticsPageData,
} from "@/lib/types/team-statistics";

interface LeagueOption {
  leagueId: string;
  season: number;
  league: { id: string; name: string; logo: string | null; apiId?: number };
}

interface TeamStatsPageClientProps {
  team: { id: string; name: string; logo: string | null };
  leagues: LeagueOption[];
  initialData: TeamStatisticsPageData | null;
  initialLeagueId: string;
  initialStatKey: string;
  initialVenue: "all" | "home" | "away";
  initialLimit: number;
  initialSeason: number;
}

function getStatLabel(statKey: string): string {
  for (const cat of STAT_CATEGORIES) {
    const found = cat.stats.find((s) => s.key === statKey);
    if (found) return found.label;
  }
  if (statKey in DERIVED_LABELS) {
    return DERIVED_LABELS[statKey as DerivedStatKey];
  }
  return statKey;
}

function getCategoryForStat(statKey: string): string {
  for (const cat of STAT_CATEGORIES) {
    if (cat.stats.some((s) => s.key === statKey)) return cat.id;
  }
  if (statKey in DERIVED_LABELS) return "derived";
  return "shots";
}

export function TeamStatsPageClient({
  team,
  leagues,
  initialData,
  initialLeagueId,
  initialStatKey,
  initialVenue,
  initialLimit,
  initialSeason,
}: TeamStatsPageClientProps) {
  const router = useRouter();
  const [data, setData] = useState<TeamStatisticsPageData | null>(initialData);
  const [leagueId, setLeagueId] = useState(initialLeagueId);
  const [statKey, setStatKey] = useState(initialStatKey);
  const [activeCategory, setActiveCategory] = useState(
    getCategoryForStat(initialStatKey)
  );
  const [venue, setVenue] = useState(initialVenue);
  const [limit, setLimit] = useState(initialLimit);
  const [season, setSeason] = useState(initialSeason);
  const [isLoading, setIsLoading] = useState(false);

  const statLabel = useMemo(() => getStatLabel(statKey), [statKey]);

  const fetchStats = useCallback(
    async (params: {
      leagueId: string;
      statKey: string;
      venue: "all" | "home" | "away";
      limit: number;
      season: number;
    }) => {
      setIsLoading(true);
      try {
        const qs = new URLSearchParams({
          leagueId: params.leagueId,
          statKey: params.statKey,
          venue: params.venue,
          limit: String(params.limit),
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
    [team.id]
  );

  const updateUrl = useCallback(
    (params: {
      leagueId: string;
      statKey: string;
      venue: string;
      limit: number;
      season: number;
    }) => {
      const qs = new URLSearchParams({
        leagueId: params.leagueId,
        statKey: params.statKey,
        venue: params.venue,
        limit: String(params.limit),
        season: String(params.season),
      });
      router.replace(`/dashboard/teams/${team.id}?${qs.toString()}`, {
        scroll: false,
      });
    },
    [router, team.id]
  );

  const handleSelectStat = (key: TeamStatKey | DerivedStatKey, categoryId: string) => {
    setStatKey(key);
    setActiveCategory(categoryId);
    const params = { leagueId, statKey: key, venue, limit, season };
    updateUrl(params);
    fetchStats(params);
  };

  const handleLeagueChange = (newLeagueId: string, newSeason: number) => {
    setLeagueId(newLeagueId);
    setSeason(newSeason);
    const params = { leagueId: newLeagueId, statKey, venue, limit, season: newSeason };
    updateUrl(params);
    fetchStats(params);
  };

  const handleVenueChange = (newVenue: "all" | "home" | "away") => {
    setVenue(newVenue);
    const params = { leagueId, statKey, venue: newVenue, limit, season };
    updateUrl(params);
    fetchStats(params);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    const params = { leagueId, statKey, venue, limit: newLimit, season };
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
      });
      await fetch(`/api/teams/${team.id}/sync?${qs.toString()}`, {
        method: "POST",
      });
      const params = { leagueId, statKey, venue, limit, season };
      await fetchStats(params);
    } finally {
      setIsLoading(false);
    }
  };

  if (!data && !isLoading) {
    return (
      <div className="flex flex-col h-full bg-[#0a0a0a]">
        <div className="p-8 text-center">
          <h1 className="text-2xl font-black text-white mb-2">{team.name}</h1>
          <p className="text-muted-foreground mb-6">
            Carregando estatísticas ou aguardando sincronização...
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
    <div className="flex flex-col h-full bg-[#0a0a0a] min-h-0">
      {data && <TeamStatsHeader data={data} />}

      <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
        <TeamStatsSidebar
          activeStatKey={statKey}
          activeCategory={activeCategory}
          onSelectStat={handleSelectStat}
        />

        <div className="flex flex-1 flex-col min-h-0 min-w-0">
          <TeamStatsFilters
            leagues={leagues}
            leagueId={leagueId}
            venue={venue}
            limit={limit}
            season={season}
            statLabel={statLabel}
            isLoading={isLoading}
            onLeagueChange={handleLeagueChange}
            onVenueChange={handleVenueChange}
            onLimitChange={handleLimitChange}
            onSync={handleSync}
          />

          {isLoading ? (
            <div className="flex-1 p-6 space-y-4">
              <Skeleton className="h-8 w-full bg-white/5" />
              <Skeleton className="h-32 w-full bg-white/5" />
            </div>
          ) : data ? (
            <TeamStatsGrid
              columns={data.columns}
              isDerived={data.isDerived}
              statLabel={statLabel}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
