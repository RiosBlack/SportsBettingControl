import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getBankrolls } from '@/lib/actions/bankroll'
import { getAllTransactions } from '@/lib/actions/transaction'
import { getBetProfitSummaries } from '@/lib/actions/stats'
import { BankrollsList } from './_components/bankrolls-list'
import { CreateBankrollDialog } from './_components/create-bankroll-dialog'
import { TransactionsList } from './_components/transactions-list'
import { BetProfitLossSummary } from '@/app/dashboard/_components/bet-profit-loss-summary'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet } from 'lucide-react'
import type { BetProfitSummary } from '@/types'

const emptyBetSummary: BetProfitSummary = {
  wonProfit: 0,
  lostProfit: 0,
  otherProfit: 0,
  profitLoss: 0,
  pendingStake: 0,
  pendingCount: 0,
}

export default async function BankrollsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const [bankrollsResult, transactionsResult, profitSummariesResult] = await Promise.all([
    getBankrolls(),
    getAllTransactions(),
    getBetProfitSummaries(),
  ])
  const bankrolls = bankrollsResult.data || []
  const transactions = transactionsResult.success && transactionsResult.data ? transactionsResult.data : []
  const globalProfitSummary = profitSummariesResult.success && profitSummariesResult.data
    ? profitSummariesResult.data.global
    : emptyBetSummary
  const betSummariesByBankroll = profitSummariesResult.success && profitSummariesResult.data
    ? profitSummariesResult.data.byBankroll
    : {}

  const totalBalance = bankrolls.reduce((sum, b) => sum + b.currentBalance, 0)
  const totalInitial = bankrolls.reduce((sum, b) => sum + b.initialBalance, 0)
  const totalDeposits = transactions
    .filter((t) => t.type === 'DEPOSIT')
    .reduce((sum, t) => sum + t.amount, 0)
  const totalInvestment = totalInitial + totalDeposits
  const totalProfitPercent = totalInvestment > 0
    ? (globalProfitSummary.profitLoss / totalInvestment) * 100
    : 0

  const depositsByBankroll = transactions
    .filter((t) => t.type === 'DEPOSIT')
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.bankrollId] = (acc[t.bankrollId] ?? 0) + t.amount
      return acc
    }, {})

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-end">
        <CreateBankrollDialog />
      </div>

      {/* Resumo */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Saldo Total</CardDescription>
            <CardTitle className="text-2xl">R$ {totalBalance.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Investimento Total</CardDescription>
            <CardTitle className="text-2xl">R$ {totalInvestment.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Lucro/Prejuízo</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <BetProfitLossSummary
              summary={globalProfitSummary}
              percent={totalProfitPercent}
              size="md"
              align="left"
            />
          </CardContent>
        </Card>
      </div>

      {/* Lista de Bancas */}
      {bankrolls.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Wallet className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma banca criada</h3>
            <p className="text-muted-foreground mb-6">Crie sua primeira banca para começar</p>
            <CreateBankrollDialog />
          </CardContent>
        </Card>
      ) : (
        <>
          <BankrollsList
            bankrolls={bankrolls}
            depositsByBankroll={depositsByBankroll}
            betSummariesByBankroll={betSummariesByBankroll}
          />
          <div className="mt-6">
            <TransactionsList transactions={transactions} showBankrollName={true} />
          </div>
        </>
      )}
    </div>
  )
}

