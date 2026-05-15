# Sync sob demanda ao clicar no time (2026-05-15)

## Resumo

Chamadas à API-Football deixam de ser automáticas. Estatísticas são buscadas e persistidas na primeira visita ao time no dia; leituras seguintes usam apenas o PostgreSQL.

## Alterações

### Backend

- `syncTeamStatisticsForTeam()` em `lib/actions/team-statistics.ts` — gate diário via `TeamStatsSync.syncedAt` (fuso `America/Sao_Paulo`)
- `POST /api/teams/[teamId]/sync` — sync manual com `force=true`
- `GET /api/fixtures` e página Partidas — somente leitura do banco
- Removido hook `syncTeamStatistics` após `syncFixturesByLeagues`
- Removido sync no login e componente `FixturesSync` do layout
- Cron Vercel (`/api/cron/daily-sync`) removido de `vercel.json` (rota mantida para invocação manual)

### Frontend

- Página `/dashboard/teams/[teamId]` dispara sync no SSR antes de renderizar stats
- Botão "Sincronizar" usa `POST /api/teams/[teamId]/sync?force=true`
- Estado vazio em Partidas orienta usar "Atualizar banco" ou clicar em um time

## Fluxos mantidos

- **Atualizar banco de dados** (Configurações → Ligas): `POST /api/database/sync` — fixtures + stats em lote
- Filtros na página do time (stat, venue, liga): apenas banco

## Testes sugeridos

1. Clicar time → dados aparecem; recarregar → sem nova chamada API (mesmo dia)
2. Botão Sincronizar → força nova busca
3. Partidas sem sync prévio → lista vazia até "Atualizar banco" ou clique no time
