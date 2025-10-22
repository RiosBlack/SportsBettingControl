# Configuração NextAuth.js v5 - Autenticação

**Data**: 30/09/2025  
**Tipo**: Nova Feature  
**Autor**: Sistema

## 📝 Descrição
Implementação completa do sistema de autenticação usando NextAuth.js v5 (beta) com suporte a login por credenciais (email/senha) e OAuth (Google).

## 🔧 Arquivos Criados/Modificados

### Configuração NextAuth
1. **auth.config.ts** - Configuração principal do NextAuth
2. **auth.ts** - Exportação dos handlers e funções
3. **middleware.ts** - Proteção de rotas
4. **types/next-auth.d.ts** - Tipos TypeScript customizados

### API Routes
5. **app/api/auth/[...nextauth]/route.ts** - Handlers HTTP do NextAuth

### Server Actions
6. **lib/actions/auth.ts** - Actions de autenticação (login, registro, logout)

### Páginas
7. **app/login/page.tsx** - Página de login
8. **app/login/_components/login-form.tsx** - Formulário de login
9. **app/register/page.tsx** - Página de registro
10. **app/register/_components/register-form.tsx** - Formulário de registro
11. **app/dashboard/page.tsx** - Página protegida do dashboard

### Dependências Instaladas
```json
{
  "dependencies": {
    "next-auth": "^5.0.0-beta.29",
    "@auth/prisma-adapter": "^2.10.0",
    "bcryptjs": "^3.0.2"
  },
  "devDependencies": {
    "@types/bcryptjs": "^3.0.0"
  }
}
```

## 🔐 Funcionalidades Implementadas

### 1. Login por Credenciais
- Login com email e senha
- Validação usando Zod
- Hash de senhas com bcryptjs
- Mensagens de erro amigáveis
- Loading states nos formulários

### 2. Registro de Usuários
- Criação de conta com nome, email e senha
- Validação de senha (confirmação)
- Verificação de email duplicado
- Criação automática de banca padrão
- Login automático após registro

### 3. OAuth (Google)
- Login com Google configurado
- Requer configuração de credenciais OAuth

### 4. Proteção de Rotas
- Middleware protegendo rotas `/dashboard/*`
- Redirecionamento automático de usuários não autenticados
- Redirecionamento de usuários autenticados tentando acessar `/login` ou `/register`

### 5. Sessões
- Sessões baseadas em JWT
- Duração de 30 dias
- Dados do usuário disponíveis via `auth()` server-side
- Dados do usuário disponíveis via `useSession()` client-side

## 🎨 UI/UX

### Design
- Interface moderna e responsiva
- Componentes shadcn/ui
- Gradientes sutis no background
- Ícones lucide-react
- Estados de loading
- Mensagens de erro/sucesso
- Dark mode suportado

### Formulários
- Validação em tempo real
- Feedback visual de erros
- Ícones nos campos
- Botões com estados de loading
- Links de navegação entre login/registro

## 🔑 Variáveis de Ambiente

### Adicionadas ao .env
```env
# NextAuth Configuration
AUTH_SECRET=B416vq3xcNgtjEwv2qCGYmmMeLM+pd63Jr2KpbEzXyA=
AUTH_URL=http://localhost:3000

# OAuth Providers (opcional)
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
```

### Geração do AUTH_SECRET
```bash
openssl rand -base64 32
```

## 🚀 Como Usar

### 1. Criar Conta
```
1. Acesse http://localhost:3000/register
2. Preencha nome, email e senha
3. Clique em "Criar Conta"
4. Será redirecionado para o dashboard automaticamente
```

### 2. Fazer Login
```
1. Acesse http://localhost:3000/login
2. Digite email e senha
3. Clique em "Entrar"
4. Será redirecionado para o dashboard
```

### 3. Usar Autenticação no Código

#### Server Components
```typescript
import { auth } from '@/auth'

export default async function MyPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }
  
  return <div>Olá, {session.user.name}!</div>
}
```

#### Server Actions
```typescript
'use server'
import { auth } from '@/auth'

export async function myAction() {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error('Não autenticado')
  }
  
  // Fazer algo com session.user.id
}
```

#### Client Components (com Provider)
```typescript
'use client'
import { useSession } from 'next-auth/react'

export function MyComponent() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') return <div>Carregando...</div>
  if (!session) return <div>Não autenticado</div>
  
  return <div>Olá, {session.user.name}!</div>
}
```

### 4. Logout
```typescript
import { logout } from '@/lib/actions/auth'

<form action={logout}>
  <Button type="submit">Sair</Button>
</form>
```

