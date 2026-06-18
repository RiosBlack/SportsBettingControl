# Busca de Eventos com API-Football e football-data.org

## Resumo
Busca de jogos ao digitar o evento na criação de apostas, com fallback automático entre [API-Football](https://www.api-football.com) e [football-data.org](https://www.football-data.org). Após salvar a aposta, o confronto é persistido localmente para evitar novas consultas externas.

## Alterações

### Novo modelo Prisma
- `SportEvent`: confronto (times + logos), competição, esporte e data
- `Bet.sportEventId`: vínculo opcional com evento persistido

### Integrações
- `lib/integrations/api-football.ts` — busca primária por time e últimos jogos
- `lib/integrations/football-data.ts` — fallback quando API-Football esgota tokens
- `lib/integrations/sport-events.ts` — busca local + externa com merge e deduplicação

### UI
- `components/event-search-combobox.tsx` — autocomplete com debounce na criação de apostas
- Preenche automaticamente competição e data ao selecionar um jogo

### Server Actions
- `searchSportEventsAction` — busca apenas durante digitação
- `createBet` — faz upsert do evento selecionado antes de salvar a aposta

### Variáveis de ambiente
- `API_FOOTBALL_KEY`
- `FOOTBALL_DATA_API_TOKEN`

### Migration
- `20260618140000_add_sport_events`
