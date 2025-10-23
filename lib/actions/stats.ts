"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Estatísticas gerais do usuário
export async function getUserStats() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Não autenticado" };
    }

    const [
      totalBets,
      wonBets,
      lostBets,
      voidBets,
      pendingBets,
      totalBankrolls,
      allBets,
    ] = await Promise.all([
      prisma.bet.count({ where: { userId: session.user.id } }),
      prisma.bet.count({ where: { userId: session.user.id, status: "GANHA" } }),
      prisma.bet.count({
        where: { userId: session.user.id, status: "PERDIDA" },
      }),
      prisma.bet.count({
        where: { userId: session.user.id, status: "ANULADA" },
      }),
      prisma.bet.count({
        where: { userId: session.user.id, status: "PENDENTE" },
      }),
      prisma.bankroll.count({ where: { userId: session.user.id } }),
      prisma.bet.findMany({
        where: {
          userId: session.user.id,
          profit: { not: null },
        },
        select: { profit: true, stake: true },
      }),
    ]);

    // Calcular lucro total e ROI
    const totalProfit = allBets.reduce(
      (sum, bet) => sum + Number(bet.profit || 0),
      0
    );
    const totalStaked = allBets.reduce(
      (sum, bet) => sum + Number(bet.stake),
      0
    );
    const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;

    // Calcular win rate
    const settledBets = totalBets - pendingBets - voidBets;
    const winRate = settledBets > 0 ? (wonBets / settledBets) * 100 : 0;

    // Calcular average odds (odds médio das apostas ganhas)
    const wonBetsWithOdds = await prisma.bet.findMany({
      where: {
        userId: session.user.id,
        status: "GANHA",
      },
      select: { odds: true },
    });
    const avgOdds =
      wonBetsWithOdds.length > 0
        ? wonBetsWithOdds.reduce((sum, bet) => sum + Number(bet.odds), 0) /
          wonBetsWithOdds.length
        : 0;

    return {
      success: true,
      data: {
        totalBets,
        wonBets,
        lostBets,
        voidBets,
        pendingBets,
        settledBets,
        totalBankrolls,
        totalProfit,
        totalStaked,
        roi,
        winRate,
        avgOdds,
      },
    };
  } catch (error: any) {
    console.error("Erro ao buscar estatísticas:", error);
    return { error: error.message || "Erro ao buscar estatísticas" };
  }
}

// Estatísticas por esporte
export async function getStatsBySport() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Não autenticado" };
    }

    const sports = await prisma.bet.groupBy({
      by: ["sport"],
      where: { userId: session.user.id },
      _count: { id: true },
      _sum: {
        profit: true,
        stake: true,
      },
    });

    const sportStats = await Promise.all(
      sports.map(async (sport) => {
        const [won, lost, pending] = await Promise.all([
          prisma.bet.count({
            where: {
              userId: session.user.id,
              sport: sport.sport,
              status: "GANHA",
            },
          }),
          prisma.bet.count({
            where: {
              userId: session.user.id,
              sport: sport.sport,
              status: "PERDIDA",
            },
          }),
          prisma.bet.count({
            where: {
              userId: session.user.id,
              sport: sport.sport,
              status: "PENDENTE",
            },
          }),
        ]);

        const settledBets = sport._count.id - pending;
        const winRate = settledBets > 0 ? (won / settledBets) * 100 : 0;
        const totalProfit = Number(sport._sum.profit || 0);
        const totalStaked = Number(sport._sum.stake || 0);
        const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;

        return {
          sport: sport.sport,
          totalBets: sport._count.id,
          won,
          lost,
          pending,
          winRate,
          totalProfit,
          totalStaked,
          roi,
        };
      })
    );

    return { success: true, data: sportStats };
  } catch (error: any) {
    console.error("Erro ao buscar estatísticas por esporte:", error);
    return {
      error: error.message || "Erro ao buscar estatísticas por esporte",
    };
  }
}

// Estatísticas mensais
export async function getMonthlyStats(year?: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Não autenticado" };
    }

    const targetYear = year || new Date().getFullYear();
    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31, 23, 59, 59);

    const bets = await prisma.bet.findMany({
      where: {
        userId: session.user.id,
        eventDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        eventDate: true,
        profit: true,
        stake: true,
        status: true,
      },
    });

    // Agrupar por mês
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      totalBets: 0,
      won: 0,
      lost: 0,
      pending: 0,
      totalProfit: 0,
      totalStaked: 0,
    }));

    bets.forEach((bet) => {
      const month = bet.eventDate.getMonth();
      monthlyData[month].totalBets++;
      monthlyData[month].totalStaked += Number(bet.stake);

      if (bet.status === "GANHA") {
        monthlyData[month].won++;
        monthlyData[month].totalProfit += Number(bet.profit || 0);
      } else if (bet.status === "PERDIDA") {
        monthlyData[month].lost++;
        monthlyData[month].totalProfit += Number(bet.profit || 0);
      } else if (bet.status === "PENDENTE") {
        monthlyData[month].pending++;
      }
    });

    // Calcular win rate e ROI para cada mês
    const stats = monthlyData.map((data) => {
      const settledBets = data.totalBets - data.pending;
      const winRate = settledBets > 0 ? (data.won / settledBets) * 100 : 0;
      const roi =
        data.totalStaked > 0 ? (data.totalProfit / data.totalStaked) * 100 : 0;

      return {
        ...data,
        winRate,
        roi,
      };
    });

    return { success: true, data: stats };
  } catch (error: any) {
    console.error("Erro ao buscar estatísticas mensais:", error);
    return { error: error.message || "Erro ao buscar estatísticas mensais" };
  }
}

