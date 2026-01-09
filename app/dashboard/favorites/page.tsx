import { getAllLeaguesWithFavoriteStatus, getAllTeamsWithFavoriteStatus } from "@/lib/actions/favorites";
import { FavoritesPageClient } from "./_components/favorites-page-client";

export default async function FavoritesPage() {
  const leaguesResult = await getAllLeaguesWithFavoriteStatus();
  const teamsResult = await getAllTeamsWithFavoriteStatus();

  const leagues = leaguesResult.success && leaguesResult.data ? leaguesResult.data : [];
  const teams = teamsResult.success && teamsResult.data ? teamsResult.data : [];

  return (
    <FavoritesPageClient 
      initialLeagues={leagues}
      initialTeams={teams}
    />
  );
}

