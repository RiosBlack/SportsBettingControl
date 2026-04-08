import { getLeaguesForSelector, syncAllLeagues } from "@/lib/actions/leagues";
import { getUserFavoriteLeagues } from "@/lib/actions/favorites";
import { LeagueSelector } from "./_components/league-selector";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { revalidatePath } from "next/cache";

export default async function LeaguesSettingsPage() {
  let { data: allLeagues = [] } = await getLeaguesForSelector();
  const favoriteLeagueIds = await getUserFavoriteLeagues();

  // Se não houver ligas no banco, tenta sincronizar
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Gerencie suas preferências de ligas e filtros.</p>
        </div>
        <form action={handleForcedSync}>
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar Ligas da API
          </Button>
        </form>
      </div>

      <LeagueSelector 
        allLeagues={allLeagues.map(l => ({
          ...l,
          id: l.id,
          apiId: l.apiId,
          name: l.name,
          logo: l.logo,
          country: l.country
        }))} 
        initialFavoriteIds={favoriteLeagueIds}
      />
    </div>
  );
}
