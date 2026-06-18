'use client'

import { useActionState, useState } from 'react'
import { createBet } from '@/lib/actions/bet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Plus, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { DatePicker } from '@/components/date-picker'
import { MarketSelect } from './market-select'
import { EventSearchCombobox } from '@/components/event-search-combobox'
import type { CreateBetInput, SelectedSportEventInput } from '@/lib/validations/bet'

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

interface CreateBetFormProps {
  bankrolls: Bankroll[]
}

export function CreateBetForm({ bankrolls }: CreateBetFormProps) {
  const [eventValue, setEventValue] = useState('')
  const [competitionValue, setCompetitionValue] = useState('')
  const [eventDate, setEventDate] = useState<Date>(new Date())
  const [marketId, setMarketId] = useState<string>('')
  const [sport, setSport] = useState<CreateBetInput['sport']>('FUTEBOL')
  const [selectedEvent, setSelectedEvent] = useState<SelectedSportEventInput | null>(null)
  const [sportEventId, setSportEventId] = useState<string | null>(null)
  const router = useRouter()

  const [state, formAction, pending] = useActionState(
    async (_: any, formData: FormData) => {
      try {
        const result = await createBet({
          bankrollId: formData.get('bankrollId') as string,
          sport,
          event: formData.get('event') as string,
          competition: formData.get('competition') as string || undefined,
          selectedEvent: selectedEvent ?? undefined,
          sportEventId: sportEventId ?? undefined,
          marketId: marketId || (formData.get('marketId') as string),
          selection: '', // Campo removido - não é mais necessário
          odds: Number(formData.get('odds')),
          stake: Number(formData.get('stake')),
          eventDate: eventDate,
          bookmaker: formData.get('bookmaker') as string || undefined,
          notes: formData.get('notes') as string || undefined,
          tags: [],
        })

        if (result.success) {
          toast.success('Aposta criada com sucesso!')
          router.push('/dashboard/bets')
        } else if (result.error) {
          toast.error(result.error)
        }

        return result
      } catch (error: any) {
        const errorMessage = error.message || 'Erro ao criar aposta'
        toast.error(errorMessage)
        return { error: errorMessage }
      }
    },
    null
  )

  const defaultBankroll = bankrolls.find(b => b.isActive) || bankrolls[0]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Nova Aposta
        </CardTitle>
        <CardDescription>Registre uma nova aposta esportiva</CardDescription>
      </CardHeader>
      <CardContent>
        {state?.error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <form action={formAction} className="space-y-6">
          {/* Banca */}
          <div className="space-y-2">
            <Label htmlFor="bankrollId">Banca *</Label>
            <Select name="bankrollId" defaultValue={defaultBankroll?.id} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a banca" />
              </SelectTrigger>
              <SelectContent>
                {bankrolls.map((bankroll) => (
                  <SelectItem key={bankroll.id} value={bankroll.id}>
                    {bankroll.name} (R$ {bankroll.currentBalance.toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Esporte */}
            <div className="space-y-2">
              <Label htmlFor="sport">Esporte *</Label>
              <Select
                name="sport"
                value={sport}
                onValueChange={(value) => {
                  setSport(value as CreateBetInput['sport'])
                  setSelectedEvent(null)
                  setSportEventId(null)
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FUTEBOL">Futebol</SelectItem>
                  <SelectItem value="TENIS">Tênis</SelectItem>
                  <SelectItem value="VOLEI">Vôlei</SelectItem>
                  <SelectItem value="FUTSAL">Futsal</SelectItem>
                  <SelectItem value="MMA">MMA</SelectItem>
                  <SelectItem value="BOXE">Boxe</SelectItem>
                  <SelectItem value="ESPORTS">E-Sports</SelectItem>
                  <SelectItem value="OUTROS">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Casa de Apostas */}
            <div className="space-y-2">
              <Label htmlFor="bookmaker">Casa de Apostas</Label>
              <Select name="bookmaker" disabled={pending}>
                <SelectTrigger>
                  <SelectValue placeholder="Ex: Bet365" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bet365">
                    <span style={{ color: '#005340' }}>Bet365</span>
                  </SelectItem>
                  <SelectItem value="Superbet">
                    <span style={{ color: '#E80105' }}>Superbet</span>
                  </SelectItem>
                  <SelectItem value="Betano">
                    <span style={{ color: '#FF3D00' }}>Betano</span>
                  </SelectItem>
                  <SelectItem value="BetMGM">
                    <span style={{ color: '#B19661' }}>BetMGM</span>
                  </SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Evento */}
          <div className="space-y-2">
            <Label htmlFor="event">Evento *</Label>
            <EventSearchCombobox
              value={eventValue}
              sport={sport}
              onValueChange={setEventValue}
              onCompetitionChange={setCompetitionValue}
              onEventDateChange={setEventDate}
              onSelectedEventChange={setSelectedEvent}
              onSportEventIdChange={setSportEventId}
              disabled={pending}
            />
            <input id="event" name="event" type="hidden" value={eventValue} required />
            <p className="text-xs text-muted-foreground">
              Digite o nome de um time ou país para ver os últimos 5 jogos.
            </p>
          </div>

          {/* Competição */}
          <div className="space-y-2">
            <Label htmlFor="competition">Competição</Label>
            <Input
              id="competition"
              name="competition"
              placeholder="Ex: Brasileirão Série A"
              disabled={pending}
              value={competitionValue}
              onChange={(e) => setCompetitionValue(e.target.value)}
            />
          </div>

          {/* Mercado */}
          <div className="space-y-2">
            <Label htmlFor="marketId">Mercado *</Label>
            <MarketSelect
              value={marketId}
              onValueChange={setMarketId}
              disabled={pending}
              required
            />
            <input type="hidden" name="marketId" value={marketId} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Odds */}
            <div className="space-y-2">
              <Label htmlFor="odds">Cotação *</Label>
              <Input
                id="odds"
                name="odds"
                type="number"
                step="0.01"
                min="1.01"
                placeholder="Ex: 2.50"
                required
                disabled={pending}
              />
            </div>

            {/* Stake */}
            <div className="space-y-2">
              <Label htmlFor="stake">Valor (R$) *</Label>
              <Input
                id="stake"
                name="stake"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Ex: 100.00"
                required
                disabled={pending}
              />
            </div>

            {/* Data do Evento */}
            <div className="space-y-2">
              <Label htmlFor="eventDate">Data do Evento *</Label>
              <DatePicker
                value={eventDate}
                onChange={(date) => setEventDate(date || new Date())}
                disabled={pending}
              />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Adicione suas observações sobre esta aposta..."
              disabled={pending}
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Aposta
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

