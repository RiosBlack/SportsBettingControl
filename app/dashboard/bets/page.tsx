import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getBets } from '@/lib/actions/bet'
import { BetsListView } from './_components/bets-list-view'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'

export default async function BetsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const betsResult = await getBets({ limit: 100 })
  const betsData = betsResult.data || []

  // Converter Decimal para number
  const bets = betsData.map(bet => ({
    ...bet,
    odds: Number(bet.odds),
    stake: Number(bet.stake),
    profit: bet.profit !== null ? Number(bet.profit) : null,
  }))

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Minhas Apostas</h1>
          <p className="text-muted-foreground">Gerencie todas as suas apostas</p>
        </div>
        <Link href="/dashboard/bets/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Aposta
          </Button>
        </Link>
      </div>

      <BetsListView bets={bets} />
    </div>
  )
}

