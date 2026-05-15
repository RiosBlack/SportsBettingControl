"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, Search } from "lucide-react";
import { FavoriteLeagueButton } from "../../fixtures/_components/favorite-league-button";
import { FavoriteTeamButton } from "../../fixtures/_components/favorite-team-button";
import Image from "next/image";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface League {
  id: string;
  apiId: number;
  name: string;
  logo: string | null;
  country: string | null;
  sport: string;
  isFavorite: boolean;
}

interface Team {
  id: string;
  apiId: number;
  name: string;
  logo: string | null;
  sport: string;
  isFavorite: boolean;
}

interface FavoritesPageClientProps {
  initialLeagues: League[];
  initialTeams: Team[];
}

export function FavoritesPageClient({ initialLeagues, initialTeams }: FavoritesPageClientProps) {
  const [leagues, setLeagues] = useState<League[]>(initialLeagues);
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [leagueSearch, setLeagueSearch] = useState("");
  const [teamSearch, setTeamSearch] = useState("");
  const [sportFilter, setSportFilter] = useState<"ALL" | "FUTEBOL">("ALL");

  // Filtrar ligas
  const filteredLeagues = useMemo(() => {
    let filtered = leagues;

    // Filtro por esporte
    if (sportFilter !== "ALL") {
      filtered = filtered.filter((league) => league.sport === sportFilter);
    }

    // Filtro por busca
    if (leagueSearch.trim()) {
      const searchLower = leagueSearch.toLowerCase();
      filtered = filtered.filter(
        (league) =>
          league.name.toLowerCase().includes(searchLower) ||
          league.country?.toLowerCase().includes(searchLower)
      );
    }

    // Ordenar: favoritas primeiro, depois alfabeticamente
    return filtered.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [leagues, leagueSearch, sportFilter]);

  // Filtrar times
  const filteredTeams = useMemo(() => {
    let filtered = teams;

    // Filtro por esporte
    if (sportFilter !== "ALL") {
      filtered = filtered.filter((team) => team.sport === sportFilter);
    }

    // Filtro por busca
    if (teamSearch.trim()) {
      const searchLower = teamSearch.toLowerCase();
      filtered = filtered.filter((team) =>
        team.name.toLowerCase().includes(searchLower)
      );
    }

    // Ordenar: favoritos primeiro, depois alfabeticamente
    return filtered.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [teams, teamSearch, sportFilter]);

  // Atualizar estado quando favorito mudar
  const handleLeagueFavoriteChange = (leagueId: string, isFavorite: boolean) => {
    setLeagues((prev) =>
      prev.map((league) =>
        league.id === leagueId ? { ...league, isFavorite } : league
      )
    );
  };

  const handleTeamFavoriteChange = (teamId: string, isFavorite: boolean) => {
    setTeams((prev) =>
      prev.map((team) =>
        team.id === teamId ? { ...team, isFavorite } : team
      )
    );
  };

  return (
    <div className="container mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Star className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Favoritos</h1>
        </div>
        <p className="text-muted-foreground">
          Gerencie suas ligas e times favoritos
        </p>
      </div>

      <Tabs defaultValue="leagues" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leagues">
            Ligas ({leagues.filter((l) => l.isFavorite).length})
          </TabsTrigger>
          <TabsTrigger value="teams">
            Times ({teams.filter((t) => t.isFavorite).length})
          </TabsTrigger>
        </TabsList>

        {/* Filtro de Esporte */}
        <div className="flex gap-2">
          <button
            onClick={() => setSportFilter("ALL")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              sportFilter === "ALL"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setSportFilter("FUTEBOL")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              sportFilter === "FUTEBOL"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Futebol
          </button>
        </div>

        <TabsContent value="leagues" className="space-y-4">
          {/* Busca de Ligas */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ligas..."
              value={leagueSearch}
              onChange={(e) => setLeagueSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Lista de Ligas */}
          {filteredLeagues.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {leagueSearch || sportFilter !== "ALL"
                      ? "Nenhuma liga encontrada com os filtros aplicados"
                      : "Nenhuma liga disponível"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {filteredLeagues.map((league) => (
                <Card key={league.id} className={league.isFavorite ? "border-yellow-400" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {league.logo && (
                        <div className="relative w-8 h-8">
                          <Image
                            src={league.logo}
                            alt={league.name}
                            fill
                            className="object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${league.isFavorite ? "text-yellow-400" : ""}`}>
                          {league.name}
                        </p>
                        {league.country && (
                          <p className="text-xs text-muted-foreground">{league.country}</p>
                        )}
                      </div>
                      <FavoriteLeagueButton
                        leagueId={league.id}
                        leagueName={league.name}
                        isFavorite={league.isFavorite}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          {/* Busca de Times */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar times..."
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Lista de Times */}
          {filteredTeams.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {teamSearch || sportFilter !== "ALL"
                      ? "Nenhum time encontrado com os filtros aplicados"
                      : "Nenhum time disponível"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {filteredTeams.map((team) => (
                <Card key={team.id} className={team.isFavorite ? "border-yellow-400" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/dashboard/teams/${team.id}`}
                        className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-90"
                      >
                        {team.logo && (
                          <div className="relative w-8 h-8 shrink-0">
                            <Image
                              src={team.logo}
                              alt={team.name}
                              fill
                              className="object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-medium truncate ${team.isFavorite ? "text-yellow-400" : ""}`}
                          >
                            {team.name}
                          </p>
                        </div>
                      </Link>
                      <Link
                        href={`/dashboard/teams/${team.id}`}
                        className="text-muted-foreground hover:text-[#a3e635] p-1"
                        title="Ver estatísticas"
                      >
                        <BarChart3 size={18} />
                      </Link>
                      <FavoriteTeamButton
                        teamId={team.id}
                        teamName={team.name}
                        isFavorite={team.isFavorite}
                        size="md"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

