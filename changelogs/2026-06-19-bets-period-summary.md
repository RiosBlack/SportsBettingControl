# Resumo de apostas na listagem

**Data:** 2026-06-19

## Resumo

A tela `/dashboard/bets` exibe uma faixa de resumo com quantidade de apostas, valor apostado, saldo e total pendente, recalculada dinamicamente conforme os filtros de status e busca.

## Mudanças

### Utilitário compartilhado

- `lib/utils/bet-summary.ts` — centraliza `computeBetProfitSummary`, `computeBetPeriodStats` e formatação de moeda
- `lib/actions/stats.ts` — refatorado para reutilizar `aggregateBetProfitSummaries` do utilitário

### UI

- `app/dashboard/bets/_components/bets-period-summary.tsx` — grid com 4 cards:
  - **Apostas** — quantidade no recorte filtrado
  - **Valor apostado** — soma de `stake`
  - **Saldo do dia/período** — `Σ profit` das apostas finalizadas
  - **Pendentes** — soma de `stake` e contagem de apostas `PENDENTE`
- `app/dashboard/bets/_components/bets-list-view.tsx` — integra o resumo entre filtros e tabela

## Fórmulas

```
Quantidade = apostas filtradas
Valor apostado = Σ stake (inclui pendentes)
Saldo = Σ profit (apostas finalizadas)
Pendentes = Σ stake onde status = PENDENTE
```

O resumo reflete o recorte atual (período + status + busca), não apenas o período.

## Documentação

- `documentos/regras-de-negocio.md` — nota na seção de apostas
