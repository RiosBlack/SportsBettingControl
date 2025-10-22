import { Prisma } from '@prisma/client'

// Tipos para Bankroll
export type Bankroll = Prisma.BankrollGetPayload<{}>
export type BankrollWithCount = Prisma.BankrollGetPayload<{
  include: {
    _count: {
      select: { bets: true }
    }
  }
}>
export type BankrollWithBets = Prisma.BankrollGetPayload<{
  include: {
    bets: true
  }
}>

// Tipos para Bet
export type Bet = Prisma.BetGetPayload<{}>
export type BetWithBankroll = Prisma.BetGetPayload<{
  include: {
    bankroll: {
      select: {
        name: true
        currency: true
      }
    }
  }
}>
export type BetWithRelations = Prisma.BetGetPayload<{
  include: {
    bankroll: true
    user: {
      select: {
        id: true
        name: true
        email: true
      }
    }
  }
}>

// Tipos para User
export type User = Prisma.UserGetPayload<{}>
export type UserWithBankrolls = Prisma.UserGetPayload<{
  include: {
    bankrolls: true
  }
}>
export type UserWithBets = Prisma.UserGetPayload<{
  include: {
    bets: true
  }
}>

// Tipos para estatísticas
export interface UserStats {
  totalBets: number
  wonBets: number
  lostBets: number
  voidBets: number
  pendingBets: number
  settledBets: number
  totalBankrolls: number
  totalProfit: number
  totalStaked: number
  roi: number
  winRate: number
  avgOdds: number
}

export interface SportStats {
  sport: string
  totalBets: number
  won: number
  lost: number
  pending: number
  winRate: number
  totalProfit: number
  totalStaked: number
  roi: number
}

export interface MonthlyStats {
  month: number
  totalBets: number
  won: number
  lost: number
  pending: number
  totalProfit: number
  totalStaked: number
  winRate: number
  roi: number
}

export interface BankrollStats {
  bankrollId: string
  bankrollName: string
  initialBalance: number
  currentBalance: number
  profitLoss: number
  profitLossPercentage: number
  totalBets: number
  wonBets: number
  lostBets: number
  pendingBets: number
  settledBets: number
  winRate: number
  totalProfit: number
  totalStaked: number
  roi: number
}

// Tipos para responses das actions
export type ActionResponse<T = any> = 
  | { success: true; data: T; message?: string }
  | { error: string; success?: false }

export type PaginatedResponse<T = any> = ActionResponse<T> & {
  pagination?: {
    total: number
    limit: number
    offset: number
  }
}

// Enums
export enum Sport {
  FUTEBOL = 'FUTEBOL',
  BASQUETE = 'BASQUETE',
  TENIS = 'TENIS',
  VOLEI = 'VOLEI',
  FUTSAL = 'FUTSAL',
  HANDEBOL = 'HANDEBOL',
  BASEBALL = 'BASEBALL',
  FUTEBOL_AMERICANO = 'FUTEBOL_AMERICANO',
  HOCKEY = 'HOCKEY',
  MMA = 'MMA',
  BOXE = 'BOXE',
  ESPORTS = 'ESPORTS',
  OUTROS = 'OUTROS',
}

export enum BetStatus {
  PENDENTE = 'PENDENTE',
  GANHA = 'GANHA',
  PERDIDA = 'PERDIDA',
  ANULADA = 'ANULADA',
  CASHOUT = 'CASHOUT',
}

export enum BetResult {
  WIN = 'WIN',
  LOSS = 'LOSS',
  VOID = 'VOID',
  HALF_WIN = 'HALF_WIN',
  HALF_LOSS = 'HALF_LOSS',
}

// Utilitários
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T