## 📊 Fluxo de Autenticação

### Registro
```
1. Usuário preenche formulário
2. Validação Zod (nome, email, senha)
3. Verificação de email duplicado
4. Hash da senha com bcrypt
5. Criação do usuário no banco
6. Criação da banca padrão
7. Login automático
8. Redirecionamento para /dashboard
```

### Login
```
1. Usuário preenche email/senha
2. Validação Zod
3. Busca usuário no banco
4. Verificação da senha com bcrypt
5. Geração do JWT
6. Criação da sessão
7. Redirecionamento para /dashboard
```

### Verificação de Rota
```
1. Middleware intercepta requisição
2. Verifica JWT do usuário
3. Se rota protegida e não autenticado → /login
4. Se rota de auth e já autenticado → /dashboard
5. Caso contrário, permite acesso
```

## 🔒 Segurança

### Implementado
- ✅ Senhas hasheadas com bcrypt (salt rounds: 10)
- ✅ JWT para sessões (não armazena em localStorage)
- ✅ HttpOnly cookies (protege contra XSS)
- ✅ CSRF protection (built-in NextAuth)
- ✅ Validação de inputs com Zod
- ✅ Rate limiting recomendado (implementar futuramente)

### Boas Práticas
- ✅ Senhas nunca retornadas em queries
- ✅ Erro genérico "Credenciais inválidas" (não revela se email existe)
- ✅ Callbacks de autorização customizados
- ✅ Tipos TypeScript para segurança de tipo

## 📁 Estrutura de Arquivos

```
sports-betting-control/
├── auth.config.ts              # Config NextAuth
├── auth.ts                     # Handlers
├── middleware.ts               # Proteção de rotas
├── types/
│   └── next-auth.d.ts          # Tipos customizados
├── lib/
│   └── actions/
│       └── auth.ts             # Server actions
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts    # API route
│   ├── login/
│   │   ├── page.tsx
│   │   └── _components/
│   │       └── login-form.tsx
│   ├── register/
│   │   ├── page.tsx
│   │   └── _components/
│   │       └── register-form.tsx
│   └── dashboard/
│       └── page.tsx            # Rota protegida
```

## 🎯 Rotas

### Públicas
- `/` - Home (pode adicionar landing page)
- `/login` - Login
- `/register` - Registro

### Protegidas (requer autenticação)
- `/dashboard` - Dashboard principal
- `/dashboard/*` - Todas as sub-rotas

### API
- `/api/auth/signin` - POST para login
- `/api/auth/signout` - POST para logout
- `/api/auth/session` - GET para obter sessão
- `/api/auth/providers` - GET para listar providers

## ⏭️ Próximos Passos

1. **Configurar OAuth Google** (opcional)
   - Criar projeto no Google Cloud Console
   - Obter Client ID e Secret
   - Adicionar ao .env

2. **Implementar Reset de Senha**
   - Criar rota /forgot-password
   - Envio de email com token
   - Página de reset

3. **Verificação de Email**
   - Envio de email de confirmação
   - Página de verificação
   - Atualizar `emailVerified` no banco

4. **Rate Limiting**
   - Adicionar middleware de rate limit
   - Prevenir brute force attacks

5. **Two-Factor Authentication**
   - Implementar 2FA opcional
   - QR code para authenticator apps

6. **Logs de Auditoria**
   - Registrar tentativas de login
   - Histórico de sessões
   - Alertas de segurança

## 📌 Observações

- NextAuth v5 está em beta mas é estável
- Compatível com Next.js 15
- Middleware usa Edge Runtime
- Sessions JWT são stateless
- Suporte completo a TypeScript
- Prisma Adapter gerencia tabelas automaticamente

## 🐛 Troubleshooting

### Erro: "Invalid credentials"
- Verificar se o email está correto
- Verificar se a senha foi hasheada
- Conferir se o usuário existe no banco

### Erro: "NEXTAUTH_SECRET must be provided"
- Verificar se AUTH_SECRET está no .env
- Gerar novo secret com `openssl rand -base64 32`

### Redirect não funciona
- Verificar se AUTH_URL está configurado
- Em produção, usar URL completo

### OAuth não funciona
- Verificar credenciais Google
- Conferir redirect URLs no console
- Habilitar APIs necessárias

## 📚 Recursos

- [NextAuth.js v5 Docs](https://authjs.dev)
- [Prisma Adapter](https://authjs.dev/reference/adapter/prisma)
- [NextAuth + Next.js 15](https://authjs.dev/getting-started/installation?framework=next.js)

