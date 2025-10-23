'use client'

import { useState, useTransition, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, TrendingUp, Target, Trophy, DollarSign, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { getStatsByDateRange } from '@/lib/actions/stats'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

interface PeriodStats {
  totalBets: number
  wonBets: number
  lostBets: number
  voidBets: number
  settledBets: number
  totalProfit: number
  totalStaked: number
  winRate: number
  roi: number
  dailyProfits: { date: string; profit: number }[]
  startDate: Date
  endDate: Date
}

export default function PeriodStatsCard() {
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [stats, setStats] = useState<PeriodStats | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Inicializar com primeiro e último dia do mês atual
  useEffect(() => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    setStartDate(firstDay)
    setEndDate(lastDay)
  }, [])

  // Buscar estatísticas quando as datas mudarem
  useEffect(() => {
    if (startDate && endDate) {
      fetchStats()
    }
  }, [startDate, endDate])

  const fetchStats = () => {
    if (!startDate || !endDate) return

    startTransition(async () => {
      try {
        setError(null)
        const result = await getStatsByDateRange(startDate, endDate)

        if (result.error) {
          setError(result.error)
          setStats(null)
        } else {
          setStats(result.data)
        }
      } catch (err) {
        setError('Erro ao buscar estatísticas')
        setStats(null)
      }
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  // Componente de tooltip customizado para o gráfico
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-3 shadow-sm">
          <div className="grid gap-2">
            <p className="text-sm font-medium">
              {format(new Date(label), 'dd/MM/yyyy', { locale: ptBR })}
            </p>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Lucro/Prejuízo:</span>
              <span className={cn(
                "text-sm font-bold",
                payload[0].value > 0 ? "text-green-600" :
                  payload[0].value < 0 ? "text-red-600" : "text-gray-500"
              )}>
                {formatCurrency(payload[0].value)}
              </span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Desempenho por Período
        </CardTitle>
        <CardDescription>
          Análise de lucro/prejuízo e estatísticas em um período específico
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Seletor de Datas */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Data Inicial</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Data Final</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Loading State */}
        {isPending && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando estatísticas...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchStats} variant="outline">
              Tentar Novamente
            </Button>
          </div>
        )}

        {/* Resumo e Gráfico */}
        {stats && !isPending && (
          <>
            {/* Cards de Resumo */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Lucro/Prejuízo Total */}
              <div className="text-center p-4 border rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">Lucro/Prejuízo Total</p>
                <p className={cn(
                  "text-2xl font-bold",
                  stats.totalProfit >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {formatCurrency(stats.totalProfit)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatPercentage(stats.roi)} de ROI
                </p>
              </div>

              {/* Total de Apostas */}
              <div className="text-center p-4 border rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Trophy className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">Apostas Finalizadas</p>
                <p className="text-2xl font-bold">{stats.settledBets}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.wonBets} ganhas, {stats.lostBets} perdidas
                </p>
              </div>
            </div>

            {/* Gráfico de Linha */}
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={stats.dailyProfits}
                  margin={{
                    top: 5,
                    right: 10,
                    left: 10,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), 'dd/MM', { locale: ptBR })}
                    stroke="hsl(var(--foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={formatCurrency}
                    stroke="hsl(var(--foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* Empty State */}
        {!stats && !isPending && !error && startDate && endDate && (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhuma aposta finalizada encontrada neste período
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
