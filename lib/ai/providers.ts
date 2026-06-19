import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import type { AiProvider } from '@/lib/ai/bet-draft-schema'

export function getDefaultProvider(): AiProvider {
  const env = process.env.BET_IMPORT_DEFAULT_PROVIDER
  if (env === 'gemini') return 'gemini'
  return 'openai'
}

export function getModel(provider: AiProvider) {
  if (provider === 'gemini') {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) {
      throw new Error('GOOGLE_GENERATIVE_AI_API_KEY não configurada')
    }
    const google = createGoogleGenerativeAI({ apiKey })
    return google('gemini-2.0-flash')
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY não configurada')
  }
  const openai = createOpenAI({ apiKey })
  return openai('gpt-4o')
}
