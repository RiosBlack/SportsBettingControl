import type { Prisma, Sport } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { searchApiFootballEvents } from '@/lib/integrations/api-football'
import { searchFootballDataEvents } from '@/lib/integrations/football-data'
import {
  formatEventLabel,
  type SportEventSearchResult,
} from '@/lib/types/sport-events'
import type { SelectedSportEventInput } from '@/lib/validations/bet'
import { formatMatchTime } from '@/lib/date-time'
import { LAST_GAMES_LIMIT } from '@/lib/integrations/event-search-config'
import { localizeSportEventResults } from '@/lib/integrations/localize-sport-events'

const MIN_QUERY_LENGTH = 3

function mergeResults(
  ...groups: SportEventSearchResult[][]
): SportEventSearchResult[] {
  const seen = new Set<string>()
  const merged: SportEventSearchResult[] = []

  for (const group of groups) {
    for (const item of group) {
      const key = item.externalId
        ? `${item.source}:${item.externalId}`
        : item.searchId

      if (seen.has(key)) continue
      seen.add(key)
      merged.push(item)
    }
  }

  return merged
    .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
    .slice(0, LAST_GAMES_LIMIT)
}

async function searchLocalEvents(
  query: string,
  sport: Sport
): Promise<SportEventSearchResult[]> {
  const events = await prisma.sportEvent.findMany({
    where: {
      sport,
      OR: [
        { homeTeamName: { contains: query, mode: 'insensitive' } },
        { awayTeamName: { contains: query, mode: 'insensitive' } },
        { competition: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { eventDate: 'desc' },
    take: LAST_GAMES_LIMIT,
  })

  return events.map((event) => ({
    searchId: `LOCAL:${event.id}`,
    source: 'LOCAL' as const,
    localSportEventId: event.id,
    externalId: event.externalId ?? undefined,
    sport: event.sport,
    homeTeamName: event.homeTeamName,
    awayTeamName: event.awayTeamName,
    homeTeamLogo: event.homeTeamLogo,
    awayTeamLogo: event.awayTeamLogo,
    competition: event.competition,
    eventDate: event.eventDate.toISOString(),
    eventLabel: formatEventLabel(event.homeTeamName, event.awayTeamName),
    time: formatMatchTime(event.eventDate),
  }))
}

async function searchExternalEvents(
  query: string,
  sport: Sport
): Promise<SportEventSearchResult[]> {
  try {
    const apiFootballResults = await searchApiFootballEvents(query, sport)
    if (apiFootballResults.length > 0) {
      return apiFootballResults
    }
  } catch (error) {
    console.error('API-Football indisponível, tentando football-data.org:', error)
  }

  if (process.env.FOOTBALL_DATA_API_TOKEN) {
    return searchFootballDataEvents(query, sport)
  }

  return []
}

export async function searchSportEvents(
  query: string,
  sport: Sport = 'FUTEBOL'
): Promise<SportEventSearchResult[]> {
  const normalizedQuery = query.trim()

  if (normalizedQuery.length < MIN_QUERY_LENGTH) {
    return []
  }

  const localResults = await searchLocalEvents(normalizedQuery, sport)

  let externalResults: SportEventSearchResult[] = []
  if (sport === 'FUTEBOL') {
    try {
      externalResults = await searchExternalEvents(normalizedQuery, sport)
    } catch (error) {
      console.error('Erro ao buscar eventos externos:', error)
    }
  }

  return localizeSportEventResults(
    mergeResults(localResults, externalResults)
  )
}

export async function upsertSportEventFromSelection(
  selectedEvent: SelectedSportEventInput,
  tx: Prisma.TransactionClient = prisma
) {
  return tx.sportEvent.upsert({
    where: {
      source_externalId: {
        source: selectedEvent.source,
        externalId: selectedEvent.externalId,
      },
    },
    create: {
      externalId: selectedEvent.externalId,
      source: selectedEvent.source,
      sport: selectedEvent.sport,
      homeTeamName: selectedEvent.homeTeamName,
      awayTeamName: selectedEvent.awayTeamName,
      homeTeamLogo: selectedEvent.homeTeamLogo,
      awayTeamLogo: selectedEvent.awayTeamLogo,
      competition: selectedEvent.competition,
      eventDate: selectedEvent.eventDate,
    },
    update: {
      sport: selectedEvent.sport,
      homeTeamName: selectedEvent.homeTeamName,
      awayTeamName: selectedEvent.awayTeamName,
      homeTeamLogo: selectedEvent.homeTeamLogo,
      awayTeamLogo: selectedEvent.awayTeamLogo,
      competition: selectedEvent.competition,
      eventDate: selectedEvent.eventDate,
    },
  })
}
