# Resumo do dia na Dashboard

**Data:** 2026-06-19

## Resumo

A página `/dashboard` exibe três cards no topo com métricas das apostas do dia atual (`eventDate` = hoje), alinhados ao mesmo visual da listagem de apostas.

## Mudanças

### Backend

- `lib/actions/stats.ts` — `getBetSummaryForDateRange` e `getTodayBetSummary` buscam apostas por `eventDate` e calculam o resumo via `computeBetPeriodStats`

### UI

- `app/dashboard/_components/dashboard-day-summary.tsx` — grid com 3 cards:
  - **Valor apostado** — soma de `stake` das apostas de hoje
  - **Saldo do dia** — `Σ profit` das apostas finalizadas de hoje
  - **Pendentes** — soma de `stake` e contagem de apostas `PENDENTE` de hoje
- `app/dashboard/page.tsx` — integra o resumo acima do card de desempenho por período

## Fórmulas

Mesmas regras do resumo em `/dashboard/bets`, com recorte fixo no dia atual (UTC).

## Documentação

- `documentos/regras-de-negocio.md` — nota na seção de estatísticas
