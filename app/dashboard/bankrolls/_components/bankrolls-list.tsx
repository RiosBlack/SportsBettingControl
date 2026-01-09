'use client'

import { useTransition } from 'react'
import { updateBankroll, deleteBankroll } from '@/lib/actions/bankroll'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { TrendingUp, TrendingDown, Minus, Settings, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { DepositDialog } from './deposit-dialog'
import { WithdrawDialog } from './withdraw-dialog'

interface Bankroll {
  id: string
  name: string
  currentBalance: number
  initialBalance: number
  isActive: boolean
  _count: {
    bets: number
  }
}

interface BankrollsListProps {
  bankrolls: Bankroll[]
}

export function BankrollsList({ bankrolls }: BankrollsListProps) {
  const [isPending, startTransition] = useTransition()

  const toggleActive = (bankroll: Bankroll) => {
    startTransition(async () => {
      const result = await updateBankroll({
        id: bankroll.id,
        isActive: !bankroll.isActive,
      })

      if (result.success) {
        toast.success(`Banca ${result.data?.isActive ? 'ativada' : 'desativada'}`)
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleDeleteBankroll = (bankroll: Bankroll) => {
    startTransition(async () => {
      const result = await deleteBankroll(bankroll.id)

      if (result.success) {
        toast.success('Banca excluída com sucesso!')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {bankrolls.map((bankroll) => {
        const profitLoss = bankroll.currentBalance - bankroll.initialBalance
        const profitLossPercent = bankroll.initialBalance > 0
          ? (profitLoss / bankroll.initialBalance) * 100
          : 0
        const progressPercent = bankroll.initialBalance > 0
          ? (bankroll.currentBalance / bankroll.initialBalance) * 100
          : 0

        return (
          <Card key={bankroll.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {bankroll.name}
                    {bankroll.isActive && (
                      <Badge variant="outline" className="text-xs">Ativa</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {bankroll._count.bets} {bankroll._count.bets === 1 ? 'aposta' : 'apostas'}
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleActive(bankroll)}
                  disabled={isPending}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Saldo */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Saldo Atual</span>
                <span className="text-2xl font-bold">
                  R$ {bankroll.currentBalance.toFixed(2)}
                </span>
              </div>

              {/* Lucro/Prejuízo */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Lucro/Prejuízo</span>
                <div className="text-right">
                  <div className={`flex items-center gap-1 font-semibold ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {profitLoss >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {profitLoss >= 0 ? '+' : ''}R$ {profitLoss.toFixed(2)}
                  </div>
                  <div className={`text-xs ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {profitLoss >= 0 ? '+' : ''}{profitLossPercent.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Progresso */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Inicial: R$ {bankroll.initialBalance.toFixed(2)}</span>
                  <span>{progressPercent.toFixed(0)}%</span>
                </div>
                <Progress value={Math.min(progressPercent, 200)} />
              </div>

              {/* Ações */}
              <div className="flex gap-2">
                <DepositDialog bankroll={bankroll} />
                <WithdrawDialog bankroll={bankroll} />

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={bankroll._count.bets > 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Banca</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir a banca <strong>"{bankroll.name}"</strong>?
                        <br />
                        <br />
                        Esta ação não pode ser desfeita.
                        {bankroll._count.bets > 0 && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700">
                            ⚠️ Esta banca possui {bankroll._count.bets} apostas e não pode ser excluída.
                          </div>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteBankroll(bankroll)}
                        disabled={isPending || bankroll._count.bets > 0}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isPending ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Excluindo...</>
                        ) : (
                          'Excluir Banca'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

