import { getTodayFixtures } from "@/lib/actions/fixtures";
import { FixturesList } from "./_components/fixtures-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default async function FixturesPage() {
  const result = await getTodayFixtures();
  const fixtures = result.success && result.data ? result.data : [];

  const footballCount = fixtures.filter((f) => f.sport === "FUTEBOL").length;
  // Contar apenas jogos da NBA (league.apiId === 12)
  const basketballCount = fixtures.filter(
    (f) => f.sport === "BASQUETE" && f.league.apiId === 12
  ).length;

  return (
    <div className="container mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Jogos do Dia</h1>
        </div>
        <p className="text-muted-foreground">
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stats */}
      {fixtures.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total de Jogos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fixtures.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Futebol</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{footballCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Basquete</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{basketballCount}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fixtures List */}
      <FixturesList fixtures={fixtures} />
    </div>
  );
}

