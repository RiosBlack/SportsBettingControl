'use server'

import { getCurrentUser } from '@/lib/auth/get-user'
import { searchSportEvents } from '@/lib/integrations/sport-events'
import type { Sport } from '@prisma/client'
import type { SportEventSearchResult } from '@/lib/types/sport-events'

export async function searchSportEventsAction(
  query: string,
  sport: Sport = 'FUTEBOL'
): Promise<{ success: true; data: SportEventSearchResult[] } | { error: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: 'Não autenticado' }
    }

    const data = await searchSportEvents(query, sport)
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao buscar eventos:', error)
    return { error: 'Não foi possível buscar eventos no momento' }
  }
}
