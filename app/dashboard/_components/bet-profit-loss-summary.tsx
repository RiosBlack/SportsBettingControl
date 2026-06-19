import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BetProfitSummary } from '@/types'

interface BetProfitLossSummaryProps {
  summary: BetProfitSummary
  percent?: number
  size?: 'sm' | 'md'
  align?: 'left' | 'right'
}

function formatSignedCurrency(value: number) {
  if (value >= 0) return `+R$ ${value.toFixed(2)}`
  return `-R$ ${Math.abs(value).toFixed(2)}`
}

export function BetProfitLossSummary({
  summary,
  percent,
  size = 'md',
  align = 'right',
}: BetProfitLossSummaryProps) {
  const { profitLoss, wonProfit, lostProfit, otherProfit, pendingStake, pendingCount } =
    summary
  const isPositive = profitLoss >= 0
  const isMd = size === 'md'

  return (
    <div className={cn('space-y-1', align === 'right' && 'text-right')}>
      <div
        className={cn(
          'flex items-center gap-1 font-semibold',
          isPositive ? 'text-green-600' : 'text-red-600',
          isMd ? 'text-2xl' : 'text-sm',
          align === 'right' && 'justify-end'
        )}
      >
        {isPositive ? (
          <TrendingUp className={cn(isMd ? 'h-5 w-5' : 'h-4 w-4')} />
        ) : (
          <TrendingDown className={cn(isMd ? 'h-5 w-5' : 'h-4 w-4')} />
        )}
        {formatSignedCurrency(profitLoss)}
      </div>

      {percent !== undefined && (
        <div
          className={cn(
            'text-xs',
            isPositive ? 'text-green-600' : 'text-red-600'
          )}
        >
          {percent >= 0 ? '+' : ''}
          {percent.toFixed(1)}%
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Ganhas: {formatSignedCurrency(wonProfit)} · Perdidas:{' '}
        {lostProfit === 0 ? 'R$ 0,00' : `-R$ ${Math.abs(lostProfit).toFixed(2)}`}
        {otherProfit !== 0 && (
          <>
            {' '}
            · Outros: {formatSignedCurrency(otherProfit)}
          </>
        )}
      </p>

      {pendingCount > 0 && (
        <p className="text-xs text-yellow-600 dark:text-yellow-500">
          R$ {pendingStake.toFixed(2)} em apostas pendentes ({pendingCount}{' '}
          {pendingCount === 1 ? 'aposta' : 'apostas'})
        </p>
      )}
    </div>
  )
}
