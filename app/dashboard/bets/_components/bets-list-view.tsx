'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format, isSameDay } from 'date-fns'
import { deleteBet } from '@/lib/actions/bet'
import { EditBetDialog } from './edit-bet-dialog'
import { SettleBetDialog } from './settle-bet-dialog'
import { DateRangePicker } from '@/components/date-range-picker'
import { BetsPeriodSummary } from './bets-period-summary'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle, XCircle, Clock, Trophy, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  formatDateRangeDescription,
  formatDayGroupLabel,
  toDateKey,
} from '@/lib/utils/date-range'
import { formatEventDateDisplay } from '@/lib/utils/event-date'
import { computeBetPeriodStats } from '@/lib/utils/bet-summary'

interface Bet {
  id: string
  event: string
  sport: string
  market: {
    id: string
    name: string
  } | null
  selection: string
  odds: number
  stake: number
  status: string
  profit: number | null
  eventDate: Date
  placedAt: Date
  competition: string | null
  bookmaker: string | null
  notes: string | null
  bankroll: {
    name: string
    currency: string
  }
}

interface BetsListViewProps {
  bets: Bet[]
  initialRange: { from: Date; to: Date }
}

function getStatusBadge(status: string) {
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

function getStatusIcon(status: string) {
  switch (status) {
    case 'GANHA':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'PERDIDA':
      return <XCircle className="h-4 w-4 text-red-500" />
    default:
      return <Clock className="h-4 w-4 text-yellow-500" />
  }
}

function BetTable({
  bets,
  isPending,
  onDelete,
}: {
  bets: Bet[]
  isPending: boolean
  onDelete: (betId: string) => void
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Evento</TableHead>
            <TableHead>Esporte</TableHead>
            <TableHead>Mercado</TableHead>
            <TableHead>Casa de Aposta</TableHead>
            <TableHead>Odd</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Lucro/Prejuízo</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bets.map((bet) => (
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
                  <p className="text-sm">{bet.market?.name ?? '-'}</p>
                  <p className="text-xs text-muted-foreground">{bet.selection}</p>
                </div>
              </TableCell>
              <TableCell className="text-sm">{bet.bookmaker ?? '-'}</TableCell>
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
                {formatEventDateDisplay(new Date(bet.eventDate))}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {bet.status === 'PENDENTE' && (
                    <SettleBetDialog
                      bet={{
                        id: bet.id,
                        event: bet.event,
                        market: bet.market,
                        selection: bet.selection,
                        stake: bet.stake,
                        odds: bet.odds,
                      }}
                      disabled={isPending}
                    />
                  )}
                  {bet.status === 'PENDENTE' && (
                    <EditBetDialog bet={bet} disabled={isPending} />
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(bet.id)}
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
  )
}

export function BetsListView({ bets, initialRange }: BetsListViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filteredBets = useMemo(() => {
    return bets.filter((bet) => {
      const matchesFilter = filter === 'all' || bet.status === filter
      const matchesSearch =
        bet.event.toLowerCase().includes(search.toLowerCase()) ||
        (bet.market?.name.toLowerCase() || '').includes(search.toLowerCase()) ||
        (bet.bookmaker?.toLowerCase() || '').includes(search.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [bets, filter, search])

  const periodStats = useMemo(
    () => computeBetPeriodStats(filteredBets),
    [filteredBets]
  )

  const isSingleDay = isSameDay(initialRange.from, initialRange.to)

  const groupedBets = useMemo(() => {
    const groups = new Map<string, Bet[]>()

    for (const bet of filteredBets) {
      const key = toDateKey(new Date(bet.eventDate))
      const existing = groups.get(key) ?? []
      existing.push(bet)
      groups.set(key, existing)
    }

    return Array.from(groups.entries()).sort(([a], [b]) => b.localeCompare(a))
  }, [filteredBets])

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

  const handleRangeChange = (range: { from: Date; to: Date }) => {
    const params = new URLSearchParams()
    params.set('startDate', format(range.from, 'yyyy-MM-dd'))
    params.set('endDate', format(range.to, 'yyyy-MM-dd'))
    router.push(`/dashboard/bets?${params.toString()}`)
  }

  const periodDescription = formatDateRangeDescription(initialRange.from, initialRange.to)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Apostas ({filteredBets.length})
        </CardTitle>
        <CardDescription>{periodDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <DateRangePicker
            value={initialRange}
            onChange={handleRangeChange}
            disabled={isPending}
          />
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
              <SelectItem value="CASHOUT">Cashout</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <BetsPeriodSummary
          totalBets={periodStats.totalBets}
          totalStaked={periodStats.totalStaked}
          summary={periodStats.summary}
          range={initialRange}
        />

        {filteredBets.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma aposta encontrada para este período</p>
          </div>
        ) : isSingleDay ? (
          <BetTable bets={filteredBets} isPending={isPending} onDelete={handleDelete} />
        ) : (
          <div className="space-y-8">
            {groupedBets.map(([dateKey, dayBets]) => (
              <section key={dateKey}>
                <h3 className="mb-3 text-sm font-semibold capitalize text-foreground">
                  {formatDayGroupLabel(dateKey)}
                  <span className="ml-2 font-normal text-muted-foreground">
                    ({dayBets.length} {dayBets.length === 1 ? 'aposta' : 'apostas'})
                  </span>
                </h3>
                <BetTable bets={dayBets} isPending={isPending} onDelete={handleDelete} />
              </section>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
