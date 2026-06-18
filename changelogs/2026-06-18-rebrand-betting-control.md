# Rebrand: Betting Control

## Resumo
Remoção completa do módulo de estatísticas de jogos/API-Football e rebrand do projeto para **Betting Control**, focando exclusivamente em Dashboard + Bancas + Apostas.

## Alterações

### Removido
- 8 modelos Prisma: Team, League, Match, MatchTeamStatistic, TeamStatsSync, FixtureSync, FavoriteLeague, FavoriteTeam
- Páginas: `/dashboard/fixtures`, `/dashboard/favorites`, `/dashboard/teams`, `/dashboard/settings/leagues`
- 8 API routes de sync/stats (fixtures, teams, database/sync, cron)
- Server actions: `fixtures.ts`, `team-statistics.ts`, `database-sync.ts`, `leagues.ts`, `favorites.ts`, `matches.ts`
- Componente `match-combobox.tsx`
- Variáveis de ambiente: `API_FOOTBALL_KEY`, `CRON_SECRET`

### Mantido
- Dashboard, Bancas, Apostas, Nova Aposta
- `lib/actions/stats.ts` (estatísticas de apostas do usuário)
- Modelos: User, Bankroll, Bet, Transaction, Market

### Refatorado
- Formulário de nova aposta: entrada manual de evento/competição
- Sidebar: 4 itens (Dashboard, Bancas, Apostas, Nova Aposta)
- Rebrand visual: "Betting Control" em sidebar, login, register, metadata

### Migration
- `20260618120000_remove_sports_statistics`: DROP das 8 tabelas esportivas

## Arquivos modificados
- [prisma/schema.prisma](prisma/schema.prisma)
- [components/app-sidebar-nav.tsx](components/app-sidebar-nav.tsx)
- [app/dashboard/bets/new/](app/dashboard/bets/new/)
- [AGENTS.md](AGENTS.md)
- Documentação em `documentos/`