// Top apostas mais lucrativas
export async function getTopProfitableBets(limit = 10) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Não autenticado" };
    }

    const bets = await prisma.bet.findMany({
      where: {
        userId: session.user.id,
        profit: { not: null },
      },
      include: {
        bankroll: {
          select: {
            name: true,
            currency: true,
          },
        },
      },
      orderBy: {
        profit: "desc",
      },
      take: limit,
    });

    return { success: true, data: bets };
  } catch (error: any) {
    console.error("Erro ao buscar top apostas:", error);
    return { error: error.message || "Erro ao buscar top apostas" };
  }
}

// Apostas recentes
export async function getRecentBets(limit = 10) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Não autenticado" };
    }

    const bets = await prisma.bet.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        bankroll: {
          select: {
            name: true,
            currency: true,
          },
        },
      },
      orderBy: {
        placedAt: "desc",
      },
      take: limit,
    });

    return { success: true, data: bets };
  } catch (error: any) {
    console.error("Erro ao buscar apostas recentes:", error);
    return { error: error.message || "Erro ao buscar apostas recentes" };
  }
}

// Estatísticas por período de datas
export async function getStatsByDateRange(startDate: Date, endDate: Date) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Não autenticado" };
    }

    // Buscar apostas finalizadas no período
    const bets = await prisma.bet.findMany({
      where: {
        userId: session.user.id,
        settledAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          not: "PENDENTE",
        },
      },
      select: {
        profit: true,
        stake: true,
        status: true,
        settledAt: true,
      },
    });

    // Calcular estatísticas
    const totalBets = bets.length;
    const wonBets = bets.filter((bet) => bet.status === "GANHA").length;
    const lostBets = bets.filter((bet) => bet.status === "PERDIDA").length;
    const voidBets = bets.filter((bet) => bet.status === "ANULADA").length;

    const totalProfit = bets.reduce(
      (sum, bet) => sum + Number(bet.profit || 0),
      0
    );
    const totalStaked = bets.reduce((sum, bet) => sum + Number(bet.stake), 0);

    const settledBets = totalBets - voidBets;
    const winRate = settledBets > 0 ? (wonBets / settledBets) * 100 : 0;
    const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;

    // Calcular lucro/prejuízo diário
    const dailyProfitsMap = new Map<string, number>();

    // Inicializar todos os dias do período com 0
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split("T")[0];
      dailyProfitsMap.set(dateKey, 0);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Adicionar lucros das apostas
    bets.forEach((bet) => {
      if (bet.settledAt) {
        const dateKey = bet.settledAt.toISOString().split("T")[0];
        const currentProfit = dailyProfitsMap.get(dateKey) || 0;
        dailyProfitsMap.set(dateKey, currentProfit + Number(bet.profit || 0));
      }
    });

    // Converter para array e ordenar por data
    const dailyProfits = Array.from(dailyProfitsMap.entries())
      .map(([date, profit]) => ({ date, profit }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      success: true,
      data: {
        totalBets,
        wonBets,
        lostBets,
        voidBets,
        settledBets,
        totalProfit,
        totalStaked,
        winRate,
        roi,
        dailyProfits,
        startDate,
        endDate,
      },
    };
  } catch (error: any) {
    console.error("Erro ao buscar estatísticas por período:", error);
    return {
      error: error.message || "Erro ao buscar estatísticas por período",
    };
  }
}

// Estatísticas do bankroll
export async function getBankrollStats(bankrollId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Não autenticado" };
    }

    const bankroll = await prisma.bankroll.findFirst({
      where: {
        id: bankrollId,
        userId: session.user.id,
      },
    });

    if (!bankroll) {
      return { error: "Banca não encontrada" };
    }

    const [totalBets, wonBets, lostBets, pendingBets, bets] = await Promise.all(
      [
        prisma.bet.count({ where: { bankrollId } }),
        prisma.bet.count({ where: { bankrollId, status: "GANHA" } }),
        prisma.bet.count({ where: { bankrollId, status: "PERDIDA" } }),
        prisma.bet.count({ where: { bankrollId, status: "PENDENTE" } }),
        prisma.bet.findMany({
          where: {
            bankrollId,
            profit: { not: null },
          },
          select: { profit: true, stake: true },
        }),
      ]
    );

    const totalProfit = bets.reduce(
      (sum, bet) => sum + Number(bet.profit || 0),
      0
    );
    const totalStaked = bets.reduce((sum, bet) => sum + Number(bet.stake), 0);
    const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;

    const settledBets = totalBets - pendingBets;
    const winRate = settledBets > 0 ? (wonBets / settledBets) * 100 : 0;

    const currentBalance = Number(bankroll.currentBalance);
    const initialBalance = Number(bankroll.initialBalance);
    const profitLoss = currentBalance - initialBalance;
    const profitLossPercentage =
      initialBalance > 0 ? (profitLoss / initialBalance) * 100 : 0;

    return {
      success: true,
      data: {
        bankrollId,
        bankrollName: bankroll.name,
        initialBalance,
        currentBalance,
        profitLoss,
        profitLossPercentage,
        totalBets,
        wonBets,
        lostBets,
        pendingBets,
        settledBets,
        winRate,
        totalProfit,
        totalStaked,
        roi,
      },
    };
  } catch (error: any) {
    console.error("Erro ao buscar estatísticas da banca:", error);
    return { error: error.message || "Erro ao buscar estatísticas da banca" };
  }
}
