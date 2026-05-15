"use client";

import Image from "next/image";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDateKey } from "@/lib/date-time";
import type { TeamStatisticsMatchColumn } from "@/lib/types/team-statistics";
import { Check, X } from "lucide-react";

interface TeamStatsGridProps {
  columns: TeamStatisticsMatchColumn[];
  isDerived: boolean;
  statLabel: string;
}

function formatValue(
  value: number | boolean | null,
  isDerived: boolean
): string {
  if (value === null || value === undefined) return "—";
  if (isDerived && typeof value === "boolean") {
    return value ? "✓" : "✗";
  }
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  return String(value);
}

export function TeamStatsGrid({
  columns,
  isDerived,
  statLabel,
}: TeamStatsGridProps) {
  if (columns.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-center">
        <div>
          <p className="text-lg font-semibold text-white mb-2">
            Nenhum dado para {statLabel}
          </p>
          <p className="text-sm text-muted-foreground max-w-md">
            Clique em &quot;Sincronizar stats&quot; para buscar dados na API.
            No plano gratuito da API-Football, temporadas recentes podem não
            estar disponíveis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 w-full">
      <div className="min-w-max p-4">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-[#0a0a0a] text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground p-3 min-w-[140px] border-b border-white/5">
                Partida
              </th>
              {columns.map((col) => (
                <th
                  key={col.matchId}
                  className="text-center p-2 min-w-[88px] border-b border-white/5"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className={cn(
                        "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded",
                        col.isHome
                          ? "bg-[#a3e635]/20 text-[#a3e635]"
                          : "bg-white/5 text-muted-foreground"
                      )}
                    >
                      {col.isHome ? "C" : "F"}
                    </span>
                    <div className="relative h-6 w-6">
                      {col.opponent.logo ? (
                        <Image
                          src={col.opponent.logo}
                          alt={col.opponent.name}
                          fill
                          className="object-contain"
                        />
                      ) : (
                        <span className="text-[10px] font-bold">
                          {col.opponent.name.slice(0, 2)}
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] text-muted-foreground line-clamp-1 max-w-[80px]">
                      {col.opponent.name}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      {formatDateKey(col.date)}
                    </span>
                    {(col.homeScore != null || col.awayScore != null) && (
                      <span className="text-[10px] font-mono font-bold text-white/70">
                        {col.isHome
                          ? `${col.homeScore ?? 0}-${col.awayScore ?? 0}`
                          : `${col.awayScore ?? 0}-${col.homeScore ?? 0}`}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="sticky left-0 z-10 bg-[#0a0a0a] text-xs font-semibold text-white p-3 border-b border-white/5">
                {statLabel}
              </td>
              {columns.map((col) => (
                <td
                  key={col.matchId}
                  className="text-center p-2 border-b border-white/5 align-middle"
                >
                  <div className="flex flex-col items-center gap-0.5 py-2">
                    <span className="text-xl font-black tabular-nums text-white leading-none">
                      {isDerived && typeof col.teamValue === "boolean" ? (
                        col.teamValue ? (
                          <Check className="inline h-5 w-5 text-[#a3e635]" />
                        ) : (
                          <X className="inline h-5 w-5 text-muted-foreground" />
                        )
                      ) : (
                        formatValue(col.teamValue, isDerived)
                      )}
                    </span>
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">
                      {isDerived && typeof col.opponentValue === "boolean" ? (
                        col.opponentValue ? (
                          <Check className="inline h-3 w-3 text-[#a3e635]/60" />
                        ) : (
                          <X className="inline h-3 w-3 text-muted-foreground/50" />
                        )
                      ) : (
                        formatValue(col.opponentValue, isDerived)
                      )}
                    </span>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
