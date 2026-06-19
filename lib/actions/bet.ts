"use server";

import { getCurrentUser } from "@/lib/auth/get-user";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  CreateBetSchema,
  UpdateBetSchema,
  SettleBetSchema,
  FilterBetsSchema,
  type CreateBetInput,
  type UpdateBetInput,
  type SettleBetInput,
  type FilterBetsInput,
} from "@/lib/validations/bet";
import { upsertSportEventFromSelection } from "@/lib/integrations/sport-events";

export async function createBetForUser(userId: string, data: CreateBetInput) {
  const validatedData = CreateBetSchema.parse(data);

  const bankroll = await prisma.bankroll.findFirst({
    where: {
      id: validatedData.bankrollId,
      userId,
    },
  });

  if (!bankroll) {
    return { error: "Banca não encontrada" };
  }

  if (Number(bankroll.currentBalance) < validatedData.stake) {
    return { error: "Saldo insuficiente na banca" };
  }

  const result = await prisma.$transaction(async (tx) => {
    let sportEventId: string | undefined = validatedData.sportEventId;

    if (!sportEventId && validatedData.selectedEvent) {
      const sportEvent = await upsertSportEventFromSelection(
        validatedData.selectedEvent,
        tx
      );
      sportEventId = sportEvent.id;
    }

    const bet = await tx.bet.create({
      data: {
        userId,
        bankrollId: validatedData.bankrollId,
        sportEventId,
        sport: validatedData.sport,
        event: validatedData.event,
        competition: validatedData.competition,
        marketId: validatedData.marketId,
        selection: validatedData.selection,
        odds: validatedData.odds,
        stake: validatedData.stake,
        eventDate: validatedData.eventDate,
        bookmaker: validatedData.bookmaker,
        notes: validatedData.notes,
        tags: validatedData.tags,
      },
      include: {
        bankroll: {
          select: {
            name: true,
            currency: true,
          },
        },
        market: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await tx.bankroll.update({
      where: { id: validatedData.bankrollId },
      data: {
        currentBalance: {
          decrement: validatedData.stake,
        },
      },
    });

    return bet;
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/bets");
  revalidatePath("/dashboard/bankrolls");

  const betData = {
    ...result,
    odds: Number(result.odds),
    stake: Number(result.stake),
    profit: result.profit ? Number(result.profit) : null,
  };

  return { success: true as const, data: betData };
}

// Criar nova aposta
export async function createBet(data: CreateBetInput) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Não autenticado" };
    }

    const result = await createBetForUser(user.dbUser.id, data);
    if ("error" in result) {
      return { error: result.error };
    }
    return result;
  } catch (error: any) {
    console.error("Erro ao criar aposta:", error);
    return { error: error.message || "Erro ao criar aposta" };
  }
}

// Buscar apostas com filtros
export async function getBets(filters?: FilterBetsInput) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Não autenticado" };
    }

    const validatedFilters = filters ? FilterBetsSchema.parse(filters) : {};

    const where: any = {
      userId: user.dbUser.id,
    };

    if (validatedFilters.bankrollId) {
      where.bankrollId = validatedFilters.bankrollId;
    }

    if (validatedFilters.sport) {
      where.sport = validatedFilters.sport;
    }

    if (validatedFilters.status) {
      where.status = validatedFilters.status;
    }

    if (validatedFilters.startDate || validatedFilters.endDate) {
      where.eventDate = {};
      if (validatedFilters.startDate) {
        where.eventDate.gte = validatedFilters.startDate;
      }
      if (validatedFilters.endDate) {
        where.eventDate.lte = validatedFilters.endDate;
      }
    }

    const [bets, total] = await Promise.all([
      prisma.bet.findMany({
        where,
        include: {
          bankroll: {
            select: {
              name: true,
              currency: true,
            },
          },
          market: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          placedAt: "desc",
        },
        take: validatedFilters.limit || 50,
        skip: validatedFilters.offset || 0,
      }),
      prisma.bet.count({ where }),
    ]);

    // Converter Decimal para number para evitar erro de serialização
    const betsData = bets.map((bet) => ({
      ...bet,
      odds: Number(bet.odds),
      stake: Number(bet.stake),
      profit: bet.profit ? Number(bet.profit) : null,
    }));

    return {
      success: true,
      data: betsData,
      pagination: {
        total,
        limit: validatedFilters.limit || 50,
        offset: validatedFilters.offset || 0,
      },
    };
  } catch (error: any) {
    console.error("Erro ao buscar apostas:", error);
    return { error: error.message || "Erro ao buscar apostas" };
  }
}

// Buscar aposta por ID
export async function getBetById(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Não autenticado" };
    }

    const bet = await prisma.bet.findFirst({
      where: {
        id,
        userId: user.dbUser.id,
      },
      include: {
        bankroll: {
          select: {
            id: true,
            name: true,
            currency: true,
          },
        },
        market: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!bet) {
      return { error: "Aposta não encontrada" };
    }

    // Converter Decimal para number para evitar erro de serialização
    const betData = {
      ...bet,
      odds: Number(bet.odds),
      stake: Number(bet.stake),
      profit: bet.profit ? Number(bet.profit) : null,
    };

    return { success: true, data: betData };
  } catch (error: any) {
    console.error("Erro ao buscar aposta:", error);
    return { error: error.message || "Erro ao buscar aposta" };
  }
}

