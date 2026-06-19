import { z } from 'zod'
import { SportEnum } from '@/lib/validations/bet'

export const AiProviderEnum = z.enum(['openai', 'gemini'])
export type AiProvider = z.infer<typeof AiProviderEnum>

export const BetDraftSchema = z.object({
  event: z.string().min(3),
  competition: z.string().optional(),
  sport: SportEnum.default('FUTEBOL'),
  marketName: z.string().min(3),
  selection: z.string().default(''),
  odds: z.number().positive().min(1.01).max(1000),
  stake: z.number().positive().max(1000000),
  eventDate: z.coerce.date(),
  bookmaker: z.string().optional(),
  notes: z.string().optional(),
  uncertainFields: z.array(z.string()).optional(),
})

export type BetDraft = z.infer<typeof BetDraftSchema>

/** Schema com todos os campos obrigatórios (exigido pelo structured output da OpenAI). */
export const AiBetDraftSchema = z.object({
  event: z.string().min(3),
  competition: z.string().nullable(),
  sport: SportEnum,
  marketName: z.string().min(3),
  selection: z.string(),
  odds: z.number().positive().min(1.01).max(1000),
  stake: z.number().positive().max(1000000),
  eventDate: z.coerce.date(),
  bookmaker: z.string().nullable(),
  notes: z.string().nullable(),
  uncertainFields: z.array(z.string()),
})

export type AiBetDraft = z.infer<typeof AiBetDraftSchema>

export function toBetDraft(raw: AiBetDraft): BetDraft {
  return BetDraftSchema.parse({
    event: raw.event,
    competition: raw.competition ?? undefined,
    sport: raw.sport,
    marketName: raw.marketName,
    selection: raw.selection,
    odds: raw.odds,
    stake: raw.stake,
    eventDate: raw.eventDate,
    bookmaker: raw.bookmaker ?? undefined,
    notes: raw.notes ?? undefined,
    uncertainFields:
      raw.uncertainFields.length > 0 ? raw.uncertainFields : undefined,
  })
}

export const BetDraftWithMarketSchema = BetDraftSchema.extend({
  marketId: z.string().optional(),
  bankrollId: z.string(),
  bankrollName: z.string().optional(),
})

export type BetDraftWithMarket = z.infer<typeof BetDraftWithMarketSchema>

export type SerializedBetDraft = Omit<BetDraftWithMarket, 'eventDate'> & {
  eventDate: string
}
