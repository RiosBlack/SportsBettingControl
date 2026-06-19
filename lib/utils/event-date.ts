import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/** Dia civil local (yyyy-MM-dd) a partir de um Date. */
export function toCalendarDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

/** Persiste eventDate como meio-dia UTC do dia civil escolhido. */
export function normalizeEventDate(date: Date): Date {
  const dateStr = toCalendarDateString(date)
  return new Date(`${dateStr}T12:00:00.000Z`)
}

export function parseCalendarDate(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return undefined

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const parsed = new Date(year, month - 1, day, 12, 0, 0, 0)

  if (Number.isNaN(parsed.getTime())) return undefined

  return parsed
}

/** Converte eventDate do banco para Date de calendário (DatePicker / UI). */
export function calendarDateFromEventDate(date: Date): Date {
  const fromIso = parseCalendarDate(date.toISOString().slice(0, 10))
  if (fromIso) return fromIso
  return normalizeEventDate(date)
}

export function formatEventDateDisplay(date: Date): string {
  return format(calendarDateFromEventDate(date), 'dd/MM/yyyy', { locale: ptBR })
}

export function toEventDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}
