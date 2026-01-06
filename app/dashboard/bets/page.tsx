import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getBets } from '@/lib/actions/bet'
import { BetsListView } from './_components/bets-list-view'

export default async function BetsPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
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
      <BetsListView bets={bets} />
    </div>
  )
}

