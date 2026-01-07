"use client";

import { useState, useMemo } from "react";
import { SportFilter } from "./sport-filter";
import { MatchCard } from "./match-card";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import type { Fixture } from "@/lib/types/fixtures";

type Sport = "FUTEBOL" | "BASQUETE" | "ALL";

interface FixturesListProps {
  fixtures: Fixture[];
}

export function FixturesList({ fixtures }: FixturesListProps) {
  const [selectedSport, setSelectedSport] = useState<Sport>("ALL");

  // Filtrar jogos por esporte
  // Basquete: apenas NBA (league.apiId === 12)
  // Futebol: todos os jogos do dia (incluindo finalizados)
  const filteredFixtures = useMemo(() => {
    if (selectedSport === "ALL") {
      return fixtures;
    }

    if (selectedSport === "BASQUETE") {
      // Filtrar apenas jogos da NBA (league.apiId === 12)
      return fixtures.filter(
        (fixture) => fixture.sport === "BASQUETE" && fixture.league.apiId === 12
      );
    }

    // Futebol: retornar todos os jogos (sem filtro de status)
    return fixtures.filter((fixture) => fixture.sport === "FUTEBOL");
  }, [fixtures, selectedSport]);

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
                  : `Nenhum jogo de ${selectedSport === "FUTEBOL" ? "futebol" : "basquete"} encontrado para hoje`}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1">
          {filteredFixtures.map((fixture) => (
            <MatchCard key={fixture.id} fixture={fixture} />
          ))}
        </div>
      )}
    </>
  );
}

