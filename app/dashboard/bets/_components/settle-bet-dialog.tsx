'use client'

import { useState } from 'react'
import { settleBet } from '@/lib/actions/bet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface SettleBetDialogProps {
  bet: {
    id: string
    event: string
    market: {
      name: string
    } | null
    selection: string
    stake: number
    odds: number
  }
  disabled?: boolean
}

type DialogMode = 'actions' | 'cashout'

export function SettleBetDialog({ bet, disabled }: SettleBetDialogProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<DialogMode>('actions')
  const [cashoutAmount, setCashoutAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetDialog = () => {
    setMode('actions')
    setCashoutAmount('')
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      resetDialog()
    }
  }

  const handleSettle = async (status: 'GANHA' | 'PERDIDA' | 'ANULADA') => {
    setIsSubmitting(true)
    try {
      const result = await settleBet({
        id: bet.id,
        status,
        result: status === 'GANHA' ? 'WIN' : status === 'PERDIDA' ? 'LOSS' : 'VOID',
      })

      if (result.success) {
        toast.success(`Aposta finalizada como ${status}!`)
        handleOpenChange(false)
      } else {
        toast.error(result.error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCashout = async () => {
    const amount = parseFloat(cashoutAmount)
    if (!cashoutAmount || Number.isNaN(amount) || amount <= 0) {
      toast.error('Informe um valor válido para o cashout')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await settleBet({
        id: bet.id,
        status: 'CASHOUT',
        cashoutAmount: amount,
      })

      if (result.success) {
        toast.success('Aposta finalizada com cashout!')
        handleOpenChange(false)
      } else {
        toast.error(result.error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const parsedCashout = parseFloat(cashoutAmount)
  const cashoutProfit =
    !Number.isNaN(parsedCashout) && parsedCashout > 0
      ? parsedCashout - bet.stake
      : null

  const isBusy = disabled || isSubmitting

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={disabled}>
          Finalizar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Finalizar Aposta</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-1">
              <p>{bet.event}</p>
              {(bet.market?.name || bet.selection) && (
                <p className="text-sm">
                  {bet.market?.name && <span>{bet.market.name}</span>}
                  {bet.market?.name && bet.selection && ' · '}
                  {bet.selection && <span>{bet.selection}</span>}
                </p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="grid grid-cols-2 gap-2 text-sm mt-2">
              <div>
                <strong>Valor:</strong> R$ {bet.stake.toFixed(2)}
              </div>
              <div>
                <strong>Odd:</strong> {bet.odds.toFixed(2)}
              </div>
              <div className="col-span-2">
                <strong>Retorno potencial:</strong> R$ {(bet.stake * bet.odds).toFixed(2)}
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {mode === 'cashout' && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor={`cashout-${bet.id}`}>Valor recebido no cash</Label>
              <Input
                id={`cashout-${bet.id}`}
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                value={cashoutAmount}
                onChange={(e) => setCashoutAmount(e.target.value)}
                disabled={isBusy}
              />
            </div>
            {cashoutProfit !== null && (
              <p className="text-sm text-muted-foreground">
                Lucro/prejuízo:{' '}
                <span
                  className={
                    cashoutProfit >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'
                  }
                >
                  {cashoutProfit >= 0 ? '+' : ''}R$ {cashoutProfit.toFixed(2)}
                </span>
              </p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {mode === 'actions' ? (
            <>
              <Button
                variant="outline"
                onClick={() => handleSettle('ANULADA')}
                disabled={isBusy}
              >
                Anular
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleSettle('PERDIDA')}
                disabled={isBusy}
              >
                Perdeu
              </Button>
              <Button
                variant="secondary"
                onClick={() => setMode('cashout')}
                disabled={isBusy}
              >
                Cash
              </Button>
              <Button onClick={() => handleSettle('GANHA')} disabled={isBusy}>
                Ganhou
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setMode('actions')} disabled={isBusy}>
                Voltar
              </Button>
              <Button onClick={handleCashout} disabled={isBusy}>
                Confirmar cashout
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
