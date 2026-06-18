# Integrações e APIs Externas

O sistema Betting Control utiliza PostgreSQL como datastore principal e NextAuth para autenticação.

## 1. PostgreSQL (Datastore)
Camada de persistência via Prisma ORM. Localizado em container Docker para desenvolvimento ou Neon/PostgreSQL em produção.

**Modelos principais:** User, Bankroll, Bet, Transaction, Market, SportEvent.

## 2. NextAuth v5
Autenticação baseada em JWT com provedor de credenciais.

## 3. API-Football (primária)
Usada na busca de eventos ao criar apostas de futebol.

- Documentação: https://www.api-football.com/documentation-v3
- Endpoint base: `https://v3.football.api-sports.io`
- Fluxo: `teams?search=` → `fixtures?team=&last=5`
- Variável: `API_FOOTBALL_KEY`

## 4. football-data.org (fallback)
Acionada automaticamente quando a API-Football esgota tokens ou retorna erro de quota.

- Documentação: https://www.football-data.org/documentation/quickstart
- Endpoint base: `https://api.football-data.org/v4`
- Fluxo: `teams?name=` → `teams/{id}/matches?limit=5`
- Variável: `FOOTBALL_DATA_API_TOKEN`

### Regra de persistência
Requisições externas ocorrem **somente durante a busca** no formulário. Ao salvar a aposta, o confronto (times, logos, competição e esporte) é gravado em `SportEvent` e reutilizado em buscas futuras sem nova chamada externa.

---

## Variáveis de Ambiente Necessárias
- `DATABASE_URL`: String de conexão com o PostgreSQL.
- `AUTH_SECRET`: Chave de criptografia para sessions JWT.
- `AUTH_URL`: URL base da aplicação (ex: `http://localhost:3000`).
- `API_FOOTBALL_KEY`: Chave da API-Football (busca de eventos).
- `FOOTBALL_DATA_API_TOKEN`: Token do football-data.org (fallback).
