import type { Sport } from '@prisma/client'
import { formatMatchTime } from '@/lib/date-time'
import { LAST_GAMES_LIMIT } from '@/lib/integrations/event-search-config'
import {
  resolveApiSearchQuery,
} from '@/lib/integrations/team-name-pt-br'
import { formatEventLabel, type SportEventSearchResult } from '@/lib/types/sport-events'

const API_BASE = 'https://api.football-data.org/v4'

interface FootballDataTeam {
  id: number
  name: string
  crest: string | null
}

interface FootballDataTeamsResponse {
  teams: FootballDataTeam[]
}

interface FootballDataMatch {
  id: number
  utcDate: string
  competition: {
    name: string
  }
  homeTeam: {
    id: number
    name: string
    crest: string | null
  }
  awayTeam: {
    id: number
    name: string
    crest: string | null
  }
}

interface FootballDataMatchesResponse {
  matches: FootballDataMatch[]
}

async function fetchFootballData<T>(path: string, apiToken: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'X-Auth-Token': apiToken,
    },
    cache: 'no-store',
  })

  if (response.status === 429 || response.status === 403) {
    throw new Error('football-data.org sem requisições disponíveis')
  }

  if (!response.ok) {
    throw new Error(`football-data.org retornou status ${response.status}`)
  }

  return response.json() as Promise<T>
}

function mapMatchToResult(match: FootballDataMatch): SportEventSearchResult {
  const homeTeamName = match.homeTeam.name
  const awayTeamName = match.awayTeam.name
  const eventDate = match.utcDate

  return {
    searchId: `FOOTBALL_DATA:${match.id}`,
    source: 'FOOTBALL_DATA',
    externalId: String(match.id),
    sport: 'FUTEBOL',
    homeTeamName,
    awayTeamName,
    homeTeamLogo: match.homeTeam.crest,
    awayTeamLogo: match.awayTeam.crest,
    competition: match.competition.name,
    eventDate,
    eventLabel: formatEventLabel(homeTeamName, awayTeamName),
    time: formatMatchTime(eventDate),
  }
}

export async function searchFootballDataEvents(
  query: string,
  sport: Sport = 'FUTEBOL'
): Promise<SportEventSearchResult[]> {
  if (sport !== 'FUTEBOL') return []

  const apiToken = process.env.FOOTBALL_DATA_API_TOKEN
  if (!apiToken) {
    throw new Error('FOOTBALL_DATA_API_TOKEN não configurada')
  }

  const apiQuery = resolveApiSearchQuery(query)

  const teamsData = await fetchFootballData<FootballDataTeamsResponse>(
    `/teams?name=${encodeURIComponent(apiQuery)}`,
    apiToken
  )

  const team = teamsData.teams[0]
  if (!team) return []

  const matchesData = await fetchFootballData<FootballDataMatchesResponse>(
    `/teams/${team.id}/matches?limit=${LAST_GAMES_LIMIT}`,
    apiToken
  )

  return [...matchesData.matches]
    .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
    .slice(0, LAST_GAMES_LIMIT)
    .map(mapMatchToResult)
}
