"use client";

import { useState, useEffect } from "react";
import { FixturesList } from "./fixtures-list";
import { FixturesSync } from "./fixtures-sync";
import { DateSelector } from "./date-selector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import type { Fixture } from "@/lib/types/fixtures";

interface FixturesPageClientProps {
  initialFixtures: Fixture[];
}

export function FixturesPageClient({ initialFixtures }: FixturesPageClientProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [fixtures, setFixtures] = useState<Fixture[]>(initialFixtures);
  const [isLoading, setIsLoading] = useState(false);

  // Buscar jogos quando a data mudar
  useEffect(() => {
    const fetchFixtures = async () => {
      setIsLoading(true);
      try {
        const dateStr = selectedDate.toISOString().split("T")[0];
        const response = await fetch(`/api/fixtures?date=${dateStr}`);
        
        if (response.ok) {
          const data = await response.json();
          setFixtures(data.success ? data.data || [] : []);
        } else {
          setFixtures([]);
        }
      } catch (error) {
        console.error("Error fetching fixtures:", error);
        setFixtures([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFixtures();
  }, [selectedDate]);

  const footballCount = fixtures.filter((f) => f.sport === "FUTEBOL").length;
  const basketballCount = fixtures.filter(
    (f) => f.sport === "BASQUETE" && f.league.apiId === 12
  ).length;

  return (
    <div className="container mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-6 w-6" />
              <h1 className="text-3xl font-bold">Jogos do Dia</h1>
            </div>
            <p className="text-muted-foreground">
              {selectedDate.toLocaleDateString("pt-BR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Seletor de Data */}
        <div className="mb-4">
          <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>

        {/* Botão de Sincronização */}
        <FixturesSync />
      </div>

      {/* Stats */}
      {!isLoading && fixtures.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total de Jogos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fixtures.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Futebol</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{footballCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Basquete</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{basketballCount}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fixtures List */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
              <p className="text-muted-foreground">Carregando jogos...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <FixturesList fixtures={fixtures} />
      )}
    </div>
  );
}

