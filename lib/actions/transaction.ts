"use server";

import { getCurrentUser } from "@/lib/auth/get-user";
import { prisma } from "@/lib/prisma";

/**
 * Buscar todas as transações de uma banca específica
 */
export async function getTransactions(bankrollId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Não autenticado" };
    }

    // Verificar se a banca pertence ao usuário
    const bankroll = await prisma.bankroll.findFirst({
      where: {
        id: bankrollId,
        userId: user.dbUser.id,
      },
    });

    if (!bankroll) {
      return { error: "Banca não encontrada" };
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        bankrollId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Converter Decimal para number
    const transactionsData = transactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
    }));

    return { success: true, data: transactionsData };
  } catch (error: any) {
    console.error("Erro ao buscar transações:", error);
    return { error: error.message || "Erro ao buscar transações" };
  }
}

/**
 * Buscar todas as transações do usuário (todas as bancas)
 */
export async function getAllTransactions() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Não autenticado" };
    }

    // Buscar todas as bancas do usuário
    const bankrolls = await prisma.bankroll.findMany({
      where: {
        userId: user.dbUser.id,
      },
      select: {
        id: true,
      },
    });

    const bankrollIds = bankrolls.map((b) => b.id);

    const transactions = await prisma.transaction.findMany({
      where: {
        bankrollId: {
          in: bankrollIds,
        },
      },
      include: {
        bankroll: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Converter Decimal para number
    const transactionsData = transactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
    }));

    return { success: true, data: transactionsData };
  } catch (error: any) {
    console.error("Erro ao buscar transações:", error);
    return { error: error.message || "Erro ao buscar transações" };
  }
}

