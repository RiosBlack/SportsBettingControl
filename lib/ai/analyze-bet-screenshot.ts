import { generateObject } from 'ai'
import { getModel } from '@/lib/ai/providers'
import {
  AiBetDraftSchema,
  toBetDraft,
  type AiProvider,
  type BetDraft,
} from '@/lib/ai/bet-draft-schema'

const SYSTEM_PROMPT = `Você é um assistente especializado em extrair dados de apostas esportivas a partir de screenshots de casas de apostas brasileiras (Bet365, Betano, Superbet, BetMGM, etc.).

Extraia os seguintes campos do print:
- event: nome do confronto (ex: "Flamengo x Palmeiras")
- competition: campeonato/liga, se visível
- sport: um dos valores FUTEBOL, TENIS, VOLEI, FUTSAL, HANDEBOL, BASEBALL, FUTEBOL_AMERICANO, HOCKEY, MMA, BOXE, ESPORTS, OUTROS
- marketName: tipo de mercado (ex: "Resultado Final", "Over 2.5", "Ambas Marcam")
- selection: opção apostada (ex: "Flamengo", "Sim", "Over 2.5")
- odds: cotação numérica (ex: 2.50)
- stake: valor apostado em reais (apenas o número, ex: 100.00)
- eventDate: data do evento no formato ISO se possível
- bookmaker: casa de apostas, se identificável
- notes: observações relevantes do bilhete
- uncertainFields: lista de nomes de campos com baixa confiança na leitura

Responda sempre em português nos valores textuais. Use valores numéricos corretos para odds e stake.`

export async function analyzeBetScreenshot(
  imageBase64: string,
  mimeType: string,
  provider: AiProvider
): Promise<BetDraft> {
  const model = getModel(provider)

  const { object } = await generateObject({
    model,
    schema: AiBetDraftSchema,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analise este print de aposta e extraia os dados estruturados.',
          },
          {
            type: 'image',
            image: `data:${mimeType};base64,${imageBase64}`,
          },
        ],
      },
    ],
  })

  return toBetDraft(AiBetDraftSchema.parse(object))
}
