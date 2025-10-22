'use client'

import { useState, useTransition } from 'react'
import { settleBet, deleteBet } from '@/lib/actions/bet'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Trophy, 
  Trash2,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Bet {
  id: string
  event: string
  sport: string
  market: string
  selection: string
  odds: number
  stake: number
  status: string
  profit: number | null
  eventDate: Date
  placedAt: Date
  competition: string | null
  bookmaker: string | null
  bankroll: {
    name: string
    currency: string
  }
}

interface BetsListViewProps {
  bets: Bet[]
}

export function BetsListView({ bets }: BetsListViewProps) {
  const [isPending, startTransition] = useTransition()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filteredBets = bets.filter((bet) => {
    const matchesFilter = filter === 'all' || bet.status === filter
    const matchesSearch =
      bet.event.toLowerCase().includes(search.toLowerCase()) ||
      bet.market.toLowerCase().includes(search.toLowerCase()) ||
      (bet.bookmaker?.toLowerCase() || '').includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const handleSettle = (betId: string, status: 'GANHA' | 'PERDIDA' | 'ANULADA') => {
    startTransition(async () => {
      const result = await settleBet({
        id: betId,
        status,
        result: status === 'GANHA' ? 'WIN' : status === 'PERDIDA' ? 'LOSS' : 'VOID',
      })

      if (result.success) {
        toast.success(`Aposta finalizada como ${status}!`)
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleDelete = (betId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta aposta?')) return

    startTransition(async () => {
      const result = await deleteBet(betId)

      if (result.success) {
        toast.success('Aposta deletada!')
      } else {
        toast.error(result.error)
      }
    })
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      PENDENTE: { label: 'Pendente', variant: 'outline' },
      GANHA: { label: 'Ganha', variant: 'default' },
      PERDIDA: { label: 'Perdida', variant: 'destructive' },
      ANULADA: { label: 'Anulada', variant: 'secondary' },
      CASHOUT: { label: 'Cashout', variant: 'secondary' },
    }

    const config = statusMap[status] || statusMap.PENDENTE

    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'GANHA':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'PERDIDA':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Apostas ({filteredBets.length})
        </CardTitle>
        <CardDescription>Todas as suas apostas registradas</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Buscar por evento, mercado ou casa de aposta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="PENDENTE">Pendentes</SelectItem>
              <SelectItem value="GANHA">Ganhas</SelectItem>
              <SelectItem value="PERDIDA">Perdidas</SelectItem>
              <SelectItem value="ANULADA">Anuladas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabela */}
        {filteredBets.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma aposta encontrada</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Esporte</TableHead>
                  <TableHead>Mercado</TableHead>
                  <TableHead>Odd</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Lucro/Prejuízo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBets.map((bet) => (
                  <TableRow key={bet.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(bet.status)}
                        {getStatusBadge(bet.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{bet.event}</p>
                        {bet.competition && (
                          <p className="text-xs text-muted-foreground">{bet.competition}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{bet.sport}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{bet.market}</p>
                        <p className="text-xs text-muted-foreground">{bet.selection}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{bet.odds.toFixed(2)}</TableCell>
                    <TableCell className="font-semibold">R$ {bet.stake.toFixed(2)}</TableCell>
                    <TableCell>
                      {bet.profit !== null ? (
                        <span className={bet.profit >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          {bet.profit >= 0 ? '+' : ''}R$ {bet.profit.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(bet.eventDate).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {bet.status === 'PENDENTE' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                Finalizar
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Finalizar Aposta</DialogTitle>
                                <DialogDescription>
                                  {bet.event}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
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
                              </div>
                              <DialogFooter className="gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => handleSettle(bet.id, 'ANULADA')}
                                  disabled={isPending}
                                >
                                  Anular
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleSettle(bet.id, 'PERDIDA')}
                                  disabled={isPending}
                                >
                                  Perdeu
                                </Button>
                                <Button
                                  onClick={() => handleSettle(bet.id, 'GANHA')}
                                  disabled={isPending}
                                >
                                  Ganhou
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(bet.id)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

