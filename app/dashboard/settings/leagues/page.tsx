import { getLeaguesForSelector, syncAllLeagues } from "@/lib/actions/leagues";
import { getUserFavoriteLeagues } from "@/lib/actions/favorites";
import { LeagueSelector } from "./_components/league-selector";
import { DatabaseSyncButton } from "./_components/database-sync-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { revalidatePath } from "next/cache";

export default async function LeaguesSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: searchQuery = "" } = await searchParams;
  let { data: allLeagues = [] } = await getLeaguesForSelector();
  const favoriteLeagueIds = await getUserFavoriteLeagues();

  if (allLeagues.length === 0) {
    const syncResult = await syncAllLeagues();
    if (syncResult.success) {
      const refreshed = await getLeaguesForSelector();
      allLeagues = refreshed.data || [];
    }
  }

  async function handleForcedSync() {
    "use server";
    await syncAllLeagues();
    revalidatePath("/dashboard/settings/leagues");
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Configurações
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas preferências de ligas e filtros.
          </p>
        </div>
        <form action={handleForcedSync}>
          <Button variant="outline" size="sm" type="submit">
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar Ligas da API
          </Button>
        </form>
      </div>

      <Card className="border-white/5 bg-[#161616]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sincronização de dados</CardTitle>
          <CardDescription>
            Busca apenas jogos e estatísticas que ainda não estão no banco
            (incremental). O sync diário automático roda às 4h (horário de
            Brasília) para todas as ligas favoritas do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DatabaseSyncButton />
        </CardContent>
      </Card>

      <LeagueSelector
        allLeagues={allLeagues.map((l) => ({
          ...l,
          id: l.id,
          apiId: l.apiId,
          name: l.name,
          logo: l.logo,
          country: l.country,
        }))}
        favoriteIds={favoriteLeagueIds}
        searchQuery={searchQuery}
      />
    </div>
  );
}
