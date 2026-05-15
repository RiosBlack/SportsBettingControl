"use client";

import { Fragment } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatDateKey } from "@/lib/date-time";
import type { TeamStatisticsFullTableData } from "@/lib/types/team-statistics";
import { Check, X } from "lucide-react";

interface TeamStatsFullTableProps {
  data: TeamStatisticsFullTableData;
}

function formatCellValue(
  value: number | boolean | null,
  format: "number" | "percent" | "boolean"
): string {
  if (value === null || value === undefined) return "—";
  if (format === "boolean" && typeof value === "boolean") {
    return value ? "✓" : "✗";
  }
  if (format === "percent" && typeof value === "number") {
    return `${value}%`;
  }
  return String(value);
}

function BooleanIcon({ value }: { value: boolean | null }) {
  if (value === null) return <span className="text-muted-foreground">—</span>;
  return value ? (
    <Check className="inline h-4 w-4 text-[#a3e635]" strokeWidth={3} />
  ) : (
    <X className="inline h-4 w-4 text-muted-foreground/60" strokeWidth={3} />
  );
}

export function TeamStatsFullTable({ data }: TeamStatsFullTableProps) {
  const { matches, rows } = data;

  if (matches.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-center">
        <div>
          <p className="text-lg font-semibold text-white mb-2">
            Nenhuma partida com estatísticas
          </p>
          <p className="text-sm text-muted-foreground max-w-md">
            Sincronize os dados do time para preencher a tabela completa.
          </p>
        </div>
      </div>
    );
  }

  let lastCategory = "";

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-max p-4 pb-16">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 bg-[#0a0a0a] text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground p-3 min-w-[200px] border-b border-r border-white/10">
                Estatística
              </th>
              {matches.map((match) => (
                <th
                  key={match.matchId}
                  className="text-center p-2 min-w-[92px] border-b border-white/5 align-bottom"
                >
                  <div className="flex flex-col items-center gap-1 py-1">
                    <span
                      className={cn(
                        "text-[9px] font-black uppercase px-1.5 py-0.5 rounded",
                        match.isHome
                          ? "bg-[#a3e635] text-black"
                          : "bg-white/10 text-muted-foreground"
                      )}
                    >
                      {match.isHome ? "C" : "F"}
                    </span>
                    <div className="relative h-7 w-7">
                      {match.opponent.logo ? (
                        <Image
                          src={match.opponent.logo}
                          alt={match.opponent.name}
                          fill
                          className="object-contain"
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-white/50">
                          {match.opponent.name.slice(0, 2)}
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] font-semibold text-white/80 line-clamp-2 max-w-[84px] leading-tight">
                      {match.opponent.name}
                    </span>
                    <span className="text-[9px] text-muted-foreground tabular-nums">
                      {formatDateKey(match.date)}
                    </span>
                    {(match.homeScore != null || match.awayScore != null) && (
                      <span className="text-[11px] font-mono font-black text-white tabular-nums">
                        {match.isHome
                          ? `${match.homeScore ?? 0}-${match.awayScore ?? 0}`
                          : `${match.awayScore ?? 0}-${match.homeScore ?? 0}`}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const showCategory = row.category !== lastCategory;
              if (showCategory) lastCategory = row.category;

              return (
                <Fragment key={row.key}>
                  {showCategory && (
                    <tr>
                      <td
                        colSpan={matches.length + 1}
                        className="bg-[#161616] text-[10px] font-black uppercase tracking-[0.2em] text-[#a3e635]/90 px-3 py-2 border-y border-white/5"
                      >
                        {row.category}
                      </td>
                    </tr>
                  )}
                  <tr className="group hover:bg-white/[0.02] transition-colors">
                    <td className="sticky left-0 z-10 bg-[#0a0a0a] group-hover:bg-[#111] text-xs font-medium text-white/90 p-3 border-b border-r border-white/5 whitespace-nowrap">
                      {row.label}
                    </td>
                    {row.values.map((cell, idx) => (
                      <td
                        key={`${row.key}-${matches[idx]?.matchId}`}
                        className="text-center p-1.5 border-b border-white/5 align-middle"
                      >
                        <div className="flex flex-col items-center justify-center gap-0.5 py-1.5 min-h-[52px]">
                          {row.format === "boolean" ? (
                            <>
                              <BooleanIcon
                                value={
                                  typeof cell.teamValue === "boolean"
                                    ? cell.teamValue
                                    : null
                                }
                              />
                              <div className="opacity-50 scale-90">
                                <BooleanIcon
                                  value={
                                    typeof cell.opponentValue === "boolean"
                                      ? cell.opponentValue
                                      : null
                                  }
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <span className="text-lg font-black tabular-nums text-white leading-none">
                                {formatCellValue(cell.teamValue, row.format)}
                              </span>
                              <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                                {formatCellValue(
                                  cell.opponentValue,
                                  row.format
                                )}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
        <p className="text-[10px] text-muted-foreground mt-4 px-3">
          Número grande = {data.team.name} · número pequeno = adversário
        </p>
      </div>
    </div>
  );
}
