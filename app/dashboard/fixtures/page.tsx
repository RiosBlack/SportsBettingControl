import { getTodayFixtures } from "@/lib/actions/fixtures";
import { getUserFavoriteLeagues, getUserFavoriteTeams } from "@/lib/actions/favorites";
import { FixturesPageClient } from "./_components/fixtures-page-client";

export default async function FixturesPage() {
  // Buscar jogos de hoje para exibir inicialmente
  const result = await getTodayFixtures();
  const initialFixtures = result.success && result.data ? result.data : [];

  // Buscar favoritos do usuário
  const favoriteLeagueIds = await getUserFavoriteLeagues();
  const favoriteTeamIds = await getUserFavoriteTeams();

  // Log para debug
  if (process.env.NODE_ENV === "development") {
    console.log(`[FixturesPage] Total fixtures received: ${initialFixtures.length}`);
    console.log(`[FixturesPage] Favorite leagues: ${favoriteLeagueIds.length}, Favorite teams: ${favoriteTeamIds.length}`);
  }

  return (
    <FixturesPageClient 
      initialFixtures={initialFixtures}
      favoriteLeagueIds={favoriteLeagueIds}
      favoriteTeamIds={favoriteTeamIds}
    />
  );
}

