import { format, isSameDay, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { parseCalendarDate, toCalendarDateString } from '@/lib/utils/event-date'

export type ResolvedDateRange = {
  startDate: Date
  endDate: Date
  from: Date
  to: Date
}

function toUtcDayStart(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`)
}

function toUtcDayEnd(dateStr: string): Date {
  return new Date(`${dateStr}T23:59:59.999Z`)
}

export function normalizeDateRange(start: Date, end: Date): ResolvedDateRange {
  const startCalendar = toCalendarDateString(start)
  const endCalendar = toCalendarDateString(end > start ? end : start)

  return {
    from: parseCalendarDate(startCalendar)!,
    to: parseCalendarDate(endCalendar)!,
    startDate: toUtcDayStart(startCalendar),
    endDate: toUtcDayEnd(endCalendar),
  }
}

export function getTodayRange(): ResolvedDateRange {
  return normalizeDateRange(new Date(), new Date())
}

export function parseDateParam(value: string | undefined): Date | undefined {
  if (!value) return undefined
  return parseCalendarDate(value)
}

export function resolveDateRangeFromParams(
  startDateParam?: string,
  endDateParam?: string
): ResolvedDateRange {
  const parsedStart = parseDateParam(startDateParam)
  const parsedEnd = parseDateParam(endDateParam)

  if (parsedStart && parsedEnd) {
    return normalizeDateRange(parsedStart, parsedEnd)
  }

  return getTodayRange()
}

export function formatDateRangeLabel(from: Date, to: Date) {
  if (isSameDay(from, to)) {
    if (isToday(from)) return 'Hoje'
    return format(from, 'dd/MM/yyyy', { locale: ptBR })
  }

  return `${format(from, 'dd/MM/yyyy', { locale: ptBR })} — ${format(to, 'dd/MM/yyyy', { locale: ptBR })}`
}

export function formatDateRangeDescription(from: Date, to: Date) {
  if (isSameDay(from, to)) {
    if (isToday(from)) return 'Apostas de hoje'
    return `Apostas de ${format(from, 'dd/MM/yyyy', { locale: ptBR })}`
  }

  return `Apostas de ${format(from, 'dd/MM/yyyy', { locale: ptBR })} a ${format(to, 'dd/MM/yyyy', { locale: ptBR })}`
}

export function formatDayGroupLabel(dateKey: string) {
  return format(new Date(`${dateKey}T12:00:00.000Z`), "EEEE, d 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  })
}

export { toEventDateKey as toDateKey } from '@/lib/utils/event-date'
