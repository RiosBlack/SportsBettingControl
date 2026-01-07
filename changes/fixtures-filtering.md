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
  - `fetchFootballFixtures()` garante buscar TODOS os jogos do dia, incluindo finalizados (FT), em andamento (LIVE) e não iniciados (NS)
  - Adicionados comentários explícitos documentando que não há filtro de status
  - `getTodayFixtures()` retorna todos os jogos do dia sem filtro de status no banco de dados
  - A API de futebol retorna todos os jogos quando apenas o parâmetro `date` é fornecido

- **Frontend (`app/dashboard/fixtures/_components/fixtures-list.tsx`)**:
  - Filtro de futebol mantido para retornar todos os jogos, sem restrição de status
  - Comentários adicionados para documentar que todos os jogos são exibidos, incluindo finalizados

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

## Atualização - Garantia de Processamento Completo

### Problema Identificado
- A API retorna 146 jogos, mas apenas alguns apareciam no site
- A função `syncDailyFixtures()` não permitia re-sincronização no mesmo dia

### Soluções Implementadas
- **Backend (`lib/actions/fixtures.ts`)**:
  - Adicionado parâmetro `force` em `syncDailyFixtures()` para permitir re-sincronização forçada
  - Melhorado tratamento de erros em `processFootballFixtures()` com contador de erros
  - Adicionados logs para rastrear quantos jogos foram processados vs. quantos foram retornados pela API
  - Garantia de que TODOS os jogos retornados pela API sejam processados, sem filtros

- **API Route (`app/api/fixtures/sync/route.ts`)**:
  - Adicionado suporte ao parâmetro `?force=true` para forçar sincronização mesmo se já foi feita hoje
  - Permite re-sincronizar quando novos jogos aparecem na API

### Como Usar
- Sincronização normal: `GET /api/fixtures/sync`
- Sincronização forçada: `GET /api/fixtures/sync?force=true`

