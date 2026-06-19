import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { analyzeBetScreenshot } from '../lib/ai/analyze-bet-screenshot'
import { formatBetSummary } from '../lib/ai/format-bet-summary'

// Carrega .env manualmente (sem dependência extra)
const envPath = resolve(process.cwd(), '.env')
try {
  const envContent = readFileSync(envPath, 'utf8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq)
    const value = trimmed.slice(eq + 1).replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
} catch {
  console.warn('Aviso: .env não encontrado')
}

async function main() {
  const imagePath = resolve(process.cwd(), 'image.png')
  const imageBase64 = readFileSync(imagePath).toString('base64')
  const provider =
    process.env.BET_IMPORT_DEFAULT_PROVIDER === 'gemini' ? 'gemini' : 'openai'

  console.log(`Provider: ${provider}`)
  console.log(`Imagem: ${imagePath}\n`)

  const draft = await analyzeBetScreenshot(imageBase64, 'image/png', provider)
  const summary = formatBetSummary({
    ...draft,
    marketId: 'test',
    bankrollId: 'test',
    bankrollName: 'Banca Teste',
  })

  console.log('✅ Extração bem-sucedida!\n')
  console.log(JSON.stringify(draft, null, 2))
  console.log('\n--- Resumo ---\n')
  console.log(summary)
}

main().catch((error) => {
  console.error('❌ Falha na extração:')
  console.error(error)
  process.exit(1)
})
