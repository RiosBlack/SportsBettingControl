"use client";

import { useState, useTransition } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { updateUserFavoriteLeagues } from "@/lib/actions/leagues";
import Image from "next/image";

interface League {
  id: string;
  apiId: number;
  name: string;
  logo: string | null;
  country: string | null;
}

interface LeagueSelectorProps {
  allLeagues: League[];
  initialFavoriteIds: string[];
}

export function LeagueSelector({ allLeagues, initialFavoriteIds }: LeagueSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialFavoriteIds);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredLeagues = allLeagues.filter((league) =>
    league.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    league.country?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleLeague = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateUserFavoriteLeagues(selectedIds);
      if (result.success) {
        toast.success("Configurações salvas com sucesso!");
      } else {
        toast.error(result.error || "Erro ao salvar configurações");
      }
    });
  };

  return (
    <Card className="w-full border-border bg-card">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-foreground">Seleção de Ligas</CardTitle>
        <CardDescription className="text-muted-foreground">
          Selecione as ligas que deseja acompanhar no seu dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome da liga ou país..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="rounded-md border border-border">
          <ScrollArea className="h-[500px]">
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
                {filteredLeagues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      Nenhuma liga encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeagues.map((league) => (
                    <TableRow key={league.id} className="hover:bg-accent/30 transition-colors">
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(league.id)}
                          onCheckedChange={() => toggleLeague(league.id)}
                        />
                      </TableCell>
                      <TableCell>
                        {league.logo && (
                          <div className="relative h-8 w-8">
                            <Image
                              src={league.logo}
                              alt={league.name}
                              fill
                              className="object-contain"
                            />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{league.name}</TableCell>
                      <TableCell className="text-muted-foreground">{league.country}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        {selectedIds.length > 0 && (
          <div className="pt-6 border-t border-border mt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {selectedIds.length}
              </span>
              Ligas Selecionadas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {allLeagues
                .filter((l) => selectedIds.includes(l.id))
                .map((league) => (
                  <div 
                    key={league.id} 
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-accent/10 hover:bg-accent/20 transition-colors group"
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
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">{league.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate">{league.country}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-auto h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                      onClick={() => toggleLeague(league.id)}
                    >
                      <span className="sr-only">Remover</span>
                      ×
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t border-border pt-6">
        <div className="text-sm text-muted-foreground">
          {selectedIds.length} ligas selecionadas
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Configurações
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
