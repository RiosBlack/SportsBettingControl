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
import type { TeamLeagueOption } from "@/lib/types/team-statistics";

interface TeamStatsFiltersProps {
  leagues: TeamLeagueOption[];
  leagueId: string;
  venue: "all" | "home" | "away";
  season: number;
  isLoading?: boolean;
  onLeagueChange: (leagueId: string, season: number) => void;
  onVenueChange: (venue: "all" | "home" | "away") => void;
  onSync?: () => void;
}

export function TeamStatsFilters({
  leagues,
  leagueId,
  venue,
  season,
  isLoading,
  onLeagueChange,
  onVenueChange,
  onSync,
}: TeamStatsFiltersProps) {
  const selectedLeague = leagues.find((l) => l.leagueId === leagueId);

  return (
    <div className="flex flex-col gap-3 border-b border-white/5 bg-[#161616]/50 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-white">
          Estatísticas por partida · últimos 10 jogos
        </h2>
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
              <SelectValue placeholder="Competição" />
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
          value={venue}
          onValueChange={(v) => onVenueChange(v as "all" | "home" | "away")}
        >
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
