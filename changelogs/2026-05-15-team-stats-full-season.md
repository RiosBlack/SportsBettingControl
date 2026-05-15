# Estatísticas: 10 na tela + temporada no banco (2026-05-15)

## Resumo

Separação entre **exibição** (10 últimos jogos na tabela) e **persistência** (todos os jogos finalizados da temporada da liga selecionada). Select de competições via API-Football (`/leagues?team=&season=`).

## Alterações

### Banco de dados

- `TeamStatsSync.expectedFixtures` — total de jogos FT esperados na temporada
- `TeamStatsSync.seasonComplete` — temporada da liga totalmente sincronizada

### Backend

- `fetchTeamLeaguesFromApi` + `getTeamLeaguesForStats(teamId, season)` — lista competições reais do clube
- `syncTeamStatisticsForTeam` — sync incremental da temporada inteira; `displayMinGames: 10` só para UX; delay entre fixtures; tratamento de 429
- Resposta do sync com `statsCount`, `expectedFixtures`, `seasonComplete`, `warning`

### Frontend

- Tabela fixa em **10 colunas** (últimos jogos)
- Select de liga com contagem de jogos salvos e indicador de temporada completa
- Banner de progresso: `"Salvando temporada: X/Y"`

## Uso

1. Abrir página do time → ligas carregadas da API
2. Selecionar competição → sync da liga; tela mostra 10 últimos do banco
3. Clicar **Sincronizar stats** para continuar backfill até `seasonComplete`
