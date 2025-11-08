# 🔐 Solução: Autenticação NextAuth v5 + Supabase

## ❌ Problema Identificado

**Sintoma:**
- Login retorna 200 (sucesso)
- Usuário não é redirecionado para `/dashboard`
- Ao tentar acessar `/dashboard`, retorna 307 (redirect para login)
- Middleware não reconhece a sessão

**Causa Raiz:**
```typescript
// ❌ CONFLITO: PrismaAdapter + JWT strategy
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma), // Tenta criar sessions no banco
  session: {
    strategy: 'jwt', // Mas usa JWT (sem banco)
  },
})
```

Quando você usa `PrismaAdapter` com `strategy: 'jwt'`:
1. NextAuth tenta criar uma session no banco de dados
2. Mas também tenta criar um JWT
3. O cookie pode não ser criado corretamente
4. Middleware não encontra o cookie de sessão

## ✅ Solução Implementada

### 1. **Removido PrismaAdapter**

```typescript
// ✅ CORRETO: Apenas JWT (sem adapter)
import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // Sem adapter - usa apenas JWT
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  cookies: {
    sessionToken: {
      name: `authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
})
```

### 2. **Middleware Verifica Cookie JWT**

```typescript
// Verificar se tem sessão ativa (cookie do NextAuth v5)
const sessionToken = 
  request.cookies.get("authjs.session-token")?.value ||
  request.cookies.get("__Secure-authjs.session-token")?.value ||
  request.cookies.get("next-auth.session-token")?.value ||
  request.cookies.get("__Secure-next-auth.session-token")?.value;

const isLoggedIn = !!sessionToken;
```

### 3. **Autenticação Usa Prisma Diretamente**

```typescript
// auth.config.ts - Provider Credentials
async authorize(credentials) {
  // Busca usuário diretamente no Prisma
  const user = await prisma.user.findUnique({
    where: { email: credentials.email as string },
  });
  
  // Valida senha com bcrypt
  const isPasswordValid = await bcrypt.compare(
    credentials.password as string,
    user.password
  );
  
  // Retorna dados do usuário (vão para o JWT)
  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}
```

## 🎯 Como Funciona Agora

### Fluxo de Login:

```
1. Usuário preenche email/senha
   ↓
2. POST /api/auth/callback/credentials
   ↓
3. NextAuth chama authorize() em auth.config.ts
   ↓
4. Prisma busca usuário no Supabase
   ↓
5. bcrypt valida a senha
   ↓
6. NextAuth cria JWT com dados do usuário
   ↓
7. Cookie "authjs.session-token" é criado
   ↓
8. Middleware detecta o cookie
   ↓
9. Redireciona para /dashboard ✅
```

### Fluxo de Verificação:

```
1. Usuário acessa /dashboard
   ↓
2. Middleware verifica cookie "authjs.session-token"
   ↓
3. Cookie existe? 
   ✅ SIM → Permite acesso
   ❌ NÃO → Redireciona para /login
```

## 📊 Comparação

| Aspecto | Com PrismaAdapter | Sem PrismaAdapter (JWT Puro) |
|---------|-------------------|------------------------------|
| **Sessions no Banco** | ✅ Sim | ❌ Não |
| **JWT** | ⚠️ Conflito | ✅ Funciona |
| **Cookie criado** | ❌ Inconsistente | ✅ Sempre |
| **Middleware** | ❌ Não detecta | ✅ Detecta |
| **Performance** | Mais lento | ⚡ Mais rápido |
| **Escalabilidade** | Limitada | ✅ Melhor |

## 🔧 Configuração Necessária

### Variáveis de Ambiente (Vercel):

```env
# Database - Conexão Direta
DATABASE_URL="postgresql://postgres.iopyfeiaxpbrpvjjuyyr:bru9ztm5TCE@avt6ump@aws-1-us-east-1.pooler.supabase.com:5432/postgres"

# NextAuth
AUTH_SECRET="sua-chave-gerada-com-openssl-rand-base64-32"
NEXTAUTH_URL="https://bet.drinovacoes.com.br"
```

### Tabelas Necessárias no Supabase:

Apenas a tabela `User` é necessária:

```sql
-- Tabela User (já existe)
CREATE TABLE "User" (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  image TEXT,
  "emailVerified" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

**NÃO são mais necessárias:**
- ❌ Tabela `Session`
- ❌ Tabela `Account`
- ❌ Tabela `VerificationToken`

## ✅ Vantagens da Solução

1. **Mais Simples:**
   - Sem tabelas de sessão no banco
   - Menos queries ao banco de dados
   - Configuração mais direta

2. **Mais Rápido:**
   - JWT é stateless (não precisa consultar banco)
   - Middleware verifica apenas cookie
   - Menos latência

3. **Mais Escalável:**
   - Não sobrecarrega o banco com sessions
   - Funciona melhor com Edge Runtime
   - Ideal para Vercel

4. **Compatível com Vercel:**
   - Middleware leve (32.6 kB)
   - Edge Runtime compatível
   - Sem dependências pesadas

## 🚀 Deploy

```bash
git add .
git commit -m "fix: remove PrismaAdapter para usar JWT puro e resolver autenticação"
git push
```

## 🧪 Testes

Após o deploy, teste:

1. **Login:**
   - Acesse `/login`
   - Faça login com credenciais válidas
   - Deve redirecionar para `/dashboard` ✅

2. **Proteção:**
   - Sem login, tente acessar `/dashboard`
   - Deve redirecionar para `/login` ✅

3. **Cookie:**
   - Após login, verifique DevTools → Application → Cookies
   - Deve existir `authjs.session-token` ✅

4. **Logout:**
   - Faça logout
   - Cookie deve ser removido
   - Deve redirecionar para `/login` ✅

## 📝 Notas Importantes

- ✅ JWT é seguro quando bem configurado
- ✅ Cookie é httpOnly (não acessível por JavaScript)
- ✅ Cookie é signed com AUTH_SECRET
- ✅ Expira em 30 dias (configurável)
- ✅ Funciona em produção com HTTPS (`secure: true`)

## 🔗 Referências

- [NextAuth v5 JWT Strategy](https://authjs.dev/concepts/session-strategies#jwt-session)
- [NextAuth without Database](https://authjs.dev/getting-started/adapters#oauth-without-database)
- [Vercel Edge Runtime](https://vercel.com/docs/functions/edge-functions)

