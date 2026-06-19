import type { BetProfitSummary } from '@/types'

export type BetForSummary = {
  bankrollId?: string
  status: string
  profit: number | { toString(): string } | null
  stake: number | { toString(): string }
}

export function createEmptyBetProfitSummary(): BetProfitSummary {
  return {
    wonProfit: 0,
    lostProfit: 0,
    otherProfit: 0,
    profitLoss: 0,
    pendingStake: 0,
    pendingCount: 0,
  }
}

function toNumber(value: number | { toString(): string }): number {
  return typeof value === 'number' ? value : Number(value)
}

export function addBetToSummary(
  summary: BetProfitSummary,
  status: string,
  profit: number | null,
  stake: number
) {
  if (status === 'PENDENTE') {
    summary.pendingStake += stake
    summary.pendingCount += 1
    return
  }

  if (profit === null) return

  if (status === 'GANHA') {
    summary.wonProfit += profit
  } else if (status === 'PERDIDA') {
    summary.lostProfit += profit
  } else {
    summary.otherProfit += profit
  }
  summary.profitLoss += profit
}

export function computeBetProfitSummary(bets: BetForSummary[]): BetProfitSummary {
  const summary = createEmptyBetProfitSummary()

  for (const bet of bets) {
    const stake = toNumber(bet.stake)
    const profit = bet.profit !== null ? toNumber(bet.profit) : null
    addBetToSummary(summary, bet.status, profit, stake)
  }

  return summary
}

export function aggregateBetProfitSummaries(bets: BetForSummary[]): {
  global: BetProfitSummary
  byBankroll: Record<string, BetProfitSummary>
} {
  const global = createEmptyBetProfitSummary()
  const byBankroll: Record<string, BetProfitSummary> = {}

  const getOrCreate = (bankrollId: string) => {
    if (!byBankroll[bankrollId]) {
      byBankroll[bankrollId] = createEmptyBetProfitSummary()
    }
    return byBankroll[bankrollId]
  }

  for (const bet of bets) {
    const stake = toNumber(bet.stake)
    const profit = bet.profit !== null ? toNumber(bet.profit) : null
    addBetToSummary(global, bet.status, profit, stake)

    if (bet.bankrollId) {
      addBetToSummary(getOrCreate(bet.bankrollId), bet.status, profit, stake)
    }
  }

  return { global, byBankroll }
}

export function computeBetPeriodStats(bets: BetForSummary[]) {
  const summary = computeBetProfitSummary(bets)
  const totalStaked = bets.reduce((sum, bet) => sum + toNumber(bet.stake), 0)

  return {
    summary,
    totalStaked,
    totalBets: bets.length,
  }
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatSignedCurrency(value: number) {
  if (value >= 0) return `+${formatCurrency(value)}`
  return `-${formatCurrency(Math.abs(value))}`
}
