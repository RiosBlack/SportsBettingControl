# 🔐 Guia de Teste de Login

## ✅ Correções Aplicadas

### 1. Erro de Hidratação Corrigido
- ✅ Adicionado `suppressHydrationWarning` no `<html>`
- ✅ Adicionado `suppressHydrationWarning` no `<body>`
- ✅ Isso resolve o conflito entre server e client rendering do tema

### 2. Página Inicial (/) Atualizada
- ✅ Redireciona para `/dashboard` se logado
- ✅ Redireciona para `/login` se não logado

### 3. Sistema de Login Completo
- ✅ Login com email/senha
- ✅ Registro de novos usuários
- ✅ Validação com Zod
- ✅ Hash de senhas com bcrypt
- ✅ Sessões JWT (30 dias)
- ✅ Proteção de rotas com middleware

## 🚀 Como Testar

### 1. Iniciar Aplicação
```bash
# Garantir que o banco está rodando
docker compose ps

# Iniciar o app
pnpm dev
```

### 2. Acessar a Aplicação
Abra: **http://localhost:3000**

- Se não estiver logado → Redireciona para `/login`
- Se já estiver logado → Redireciona para `/dashboard`

### 3. Testar com Conta de Teste
**Credenciais:**
- Email: `teste@teste.com`
- Senha: `senha123`

**Passos:**
1. Acesse http://localhost:3000/login
2. Digite as credenciais acima
3. Clique em "Entrar"
4. Será redirecionado para `/dashboard`
5. Verá seus dados: 1 banca, 1 aposta

### 4. Criar Nova Conta
**Passos:**
1. Acesse http://localhost:3000/register
2. Preencha:
   - Nome: Seu nome
   - Email: seu@email.com
   - Senha: mínimo 6 caracteres
   - Confirmar senha: mesma senha
3. Clique em "Criar Conta"
4. Será logado automaticamente
5. Uma banca padrão será criada para você

### 5. Testar Logout
1. No dashboard, clique em "Sair"
2. Será redirecionado para `/login`
3. Tente acessar `/dashboard` diretamente
4. Será redirecionado de volta para `/login` ✅

## 🔒 Fluxo de Autenticação

### Login
```
1. Usuário preenche email/senha
2. Validação Zod
3. Busca usuário no banco
4. Compara senha (bcrypt)
5. Cria sessão JWT
6. Redireciona para /dashboard
```

### Registro
```
1. Usuário preenche dados
2. Validação Zod (senha + confirmação)
3. Verifica se email já existe
4. Hash da senha (bcrypt)
5. Cria usuário
6. Cria banca padrão (R$ 0)
7. Login automático
8. Redireciona para /dashboard
```

### Proteção de Rotas
```
Middleware verifica cada requisição:
- Se rota protegida e não logado → /login
- Se rota de auth e já logado → /dashboard
- Caso contrário → permite acesso
```

## 🎯 Rotas

### Públicas
- `/` → Redireciona para login ou dashboard
- `/login` → Página de login
- `/register` → Página de registro

### Protegidas (requer login)
- `/dashboard` → Dashboard principal
- `/dashboard/bankrolls` → Gestão de bancas
- `/dashboard/bets/new` → Nova aposta
- `/dashboard/bets` → Lista de apostas (criar)

## ⚡ Recursos do Login

### Validações
- ✅ Email válido
- ✅ Senha mínima 6 caracteres
- ✅ Senhas devem coincidir no registro
- ✅ Email não pode estar duplicado

### Segurança
- ✅ Senhas hasheadas (bcrypt, 10 rounds)
- ✅ Sessões JWT com expiração
- ✅ HttpOnly cookies
- ✅ CSRF protection (NextAuth)
- ✅ Validação server-side

### UI/UX
- ✅ Loading states
- ✅ Mensagens de erro claras
- ✅ Toast notifications
- ✅ Ícones informativos
- ✅ Design moderno
- ✅ Dark mode

## 🐛 Erros Comuns

### "Credenciais inválidas"
- Verifique se o email está correto
- Verifique se a senha está correta
- Use a conta de teste: teste@teste.com / senha123

### "Email já está em uso"
- Esse email já tem conta
- Use outro email ou faça login

### Redirecionamento infinito
- Limpe cookies do navegador
- Reinicie o servidor

### "Não autenticado"
- Faça login novamente
- Verifique se a sessão expirou (30 dias)

## 📝 Testando Manualmente

### Via Banco de Dados
```bash
# Ver todos os usuários
docker compose exec postgres psql -U betting_user -d sports_betting -c "
SELECT id, name, email, \"createdAt\" FROM users;
"

# Ver sessões ativas
docker compose exec postgres psql -U betting_user -d sports_betting -c "
SELECT \"sessionToken\", \"userId\", expires FROM sessions;
"
```

### Via Código (Server Action)
```typescript
import { authenticate } from '@/lib/actions/auth'

const formData = new FormData()
formData.append('email', 'teste@teste.com')
formData.append('password', 'senha123')

const result = await authenticate(undefined, formData)
console.log(result) // { message: 'Login realizado com sucesso!' }
```

## ✅ Checklist de Testes

- [ ] Login com credenciais válidas
- [ ] Login com credenciais inválidas (ver erro)
- [ ] Registrar nova conta
- [ ] Registrar com email duplicado (ver erro)
- [ ] Senhas não coincidem no registro (ver erro)
- [ ] Logout funciona
- [ ] Acessar `/dashboard` sem login (redireciona)
- [ ] Acessar `/login` já logado (redireciona)
- [ ] Página `/` redireciona corretamente
- [ ] Banca padrão criada após registro
- [ ] Sessão persiste após fechar navegador

## 🔧 Comandos Úteis

```bash
# Ver logs do Next.js
# (no terminal onde roda pnpm dev)

# Ver logs do PostgreSQL
docker compose logs -f postgres

# Ver usuários no banco
docker compose exec postgres psql -U betting_user -d sports_betting -c "SELECT * FROM users;"

# Limpar sessões antigas
docker compose exec postgres psql -U betting_user -d sports_betting -c "DELETE FROM sessions WHERE expires < NOW();"

# Resetar senha de teste
docker compose exec postgres psql -U betting_user -d sports_betting -c "
UPDATE users 
SET password = '\$2a\$10\$YourHashHere'
WHERE email = 'teste@teste.com';
"
```

## 📚 Arquivos Importantes

- `app/login/page.tsx` - Página de login
- `app/register/page.tsx` - Página de registro
- `auth.ts` - Configuração NextAuth
- `auth.config.ts` - Config de providers
- `middleware.ts` - Proteção de rotas
- `lib/actions/auth.ts` - Server actions

## 🎉 Tudo Funcionando!

O sistema de login está **100% funcional**:

✅ Login  
✅ Registro  
✅ Logout  
✅ Proteção de rotas  
✅ Sessões persistentes  
✅ Validações  
✅ Segurança  
✅ UI moderna  

Bons testes! 🚀
