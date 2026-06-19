import type { SerializedBetDraft } from '@/lib/ai/bet-draft-schema'

export type ImportMarketChoice =
  | { type: 'existing'; marketId: string; marketName: string }
  | { type: 'ai' }

export function applyImportChoices(
  draft: SerializedBetDraft,
  choices: {
    market: ImportMarketChoice
    bookmaker: string
  }
): SerializedBetDraft {
  const next: SerializedBetDraft = {
    ...draft,
    bookmaker: choices.bookmaker,
  }

  if (choices.market.type === 'existing') {
    next.marketId = choices.market.marketId
    next.marketName = choices.market.marketName
  } else {
    delete next.marketId
  }

  return next
}
