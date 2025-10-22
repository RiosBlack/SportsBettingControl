import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getBankrolls } from '@/lib/actions/bankroll'
import { CreateBetForm } from './_components/create-bet-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function NewBetPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const bankrollsResult = await getBankrolls()
  const bankrollsData = bankrollsResult.data || []

  if (bankrollsData.length === 0) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Nenhuma Banca Encontrada</CardTitle>
            <CardDescription>
              Você precisa criar uma banca antes de registrar apostas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/bankrolls">
              <Button>Criar Banca</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Converter Decimal para number para evitar erro de serialização
  const bankrolls = bankrollsData.map(b => ({
    ...b,
    initialBalance: Number(b.initialBalance),
    currentBalance: Number(b.currentBalance),
  }))

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </Link>
      </div>

      <CreateBetForm bankrolls={bankrolls} />
    </div>
  )
}

