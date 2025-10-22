import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getBankrolls } from '@/lib/actions/bankroll'
import { BankrollsList } from './_components/bankrolls-list'
import { CreateBankrollDialog } from './_components/create-bankroll-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Wallet } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function BankrollsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const bankrollsResult = await getBankrolls()
  const bankrollsData = bankrollsResult.data || []

  // Converter Decimal para number
  const bankrolls = bankrollsData.map(b => ({
    ...b,
    initialBalance: Number(b.initialBalance),
    currentBalance: Number(b.currentBalance),
  }))

  const totalBalance = bankrolls.reduce((sum, b) => sum + b.currentBalance, 0)
  const totalInitial = bankrolls.reduce((sum, b) => sum + b.initialBalance, 0)
  const totalProfit = totalBalance - totalInitial

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Minhas Bancas</h1>
          <p className="text-muted-foreground">Gerencie suas bancas de apostas</p>
        </div>
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
            <CardTitle className="text-2xl">R$ {totalInitial.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Lucro/Prejuízo</CardDescription>
            <CardTitle className={`text-2xl ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalProfit >= 0 ? '+' : ''}R$ {totalProfit.toFixed(2)}
            </CardTitle>
          </CardHeader>
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
        <BankrollsList bankrolls={bankrolls} />
      )}
    </div>
  )
}

