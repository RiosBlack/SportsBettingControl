import type { EventSource, Sport } from '@prisma/client'

export type SportEventSearchSource = EventSource | 'LOCAL'

export interface SportEventSearchResult {
  /** Identificador temporário para seleção no formulário */
  searchId: string
  source: SportEventSearchSource
  externalId?: string
  localSportEventId?: string
  sport: Sport
  homeTeamName: string
  awayTeamName: string
  homeTeamLogo?: string | null
  awayTeamLogo?: string | null
  competition: string
  eventDate: string
  eventLabel: string
  time: string
}

export function formatEventLabel(homeTeamName: string, awayTeamName: string): string {
  return `${homeTeamName} x ${awayTeamName}`
}
