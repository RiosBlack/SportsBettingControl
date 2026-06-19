# Filtro de apostas por dia com calendário de intervalo

**Data:** 2026-06-19

## Resumo

A tela `/dashboard/bets` passa a exibir apostas filtradas por período, com padrão "hoje", seletor de intervalo via Calendar Shadcn e agrupamento por dia quando o intervalo abrange múltiplos dias.

## Mudanças

### Novos componentes e utilitários

- `components/date-range-picker.tsx` — seletor de intervalo com `Calendar mode="range"` e locale pt-BR
- `lib/utils/date-range.ts` — filtro por dia civil com limites UTC (`00:00:00Z`–`23:59:59Z`), evitando exclusão de apostas salvas à meia-noite UTC

### Página de apostas

- `app/dashboard/bets/page.tsx` lê `searchParams.startDate` e `searchParams.endDate`
- Sem params na URL, carrega apostas de hoje
- Passa `initialRange` para o componente client

### Listagem

- `app/dashboard/bets/_components/bets-list-view.tsx`:
  - `DateRangePicker` na barra de filtros
  - Sincronização com URL via `router.push`
  - Agrupamento por dia com cabeçalho quando intervalo > 1 dia
  - Descrição contextual do período ("Apostas de hoje", etc.)

### Backend

- `lib/actions/bet.ts` — `getBets` normaliza datas com `startOfDay`/`endOfDay` e ordena por `eventDate` quando há filtro de data

## Comportamento

| Cenário | Resultado |
|---------|-----------|
| `/dashboard/bets` | Apostas de hoje |
| Intervalo de 1 dia | Tabela única |
| Intervalo de vários dias | Grupos por dia, do mais recente ao mais antigo |
| Filtros status/busca | Continuam no cliente sobre o período selecionado |

Campo de filtro: `eventDate` (data do evento).

## URL

```
/dashboard/bets?startDate=2026-06-17&endDate=2026-06-19
```
