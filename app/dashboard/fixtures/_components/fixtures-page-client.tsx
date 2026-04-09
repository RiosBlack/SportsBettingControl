"use client";

import { useState, useEffect, useMemo } from "react";
import { MatchCard } from "./match-card";
import { HorizontalDateSelector } from "./horizontal-date-selector";
import { LoadingDice } from "./loading-dice";
import { Trophy, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Fixture } from "@/lib/types/fixtures";
import Image from "next/image";

interface FixturesPageClientProps {
  initialFixtures: Fixture[];
  favoriteLeagueIds: string[];
  favoriteTeamIds: string[];
}

export function FixturesPageClient({ initialFixtures, favoriteLeagueIds, favoriteTeamIds }: FixturesPageClientProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [fixtures, setFixtures] = useState<Fixture[]>(initialFixtures);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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

  // Filtrar e Agrupar por liga
  const groupedFixtures = useMemo(() => {
    const filtered = fixtures.filter(f => 
      f.homeTeam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.awayTeam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.league.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groups: Record<number, { league: any; matches: Fixture[] }> = {};
    
    filtered.forEach(fixture => {
      const leagueId = fixture.league.apiId;
      if (!groups[leagueId]) {
        groups[leagueId] = {
          league: fixture.league,
          matches: []
        };
      }
      groups[leagueId].matches.push(fixture);
    });

    return Object.values(groups);
  }, [fixtures, searchTerm]);

  return (
    <div className="flex-1 min-h-0 bg-[#0a0a0a] text-white flex flex-col overflow-hidden">
      {/* Header & Date Selector */}
      <div className="bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 pt-6 pb-2 shrink-0">
        <div className="container mx-auto max-w-7xl px-4 md:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tighter flex items-center gap-2">
                <Trophy className="text-[#a3e635] h-8 w-8" strokeWidth={2.5} />
                PARTIDAS
              </h1>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">
                Acompanhe o mercado em tempo real
              </p>
            </div>

            <div className="flex items-center gap-2 flex-1 md:max-w-md">
              <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-[#a3e635] transition-colors" />
                <Input 
                  placeholder="Procurar partida por time ou liga..." 
                  className="bg-[#161616] border-white/5 pl-10 h-10 ring-offset-transparent focus-visible:ring-1 focus-visible:ring-[#a3e635]/50 focus-visible:border-[#a3e635] transition-all rounded-xl"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="bg-[#161616] border border-white/5 p-2.5 rounded-xl hover:bg-white/5 transition-colors">
                <Filter className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          <HorizontalDateSelector 
            selectedDate={selectedDate} 
            onDateChange={setSelectedDate} 
          />
        </div>
      </div>

      <main className="flex-1 overflow-y-auto scroll-smooth">
        <div className="container mx-auto max-w-7xl px-4 md:px-8 py-8 h-full">
          {isLoading ? (
            <LoadingDice />
          ) : groupedFixtures.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <Trophy size={40} className="text-muted-foreground opacity-20" />
              </div>
              <h2 className="text-xl font-bold">Nenhuma partida encontrada</h2>
              <p className="text-muted-foreground max-w-xs mx-auto mt-2">
                Selecione outra data ou verifique suas ligas favoritas nas configurações.
              </p>
            </div>
          ) : (
            <div className="space-y-12 pb-12">
              {groupedFixtures.map((group) => (
                <section key={group.league.id} className="space-y-6">
                  <div className="flex items-center gap-3 px-2">
                    <div className="relative h-6 w-6 shrink-0 shadow-lg">
                      {group.league.logo && (
                        <Image
                          src={group.league.logo}
                          alt={group.league.name}
                          fill
                          className="object-contain"
                        />
                      )}
                    </div>
                    <h2 className="text-lg font-black tracking-tight uppercase flex items-center gap-3">
                      {group.league.name}
                      <span className="text-[10px] font-bold text-muted-foreground px-2 py-0.5 rounded bg-white/5 uppercase tracking-widest">
                        {group.matches.length} {group.matches.length === 1 ? 'Jogo' : 'Jogos'}
                      </span>
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {group.matches.map((fixture) => (
                      <MatchCard key={fixture.id} fixture={fixture} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>

      <style jsx global>{`
        main::-webkit-scrollbar {
          width: 8px;
        }
        
        main::-webkit-scrollbar-track {
          background: #0a0a0a;
        }
        
        main::-webkit-scrollbar-thumb {
          background: #161616;
          border-radius: 10px;
          border: 2px solid #0a0a0a;
        }
        
        main::-webkit-scrollbar-thumb:hover {
          background: #202020;
        }
      `}</style>
    </div>
  );
}

