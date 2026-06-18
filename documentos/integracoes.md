# Integrações e APIs Externas

O sistema Betting Control utiliza PostgreSQL como datastore principal e NextAuth para autenticação.

## 1. PostgreSQL (Datastore)
Camada de persistência via Prisma ORM. Localizado em container Docker para desenvolvimento ou Neon/PostgreSQL em produção.

**Modelos principais:** User, Bankroll, Bet, Transaction, Market.

## 2. NextAuth v5
Autenticação baseada em JWT com provedor de credenciais.

---

## Variáveis de Ambiente Necessárias
- `DATABASE_URL`: String de conexão com o PostgreSQL.
- `AUTH_SECRET`: Chave de criptografia para sessions JWT.
- `AUTH_URL`: URL base da aplicação (ex: `http://localhost:3000`).
