import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Check, X } from "lucide-react";
import { toggleFavoriteLeague } from "@/lib/actions/leagues";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface LeagueOption {
  id: string;
  apiId: number;
  name: string;
  logo: string | null;
  country: string | null;
}

interface LeagueSelectorProps {
  allLeagues: LeagueOption[];
  favoriteIds: string[];
  searchQuery?: string;
}

function LeagueToggleButton({ leagueId, isSaved }: { leagueId: string; isSaved: boolean }) {
  const toggle = toggleFavoriteLeague.bind(null, leagueId);

  return (
    <form action={toggle}>
      <button
        type="submit"
        role="checkbox"
        aria-checked={isSaved}
        aria-label={isSaved ? "Remover liga salva" : "Salvar liga"}
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded-sm border border-primary transition-colors",
          isSaved
            ? "bg-[#a3e635] text-black"
            : "bg-transparent hover:bg-accent/50"
        )}
      >
        {isSaved ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
      </button>
    </form>
  );
}

export function LeagueSelector({
  allLeagues,
  favoriteIds,
  searchQuery = "",
}: LeagueSelectorProps) {
  const favoriteSet = new Set(favoriteIds);
  const normalizedSearch = searchQuery.trim().toLowerCase();

  const visibleLeagues = allLeagues.filter((league) => {
    if (!normalizedSearch) return true;
    return (
      league.name.toLowerCase().includes(normalizedSearch) ||
      league.country?.toLowerCase().includes(normalizedSearch)
    );
  });

  const savedLeagues = allLeagues.filter((league) => favoriteSet.has(league.id));

  return (
    <Card className="w-full border-border bg-card">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-foreground">
          Seleção de Ligas
        </CardTitle>
        <CardDescription className="text-muted-foreground mt-1.5">
          Clique na caixa de seleção para salvar ou remover a liga. As ligas
          salvas aparecem na lista abaixo e nos jogos do dia.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form method="GET" className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            name="q"
            defaultValue={searchQuery}
            placeholder="Buscar por nome da liga ou país..."
            className="pl-10"
          />
        </form>

        <div className="rounded-md border border-border">
          <ScrollArea className="h-[500px]">
            <div className="min-w-full">
              <Table>
                <TableHeader className="bg-accent/50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-[50px]">Ativa</TableHead>
                    <TableHead className="w-[80px]">Logo</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>País</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleLeagues.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Nenhuma liga encontrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleLeagues.map((league) => {
                      const isSaved = favoriteSet.has(league.id);

                      return (
                        <TableRow
                          key={league.id}
                          className={cn(
                            "transition-colors hover:bg-accent/30",
                            isSaved && "bg-[#a3e635]/10"
                          )}
                        >
                          <TableCell className="w-[50px] align-middle">
                            <LeagueToggleButton
                              leagueId={league.id}
                              isSaved={isSaved}
                            />
                          </TableCell>
                          <TableCell className="align-middle">
                            {league.logo ? (
                              <div className="relative h-8 w-8 shrink-0">
                                <Image
                                  src={league.logo}
                                  alt={league.name}
                                  fill
                                  className="object-contain"
                                />
                              </div>
                            ) : null}
                          </TableCell>
                          <TableCell className="align-middle font-medium">
                            {league.name}
                          </TableCell>
                          <TableCell className="align-middle text-muted-foreground">
                            {league.country}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </div>

        <div className="pt-6 border-t border-border">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#a3e635] text-[10px] font-bold text-black">
              {savedLeagues.length}
            </span>
            Ligas salvas
          </h3>

          {savedLeagues.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma liga salva ainda. Marque uma liga na tabela acima.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedLeagues.map((league) => (
                <div
                  key={league.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-accent/10"
                >
                  {league.logo && (
                    <div className="relative h-6 w-6 shrink-0">
                      <Image
                        src={league.logo}
                        alt={league.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium truncate">
                      {league.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {league.country}
                    </span>
                  </div>
                  <form action={toggleFavoriteLeague.bind(null, league.id)}>
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      aria-label={`Remover ${league.name}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground pt-2">
          {savedLeagues.length} liga{savedLeagues.length !== 1 ? "s" : ""} salva
          {savedLeagues.length !== 1 ? "s" : ""}
        </p>
      </CardContent>
    </Card>
  );
}
