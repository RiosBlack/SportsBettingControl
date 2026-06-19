import { Clock, DollarSign, TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  formatCurrency,
  formatSignedCurrency,
} from '@/lib/utils/bet-summary'
import type { BetProfitSummary } from '@/types'

interface DashboardDaySummaryProps {
  totalStaked: number
  summary: BetProfitSummary
}

export function DashboardDaySummary({
  totalStaked,
  summary,
}: DashboardDaySummaryProps) {
  const isPositive = summary.profitLoss >= 0

  return (
    <div className="mb-6 grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor apostado no dia</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalStaked)}</div>
          <p className="text-xs text-muted-foreground">soma de stakes filtradas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo do dia</CardTitle>
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
          <CardTitle className="text-sm font-medium">Pendentes no dia</CardTitle>
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
