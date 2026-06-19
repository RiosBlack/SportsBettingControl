# Edição de Apostas Pendentes

**Data:** 2026-06-19

## Resumo

Adicionada funcionalidade para editar apostas com status `PENDENTE` diretamente na lista de apostas.

## Alterações

### UI

- Novo botão com ícone de lápis (`Pencil`) na coluna **Ações**, visível apenas para apostas pendentes.
- Modal `EditBetDialog` com todos os campos editáveis: esporte, casa de apostas, evento, competição, mercado, cotação, valor, data do evento e observações.
- Layout das ações para apostas pendentes: `[Finalizar] [Editar] [Excluir]`.

### Backend

- `updateBet` corrigido para:
  - Montar `updateData` apenas com campos definidos.
  - Executar update em transação.
  - Ajustar saldo da banca quando o valor apostado (`stake`) é alterado.
  - Validar saldo insuficiente ao aumentar o stake.
  - Revalidar `/dashboard/bankrolls` após sucesso.

## Arquivos

- `app/dashboard/bets/_components/edit-bet-dialog.tsx` (novo)
- `app/dashboard/bets/_components/bets-list-view.tsx`
- `lib/actions/bet.ts`

## Regras de negócio

- Edição permitida **somente** para apostas com status `PENDENTE` (validado no backend e na UI).
- A banca não pode ser alterada na edição.
