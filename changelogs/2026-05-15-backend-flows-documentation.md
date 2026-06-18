# Documentação: Fluxos de Backend (2026-05-15)

## Resumo

Criado `documentos/fluxos-backend.md` com diagramas Mermaid detalhando todos os fluxos de backend do sistema: SSR, API Routes, Server Actions, PostgreSQL e APIs externas.

## Conteúdo

- Evolução do fluxo de estatísticas de times (limit fixo 10 → dinâmico 10/20/all)
- Sequências completas: carregamento SSR, filtros no cliente, sync sob demanda
- Detalhamento de `processFixtureStatistics` e endpoints API-Football
- Fluxos auxiliares: fixtures, database sync, cron, matches/today
- Mapa de endpoints e modelos Prisma envolvidos

## Referência

- [fluxos-backend.md](../documentos/fluxos-backend.md)
