import type { Sport } from '@prisma/client'
import dayjs from 'dayjs'
import { formatDateKey, formatMatchTime } from '@/lib/date-time'
import {
  LAST_GAMES_LIMIT,
} from '@/lib/integrations/event-search-config'
import {
  resolveApiSearchQuery,
} from '@/lib/integrations/team-name-pt-br'
import { formatEventLabel, type SportEventSearchResult } from '@/lib/types/sport-events'

const API_BASE = 'https://v3.football.api-sports.io'

interface ApiFootballTeam {
  team: {
    id: number
    name: string
    logo: string | null
    national?: boolean
  }
}

interface ApiFootballFixture {
  fixture: {
    id: number
    date: string
  }
  league: {
    name: string
    country: string
  }
  teams: {
    home: {
      id: number
      name: string
      logo: string | null
    }
    away: {
      id: number
      name: string
      logo: string | null
    }
  }
}

interface ApiFootballResponse<T> {
  errors?: Record<string, string> | string[]
  results: number
  response: T[]
}

function getApiFootballHeaders(apiKey: string): HeadersInit {
  return {
    'x-apisports-key': apiKey,
    'x-rapidapi-key': apiKey,
    'x-rapidapi-host': 'v3.football.api-sports.io',
  }
}

function hasApiFootballErrors(data: ApiFootballResponse<unknown>): boolean {
  if (!data.errors) return false
  if (Array.isArray(data.errors)) return data.errors.length > 0
  return Object.keys(data.errors).length > 0
}

export class ApiFootballQuotaError extends Error {
  constructor(message = 'API-Football sem tokens disponíveis') {
    super(message)
    this.name = 'ApiFootballQuotaError'
  }
}

function getFixtureSeasons() {
  const currentYear = new Date().getFullYear()
  return [currentYear, currentYear - 1, 2024, 2023, 2022]
}

function getSeasonDateRange(season: number) {
  const seasonStart = `${season}-01-01`
  const seasonEnd = `${season}-12-31`
  const today = formatDateKey(new Date())
  const recentStart = formatDateKey(dayjs().subtract(120, 'day').toDate())

  if (season < new Date().getFullYear()) {
    return { from: `${season}-07-01`, to: seasonEnd }
  }

  return {
    from: recentStart < seasonStart ? seasonStart : recentStart,
    to: today < seasonEnd ? today : seasonEnd,
  }
}

function pickLatestFixtures(fixtures: ApiFootballFixture[]): ApiFootballFixture[] {
  return [...fixtures]
    .sort(
      (a, b) =>
        new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime()
    )
    .slice(0, LAST_GAMES_LIMIT)
}

async function fetchTeamFixtures(
  teamId: number,
  apiKey: string
): Promise<ApiFootballFixture[]> {
  for (const season of getFixtureSeasons()) {
    const { from, to } = getSeasonDateRange(season)

    try {
      const data = await fetchApiFootball<ApiFootballFixture>(
        `/fixtures?team=${teamId}&season=${season}&from=${from}&to=${to}`,
        apiKey
      )

      if (data.response.length > 0) {
        return pickLatestFixtures(data.response)
      }
    } catch (error) {
      if (error instanceof ApiFootballQuotaError) {
        throw error
      }

      const message = error instanceof Error ? error.message : ''
      if (message.startsWith('API_FOOTBALL_PLAN:')) {
        continue
      }

      throw error
    }
  }

  return []
}

async function fetchApiFootball<T>(
  path: string,
  apiKey: string
): Promise<ApiFootballResponse<T>> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: getApiFootballHeaders(apiKey),
    cache: 'no-store',
  })

  if (response.status === 429 || response.status === 403) {
    throw new ApiFootballQuotaError()
  }

  if (!response.ok) {
    throw new Error(`API-Football retornou status ${response.status}`)
  }

  const data = (await response.json()) as ApiFootballResponse<T>

  if (hasApiFootballErrors(data)) {
    const errorMessage = JSON.stringify(data.errors).toLowerCase()
    if (
      errorMessage.includes('request') ||
      errorMessage.includes('limit') ||
      errorMessage.includes('quota')
    ) {
      throw new ApiFootballQuotaError()
    }
    throw new Error(`API_FOOTBALL_PLAN:${JSON.stringify(data.errors)}`)
  }

  return data
}

function mapFixtureToResult(fixture: ApiFootballFixture): SportEventSearchResult {
  const homeTeamName = fixture.teams.home.name
  const awayTeamName = fixture.teams.away.name
  const eventDate = fixture.fixture.date

  return {
    searchId: `API_FOOTBALL:${fixture.fixture.id}`,
    source: 'API_FOOTBALL',
    externalId: String(fixture.fixture.id),
    sport: 'FUTEBOL',
    homeTeamName,
    awayTeamName,
    homeTeamLogo: fixture.teams.home.logo,
    awayTeamLogo: fixture.teams.away.logo,
    competition: fixture.league.name,
    eventDate,
    eventLabel: formatEventLabel(homeTeamName, awayTeamName),
    time: formatMatchTime(eventDate),
  }
}

function pickBestTeam(teams: ApiFootballTeam[], query: string): ApiFootballTeam | undefined {
  if (teams.length === 0) return undefined

  const apiQuery = resolveApiSearchQuery(query)
  const normalizedQuery = apiQuery.toLowerCase()

  const nationalExact = teams.find(
    (entry) =>
      entry.team.national &&
      entry.team.name.toLowerCase() === normalizedQuery
  )
  if (nationalExact) return nationalExact

  const nationalPartial = teams.find(
    (entry) =>
      entry.team.national &&
      entry.team.name.toLowerCase().includes(normalizedQuery)
  )
  if (nationalPartial) return nationalPartial

  const clubExact = teams.find(
    (entry) => entry.team.name.toLowerCase() === query.trim().toLowerCase()
  )
  if (clubExact) return clubExact

  return teams[0]
}

export async function searchApiFootballEvents(
  query: string,
  sport: Sport = 'FUTEBOL'
): Promise<SportEventSearchResult[]> {
  if (sport !== 'FUTEBOL') return []

  const apiKey = process.env.API_FOOTBALL_KEY
  if (!apiKey) {
    throw new ApiFootballQuotaError('API_FOOTBALL_KEY não configurada')
  }

  const apiQuery = resolveApiSearchQuery(query)

  const teamsData = await fetchApiFootball<ApiFootballTeam>(
    `/teams?search=${encodeURIComponent(apiQuery)}`,
    apiKey
  )

  const team = pickBestTeam(teamsData.response, query)
  if (!team) return []

  const fixtures = await fetchTeamFixtures(team.team.id, apiKey)

  return fixtures.map(mapFixtureToResult)
}
