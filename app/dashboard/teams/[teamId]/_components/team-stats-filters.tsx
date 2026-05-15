"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import {
  getMatchLimitLabel,
  matchLimitToQueryValue,
  TEAM_STATS_MATCH_LIMIT_OPTIONS,
  type TeamLeagueOption,
  type TeamStatsFiltersState,
} from "@/lib/types/team-statistics";

interface TeamStatsFiltersProps {
  leagues: TeamLeagueOption[];
  filters: TeamStatsFiltersState;
  isLoading?: boolean;
  onLeagueChange: (leagueId: string, season: number) => void;
  onMatchLimitChange: (matchLimit: TeamStatsFiltersState["matchLimit"]) => void;
  onVenueChange: (venue: TeamStatsFiltersState["venue"]) => void;
  onSync?: () => void;
}

export function TeamStatsFilters({
  leagues,
  filters,
  isLoading,
  onLeagueChange,
  onMatchLimitChange,
  onVenueChange,
  onSync,
}: TeamStatsFiltersProps) {
  const { leagueId, season, venue, matchLimit } = filters;
  const selectedLeague = leagues.find((l) => l.leagueId === leagueId);
  const sectionTitle = `Estatísticas por partida · ${getMatchLimitLabel(matchLimit)}`;

  return (
    <div className="flex flex-col gap-3 border-b border-white/5 bg-[#161616]/50 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-white">{sectionTitle}</h2>
        {onSync && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 border-white/10 text-xs gap-1"
            onClick={onSync}
            disabled={isLoading}
          >
            <RotateCcw size={12} className={isLoading ? "animate-spin" : ""} />
            Sincronizar stats
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {leagues.length > 0 && (
          <Select
            value={leagueId}
            onValueChange={(value) => {
              const item = leagues.find((l) => l.leagueId === value);
              onLeagueChange(value, item?.season ?? season);
            }}
          >
            <SelectTrigger className="w-[220px] h-8 bg-[#0a0a0a] border-white/10 text-xs">
              <SelectValue placeholder="Liga" />
            </SelectTrigger>
            <SelectContent>
              {leagues.map((item) => (
                <SelectItem key={item.leagueId} value={item.leagueId}>
                  {item.league.name}
                  {item.statsCount != null && item.statsCount > 0
                    ? ` (${item.statsCount}${item.seasonComplete ? " ✓" : ""})`
                    : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          value={matchLimitToQueryValue(matchLimit)}
          onValueChange={(value) =>
            onMatchLimitChange(
              value === "all" ? "all" : value === "20" ? 20 : 10
            )
          }
        >
          <SelectTrigger className="w-[130px] h-8 bg-[#0a0a0a] border-white/10 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TEAM_STATS_MATCH_LIMIT_OPTIONS.map((option) => (
              <SelectItem key={String(option)} value={matchLimitToQueryValue(option)}>
                {option === "all" ? "Todos" : `${option} jogos`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={venue} onValueChange={(v) => onVenueChange(v as typeof venue)}>
          <SelectTrigger className="w-[120px] h-8 bg-[#0a0a0a] border-white/10 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="home">Casa</SelectItem>
            <SelectItem value="away">Fora</SelectItem>
          </SelectContent>
        </Select>

        {selectedLeague && (
          <span className="text-[11px] text-muted-foreground self-center px-2">
            Temporada {selectedLeague.season}/
            {String(selectedLeague.season + 1).slice(-2)}
          </span>
        )}
      </div>
    </div>
  );
}
