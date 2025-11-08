# Middleware e NextAuth Simplificados

## 🔄 Mudanças Realizadas

### ✅ Problema Anterior:
- Middleware estava usando `getToken` do NextAuth v4
- Lógica de autenticação duplicada entre `middleware.ts` e `auth.config.ts`
- Conflito entre o callback `authorized` e o middleware
- Rotas de API sendo bloqueadas incorretamente

### ✅ Solução Implementada:

#### 1. **Middleware Simplificado** (`middleware.ts`)
```typescript
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  // Lógica simples de verificação de autenticação
});
```

**Características:**
- ✅ Usa `auth()` do NextAuth v5 (Auth.js)
- ✅ Verifica apenas se o usuário está logado: `!!req.auth`
- ✅ Não interfere com rotas de API
- ✅ Redirecionamentos simples e diretos

#### 2. **NextAuth Config Simplificado** (`auth.config.ts`)
```typescript
export const authConfig = {
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
  callbacks: {
    jwt: // Adiciona dados do usuário ao token
    session: // Adiciona dados do token à sessão
  },
  providers: [
    Credentials({ /* Login com email e senha */ })
  ],
}
```

**Características:**
- ✅ Removido callback `authorized` (lógica movida para middleware)
- ✅ Mantido apenas callbacks essenciais: `jwt` e `session`
- ✅ Provider Credentials com validação bcrypt
- ✅ Sem duplicação de lógica

## 🎯 Fluxo de Autenticação

### 1. **Usuário NÃO logado:**
```
/ → redireciona para /login
/dashboard → redireciona para /login?callbackUrl=/dashboard
/login → permite acesso
/register → permite acesso
```

### 2. **Usuário LOGADO:**
```
/ → redireciona para /dashboard
/login → redireciona para /dashboard
/register → redireciona para /dashboard
/dashboard → permite acesso
/dashboard/* → permite acesso
```

### 3. **Rotas de API:**
```
/api/* → sempre permite acesso (não passa pelo middleware)
```

## 📊 Comparação

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Tamanho do Middleware** | 43.6 kB | 145 kB |
| **Compatibilidade** | NextAuth v4 | NextAuth v5 ✅ |
| **Lógica Duplicada** | Sim ❌ | Não ✅ |
| **Bloqueio de API** | Sim ❌ | Não ✅ |
| **Complexidade** | Alta | Baixa ✅ |

**Nota:** O middleware ficou maior (145 kB) porque agora inclui o Prisma Adapter e bcrypt, mas isso é normal para NextAuth v5 e garante compatibilidade total.

## 🔧 Configuração Necessária na Vercel

Certifique-se de ter estas variáveis de ambiente configuradas:

```env
# NextAuth v5 usa AUTH_SECRET ao invés de NEXTAUTH_SECRET
AUTH_SECRET="sua-chave-gerada-com-openssl-rand-base64-32"
NEXTAUTH_URL="https://bet.drinovacoes.com.br"
DATABASE_URL="postgresql://..."
```

## ✅ Testes Recomendados

1. **Teste de Login:**
   - Acesse `/login`
   - Faça login com credenciais válidas
   - Deve redirecionar para `/dashboard`

2. **Teste de Proteção:**
   - Sem estar logado, tente acessar `/dashboard`
   - Deve redirecionar para `/login?callbackUrl=/dashboard`

3. **Teste de Redirecionamento:**
   - Estando logado, tente acessar `/login`
   - Deve redirecionar para `/dashboard`

4. **Teste de API:**
   - Rotas `/api/*` devem funcionar normalmente
   - Não devem ser bloqueadas pelo middleware

## 🚀 Deploy

```bash
git add .
git commit -m "refactor: simplifica middleware e NextAuth para compatibilidade v5"
git push
```

Após o deploy, verifique os logs da Vercel para confirmar que não há erros.

