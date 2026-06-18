import {
  translateCompetitionToPtBr,
  translateTeamNameToPtBr,
} from '@/lib/integrations/team-name-pt-br'
import type { SportEventSearchResult } from '@/lib/types/sport-events'
import { formatEventLabel } from '@/lib/types/sport-events'

export function localizeSportEventResult(
  result: SportEventSearchResult
): SportEventSearchResult {
  const homeTeamName = translateTeamNameToPtBr(result.homeTeamName)
  const awayTeamName = translateTeamNameToPtBr(result.awayTeamName)
  const competition = translateCompetitionToPtBr(result.competition)

  return {
    ...result,
    homeTeamName,
    awayTeamName,
    competition,
    eventLabel: formatEventLabel(homeTeamName, awayTeamName),
  }
}

export function localizeSportEventResults(
  results: SportEventSearchResult[]
): SportEventSearchResult[] {
  return results.map(localizeSportEventResult)
}
