import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getBets } from '@/lib/actions/bet'
import { resolveDateRangeFromParams } from '@/lib/utils/date-range'
import { BetsListView } from './_components/bets-list-view'

interface BetsPageProps {
  searchParams: Promise<{
    startDate?: string
    endDate?: string
  }>
}

export default async function BetsPage({ searchParams }: BetsPageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const params = await searchParams
  const { startDate, endDate, from, to } = resolveDateRangeFromParams(
    params.startDate,
    params.endDate
  )

  const betsResult = await getBets({ startDate, endDate, limit: 100, offset: 0 })
  const betsData = betsResult.data || []

  const bets = betsData.map((bet) => ({
    ...bet,
    odds: Number(bet.odds),
    stake: Number(bet.stake),
    profit: bet.profit !== null ? Number(bet.profit) : null,
  }))

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <BetsListView
        bets={bets}
        initialRange={{ from, to }}
      />
    </div>
  )
}
