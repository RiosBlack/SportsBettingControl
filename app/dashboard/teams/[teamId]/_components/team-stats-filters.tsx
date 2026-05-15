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

interface LeagueOption {
  leagueId: string;
  season: number;
  league: { id: string; name: string; logo: string | null };
}

interface TeamStatsFiltersProps {
  leagues: LeagueOption[];
  leagueId: string;
  venue: "all" | "home" | "away";
  limit: number;
  season: number;
  statLabel: string;
  isLoading?: boolean;
  onLeagueChange: (leagueId: string, season: number) => void;
  onVenueChange: (venue: "all" | "home" | "away") => void;
  onLimitChange: (limit: number) => void;
  onSync?: () => void;
}

const LIMIT_OPTIONS = [
  { value: 5, label: "Últimos 5" },
  { value: 10, label: "Últimos 10" },
  { value: 20, label: "Últimos 20" },
  { value: 30, label: "Últimos 30" },
];

export function TeamStatsFilters({
  leagues,
  leagueId,
  venue,
  limit,
  season,
  statLabel,
  isLoading,
  onLeagueChange,
  onVenueChange,
  onLimitChange,
  onSync,
}: TeamStatsFiltersProps) {
  const selectedLeague = leagues.find((l) => l.leagueId === leagueId);

  return (
    <div className="flex flex-col gap-3 border-b border-white/5 bg-[#161616]/50 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-white">{statLabel}</h2>
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
            <SelectTrigger className="w-[180px] h-8 bg-[#0a0a0a] border-white/10 text-xs">
              <SelectValue placeholder="Liga" />
            </SelectTrigger>
            <SelectContent>
              {leagues.map((item) => (
                <SelectItem key={item.leagueId} value={item.leagueId}>
                  {item.league.name}
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

        <Select
          value={String(limit)}
          onValueChange={(v) => onLimitChange(Number(v))}
        >
          <SelectTrigger className="w-[130px] h-8 bg-[#0a0a0a] border-white/10 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LIMIT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedLeague && (
          <span className="text-[11px] text-muted-foreground self-center px-2">
            Temporada {selectedLeague.season}
          </span>
        )}
      </div>
    </div>
  );
}
