"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  CreateBankrollSchema,
  UpdateBankrollSchema,
  UpdateBankrollBalanceSchema,
  type CreateBankrollInput,
  type UpdateBankrollInput,
  type UpdateBankrollBalanceInput,
} from "@/lib/validations/bankroll";

// Criar nova banca
export async function createBankroll(data: CreateBankrollInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Não autenticado" };
    }

    const validatedData = CreateBankrollSchema.parse(data);

    const bankroll = await prisma.bankroll.create({
      data: {
        userId: session.user.id,
        name: validatedData.name,
        initialBalance: validatedData.initialBalance,
        currentBalance: validatedData.initialBalance,
        currency: validatedData.currency,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/bankrolls");

    // Converter Decimal para number para evitar erro de serialização
    const bankrollData = {
      ...bankroll,
      initialBalance: Number(bankroll.initialBalance),
      currentBalance: Number(bankroll.currentBalance),
    };

    return { success: true, data: bankrollData };
  } catch (error: any) {
    console.error("Erro ao criar banca:", error);
    return { error: error.message || "Erro ao criar banca" };
  }
}

// Buscar todas as bancas do usuário
export async function getBankrolls() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Não autenticado" };
    }

    const bankrolls = await prisma.bankroll.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        _count: {
          select: { bets: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Converter Decimal para number para evitar erro de serialização
    const bankrollsData = bankrolls.map((b) => ({
      ...b,
      initialBalance: Number(b.initialBalance),
      currentBalance: Number(b.currentBalance),
    }));

    return { success: true, data: bankrollsData };
  } catch (error: any) {
    console.error("Erro ao buscar bancas:", error);
    return { error: error.message || "Erro ao buscar bancas" };
  }
}

// Buscar banca por ID
export async function getBankrollById(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Não autenticado" };
    }

    const bankroll = await prisma.bankroll.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        _count: {
          select: { bets: true },
        },
        bets: {
          take: 10,
          orderBy: { placedAt: "desc" },
        },
      },
    });

    if (!bankroll) {
      return { error: "Banca não encontrada" };
    }

    // Converter Decimal para number para evitar erro de serialização
    const bankrollData = {
      ...bankroll,
      initialBalance: Number(bankroll.initialBalance),
      currentBalance: Number(bankroll.currentBalance),
      bets: bankroll.bets.map((bet) => ({
        ...bet,
        odds: Number(bet.odds),
        stake: Number(bet.stake),
        profit: bet.profit ? Number(bet.profit) : null,
      })),
    };

    return { success: true, data: bankrollData };
  } catch (error: any) {
    console.error("Erro ao buscar banca:", error);
    return { error: error.message || "Erro ao buscar banca" };
  }
}

// Atualizar banca
export async function updateBankroll(data: UpdateBankrollInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Não autenticado" };
    }

    const validatedData = UpdateBankrollSchema.parse(data);

    // Verificar se a banca pertence ao usuário
    const existingBankroll = await prisma.bankroll.findFirst({
      where: {
        id: validatedData.id,
        userId: session.user.id,
      },
    });

    if (!existingBankroll) {
      return { error: "Banca não encontrada" };
    }

    const bankroll = await prisma.bankroll.update({
      where: { id: validatedData.id },
      data: {
        name: validatedData.name,
        isActive: validatedData.isActive,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/bankrolls");

    // Converter Decimal para number para evitar erro de serialização
    const bankrollData = {
      ...bankroll,
      initialBalance: Number(bankroll.initialBalance),
      currentBalance: Number(bankroll.currentBalance),
    };

    return { success: true, data: bankrollData };
  } catch (error: any) {
    console.error("Erro ao atualizar banca:", error);
    return { error: error.message || "Erro ao atualizar banca" };
  }
}

// Atualizar saldo da banca
export async function updateBankrollBalance(data: UpdateBankrollBalanceInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Não autenticado" };
    }

    const validatedData = UpdateBankrollBalanceSchema.parse(data);

    // Verificar se a banca pertence ao usuário
    const existingBankroll = await prisma.bankroll.findFirst({
      where: {
        id: validatedData.id,
        userId: session.user.id,
      },
    });

    if (!existingBankroll) {
      return { error: "Banca não encontrada" };
    }

    let newBalance: number;

    switch (validatedData.operation) {
      case "add":
        newBalance =
          Number(existingBankroll.currentBalance) + validatedData.amount;
        break;
      case "subtract":
        newBalance =
          Number(existingBankroll.currentBalance) - validatedData.amount;
        if (newBalance < 0) {
          return { error: "Saldo insuficiente" };
        }
        break;
      case "set":
        newBalance = validatedData.amount;
        break;
      default:
        return { error: "Operação inválida" };
    }

    const bankroll = await prisma.bankroll.update({
      where: { id: validatedData.id },
      data: {
        currentBalance: newBalance,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/bankrolls");

    // Converter Decimal para number para evitar erro de serialização
    const bankrollData = {
      ...bankroll,
      initialBalance: Number(bankroll.initialBalance),
      currentBalance: Number(bankroll.currentBalance),
    };

    return { success: true, data: bankrollData };
  } catch (error: any) {
    console.error("Erro ao atualizar saldo:", error);
    return { error: error.message || "Erro ao atualizar saldo" };
  }
}

// Deletar banca
export async function deleteBankroll(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Não autenticado" };
    }

    // Verificar se a banca pertence ao usuário
    const existingBankroll = await prisma.bankroll.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        _count: {
          select: { bets: true },
        },
      },
    });

    if (!existingBankroll) {
      return { error: "Banca não encontrada" };
    }

    // Verificar se há apostas associadas
    if (existingBankroll._count.bets > 0) {
      return {
        error: `Não é possível deletar. Existem ${existingBankroll._count.bets} apostas associadas.`,
      };
    }

    await prisma.bankroll.delete({
      where: { id },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/bankrolls");

    return { success: true, message: "Banca deletada com sucesso" };
  } catch (error: any) {
    console.error("Erro ao deletar banca:", error);
    return { error: error.message || "Erro ao deletar banca" };
  }
}

// Buscar banca ativa (principal)
export async function getActiveBankroll() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Não autenticado" };
    }

    const bankroll = await prisma.bankroll.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      orderBy: {
        createdAt: "asc", // Pega a primeira criada
      },
    });

    if (!bankroll) {
      return { error: "Nenhuma banca ativa encontrada" };
    }

    // Converter Decimal para number para evitar erro de serialização
    const bankrollData = {
      ...bankroll,
      initialBalance: Number(bankroll.initialBalance),
      currentBalance: Number(bankroll.currentBalance),
    };

    return { success: true, data: bankrollData };
  } catch (error: any) {
    console.error("Erro ao buscar banca ativa:", error);
    return { error: error.message || "Erro ao buscar banca ativa" };
  }
}
