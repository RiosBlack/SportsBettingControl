"use server";

import { getCurrentUser } from "@/lib/auth/get-user";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Buscar IDs das ligas favoritas do usuário atual
 */
export async function getUserFavoriteLeagues(): Promise<string[]> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return [];
    }

    const favorites = await prisma.favoriteLeague.findMany({
      where: {
        userId: user.dbUser.id,
      },
      select: {
        leagueId: true,
      },
    });

    return favorites.map((f) => f.leagueId);
  } catch (error) {
    console.error("Error fetching favorite leagues:", error);
    return [];
  }
}

/**
 * Buscar IDs dos times favoritos do usuário atual
 */
/**
 * Liga favorita de qualquer usuário (para sync diário/cron).
 */
export async function getAllFavoriteLeagueIds(): Promise<string[]> {
  const rows = await prisma.favoriteLeague.findMany({
    distinct: ["leagueId"],
    select: { leagueId: true },
  });
  return rows.map((r) => r.leagueId);
}

/**
 * Times favoritos de qualquer usuário (para sync diário/cron).
 */
export async function getAllFavoriteTeamIds(): Promise<string[]> {
  const rows = await prisma.favoriteTeam.findMany({
    distinct: ["teamId"],
    select: { teamId: true },
  });
  return rows.map((r) => r.teamId);
}

export async function getUserFavoriteTeams(): Promise<string[]> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return [];
    }

    const favorites = await prisma.favoriteTeam.findMany({
      where: {
        userId: user.dbUser.id,
      },
      select: {
        teamId: true,
      },
    });

    return favorites.map((f) => f.teamId);
  } catch (error) {
    console.error("Error fetching favorite teams:", error);
    return [];
  }
}

/**
 * Verificar se uma liga é favorita do usuário atual
 */
export async function isLeagueFavorite(leagueId: string): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return false;
    }

    const favorite = await prisma.favoriteLeague.findUnique({
      where: {
        userId_leagueId: {
          userId: user.dbUser.id,
          leagueId,
        },
      },
    });

    return !!favorite;
  } catch (error) {
    console.error("Error checking if league is favorite:", error);
    return false;
  }
}

/**
 * Verificar se um time é favorito do usuário atual
 */
export async function isTeamFavorite(teamId: string): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return false;
    }

    const favorite = await prisma.favoriteTeam.findUnique({
      where: {
        userId_teamId: {
          userId: user.dbUser.id,
          teamId,
        },
      },
    });

    return !!favorite;
  } catch (error) {
    console.error("Error checking if team is favorite:", error);
    return false;
  }
}

/**
 * Adicionar ou remover liga dos favoritos
 */
export async function toggleFavoriteLeague(leagueId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Não autenticado" };
    }

    // Verificar se a liga existe
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
    });

    if (!league) {
      return { error: "Liga não encontrada" };
    }

    // Verificar se já é favorita
    const existing = await prisma.favoriteLeague.findUnique({
      where: {
        userId_leagueId: {
          userId: user.dbUser.id,
          leagueId,
        },
      },
    });

    if (existing) {
      // Remover dos favoritos
      await prisma.favoriteLeague.delete({
        where: {
          id: existing.id,
        },
      });
      revalidatePath("/dashboard/fixtures");
      revalidatePath("/dashboard/favorites");
      return { success: true, isFavorite: false };
    } else {
      // Adicionar aos favoritos
      await prisma.favoriteLeague.create({
        data: {
          userId: user.dbUser.id,
          leagueId,
        },
      });
      revalidatePath("/dashboard/fixtures");
      revalidatePath("/dashboard/favorites");
      return { success: true, isFavorite: true };
    }
  } catch (error: any) {
    console.error("Error toggling favorite league:", error);
    return { error: error.message || "Erro ao atualizar favorito" };
  }
}

/**
 * Adicionar ou remover time dos favoritos
 */
export async function toggleFavoriteTeam(teamId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Não autenticado" };
    }

    // Verificar se o time existe
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return { error: "Time não encontrado" };
    }

    // Verificar se já é favorito
    const existing = await prisma.favoriteTeam.findUnique({
      where: {
        userId_teamId: {
          userId: user.dbUser.id,
          teamId,
        },
      },
    });

    if (existing) {
      // Remover dos favoritos
      await prisma.favoriteTeam.delete({
        where: {
          id: existing.id,
        },
      });
      revalidatePath("/dashboard/fixtures");
      revalidatePath("/dashboard/favorites");
      return { success: true, isFavorite: false };
    } else {
      // Adicionar aos favoritos
      await prisma.favoriteTeam.create({
        data: {
          userId: user.dbUser.id,
          teamId,
        },
      });
      revalidatePath("/dashboard/fixtures");
      revalidatePath("/dashboard/favorites");
      return { success: true, isFavorite: true };
    }
  } catch (error: any) {
    console.error("Error toggling favorite team:", error);
    return { error: error.message || "Erro ao atualizar favorito" };
  }
}

/**
 * Buscar todas as ligas com informação de favorito
 */
export async function getAllLeaguesWithFavoriteStatus() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Não autenticado" };
    }

    const leagues = await prisma.league.findMany({
      orderBy: {
        name: "asc",
      },
    });

    const favoriteLeagueIds = await getUserFavoriteLeagues();

    return {
      success: true,
      data: leagues.map((league) => ({
        ...league,
        isFavorite: favoriteLeagueIds.includes(league.id),
      })),
    };
  } catch (error: any) {
    console.error("Error fetching leagues:", error);
    return { error: error.message || "Erro ao buscar ligas" };
  }
}

/**
 * Buscar todos os times com informação de favorito
 */
export async function getAllTeamsWithFavoriteStatus() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Não autenticado" };
    }

    const teams = await prisma.team.findMany({
      orderBy: {
        name: "asc",
      },
    });

    const favoriteTeamIds = await getUserFavoriteTeams();

    return {
      success: true,
      data: teams.map((team) => ({
        ...team,
        isFavorite: favoriteTeamIds.includes(team.id),
      })),
    };
  } catch (error: any) {
    console.error("Error fetching teams:", error);
    return { error: error.message || "Erro ao buscar times" };
  }
}

