# Segurança e Proteção de Dados

A segurança no RiosBlack é implementada seguindo práticas modernas de desenvolvimento web e as diretrizes do Senior Staff Engineer.

## 1. Autenticação (NextAuth v5)
Utilizamos a versão mais recente do **NextAuth.js (Auth.js v5)**.
- **Estratégia**: JSON Web Tokens (JWT) para stateless sessions.
- **Provider**: `Credentials` (E-mail e Senha).
- **Session Lifespan**: 30 dias por padrão.
- **Criptografia**: Passwords são hasheadas utilizando `bcryptjs` antes da persistência.

## 2. Proteção de Rotas (Middleware)
O arquivo `@/middleware.ts` intercepta todas as requisições ao sistema:
- **Matcher**: Protege todas as rotas exceto assets estáticos, `api/auth`, e rotas de login/register.
- **Redirecionamento**: Usuários não autenticados tentando acessar o `/dashboard` são redirecionados para `/login`.

## 3. Validação de Dados (Zod)
Camadas de validação profundas utilizando Zod em `@/lib/validations`:
- Todas as **Server Actions** validam o input do usuário no servidor antes de interagir com o Prisma.
- Formulários no Frontend (React Hook Form + Resolvers) dão feedback imediato ao usuário.

## 4. Proteção contra SQL Injection (Prisma)
- O uso do Prisma ORM nativamente parametriza todas as queries, eliminando riscos de SQL Injection comuns em queries manuais de string.

## 5. Variáveis de Ambiente
- Informações sensíveis (Secrets, URLs de DB) nunca são expostas no código client-side.
- Arquivo `.env` está no `.gitignore`.

## 6. Segurança de Cabeçalhos (Planejado)
- Implementação futura de CSP (Content Security Policy) e cabeçalhos de segurança via `next.config`.
