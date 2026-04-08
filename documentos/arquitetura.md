# Arquitetura do Sistema

O sistema RiosBlack Sports Betting Control utiliza uma arquitetura moderna baseada em Next.js 15, seguindo padrões de desenvolvimento robustos e escaláveis.

## Core Stack
- **Framework**: Next.js 15 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS + Shadcn/UI
- **ORM**: Prisma
- **Banco de Dados**: PostgreSQL
- **Autenticação**: NextAuth.js v5 (Beta)

## Padrões Arquiteturais
O projeto segue uma estrutura organizada por responsabilidades:

### 1. Frontend (App Router)
- Utilizamos o diretório `app/` para definir rotas e layouts.
- Componentes de interface são divididos entre `components/ui` (baseados em Shadcn) e componentes de negócio específicos.
- Uso extensivo de **Server Components** para performance e **Client Components** apenas onde há necessidade de interatividade.

### 2. Camada de Dados (Backend-integrated)
- **Server Actions**: Localizadas em `@/lib/actions`, centralizam a lógica de mutação de dados, garantindo type-safety de ponta a ponta.
- **Validations**: Uso de Zod em `@/lib/validations` para garantir a integridade dos dados antes do processamento.
- **Prisma Client**: Instância única gerenciada em `@/lib/prisma.ts`.

### 3. Segurança e Middleware
- **Middleware**: Controla o acesso às rotas, protegendo o diretório `/dashboard` e redirecionando usuários não autenticados.
- **NextAuth v5**: Implementação de autenticação baseada em JWT com provedor de credenciais customizado.

## Estrutura de Pastas Geral
```text
├── app/                  # Rotas, Layouts e Páginas (Next.js App Router)
├── components/           # Componentes React reutilizáveis
│   ├── ui/               # Componentes Shadcn (primitivos)
│   └── ...               # Componentes de negócio
├── documentos/           # Documentação técnica detalhada do projeto
├── hooks/                # Custom React Hooks
├── lib/                  # Utilitários, Lógica de Negócio e Configurações
│   ├── actions/          # Server Actions para operações de DB
│   ├── auth/             # Utilitários de autenticação
│   ├── prisma.ts         # Inicialização do Prisma Client
│   ├── types/            # Definições de tipos TypeScript
│   └── validations/      # Schemas Zod para validação
├── prisma/               # Schema e Migrações do Banco de Dados
├── public/               # Ativos estáticos (imagens, ícones)
└── styles/               # Estilos globais (CSS)
```
