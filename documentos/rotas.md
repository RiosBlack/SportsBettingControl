# Rotas do Sistema

O sistema Betting Control utiliza o **App Router** do Next.js 15 para gerenciar a navegação e o roteamento.

## Rotas Públicas
Rotas acessíveis sem necessidade de autenticação.

- `/login`: Página de autenticação de usuários.
- `/register`: Página de cadastro de novos usuários.

## Rotas Privadas (Protegidas)
Todas as rotas sob o prefixo `/dashboard` requerem autenticação via middleware.

- `/dashboard`: Visão geral (Dashboard), estatísticas rápidas e resumos financeiros.
- `/dashboard/bankrolls`: Gestão de bancas. Permite criar, editar e visualizar múltiplas bancas.
- `/dashboard/bets`: Histórico e gestão de apostas.
- `/dashboard/bets/new`: Formulário para criação de nova aposta manual.

## Rotas de API (Internal Services)
Endpoints utilizados por componentes Client ou serviços externos.

### Autenticação
- `/api/auth/[...nextauth]`: Handlers do NextAuth v5.

### Mercados
- `/api/markets`: Endpoints relacionados a mercados de apostas.

## Estrutura no Disco
```text
app/
├── login/
├── register/
├── dashboard/          # Root das rotas privadas
│   ├── bankrolls/
│   └── bets/
└── api/                # Endpoints de API
    ├── auth/
    └── markets/
```
