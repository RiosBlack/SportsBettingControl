# Fluxos de Backend — Betting Control

Documento de referência dos fluxos de dados no servidor: **requisições HTTP internas** (`/api/*`) e **Server Actions** (`"use server"`).

> **Stack:** Next.js 15 App Router · Prisma · PostgreSQL · NextAuth v5  
> **Última atualização:** 2026-06-18

---

## Visão geral da arquitetura

```mermaid
flowchart TB
  subgraph Cliente["Cliente (Browser)"]
    UI[Componentes React]
  end

  subgraph NextJS["Next.js — Servidor"]
    SSR["Server Components<br/>page.tsx"]
    API["API Routes<br/>app/api/*"]
    SA["Server Actions<br/>lib/actions/*"]
  end

  subgraph Persistência["Persistência"]
    PG[(PostgreSQL<br/>via Prisma)]
  end

  UI -->|navegação| SSR
  UI -->|fetch| API
  UI -->|form actions| SA
  SSR --> SA
  SA --> PG
  API --> PG
```

---

## Módulos principais

| Módulo | Server Actions | Descrição |
|--------|----------------|-----------|
| Autenticação | `auth.ts` | Login, registro, logout |
| Bancas | `bankroll.ts` | CRUD de bancas |
| Transações | `transaction.ts` | Depósitos e saques |
| Apostas | `bet.ts` | CRUD e liquidação de apostas |
| Mercados | `market.ts` | Cadastro de mercados |
| Estatísticas | `stats.ts` | ROI, win rate, gráficos do dashboard |

---

## Fluxo: criar aposta

```mermaid
sequenceDiagram
  participant User as Usuário
  participant Form as CreateBetForm
  participant SA as createBet
  participant DB as PostgreSQL

  User->>Form: Preenche evento, odds, stake
  Form->>SA: Server Action
  SA->>DB: Valida saldo da banca
  SA->>DB: Cria Bet + debita stake
  SA-->>Form: success
  Form-->>User: Redirect /dashboard/bets
```

---

## Mapa de endpoints

| Método | Rota | Autenticação | Função |
|--------|------|--------------|--------|
| * | `/api/auth/[...nextauth]` | Público | NextAuth handlers |
| GET/POST | `/api/markets` | Sessão | Listar/criar mercados |

---

## Modelos de dados

- **User** → **Bankroll** → **Bet**, **Transaction**
- **Market** → **Bet**
- Campos de aposta: `event`, `competition`, `sport`, `odds`, `stake`, `status`, `result`
