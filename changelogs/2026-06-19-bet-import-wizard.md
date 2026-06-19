# Wizard interativo na importação por print

**Data:** 2026-06-19

## Resumo

Fluxo de importação por IA passa a perguntar mercado e casa de apostas no chat **antes** de exibir o resumo para confirmação.

## Novo fluxo

1. Usuário envia print → IA analisa em background
2. Assistente pergunta se deseja usar mercado cadastrado (Sim/Não)
3. Se **Sim** e houver mercados → select inline no chat
4. Se **Não** ou sem mercados cadastrados → usa sugestão da IA para mercado
5. Select de casa de apostas (Bet365, Superbet, Betano, BetMGM, Outros)
6. Resumo final → confirmação

## Alterações técnicas

- `analyzeBetScreenshotAction` não resolve/cria mercado nem retorna resumo imediato
- `confirmBetFromDraftAction` usa `marketId` do draft quando definido
- `refineBetDraftAction` preserva mercado e casa escolhidos manualmente
- `lib/constants/bookmakers.ts` — lista compartilhada de casas
- `lib/ai/apply-import-choices.ts` — aplica escolhas de mercado/casa ao rascunho

## Arquivos

- `app/dashboard/bets/new/_components/bet-import-assistant.tsx`
- `lib/actions/bet-import.ts`
- `lib/ai/apply-import-choices.ts`
- `lib/constants/bookmakers.ts`
- `create-bet-form.tsx`, `edit-bet-dialog.tsx`
