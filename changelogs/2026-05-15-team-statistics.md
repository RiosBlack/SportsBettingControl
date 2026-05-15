# Estatísticas de clubes (2026-05-15)

## Resumo

Sincronização incremental de estatísticas por partida/time via API-Football integrada ao fluxo de fixtures, com página de time no estilo PlayerStats.

## Alterações

### Banco de dados

- `Match.season` — temporada da partida
- `MatchTeamStatistic` — stats normalizadas + derivadas por time/partida
- `TeamStatsSync` — controle incremental de sync por time/liga/temporada

### Backend

- `lib/actions/team-statistics.ts` — sync, normalização API, métricas derivadas (BTTS, gols por tempo, etc.)
- Hook em `syncFixturesByLeagues` após salvar fixtures do dia
- `GET /api/teams/[teamId]/statistics` — leitura para UI
- `GET /api/teams/statistics/sync` — sync manual

### Frontend

- `/dashboard/teams/[teamId]` — grid horizontal de partidas, sidebar de métricas, filtros
- Links nos cards de fixture e favoritos

## Limitações (fase 1)

- Fonte: API-Football apenas
- xG, xGoT e odds pré-jogo: fase 2
- Limite de ~40 fixtures por execução de sync (proteção de cota)
