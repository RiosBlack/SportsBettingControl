'use server'

import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { createMarket } from '@/lib/actions/market'
import { createBetForUser } from '@/lib/actions/bet'
import { analyzeBetScreenshot } from '@/lib/ai/analyze-bet-screenshot'
import { refineBetDraft } from '@/lib/ai/refine-bet-draft'
import { formatBetSummary } from '@/lib/ai/format-bet-summary'
import {
  AiProviderEnum,
  BetDraftSchema,
  type AiProvider,
  type BetDraft,
  type BetDraftWithMarket,
  type SerializedBetDraft,
} from '@/lib/ai/bet-draft-schema'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

function parseImagePayload(imageBase64: string): {
  mimeType: AllowedMimeType
  data: string
} {
  const dataUrlMatch = imageBase64.match(
    /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/
  )

  if (dataUrlMatch) {
    const mimeType = dataUrlMatch[1] as AllowedMimeType
    const data = dataUrlMatch[2]
    const sizeBytes = Buffer.byteLength(data, 'base64')
    if (sizeBytes > MAX_IMAGE_SIZE) {
      throw new Error('Imagem muito grande. Máximo: 5MB.')
    }
    return { mimeType, data }
  }

  const sizeBytes = Buffer.byteLength(imageBase64, 'base64')
  if (sizeBytes > MAX_IMAGE_SIZE) {
    throw new Error('Imagem muito grande. Máximo: 5MB.')
  }

  return { mimeType: 'image/jpeg', data: imageBase64 }
}

async function resolveMarketId(marketName: string): Promise<string> {
  const trimmed = marketName.trim()

  const existing = await prisma.market.findFirst({
    where: {
      name: {
        equals: trimmed,
        mode: 'insensitive',
      },
    },
  })

  if (existing) {
    return existing.id
  }

  const created = await createMarket(trimmed)
  if (created.success && created.data) {
    return created.data.id
  }

  const retry = await prisma.market.findFirst({
    where: {
      name: {
        equals: trimmed,
        mode: 'insensitive',
      },
    },
  })

  if (retry) {
    return retry.id
  }

  throw new Error(created.error || 'Erro ao resolver mercado')
}

async function enrichDraftWithoutMarket(
  draft: BetDraft,
  bankrollId: string,
  userId: string
): Promise<BetDraftWithMarket> {
  const bankroll = await prisma.bankroll.findFirst({
    where: { id: bankrollId, userId },
  })

  if (!bankroll) {
    throw new Error('Banca não encontrada')
  }

  return {
    ...draft,
    eventDate: new Date(draft.eventDate),
    bankrollId,
    bankrollName: bankroll.name,
  }
}

async function enrichDraft(
  draft: BetDraft,
  bankrollId: string,
  userId: string,
  existingMarketId?: string
): Promise<BetDraftWithMarket> {
  const base = await enrichDraftWithoutMarket(draft, bankrollId, userId)
  const marketId =
    existingMarketId || (await resolveMarketId(draft.marketName))

  return {
    ...base,
    marketId,
  }
}

function serializeDraft(draft: BetDraftWithMarket): SerializedBetDraft {
  return {
    ...draft,
    eventDate: draft.eventDate.toISOString(),
  }
}

function deserializeDraft(draft: SerializedBetDraft): BetDraftWithMarket {
  return {
    ...draft,
    eventDate: new Date(draft.eventDate),
  }
}

export async function analyzeBetScreenshotAction(input: {
  imageBase64: string
  provider: AiProvider
  bankrollId: string
}) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: 'Não autenticado' }
    }

    const provider = AiProviderEnum.parse(input.provider)
    const { mimeType, data } = parseImagePayload(input.imageBase64)

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return { error: 'Formato de imagem inválido. Use JPEG, PNG ou WebP.' }
    }

    const draft = await analyzeBetScreenshot(data, mimeType, provider)
    const enriched = await enrichDraftWithoutMarket(
      draft,
      input.bankrollId,
      user.dbUser.id
    )

    return {
      success: true as const,
      data: {
        draft: serializeDraft(enriched),
      },
    }
  } catch (error: unknown) {
    console.error('Erro ao analisar print:', error)
    const message =
      error instanceof Error ? error.message : 'Erro ao analisar print da aposta'
    return { error: message }
  }
}

export async function refineBetDraftAction(input: {
  draft: SerializedBetDraft
  message: string
  provider: AiProvider
}) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: 'Não autenticado' }
    }

    const provider = AiProviderEnum.parse(input.provider)
    const current = deserializeDraft(input.draft)
    const preservedMarketId = current.marketId
    const preservedMarketName = current.marketName

    const baseDraft = BetDraftSchema.parse({
      event: current.event,
      competition: current.competition,
      sport: current.sport,
      marketName: current.marketName,
      selection: current.selection,
      odds: current.odds,
      stake: current.stake,
      eventDate: current.eventDate,
      bookmaker: current.bookmaker,
      notes: current.notes,
      uncertainFields: current.uncertainFields,
    })

    const refined = await refineBetDraft(baseDraft, input.message, provider)

    const enriched = await enrichDraft(
      {
        ...refined,
        marketName: preservedMarketId ? preservedMarketName : refined.marketName,
        bookmaker: current.bookmaker ?? refined.bookmaker,
      },
      current.bankrollId,
      user.dbUser.id,
      preservedMarketId
    )

    const summary = formatBetSummary(enriched)

    return {
      success: true as const,
      data: {
        draft: serializeDraft(enriched),
        summary,
      },
    }
  } catch (error: unknown) {
    console.error('Erro ao refinar rascunho:', error)
    const message =
      error instanceof Error ? error.message : 'Erro ao aplicar correção'
    return { error: message }
  }
}

export async function confirmBetFromDraftAction(input: {
  draft: SerializedBetDraft
}) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: 'Não autenticado' }
    }

    const current = deserializeDraft(input.draft)

    const bankroll = await prisma.bankroll.findFirst({
      where: { id: current.bankrollId, userId: user.dbUser.id },
    })

    if (!bankroll) {
      return { error: 'Banca não encontrada' }
    }

    const marketId =
      current.marketId || (await resolveMarketId(current.marketName))

    const result = await createBetForUser(user.dbUser.id, {
      bankrollId: current.bankrollId,
      sport: current.sport,
      event: current.event,
      competition: current.competition,
      marketId,
      selection: current.selection,
      odds: current.odds,
      stake: current.stake,
      eventDate: current.eventDate,
      bookmaker: current.bookmaker,
      notes: current.notes,
      tags: [],
    })

    if ('error' in result && result.error) {
      return { error: result.error }
    }

    return { success: true as const, data: result.data }
  } catch (error: unknown) {
    console.error('Erro ao confirmar aposta:', error)
    const message =
      error instanceof Error ? error.message : 'Erro ao registrar aposta'
    return { error: message }
  }
}
