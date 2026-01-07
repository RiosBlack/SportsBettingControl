import { getTodayFixtures } from "@/lib/actions/fixtures";
import { FixturesPageClient } from "./_components/fixtures-page-client";

export default async function FixturesPage() {
  // Buscar jogos de hoje para exibir inicialmente
  const result = await getTodayFixtures();
  const initialFixtures = result.success && result.data ? result.data : [];

  // Log para debug
  if (process.env.NODE_ENV === "development") {
    console.log(`[FixturesPage] Total fixtures received: ${initialFixtures.length}`);
  }

  return <FixturesPageClient initialFixtures={initialFixtures} />;
}

