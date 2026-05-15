"use server";

import { prisma } from "@/lib/prisma";
import { getTodayStart } from "@/lib/date-time";
import {
  getAllFavoriteLeagueIds,
  getAllFavoriteTeamIds,
  getUserFavoriteLeagues,
  getUserFavoriteTeams,
} from "./favorites";
import { syncFixturesByLeagues } from "./fixtures";
import { syncTeamStatistics } from "./team-statistics";
import type { SyncFixturesResult } from "@/lib/types/fixtures";
import type { SyncTeamStatisticsResult } from "@/lib/types/team-statistics";

export interface DatabaseSyncResult {
  success: boolean;
  fixtures: SyncFixturesResult;
  statistics: SyncTeamStatisticsResult;
  error?: string;
  message?: string;
}

/**
 * Sincronização incremental: fixtures do dia + estatísticas faltantes.
 * Não usa force — só busca o que ainda não está no banco.
 */
export async function runIncrementalDatabaseSync(options: {
  leagueIds: string[];
  favoriteTeamIds?: string[];
  /** Mais partidas por execução (ex.: cron diário). */
  maxStatsPerRun?: number;
}): Promise<DatabaseSyncResult> {
  const { leagueIds, favoriteTeamIds, maxStatsPerRun } = options;

  if (leagueIds.length === 0) {
    return {
      success: false,
      fixtures: { success: true, footballCount: 0 },
      statistics: { success: true, processed: 0, skipped: 0 },
      error: "Nenhuma liga configurada para sincronizar",
    };
  }

  const today = getTodayStart();

  const fixtures = await syncFixturesByLeagues(today, leagueIds, false);

  const statistics = await syncTeamStatistics({
    leagueIds,
    upToDate: today,
    favoriteTeamIds,
    maxFixturesPerRun: maxStatsPerRun,
  });

  const success = fixtures.success && statistics.success;

  return {
    success,
    fixtures,
    statistics,
    message: success
      ? `Jogos: ${fixtures.footballCount ?? 0} processados. Stats: ${statistics.processed} novas, ${statistics.skipped} já existentes.`
      : fixtures.error || statistics.error,
  };
}

/** Sync do usuário logado (ligas e times favoritos dele). */
export async function syncUserDatabase(): Promise<DatabaseSyncResult> {
  const leagueIds = await getUserFavoriteLeagues();
  const favoriteTeamIds = await getUserFavoriteTeams();

  return runIncrementalDatabaseSync({
    leagueIds,
    favoriteTeamIds,
  });
}

/** Sync global para cron — todas as ligas/times favoritos no sistema. */
export async function syncSystemDatabase(): Promise<DatabaseSyncResult> {
  const leagueIds = await getAllFavoriteLeagueIds();
  const favoriteTeamIds = await getAllFavoriteTeamIds();

  return runIncrementalDatabaseSync({
    leagueIds,
    favoriteTeamIds,
    maxStatsPerRun: 80,
  });
}
