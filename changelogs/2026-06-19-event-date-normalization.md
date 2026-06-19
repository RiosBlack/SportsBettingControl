# Normalização de eventDate na criação de apostas

**Data:** 2026-06-19

## Resumo

`eventDate` passa a ser salvo sempre como **meio-dia UTC** (`T12:00:00.000Z`) do dia civil escolhido, alinhando filtro, exibição e agrupamento.

## Mudanças

- `lib/utils/event-date.ts` — `normalizeEventDate`, `formatEventDateDisplay`, `calendarDateFromEventDate`
- `lib/actions/bet.ts` — normalização em `createBetForUser` e `updateBet`
- `app/dashboard/bets/_components/bets-list-view.tsx` — coluna Data usa `formatEventDateDisplay`
- `app/dashboard/bets/_components/edit-bet-dialog.tsx` — DatePicker inicializa com dia civil correto
- `lib/utils/date-range.ts` — reutiliza helpers de calendário de `event-date`

## Comportamento

```
Usuário escolhe 19/06/2026 → salva 2026-06-19T12:00:00.000Z
Importação IA "2026-06-19"     → salva 2026-06-19T12:00:00.000Z
```

Apostas antigas (meia-noite UTC) continuam funcionando no filtro; a exibição usa o dia UTC do timestamp até serem editadas.

## Documentação

- `documentos/regras-de-negocio.md` — regra de persistência de `eventDate`
