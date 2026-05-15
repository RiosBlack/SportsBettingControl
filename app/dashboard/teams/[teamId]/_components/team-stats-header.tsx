"use client";

import Image from "next/image";
import { Calendar, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateKey } from "@/lib/date-time";
import type { TeamStatisticsPageData } from "@/lib/types/team-statistics";

interface TeamStatsHeaderProps {
  data: TeamStatisticsPageData;
}

export function TeamStatsHeader({ data }: TeamStatsHeaderProps) {
  const { team, league, season, nextFixture, totalMatches } = data;

  return (
    <div className="border-b border-white/5 bg-[#0a0a0a] px-6 py-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0">
            {team.logo ? (
              <Image
                src={team.logo}
                alt={team.name}
                fill
                className="object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[#a3e635]/20 text-2xl font-bold text-[#a3e635]">
                {team.name[0]}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              {league.logo && (
                <div className="relative h-5 w-5">
                  <Image
                    src={league.logo}
                    alt={league.name}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                {league.name} · {season}/{String(season + 1).slice(-2)}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {team.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Estatísticas da equipe · {totalMatches} jogos no banco
            </p>
          </div>
        </div>

        {nextFixture && (
          <div className="bg-[#161616] border border-white/5 rounded-xl px-4 py-3 min-w-[220px]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#a3e635] mb-2">
              Próximo jogo
            </p>
            <div className="flex items-center gap-2">
              <div className="relative h-8 w-8 shrink-0">
                {nextFixture.opponent.logo ? (
                  <Image
                    src={nextFixture.opponent.logo}
                    alt={nextFixture.opponent.name}
                    fill
                    className="object-contain"
                  />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {nextFixture.isHome ? "vs" : "@"}{" "}
                  {nextFixture.opponent.name}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Calendar size={10} />
                  {formatDateKey(nextFixture.date)}
                  {nextFixture.time && ` · ${nextFixture.time}`}
                  <MapPin size={10} />
                  {nextFixture.isHome ? "Casa" : "Fora"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <Badge variant="outline" className="border-white/10 text-muted-foreground">
          Team Stats
        </Badge>
        {league.country && (
          <Badge variant="outline" className="border-white/10 text-muted-foreground">
            {league.country}
          </Badge>
        )}
      </div>
    </div>
  );
}
