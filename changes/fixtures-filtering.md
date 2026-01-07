# Filtros de Jogos - NBA e Futebol

## Data
2025-01-07

## Mudanças Implementadas

### 1. Filtro de Basquete - Apenas NBA
- **Backend (`lib/actions/fixtures.ts`)**:
  - Modificado `fetchBasketballGames()` para buscar apenas jogos da NBA usando o parâmetro `league=12` na API
  - Adicionado filtro adicional em `processBasketballGames()` para garantir que apenas jogos da NBA sejam processados (league.id === 12)
  
- **Frontend (`app/dashboard/fixtures/_components/fixtures-list.tsx`)**:
  - Atualizado filtro de basquete para mostrar apenas jogos da NBA (league.apiId === 12)
  - Garantia de que mesmo dados antigos no banco sejam filtrados corretamente

- **Estatísticas (`app/dashboard/fixtures/page.tsx`)**:
  - Atualizada contagem de basquete para considerar apenas jogos da NBA

### 2. Futebol - Todos os Jogos do Dia
- **Backend (`lib/actions/fixtures.ts`)**:
  - `getTodayFixtures()` já retorna todos os jogos do dia sem filtro de status
  - A API de futebol (`fetchFootballFixtures()`) já retorna todos os jogos do dia, incluindo finalizados

- **Frontend (`app/dashboard/fixtures/_components/fixtures-list.tsx`)**:
  - Filtro de futebol mantido para retornar todos os jogos, sem restrição de status

## Detalhes Técnicos

### NBA League ID
- **ID da Liga NBA**: 12
- **API Utilizada**: `https://v1.basketball.api-sports.io/games`
- **Parâmetro**: `league=12`

### API de Futebol
- **Endpoint**: `https://v3.football.api-sports.io/fixtures`
- **Parâmetro**: `date=YYYY-MM-DD`
- **Retorno**: Todos os jogos do dia, independente do status (NS, LIVE, FT, etc.)

## Impacto

- **Basquete**: Agora mostra apenas jogos da NBA, reduzindo ruído de outras ligas
- **Futebol**: Continua mostrando todos os jogos do dia, incluindo os que já foram finalizados
- **Performance**: Redução no volume de dados de basquete processados e armazenados

