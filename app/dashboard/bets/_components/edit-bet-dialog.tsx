'use client'

import { useEffect, useState, useTransition } from 'react'
import { updateBet } from '@/lib/actions/bet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Loader2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { DatePicker } from '@/components/date-picker'
import { MarketSelect } from '../new/_components/market-select'
import { EventSearchCombobox } from '@/components/event-search-combobox'
import type { CreateBetInput } from '@/lib/validations/bet'
import { BOOKMAKER_OPTIONS } from '@/lib/constants/bookmakers'
import { calendarDateFromEventDate } from '@/lib/utils/event-date'

interface EditBetDialogBet {
  id: string
  event: string
  sport: string
  market: {
    id: string
    name: string
  } | null
  odds: number
  stake: number
  eventDate: Date
  competition: string | null
  selection: string
  bookmaker: string | null
  notes: string | null
}

interface EditBetDialogProps {
  bet: EditBetDialogBet
  disabled?: boolean
}

export function EditBetDialog({ bet, disabled }: EditBetDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [sport, setSport] = useState<CreateBetInput['sport']>('FUTEBOL')
  const [eventValue, setEventValue] = useState('')
  const [competitionValue, setCompetitionValue] = useState('')
  const [eventDate, setEventDate] = useState<Date>(new Date())
  const [marketId, setMarketId] = useState('')
  const [selection, setSelection] = useState('')
  const [odds, setOdds] = useState('')
  const [stake, setStake] = useState('')
  const [bookmaker, setBookmaker] = useState<string>('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return

    setSport(bet.sport as CreateBetInput['sport'])
    setEventValue(bet.event)
    setCompetitionValue(bet.competition ?? '')
    setEventDate(calendarDateFromEventDate(new Date(bet.eventDate)))
    setMarketId(bet.market?.id ?? '')
    setSelection(bet.selection ?? '')
    setOdds(bet.odds.toString())
    setStake(bet.stake.toString())
    setBookmaker(bet.bookmaker ?? '')
    setNotes(bet.notes ?? '')
  }, [open, bet])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!marketId) {
      toast.error('Selecione um mercado')
      return
    }

    startTransition(async () => {
      const result = await updateBet({
        id: bet.id,
        sport,
        event: eventValue,
        competition: competitionValue || undefined,
        marketId,
        selection: selection || undefined,
        odds: Number(odds),
        stake: Number(stake),
        eventDate,
        bookmaker: bookmaker || undefined,
        notes: notes || undefined,
      })

      if (result.success) {
        toast.success('Aposta atualizada!')
        setOpen(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  const isDisabled = disabled || isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" disabled={disabled}>
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Aposta</DialogTitle>
          <DialogDescription>{bet.event}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Esporte *</Label>
              <Select
                value={sport}
                onValueChange={(value) => {
                  setSport(value as CreateBetInput['sport'])
                }}
                disabled={isDisabled}
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

            <div className="space-y-2">
              <Label>Casa de Apostas</Label>
              <Select
                value={bookmaker}
                onValueChange={setBookmaker}
                disabled={isDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ex: Bet365" />
                </SelectTrigger>
                <SelectContent>
                  {BOOKMAKER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Evento *</Label>
            <EventSearchCombobox
              value={eventValue}
              sport={sport}
              onValueChange={setEventValue}
              onCompetitionChange={setCompetitionValue}
              onEventDateChange={setEventDate}
              onSelectedEventChange={() => {}}
              onSportEventIdChange={() => {}}
              disabled={isDisabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Competição</Label>
            <Input
              value={competitionValue}
              onChange={(e) => setCompetitionValue(e.target.value)}
              placeholder="Ex: Brasileirão Série A"
              disabled={isDisabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Mercado *</Label>
            <MarketSelect
              value={marketId}
              onValueChange={setMarketId}
              disabled={isDisabled}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Seleção</Label>
            <Input
              value={selection}
              onChange={(e) => setSelection(e.target.value)}
              placeholder="Ex: Folarin Balogun - Mais de 3.5"
              disabled={isDisabled}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Cotação *</Label>
              <Input
                type="number"
                step="0.01"
                min="1.01"
                value={odds}
                onChange={(e) => setOdds(e.target.value)}
                required
                disabled={isDisabled}
              />
            </div>

            <div className="space-y-2">
              <Label>Valor (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                required
                disabled={isDisabled}
              />
            </div>

            <div className="space-y-2">
              <Label>Data do Evento *</Label>
              <DatePicker
                value={eventDate}
                onChange={(date) => setEventDate(date || new Date())}
                disabled={isDisabled}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione suas observações sobre esta aposta..."
              disabled={isDisabled}
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isDisabled}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isDisabled}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
