import { getTodayFixtures, syncFixturesByLeagues } from "@/lib/actions/fixtures";
import { getUserFavoriteLeagues, getUserFavoriteTeams } from "@/lib/actions/favorites";
import { getTodayStart } from "@/lib/date-time";
import { FixturesPageClient } from "./_components/fixtures-page-client";
import { NoLeaguesWarning } from "./_components/no-leagues-warning";

export default async function FixturesPage() {
  // 1. Buscar ligas favoritas do usuário primeiro
  const favoriteLeagueIds = await getUserFavoriteLeagues();

  // 2. Se nenhuma liga estiver selecionada, exibir o aviso
  if (favoriteLeagueIds.length === 0) {
    return <NoLeaguesWarning />;
  }

  // 3. Sincronizar jogos das ligas selecionadas para hoje
  const today = getTodayStart();
  await syncFixturesByLeagues(today, favoriteLeagueIds, true);

  // 4. Buscar jogos de hoje filtrados pelas ligas selecionadas
  const result = await getTodayFixtures(undefined, undefined, favoriteLeagueIds);
  const initialFixtures = result.success && result.data ? result.data : [];

  // Buscar times favoritos para destaque
  const favoriteTeamIds = await getUserFavoriteTeams();

  // Log para debug
  if (process.env.NODE_ENV === "development") {
    console.log(`[FixturesPage] Favorite leagues: ${favoriteLeagueIds.length}, Matches found: ${initialFixtures.length}`);
  }

  return (
    <FixturesPageClient 
      initialFixtures={initialFixtures}
      favoriteLeagueIds={favoriteLeagueIds}
      favoriteTeamIds={favoriteTeamIds}
    />
  );
}

