"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/get-user";
import { revalidatePath } from "next/cache";

interface ApiLeagueResponse {
  response: {
    league: {
      id: number;
      name: string;
      logo: string;
      type: string;
    };
    country: {
      name: string;
      code: string;
      flag: string;
    };
  }[];
}

/**
 * Sincroniza todas as ligas disponíveis na API-Football para o banco de dados local.
 * Isso deve ser executado para popular o seletor de ligas.
 */
export async function syncAllLeagues() {
  try {
    const apiKey = process.env.API_FOOTBALL_KEY;
    if (!apiKey) {
      throw new Error("API_FOOTBALL_KEY não configurada");
    }

    const response = await fetch("https://v3.football.api-sports.io/leagues", {
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": "v3.football.api-sports.io",
      },
      next: { revalidate: 86400 }, // Cache por 24h
    });

    if (!response.ok) {
      throw new Error(`Erro API-Football: ${response.status}`);
    }

    const data: ApiLeagueResponse = await response.json();
    
    // Processar em lotes para evitar sobrecarga no banco
    const BATCH_SIZE = 100;
    const leagues = data.response;
    let syncedCount = 0;

    for (let i = 0; i < leagues.length; i += BATCH_SIZE) {
      const batch = leagues.slice(i, i + BATCH_SIZE);
      
      await Promise.all(
        batch.map((item) =>
          prisma.league.upsert({
            where: { apiId: item.league.id },
            update: {
              name: item.league.name,
              logo: item.league.logo,
              country: item.country.name,
            },
            create: {
              apiId: item.league.id,
              name: item.league.name,
              logo: item.league.logo,
              country: item.country.name,
              sport: "FUTEBOL",
            },
          })
        )
      );
      syncedCount += batch.length;
    }

    return { success: true, count: syncedCount };
  } catch (error: any) {
    console.error("[syncAllLeagues] Erro:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Atualiza as ligas favoritas do usuário em massa.
 */
export async function updateUserFavoriteLeagues(leagueIds: string[]) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Usuário não autenticado" };
    }

    const userId = user.dbUser.id;

    // Usar transação para garantir atomicidade
    await prisma.$transaction(async (tx) => {
      // 1. Remover favoritos atuais
      await tx.favoriteLeague.deleteMany({
        where: { userId },
      });

      // 2. Adicionar novos favoritos
      if (leagueIds.length > 0) {
        await tx.favoriteLeague.createMany({
          data: leagueIds.map((leagueId) => ({
            userId,
            leagueId,
          })),
        });
      }
    });

    revalidatePath("/dashboard/fixtures");
    revalidatePath("/dashboard/settings/leagues");

    return { success: true };
  } catch (error: any) {
    console.error("[updateUserFavoriteLeagues] Erro:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Busca todas as ligas do banco para o seletor.
 */
export async function getLeaguesForSelector() {
  try {
    const leagues = await prisma.league.findMany({
      orderBy: [
        { country: "asc" },
        { name: "asc" }
      ],
    });
    return { success: true, data: leagues };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
