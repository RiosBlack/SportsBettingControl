# Integrações e APIs Externas

O sistema RiosBlack se integra com serviços externos para obtenção de dados esportivos em tempo real.

## 1. API-Football (RapidAPI)
A principal fonte de dados para o sistema de gestão de apostas.

- **Versão**: v3
- **Provedor**: API-Sports (RapidAPI)
- **Dados Coletados**:
  - **Leagues**: Campeonatos mundiais filtrados por esporte.
  - **Teams**: Informações sobre clubes (nome, logo, ID).
  - **Fixtures (Matches)**: Jogos programados, horários, estádios e placares em tempo real.
  - **Fixtures Statistics**: Estatísticas por partida (posse, chutes, escanteios, faltas, cartões, etc.) via `/fixtures/statistics`.
  - **Fixtures Events**: Eventos da partida (gols, cartões) via `/fixtures/events` para indicadores derivados.
  - **Teams**: Elenco de times por liga/temporada via `/teams`.
  - **Odds**: Cotações para diversos mercados (pre-match) — planejado.

### Fluxo de Sincronização

#### Estatísticas do time (sob demanda)
1. Usuário clica em um time → `/dashboard/teams/[teamId]`.
2. `getTeamLeaguesForStats()` busca competições do clube via `GET /leagues?team={apiId}&season={year}` e popula o select.
3. `syncTeamStatisticsForTeam()` para a **liga selecionada**:
   - Persiste **todos** os jogos finalizados (FT) da temporada em `Match` + `MatchTeamStatistic` (incremental, até `maxFixturesPerRun` por execução).
   - Prioriza ter **10 jogos** no banco para liberar a UI (`displayMinGames`).
   - `TeamStatsSync.seasonComplete` quando `statsCount >= expectedFixtures`.
4. A tabela exibe sempre os **10 últimos jogos** lidos só do PostgreSQL (`getTeamStatisticsFullTable` com `limit=10`).
5. `POST /api/teams/[teamId]/sync?force=true` continua o backfill (útil após limite 429 da API).
6. Se `seasonComplete` e sync no mesmo dia (`America/Sao_Paulo`), não chama a API novamente.

#### Partidas (fixtures)
- Página Partidas e `GET /api/fixtures` leem somente o PostgreSQL.
- População em lote: botão **Atualizar banco de dados** → `POST /api/database/sync` (usa `FixtureSync` + `syncTeamStatistics` incremental).

#### Cron
- Agendamento Vercel desativado. Rota `GET /api/cron/daily-sync` permanece para invocação manual com `CRON_SECRET`.

## 2. Supabase (Opcional/Futuro)
O diretório `@/lib/supabase` indica uma possível integração para:
- Storage de imagens de perfil ou evidências de apostas.
- Real-time subscriptions caso se deseje notificações push.

## 3. PostgreSQL (Datastore)
Embora interno, é tratado como uma camada de serviço via Prisma ORM. Localizado em um container Docker para desenvolvimento ou no serviço Neon/PostgreSQL em produção.

---

## Variáveis de Ambiente Necessárias
As integrações dependem das seguintes chaves no arquivo `.env`:
- `API_FOOTBALL_KEY`: Chave de acesso à RapidAPI.
- `DATABASE_URL`: String de conexão com o PostgreSQL.
- `AUTH_SECRET`: Chave de criptografia para sessions JWT.
