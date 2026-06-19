# Cashout no Diálogo Finalizar Aposta

**Data:** 2026-06-19

## Resumo

Adicionada opção **Cash** no diálogo de finalização de apostas pendentes, permitindo informar o valor recebido no cashout e atualizar saldo da banca e lucro/prejuízo.

## Alterações

### UI

- Novo componente `SettleBetDialog` com dois modos: ações (Anular / Perdeu / Cash / Ganhou) e cashout (input de valor).
- Preview de lucro/prejuízo ao digitar o valor do cashout.
- Filtro de status na lista passa a incluir **Cashout**.

### Backend

- `SettleBetSchema` aceita `cashoutAmount` (obrigatório quando `status === 'CASHOUT'`).
- `settleBet` calcula:
  - `balanceChange = cashoutAmount` (valor devolvido à banca)
  - `profit = cashoutAmount - stake` (lucro/prejuízo líquido)

## Arquivos

- `app/dashboard/bets/_components/settle-bet-dialog.tsx` (novo)
- `app/dashboard/bets/_components/bets-list-view.tsx`
- `lib/validations/bet.ts`
- `lib/actions/bet.ts`

## Regras de negócio

- O stake já é debitado na criação da aposta; no cashout, apenas o valor recebido é creditado de volta.
- Lucro negativo é permitido (cashout menor que o stake).
