# Importação de apostas por print (chat in-app)

## Resumo

Assistente na página **Nova Aposta** que interpreta screenshots de bilhetes via IA (OpenAI ou Gemini), exibe um resumo em chat para confirmação e registra a aposta no banco ao confirmar.

## Fluxo

1. Usuário envia print (drag-and-drop ou clique) na seção "Importar do print"
2. Sheet lateral abre com chat
3. IA extrai evento, mercado, cotação, valor, data etc.
4. Assistente pergunta se está correto
5. **"sim"** → `confirmBetFromDraft` → `createBetForUser`
6. Correção em texto → `refineBetDraft` → novo resumo
7. **"cancelar"** → encerra sem persistir

## Arquivos

| Caminho | Função |
|---------|--------|
| `app/dashboard/bets/new/_components/bet-import-assistant.tsx` | UI upload + chat |
| `lib/actions/bet-import.ts` | Server Actions |
| `lib/ai/*` | Schema, providers, analyze, refine, format |
| `lib/actions/bet.ts` | `createBetForUser` (reutilizado) |

## Variáveis de ambiente

```
OPENAI_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
BET_IMPORT_DEFAULT_PROVIDER=openai
```

## Dependências

- `ai` (Vercel AI SDK)
- `@ai-sdk/openai`
- `@ai-sdk/google`

## Segurança

- Autenticação obrigatória em todas as actions
- Imagens processadas em memória (não persistidas)
- Validação de MIME (JPEG/PNG/WebP) e tamanho (5MB)

## Correção (2026-06-19)

- **Problema:** OpenAI rejeitava o schema Zod com campos `.optional()` (`Invalid schema for response_format: Missing 'competition' in required`).
- **Solução:** `AiBetDraftSchema` com todos os campos obrigatórios (nullable onde aplicável) + `toBetDraft()` para o modelo interno. Uso de `system` em vez de `role: system` nas mensagens.
