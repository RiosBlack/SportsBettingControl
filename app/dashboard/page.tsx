import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { logout } from '@/lib/actions/auth'
import {
  getUserStats,
  getRecentBets,
} from '@/lib/actions/stats'
import { getBankrolls } from '@/lib/actions/bankroll'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LogOut,
  User,
  TrendingUp,
  Target,
  Wallet,
  Trophy,
  BarChart3,
  Plus,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import PeriodStatsCard from './_components/period-stats-card'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const [statsResult, bankrollsResult, recentBetsResult] = await Promise.all([
    getUserStats(),
    getBankrolls(),
    getRecentBets(5),
  ])

  const stats = statsResult.data
  const bankrolls = bankrollsResult.data || []
  const recentBets = recentBetsResult.data || []

  const totalBankrollBalance = bankrolls.reduce(
    (sum, b) => sum + Number(b.currentBalance),
    0
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Bem-vindo de volta, {session.user.name}!
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/bets/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Aposta
              </Button>
            </Link>
            <form action={logout}>
              <Button variant="outline" type="submit">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </form>
          </div>
        </div>

        {/* Period Stats */}
        <PeriodStatsCard />

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Saldo Total
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {totalBankrollBalance.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {bankrolls.length} {bankrolls.length === 1 ? 'banca' : 'bancas'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Apostas
              </CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalBets || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.pendingBets || 0} pendentes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Win Rate
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.winRate?.toFixed(1) || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.wonBets || 0} vitórias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                ROI
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(stats?.roi || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(stats?.roi || 0) >= 0 ? '+' : ''}{stats?.roi?.toFixed(2) || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                R$ {stats?.totalProfit?.toFixed(2) || '0.00'} de lucro
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Bancas */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Minhas Bancas
                  </CardTitle>
                  <CardDescription>Gerencie suas bancas de apostas</CardDescription>
                </div>
                <Link href="/dashboard/bankrolls">
                  <Button variant="ghost" size="sm">
                    Ver todas
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {bankrolls.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Você ainda não tem bancas</p>
                  <Link href="/dashboard/bankrolls">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Primeira Banca
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {bankrolls.slice(0, 3).map((bankroll) => {
                    const profitLoss = Number(bankroll.currentBalance) - Number(bankroll.initialBalance)
                    const profitLossPercent = Number(bankroll.initialBalance) > 0
                      ? (profitLoss / Number(bankroll.initialBalance)) * 100
                      : 0

                    return (
                      <div
                        key={bankroll.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{bankroll.name}</p>
                            {bankroll.isActive && (
                              <Badge variant="outline" className="text-xs">Ativa</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {bankroll._count.bets} {bankroll._count.bets === 1 ? 'aposta' : 'apostas'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            R$ {Number(bankroll.currentBalance).toFixed(2)}
                          </p>
                          <p className={`text-sm ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {profitLoss >= 0 ? '+' : ''}
                            R$ {profitLoss.toFixed(2)} ({profitLossPercent.toFixed(1)}%)
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Apostas Recentes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Apostas Recentes
                  </CardTitle>
                  <CardDescription>Suas últimas apostas registradas</CardDescription>
                </div>
                <Link href="/dashboard/bets">
                  <Button variant="ghost" size="sm">
                    Ver todas
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentBets.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Nenhuma aposta registrada</p>
                  <Link href="/dashboard/bets/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Primeira Aposta
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentBets.map((bet) => {
                    const statusConfig = {
                      PENDENTE: { label: 'Pendente', color: 'bg-yellow-500/10 text-yellow-500' },
                      GANHA: { label: 'Ganha', color: 'bg-green-500/10 text-green-500' },
                      PERDIDA: { label: 'Perdida', color: 'bg-red-500/10 text-red-500' },
                      ANULADA: { label: 'Anulada', color: 'bg-gray-500/10 text-gray-500' },
                      CASHOUT: { label: 'Cashout', color: 'bg-blue-500/10 text-blue-500' },
                    }

                    const config = statusConfig[bet.status as keyof typeof statusConfig]

                    return (
                      <div
                        key={bet.id}
                        className="flex items-start justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{bet.event}</p>
                            <Badge className={config.color}>
                              {config.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {bet.market} • Odd {Number(bet.odds).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(bet.placedAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            R$ {Number(bet.stake).toFixed(2)}
                          </p>
                          {bet.profit !== null && (
                            <p className={`text-sm ${Number(bet.profit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {Number(bet.profit) >= 0 ? '+' : ''}
                              R$ {Number(bet.profit).toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        {stats && stats.totalBets > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Estatísticas Rápidas</CardTitle>
              <CardDescription>Resumo do seu desempenho</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Ganhas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.wonBets}</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Perdidas</p>
                  <p className="text-2xl font-bold text-red-600">{stats.lostBets}</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingBets}</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Apostado</p>
                  <p className="text-2xl font-bold">
                    R$ {stats.totalStaked?.toFixed(0) || '0'}
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Odd Média</p>
                  <p className="text-2xl font-bold">{stats.avgOdds?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
