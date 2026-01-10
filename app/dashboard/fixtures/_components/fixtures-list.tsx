"use client";

import { useState, useMemo, useEffect } from "react";
import { SportFilter } from "./sport-filter";
import { MatchCard } from "./match-card";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { Fixture } from "@/lib/types/fixtures";
import { FavoriteLeagueButton } from "./favorite-league-button";

type Sport = "FUTEBOL" | "ALL";

interface FixturesListProps {
  fixtures: Fixture[];
  favoriteLeagueIds?: string[];
  favoriteTeamIds?: string[];
}

interface LeagueGroup {
  league: {
    id: string;
    apiId: number;
    name: string;
    logo: string | null;
    country: string | null;
  };
  fixtures: Fixture[];
}

export function FixturesList({ fixtures, favoriteLeagueIds = [], favoriteTeamIds = [] }: FixturesListProps) {
  const [selectedSport, setSelectedSport] = useState<Sport>("ALL");
  const [expandedLeagues, setExpandedLeagues] = useState<Set<string>>(new Set());

  const toggleLeague = (leagueId: string) => {
    setExpandedLeagues((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(leagueId)) {
        newSet.delete(leagueId);
      } else {
        newSet.add(leagueId);
      }
      return newSet;
    });
  };

  // Filtrar jogos por esporte
  // Futebol: todos os jogos do dia (incluindo finalizados)
  const filteredFixtures = useMemo(() => {
    if (selectedSport === "ALL") {
      return fixtures;
    }

    // Futebol: retornar todos os jogos (sem filtro de status)
    return fixtures.filter((fixture) => fixture.sport === "FUTEBOL");
  }, [fixtures, selectedSport]);

  // Agrupar jogos por liga e ordenar
  const groupedByLeague = useMemo(() => {
    const groups = new Map<string, LeagueGroup>();

    filteredFixtures.forEach((fixture) => {
      const leagueId = fixture.league.id;
      
      if (!groups.has(leagueId)) {
        groups.set(leagueId, {
          league: fixture.league,
          fixtures: [],
        });
      }

      groups.get(leagueId)!.fixtures.push(fixture);
    });

    // Converter Map para Array
    const groupsArray = Array.from(groups.values());

    // Ordenar fixtures dentro de cada grupo: times favoritos primeiro
    groupsArray.forEach((group) => {
      group.fixtures.sort((a, b) => {
        const aHasFavorite = favoriteTeamIds.includes(a.homeTeam.id) || favoriteTeamIds.includes(a.awayTeam.id);
        const bHasFavorite = favoriteTeamIds.includes(b.homeTeam.id) || favoriteTeamIds.includes(b.awayTeam.id);
        
        if (aHasFavorite && !bHasFavorite) return -1;
        if (!aHasFavorite && bHasFavorite) return 1;
        
        // Se ambos têm ou não têm favoritos, manter ordem original (por horário)
        return 0;
      });
    });

    // Ordenar grupos: ligas favoritas primeiro, depois não favoritas (ambas alfabeticamente)
    return groupsArray.sort((a, b) => {
      const aIsFavorite = favoriteLeagueIds.includes(a.league.id);
      const bIsFavorite = favoriteLeagueIds.includes(b.league.id);
      
      // Ligas favoritas primeiro
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;
      
      // Dentro do mesmo grupo (favoritas ou não), ordenar alfabeticamente
      const nameA = a.league.name.toLowerCase();
      const nameB = b.league.name.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [filteredFixtures, favoriteLeagueIds, favoriteTeamIds]);

  // Inicializar: ligas favoritas abertas, outras fechadas
  useEffect(() => {
    const initialExpanded = new Set<string>();
    groupedByLeague.forEach((group) => {
      if (favoriteLeagueIds.includes(group.league.id)) {
        initialExpanded.add(group.league.id);
      }
    });
    setExpandedLeagues(initialExpanded);
  }, [groupedByLeague, favoriteLeagueIds]);

  return (
    <>
      {/* Sport Filter */}
      <SportFilter selectedSport={selectedSport} onSportChange={setSelectedSport} />

      {/* Fixtures List */}
      {filteredFixtures.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {selectedSport === "ALL"
                  ? "Nenhum jogo encontrado para hoje"
                  : "Nenhum jogo de futebol encontrado para hoje"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedByLeague.map((group) => {
            const isExpanded = expandedLeagues.has(group.league.id);
            const isFavorite = favoriteLeagueIds.includes(group.league.id);
            
            return (
              <div key={group.league.id} className="space-y-3">
                {/* League Header */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleLeague(group.league.id)}
                        className="h-8 w-8 shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      {group.league.logo && (
                        <div className="relative w-6 h-6">
                          <Image
                            src={group.league.logo}
                            alt={group.league.name}
                            fill
                            className="object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isFavorite ? "text-yellow-400" : ""}`}>
                          {group.league.name}
                        </p>
                        {group.league.country && (
                          <p className="text-xs text-muted-foreground">{group.league.country}</p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {group.fixtures.length} {group.fixtures.length === 1 ? "jogo" : "jogos"}
                      </p>
                      <FavoriteLeagueButton
                        leagueId={group.league.id}
                        leagueName={group.league.name}
                        isFavorite={isFavorite}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Matches - Mostrar apenas se expandido */}
                {isExpanded && (
                  <div className="grid grid-cols-1 gap-3">
                    {group.fixtures.map((fixture) => (
                      <MatchCard 
                        key={fixture.id} 
                        fixture={fixture} 
                        hideLeagueHeader={true}
                        favoriteTeamIds={favoriteTeamIds}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

