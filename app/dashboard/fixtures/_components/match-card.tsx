"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Circle, Basketball } from "lucide-react";
import type { Fixture } from "@/lib/types/fixtures";
import Image from "next/image";
import { FavoriteTeamButton } from "./favorite-team-button";

interface MatchCardProps {
  fixture: Fixture;
  hideLeagueHeader?: boolean;
  favoriteTeamIds?: string[];
}

function getStatusColor(status: string): string {
  const statusUpper = status.toUpperCase();
  if (statusUpper === "FT" || statusUpper === "FINISHED") {
    return "bg-green-500/10 text-green-500";
  }
  if (statusUpper === "LIVE" || statusUpper === "IN PLAY") {
    return "bg-yellow-500/10 text-yellow-500";
  }
  return "bg-muted text-muted-foreground";
}

function getStatusLabel(status: string): string {
  const statusUpper = status.toUpperCase();
  if (statusUpper === "FT" || statusUpper === "FINISHED") {
    return "Finalizado";
  }
  if (statusUpper === "LIVE" || statusUpper === "IN PLAY") {
    return "Ao vivo";
  }
  if (statusUpper === "NS" || statusUpper === "NOT STARTED") {
    return "Não iniciado";
  }
  if (statusUpper === "HT") {
    return "Intervalo";
  }
  if (statusUpper === "2H" || statusUpper === "1H") {
    return "Em andamento";
  }
  return status;
}

export function MatchCard({ fixture, hideLeagueHeader = false, favoriteTeamIds = [] }: MatchCardProps) {
  const isFinished = fixture.status.toUpperCase() === "FT" || fixture.status.toUpperCase() === "FINISHED";
  const isLive = fixture.status.toUpperCase() === "LIVE" || fixture.status.toUpperCase() === "IN PLAY";
  
  const isHomeTeamFavorite = favoriteTeamIds.includes(fixture.homeTeam.id);
  const isAwayTeamFavorite = favoriteTeamIds.includes(fixture.awayTeam.id);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        {/* League Header */}
        {!hideLeagueHeader && (
          <div className="flex items-center gap-3 mb-4 pb-3 border-b">
            {fixture.league.logo && (
              <div className="relative w-6 h-6">
                <Image
                  src={fixture.league.logo}
                  alt={fixture.league.name}
                  fill
                  className="object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{fixture.league.name}</p>
              {fixture.league.country && (
                <p className="text-xs text-muted-foreground">{fixture.league.country}</p>
              )}
            </div>
            <Badge className={getStatusColor(fixture.status)}>
              {getStatusLabel(fixture.status)}
            </Badge>
          </div>
        )}

        {/* Match Content */}
        <div className="space-y-4">
          {/* Teams */}
          <div className="flex items-center justify-between gap-4">
            {/* Home Team */}
            <div className="flex-1 flex items-center gap-3">
              {fixture.homeTeam.logo ? (
                <div className="relative w-10 h-10 flex-shrink-0">
                  <Image
                    src={fixture.homeTeam.logo}
                    alt={fixture.homeTeam.name}
                    fill
                    className="object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              ) : (
                <div className="w-10 h-10 flex items-center justify-center bg-muted rounded-full">
                  {fixture.sport === "FUTEBOL" ? (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Basketball className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={isHomeTeamFavorite ? "font-medium truncate text-yellow-400" : "font-medium truncate"}>
                    {fixture.homeTeam.name}
                  </p>
                  <FavoriteTeamButton
                    teamId={fixture.homeTeam.id}
                    teamName={fixture.homeTeam.name}
                    isFavorite={isHomeTeamFavorite}
                    size="sm"
                  />
                </div>
                {isFinished && fixture.homeScore !== null && (
                  <p className="text-2xl font-bold text-primary mt-1">
                    {fixture.homeScore}
                  </p>
                )}
              </div>
            </div>

            {/* VS / Time / Score */}
            <div className="flex flex-col items-center gap-2 min-w-[80px]">
              {isLive && (
                <Badge variant="destructive" className="text-xs animate-pulse">
                  AO VIVO
                </Badge>
              )}
              {!isFinished && !isLive && fixture.time && (
                <p className="text-sm font-medium text-muted-foreground">
                  {fixture.time}
                </p>
              )}
              {isFinished && fixture.homeScore !== null && fixture.awayScore !== null && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {fixture.homeScore}
                  </span>
                  <span className="text-muted-foreground">x</span>
                  <span className="text-2xl font-bold">
                    {fixture.awayScore}
                  </span>
                </div>
              )}
              {!isFinished && !isLive && !fixture.time && (
                <span className="text-sm text-muted-foreground">VS</span>
              )}
            </div>

            {/* Away Team */}
            <div className="flex-1 flex items-center gap-3 flex-row-reverse text-right">
              {fixture.awayTeam.logo ? (
                <div className="relative w-10 h-10 flex-shrink-0">
                  <Image
                    src={fixture.awayTeam.logo}
                    alt={fixture.awayTeam.name}
                    fill
                    className="object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              ) : (
                <div className="w-10 h-10 flex items-center justify-center bg-muted rounded-full">
                  {fixture.sport === "FUTEBOL" ? (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Basketball className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 justify-end">
                  <FavoriteTeamButton
                    teamId={fixture.awayTeam.id}
                    teamName={fixture.awayTeam.name}
                    isFavorite={isAwayTeamFavorite}
                    size="sm"
                  />
                  <p className={isAwayTeamFavorite ? "font-medium truncate text-yellow-400" : "font-medium truncate"}>
                    {fixture.awayTeam.name}
                  </p>
                </div>
                {isFinished && fixture.awayScore !== null && (
                  <p className="text-2xl font-bold text-primary mt-1">
                    {fixture.awayScore}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

