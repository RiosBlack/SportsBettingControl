# RiosBlack Sports Betting Control

## 📑 Documentação Detalhada
Para informações específicas sobre cada módulo do sistema, acesse os links abaixo:

- [🏗️ Arquitetura](documentos/arquitetura.md) - Visão técnica e padrões de projeto.
- [🛣️ Rotas](documentos/rotas.md) - Mapeamento de endpoints e páginas.
- [💼 Regras de Negócio](documentos/regras-de-negocio.md) - Lógicas e restrições do sistema.
- [🔐 Segurança](documentos/seguranca.md) - Autenticação e proteção de dados.
- [🛠️ Funções & Server Actions](documentos/funcoes.md) - Lógica de backend e manipulação de dados.
- [🔌 Integrações & APIs](documentos/integracoes.md) - Serviços externos e persistência.
- [📚 Bibliotecas](documentos/bibliotecas.md) - Stack de dependências e ferramentas.

---

## 🚀 Resumo do Projeto
Sistema profissional de gestão e controle de apostas esportivas desenvolvido com **Next.js 15**, **Prisma**, e **NextAuth v5**.

### Tech Stack Principal
- **Frontend**: Next.js 15 (App Router), React 19, TailwindCSS.
- **Backend**: Server Actions & API Routes.
- **Database**: PostgreSQL com Prisma ORM.
- **Auth**: NextAuth.js v5.

## 📊 Estrutura de Dados (ERD)
- **User** 1 --- N **Bankroll**
- **User** 1 --- N **Bet**
- **Bankroll** 1 --- N **Bet**
- **Bankroll** 1 --- N **Transaction**
- **League** 1 --- N **Match**
- **Team** 1 --- N **Match** (Home/Away)
- **Match** 1 --- N **MatchTeamStatistic** (por time)
- **Team** 1 --- N **TeamStatsSync**

## ⚙️ Configuração Rápida
1. `pnpm install`
2. Configure o `.env` (DATABASE_URL, AUTH_SECRET, API_FOOTBALL_KEY)
3. `pnpm dlx prisma db push`
4. `pnpm dev`

## 📅 Changelogs
- [2026-05-15 - Sync sob demanda (clique no time)](changelogs/2026-05-15-on-demand-team-sync.md)
- [2026-05-15 - Estatísticas de Clubes](changelogs/2026-05-15-team-statistics.md)
- [2026-04-08 - Design System Documentation](changelogs/2026-04-08-design-system-documentation.md)
- [2026-04-08 - Documentação Detalhada do Sistema](changelogs/2026-04-08-detailed-documentation.md)
- [2026-04-08 - Bug Investigation: Constant DB Queries](changelogs/2026-04-08-bug-investigation-db-queries.md)
