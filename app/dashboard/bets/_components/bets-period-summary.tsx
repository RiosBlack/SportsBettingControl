import { isSameDay } from 'date-fns'
import { Clock, DollarSign, Target, TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  formatCurrency,
  formatSignedCurrency,
} from '@/lib/utils/bet-summary'
import type { BetProfitSummary } from '@/types'

interface BetsPeriodSummaryProps {
  totalBets: number
  totalStaked: number
  summary: BetProfitSummary
  range: { from: Date; to: Date }
}

export function BetsPeriodSummary({
  totalBets,
  totalStaked,
  summary,
  range,
}: BetsPeriodSummaryProps) {
  const isMultiDay = !isSameDay(range.from, range.to)
  const balanceLabel = isMultiDay ? 'Saldo do período' : 'Saldo do dia'
  const isPositive = summary.profitLoss >= 0

  return (
    <div className="mb-6 grid gap-4 grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Apostas</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalBets}</div>
          <p className="text-xs text-muted-foreground">
            {totalBets === 1 ? 'aposta no recorte' : 'apostas no recorte'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor apostado</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalStaked)}</div>
          <p className="text-xs text-muted-foreground">soma de stakes filtradas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{balanceLabel}</CardTitle>
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              'text-2xl font-bold',
              isPositive ? 'text-green-600' : 'text-red-600'
            )}
          >
            {formatSignedCurrency(summary.profitLoss)}
          </div>
          <p className="text-xs text-muted-foreground">
            Ganhas {formatSignedCurrency(summary.wonProfit)} · Perdidas{' '}
            {summary.lostProfit === 0
              ? formatCurrency(0)
              : `-${formatCurrency(Math.abs(summary.lostProfit))}`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          <Clock className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">
            {formatCurrency(summary.pendingStake)}
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.pendingCount}{' '}
            {summary.pendingCount === 1 ? 'aposta pendente' : 'apostas pendentes'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
