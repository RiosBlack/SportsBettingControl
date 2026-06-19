import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { BetDraftWithMarket } from '@/lib/ai/bet-draft-schema'

export function formatBetSummary(draft: BetDraftWithMarket): string {
  const lines = [
    'Encontrei esta aposta no print:',
    '',
    `• Banca: ${draft.bankrollName ?? 'Selecionada'}`,
    `• Evento: ${draft.event}`,
  ]

  if (draft.competition) {
    lines.push(`• Competição: ${draft.competition}`)
  }

  lines.push(
    `• Esporte: ${formatSport(draft.sport)}`,
    `• Mercado: ${draft.marketName}`,
    `• Seleção: ${draft.selection || '—'}`,
    `• Cotação: ${draft.odds.toFixed(2)}`,
    `• Valor: R$ ${draft.stake.toFixed(2)}`,
    `• Data: ${format(draft.eventDate, "dd/MM/yyyy", { locale: ptBR })}`
  )

  if (draft.bookmaker) {
    lines.push(`• Casa: ${draft.bookmaker}`)
  }

  if (draft.notes) {
    lines.push(`• Observações: ${draft.notes}`)
  }

  if (draft.uncertainFields && draft.uncertainFields.length > 0) {
    lines.push(
      '',
      `⚠️ Campos com baixa confiança: ${draft.uncertainFields.join(', ')}`
    )
  }

  lines.push(
    '',
    'Está correto? Responda "sim" para registrar, descreva o que mudar, ou "cancelar".'
  )

  return lines.join('\n')
}

function formatSport(sport: string): string {
  const labels: Record<string, string> = {
    FUTEBOL: 'Futebol',
    TENIS: 'Tênis',
    VOLEI: 'Vôlei',
    FUTSAL: 'Futsal',
    HANDEBOL: 'Handebol',
    BASEBALL: 'Baseball',
    FUTEBOL_AMERICANO: 'Futebol Americano',
    HOCKEY: 'Hockey',
    MMA: 'MMA',
    BOXE: 'Boxe',
    ESPORTS: 'E-Sports',
    OUTROS: 'Outros',
  }
  return labels[sport] ?? sport
}
