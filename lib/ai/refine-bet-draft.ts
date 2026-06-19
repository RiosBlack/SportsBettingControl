import { generateObject } from 'ai'
import { getModel } from '@/lib/ai/providers'
import {
  AiBetDraftSchema,
  toBetDraft,
  type AiProvider,
  type BetDraft,
} from '@/lib/ai/bet-draft-schema'

const SYSTEM_PROMPT = `Você atualiza um rascunho de aposta esportiva com base na correção do usuário.

Mantenha todos os campos que o usuário não mencionou. Aplique apenas as alterações solicitadas.
Responda com o rascunho completo atualizado.`

export async function refineBetDraft(
  draft: BetDraft,
  userMessage: string,
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
        content: `Rascunho atual:\n${JSON.stringify(draft, null, 2)}\n\nCorreção do usuário: ${userMessage}`,
      },
    ],
  })

  return toBetDraft(AiBetDraftSchema.parse(object))
}
