"use client";

import type { Fixture } from "@/lib/types/fixtures";
import Image from "next/image";
import Link from "next/link";
import { MapPin, ArrowRight, Clock, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MatchCardProps {
  fixture: Fixture;
}

export function MatchCard({ fixture }: MatchCardProps) {
  const isLive =
    fixture.status === "1H" ||
    fixture.status === "2H" ||
    fixture.status === "HT" ||
    fixture.status === "LIVE";
  const isFinished =
    fixture.status === "FT" ||
    fixture.status === "AET" ||
    fixture.status === "PEN";
  const isPending = !isLive && !isFinished;

  const teamStatsHref = (teamId: string) =>
    `/dashboard/teams/${teamId}?leagueId=${fixture.league.id}`;

  return (
    <div className="group bg-[#161616] border border-white/5 rounded-xl overflow-hidden hover:border-[#a3e635]/30 transition-all duration-300 flex flex-col h-full shadow-lg">
      <div className="px-4 py-3 flex items-center gap-2 border-b border-white/5 bg-white/[0.02]">
        {fixture.league.logo && (
          <div className="relative h-4 w-4 shrink-0">
            <Image
              src={fixture.league.logo}
              alt={fixture.league.name}
              fill
              className="object-contain"
            />
          </div>
        )}
        <span className="text-[11px] font-medium text-muted-foreground truncate uppercase tracking-wider">
          {fixture.league.name}
        </span>
      </div>

      <div className="flex-1 p-6 flex flex-col justify-center items-center space-y-6">
        <div className="flex items-center justify-between w-full gap-4">
          <Link
            href={teamStatsHref(fixture.homeTeam.id)}
            className="flex flex-col items-center flex-1 space-y-3 hover:opacity-90 transition-opacity"
          >
            <div className="relative h-16 w-16 md:h-20 md:w-20 drop-shadow-2xl">
              {fixture.homeTeam.logo ? (
                <Image
                  src={fixture.homeTeam.logo}
                  alt={fixture.homeTeam.name}
                  fill
                  className="object-contain"
                />
              ) : (
                <div className="w-full h-full bg-accent/20 rounded-full flex items-center justify-center text-2xl font-bold">
                  {fixture.homeTeam.name[0]}
                </div>
              )}
            </div>
            <span className="text-sm font-bold text-center line-clamp-2 min-h-[2.5rem] flex items-center hover:text-[#a3e635]">
              {fixture.homeTeam.name}
            </span>
          </Link>

          <div className="flex flex-col items-center justify-center min-w-[100px] space-y-2">
            {isPending ? (
              <div className="flex flex-col items-center">
                <span className="text-2xl font-black text-white px-3 py-1 bg-white/5 rounded-lg mb-1">
                  VS
                </span>
                <div className="flex items-center gap-1 text-[#a3e635] font-mono text-sm font-bold">
                  <Clock size={12} />
                  {fixture.time}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "text-4xl font-black tabular-nums tracking-tighter",
                      isLive ? "text-white" : "text-muted-foreground"
                    )}
                  >
                    {fixture.homeScore ?? 0}
                  </span>
                  <span className="text-muted-foreground font-light text-xl">
                    -
                  </span>
                  <span
                    className={cn(
                      "text-4xl font-black tabular-nums tracking-tighter",
                      isLive ? "text-white" : "text-muted-foreground"
                    )}
                  >
                    {fixture.awayScore ?? 0}
                  </span>
                </div>
                {isLive && (
                  <Badge className="mt-2 bg-[#a3e635] text-black hover:bg-[#a3e635] animate-pulse font-black text-[10px] px-2 py-0">
                    AO VIVO
                  </Badge>
                )}
                {isFinished && (
                  <span className="mt-2 text-[10px] font-bold text-muted-foreground uppercase bg-white/5 px-2 py-0.5 rounded">
                    Encerrado
                  </span>
                )}
              </div>
            )}
          </div>

          <Link
            href={teamStatsHref(fixture.awayTeam.id)}
            className="flex flex-col items-center flex-1 space-y-3 hover:opacity-90 transition-opacity"
          >
            <div className="relative h-16 w-16 md:h-20 md:w-20 drop-shadow-2xl">
              {fixture.awayTeam.logo ? (
                <Image
                  src={fixture.awayTeam.logo}
                  alt={fixture.awayTeam.name}
                  fill
                  className="object-contain"
                />
              ) : (
                <div className="w-full h-full bg-accent/20 rounded-full flex items-center justify-center text-2xl font-bold">
                  {fixture.awayTeam.name[0]}
                </div>
              )}
            </div>
            <span className="text-sm font-bold text-center line-clamp-2 min-h-[2.5rem] flex items-center hover:text-[#a3e635]">
              {fixture.awayTeam.name}
            </span>
          </Link>
        </div>
      </div>

      <div className="px-4 py-4 mt-auto flex items-center justify-between border-t border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-1.5 text-muted-foreground max-w-[50%]">
          <MapPin size={12} className="shrink-0" />
          <span className="text-[10px] truncate font-medium">
            {fixture.league.country || "Estádio Indisponível"}
          </span>
        </div>
        <Button
          size="sm"
          className="bg-[#a3e635] hover:bg-[#a3e635]/90 text-black font-bold text-[11px] gap-2 rounded-lg transition-transform active:scale-95 px-4"
          asChild
        >
          <Link href={teamStatsHref(fixture.homeTeam.id)}>
            <BarChart3 size={14} />
            Ver Stats
            <ArrowRight size={14} strokeWidth={3} />
          </Link>
        </Button>
      </div>
    </div>
  );
}
