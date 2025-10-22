'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import {
  CreateBetSchema,
  UpdateBetSchema,
  SettleBetSchema,
  FilterBetsSchema,
  type CreateBetInput,
  type UpdateBetInput,
  type SettleBetInput,
  type FilterBetsInput,
} from '@/lib/validations/bet'

// Criar nova aposta
export async function createBet(data: CreateBetInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Não autenticado' }
    }

    const validatedData = CreateBetSchema.parse(data)

    // Verificar se a banca pertence ao usuário
    const bankroll = await prisma.bankroll.findFirst({
      where: {
        id: validatedData.bankrollId,
        userId: session.user.id,
      },
    })

    if (!bankroll) {
      return { error: 'Banca não encontrada' }
    }

    // Verificar se há saldo suficiente
    if (Number(bankroll.currentBalance) < validatedData.stake) {
      return { error: 'Saldo insuficiente na banca' }
    }

    // Criar a aposta e atualizar o saldo em uma transação
    const result = await prisma.$transaction(async (tx) => {
      // Criar aposta
      const bet = await tx.bet.create({
        data: {
          userId: session.user.id!,
          bankrollId: validatedData.bankrollId,
          sport: validatedData.sport,
          event: validatedData.event,
          competition: validatedData.competition,
          market: validatedData.market,
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
        },
      })

      // Atualizar saldo da banca
      await tx.bankroll.update({
        where: { id: validatedData.bankrollId },
        data: {
          currentBalance: {
            decrement: validatedData.stake,
          },
        },
      })

      return bet
    })

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/bets')
    revalidatePath('/dashboard/bankrolls')

    return { success: true, data: result }
  } catch (error: any) {
    console.error('Erro ao criar aposta:', error)
    return { error: error.message || 'Erro ao criar aposta' }
  }
}

// Buscar apostas com filtros
export async function getBets(filters?: FilterBetsInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Não autenticado' }
    }

    const validatedFilters = filters ? FilterBetsSchema.parse(filters) : {}

    const where: any = {
      userId: session.user.id,
    }

    if (validatedFilters.bankrollId) {
      where.bankrollId = validatedFilters.bankrollId
    }

    if (validatedFilters.sport) {
      where.sport = validatedFilters.sport
    }

    if (validatedFilters.status) {
      where.status = validatedFilters.status
    }

    if (validatedFilters.startDate || validatedFilters.endDate) {
      where.eventDate = {}
      if (validatedFilters.startDate) {
        where.eventDate.gte = validatedFilters.startDate
      }
      if (validatedFilters.endDate) {
        where.eventDate.lte = validatedFilters.endDate
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
        },
        orderBy: {
          placedAt: 'desc',
        },
        take: validatedFilters.limit || 50,
        skip: validatedFilters.offset || 0,
      }),
      prisma.bet.count({ where }),
    ])

    return { 
      success: true, 
      data: bets,
      pagination: {
        total,
        limit: validatedFilters.limit || 50,
        offset: validatedFilters.offset || 0,
      }
    }
  } catch (error: any) {
    console.error('Erro ao buscar apostas:', error)
    return { error: error.message || 'Erro ao buscar apostas' }
  }
}

// Buscar aposta por ID
export async function getBetById(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Não autenticado' }
    }

    const bet = await prisma.bet.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        bankroll: {
          select: {
            id: true,
            name: true,
            currency: true,
          },
        },
      },
    })

    if (!bet) {
      return { error: 'Aposta não encontrada' }
    }

    return { success: true, data: bet }
  } catch (error: any) {
    console.error('Erro ao buscar aposta:', error)
    return { error: error.message || 'Erro ao buscar aposta' }
  }
}

// Atualizar aposta
export async function updateBet(data: UpdateBetInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Não autenticado' }
    }

    const validatedData = UpdateBetSchema.parse(data)

    // Verificar se a aposta pertence ao usuário e está pendente
    const existingBet = await prisma.bet.findFirst({
      where: {
        id: validatedData.id,
        userId: session.user.id,
        status: 'PENDENTE', // Só pode editar apostas pendentes
      },
    })

    if (!existingBet) {
      return { error: 'Aposta não encontrada ou já foi finalizada' }
    }

    const bet = await prisma.bet.update({
      where: { id: validatedData.id },
      data: {
        sport: validatedData.sport,
        event: validatedData.event,
        competition: validatedData.competition,
        market: validatedData.market,
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
      },
    })

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/bets')

    return { success: true, data: bet }
  } catch (error: any) {
    console.error('Erro ao atualizar aposta:', error)
    return { error: error.message || 'Erro ao atualizar aposta' }
  }
}

// Finalizar aposta (win/loss)
export async function settleBet(data: SettleBetInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Não autenticado' }
    }

    const validatedData = SettleBetSchema.parse(data)

    // Buscar a aposta
    const existingBet = await prisma.bet.findFirst({
      where: {
        id: validatedData.id,
        userId: session.user.id,
      },
      include: {
        bankroll: true,
      },
    })

    if (!existingBet) {
      return { error: 'Aposta não encontrada' }
    }

    if (existingBet.status !== 'PENDENTE') {
      return { error: 'Aposta já foi finalizada' }
    }

    // Calcular lucro/prejuízo
    let profit = 0
    let balanceChange = 0

    switch (validatedData.status) {
      case 'GANHA':
        profit = Number(existingBet.stake) * Number(existingBet.odds) - Number(existingBet.stake)
        balanceChange = Number(existingBet.stake) * Number(existingBet.odds) // Retorna stake + lucro
        break
      case 'PERDIDA':
        profit = -Number(existingBet.stake)
        balanceChange = 0 // Já foi descontado ao criar a aposta
        break
      case 'ANULADA':
        profit = 0
        balanceChange = Number(existingBet.stake) // Retorna o stake
        break
      case 'CASHOUT':
        // Para cashout, o lucro deve ser calculado externamente
        profit = 0 // Será atualizado manualmente
        balanceChange = 0 // Será atualizado manualmente
        break
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
        },
      })

      // Atualizar saldo da banca
      if (balanceChange !== 0) {
        await tx.bankroll.update({
          where: { id: existingBet.bankrollId },
          data: {
            currentBalance: {
              increment: balanceChange,
            },
          },
        })
      }

      return bet
    })

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/bets')
    revalidatePath('/dashboard/bankrolls')

    return { success: true, data: result }
  } catch (error: any) {
    console.error('Erro ao finalizar aposta:', error)
    return { error: error.message || 'Erro ao finalizar aposta' }
  }
}

// Deletar aposta
export async function deleteBet(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Não autenticado' }
    }

    // Buscar a aposta
    const existingBet = await prisma.bet.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existingBet) {
      return { error: 'Aposta não encontrada' }
    }

    // Se a aposta está pendente, devolver o valor à banca
    if (existingBet.status === 'PENDENTE') {
      await prisma.$transaction(async (tx) => {
        // Deletar aposta
        await tx.bet.delete({
          where: { id },
        })

        // Devolver stake à banca
        await tx.bankroll.update({
          where: { id: existingBet.bankrollId },
          data: {
            currentBalance: {
              increment: Number(existingBet.stake),
            },
          },
        })
      })
    } else {
      // Se já foi finalizada, apenas deleta
      await prisma.bet.delete({
        where: { id },
      })
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/bets')
    revalidatePath('/dashboard/bankrolls')

    return { success: true, message: 'Aposta deletada com sucesso' }
  } catch (error: any) {
    console.error('Erro ao deletar aposta:', error)
    return { error: error.message || 'Erro ao deletar aposta' }
  }
}

