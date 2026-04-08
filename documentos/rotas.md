# Rotas do Sistema

O sistema RiosBlack utiliza o **App Router** do Next.js 15 para gerenciar a navegação e o roteamento.

## Rotas Públicas
Rotas acessíveis sem necessidade de autenticação.

- `/login`: Página de autenticação de usuários.
- `/register`: Página de cadastro de novos usuários.

## Rotas Privadas (Protegidas)
Todas as rotas sob o prefixo `/dashboard` requerem autenticação via middleware.

- `/dashboard`: Visão geral (Dashboard), estatísticas rápidas e resumos financeiros.
- `/dashboard/bankrolls`: Gestão de bancas. Permite criar, editar e visualizar múltiplas bancas.
- `/dashboard/bets`: Histórico e gestão de apostas.
- `/dashboard/bets/new`: Formulário para criação de nova aposta manual ou via fixture.
- `/dashboard/fixtures`: Listagem de jogos do dia sincronizados com a API externa.
- `/dashboard/favorites`: Listagem de ligas e times marcados como favoritos pelo usuário.

## Rotas de API (Internal Services)
Endpoints utilizados por componentes Client ou serviços externos.

### Autenticação
- `/api/auth/[...nextauth]`: Handlers do NextAuth v5.

### Jogos e Ligas
- `/api/fixtures`: Listagem de fixtures.
- `/api/fixtures/sync`: Gatilho para sincronização de fixtures com a API-Football.
- `/api/markets`: Endpoints relacionados a mercados de apostas.
- `/api/matches/today`: Retorna os jogos agendados para a data atual.

## Estrutura no Disco
```text
app/
├── (auth)/             # Grupo de rotas de autenticação
│   ├── login/
│   └── register/
├── dashboard/          # Root das rotas privadas
│   ├── bankrolls/
│   ├── bets/
│   ├── favorites/
│   └── fixtures/
└── api/                # Endpoints de API
```