// Atualizar aposta
export async function updateBet(data: UpdateBetInput) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Não autenticado" };
    }

    const validatedData = UpdateBetSchema.parse(data);

    // Verificar se a aposta pertence ao usuário e está pendente
    const existingBet = await prisma.bet.findFirst({
      where: {
        id: validatedData.id,
        userId: user.dbUser.id,
        status: "PENDENTE", // Só pode editar apostas pendentes
      },
    });

    if (!existingBet) {
      return { error: "Aposta não encontrada ou já foi finalizada" };
    }

    const updateData: any = {
        sport: validatedData.sport,
        event: validatedData.event,
        competition: validatedData.competition,
        selection: validatedData.selection,
        odds: validatedData.odds,
        stake: validatedData.stake,
        eventDate: validatedData.eventDate,
        bookmaker: validatedData.bookmaker,
        notes: validatedData.notes,
        tags: validatedData.tags,
    };

    if (validatedData.marketId) {
      updateData.marketId = validatedData.marketId;
    }

    const bet = await prisma.bet.update({
      where: { id: validatedData.id },
      data: updateData,
      include: {
        bankroll: {
          select: {
            name: true,
            currency: true,
          },
        },
        market: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/bets");

    // Converter Decimal para number para evitar erro de serialização
    const betData = {
      ...bet,
      odds: Number(bet.odds),
      stake: Number(bet.stake),
      profit: bet.profit ? Number(bet.profit) : null,
    };

    return { success: true, data: betData };
  } catch (error: any) {
    console.error("Erro ao atualizar aposta:", error);
    return { error: error.message || "Erro ao atualizar aposta" };
  }
}

// Finalizar aposta (win/loss)
export async function settleBet(data: SettleBetInput) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Não autenticado" };
    }

    const validatedData = SettleBetSchema.parse(data);

    // Buscar a aposta
    const existingBet = await prisma.bet.findFirst({
      where: {
        id: validatedData.id,
        userId: user.dbUser.id,
      },
      include: {
        bankroll: true,
      },
    });

    if (!existingBet) {
      return { error: "Aposta não encontrada" };
    }

    if (existingBet.status !== "PENDENTE") {
      return { error: "Aposta já foi finalizada" };
    }

    // Calcular lucro/prejuízo
    let profit = 0;
    let balanceChange = 0;

    switch (validatedData.status) {
      case "GANHA":
        profit =
          Number(existingBet.stake) * Number(existingBet.odds) -
          Number(existingBet.stake);
        balanceChange = Number(existingBet.stake) * Number(existingBet.odds); // Retorna stake + lucro
        break;
      case "PERDIDA":
        profit = -Number(existingBet.stake);
        balanceChange = 0; // Já foi descontado ao criar a aposta
        break;
      case "ANULADA":
        profit = 0;
        balanceChange = Number(existingBet.stake); // Retorna o stake
        break;
      case "CASHOUT":
        // Para cashout, o lucro deve ser calculado externamente
        profit = 0; // Será atualizado manualmente
        balanceChange = 0; // Será atualizado manualmente
        break;
    }

    // Atualizar aposta e saldo da banca em uma transação
    const result = await prisma.$transaction(async (tx) => {
      // Atualizar aposta
      const bet = await tx.bet.update({
        where: { id: validatedData.id },
        data: {
          status: validatedData.status,
          result: validatedData.result,
          profit,
          settledAt: new Date(),
        },
        include: {
          bankroll: {
            select: {
              name: true,
              currency: true,
            },
          },
          market: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Atualizar saldo da banca
      if (balanceChange !== 0) {
        await tx.bankroll.update({
          where: { id: existingBet.bankrollId },
          data: {
            currentBalance: {
              increment: balanceChange,
            },
          },
        });
      }

      return bet;
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/bets");
    revalidatePath("/dashboard/bankrolls");

    // Converter Decimal para number para evitar erro de serialização
    const betData = {
      ...result,
      odds: Number(result.odds),
      stake: Number(result.stake),
      profit: result.profit ? Number(result.profit) : null,
    };

    return { success: true, data: betData };
  } catch (error: any) {
    console.error("Erro ao finalizar aposta:", error);
    return { error: error.message || "Erro ao finalizar aposta" };
  }
}

// Deletar aposta
export async function deleteBet(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Não autenticado" };
    }

    // Buscar a aposta
    const existingBet = await prisma.bet.findFirst({
      where: {
        id,
        userId: user.dbUser.id,
      },
    });

    if (!existingBet) {
      return { error: "Aposta não encontrada" };
    }

    // Se a aposta está pendente, devolver o valor à banca
    if (existingBet.status === "PENDENTE") {
      await prisma.$transaction(async (tx) => {
        // Deletar aposta
        await tx.bet.delete({
          where: { id },
        });

        // Devolver stake à banca
        await tx.bankroll.update({
          where: { id: existingBet.bankrollId },
          data: {
            currentBalance: {
              increment: Number(existingBet.stake),
            },
          },
        });
      });
    } else {
      // Se já foi finalizada, apenas deleta
      await prisma.bet.delete({
        where: { id },
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/bets");
    revalidatePath("/dashboard/bankrolls");

    return { success: true, message: "Aposta deletada com sucesso" };
  } catch (error: any) {
    console.error("Erro ao deletar aposta:", error);
    return { error: error.message || "Erro ao deletar aposta" };
  }
}
