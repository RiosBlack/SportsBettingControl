# 🚀 Guia de Criação de Usuários

Este guia mostra como criar usuários no sistema de apostas esportivas usando o script interativo.

## 📋 Script Disponível

### Script Interativo Completo

```bash
pnpm create-user
```

**Características:**

- ✅ Interface interativa no terminal
- ✅ Validação de email e senha
- ✅ Verificação de email duplicado
- ✅ Configuração de banca inicial
- ✅ Confirmação antes de criar
- ✅ Opção de criar múltiplos usuários
- ✅ Tratamento de erros robusto

## 🎯 Como Usar

1. **Garantir que o banco está rodando:**

```bash
docker compose ps
```

2. **Executar o script:**

```bash
pnpm create-user
```

3. **Seguir as instruções:**

```
🚀 === CRIADOR DE USUÁRIOS === 🚀

Este script irá criar um novo usuário no sistema de apostas esportivas.

💡 Dica: Use Ctrl+C para cancelar a qualquer momento.

📝 Digite o nome completo: João Silva
📧 Digite o email: joao@exemplo.com
🔒 Digite a senha: ********
🔒 Confirme a senha: ********

💰 === CONFIGURAÇÃO DA BANCA ===
Deseja criar uma banca inicial? (s/n): s
💵 Digite o valor inicial da banca (R$): 1000

📋 === RESUMO ===
Nome: João Silva
Email: joao@exemplo.com
Banca inicial: R$ 1000.00

✅ Confirma a criação do usuário? (s/n): s

🔄 Criando usuário...
✅ Usuário criado com sucesso!

📊 === DADOS CRIADOS ===
ID do usuário: clx1234567890
ID da banca: clx0987654321
Saldo inicial: R$ 1000.00

🎉 === USUÁRIO PRONTO PARA USO ===
Email: joao@exemplo.com
Senha: ********

O usuário pode fazer login em: http://localhost:3000/login

🔄 Deseja criar outro usuário? (s/n): n

👋 Obrigado por usar o criador de usuários!
```

## 🔧 Comandos Úteis

### Gerenciamento do Banco

```bash
# Ver dados no Prisma Studio
pnpm db:studio

# Gerar cliente Prisma
pnpm db:generate

# Aplicar mudanças no banco
pnpm db:push

# Criar migração
pnpm db:migrate

# Resetar banco (CUIDADO!)
pnpm db:reset
```

### Docker

```bash
# Iniciar banco
docker compose up -d

# Parar banco
docker compose down

# Ver logs
docker compose logs postgres

# Status dos containers
docker compose ps
```

## 📊 Verificar Usuários Criados

### 1. Via Prisma Studio

```bash
pnpm db:studio
```

Acesse: http://localhost:5555

### 2. Via Terminal

```bash
# Conectar ao banco
docker compose exec postgres psql -U betting_user -d sports_betting

# Listar usuários
SELECT id, name, email, "createdAt" FROM users;

# Listar bancas
SELECT id, name, "initialBalance", "currentBalance" FROM bankrolls;

# Sair
\q
```

## 🛡️ Validações Implementadas

### Email

- ✅ Formato válido (usuario@exemplo.com)
- ✅ Não pode estar vazio
- ✅ Não pode ser duplicado

### Senha

- ✅ Mínimo 6 caracteres
- ✅ Confirmação obrigatória
- ✅ Hash com bcrypt (salt rounds: 10)

### Nome

- ✅ Mínimo 3 caracteres
- ✅ Não pode estar vazio

### Banca

- ✅ Valor numérico positivo
- ✅ Aceita vírgula ou ponto decimal
- ✅ Valor padrão: R$ 0,00

## 🚨 Tratamento de Erros

O script trata os seguintes erros:

- **Email duplicado:** "Este email já está em uso"
- **Email inválido:** "Email inválido. Use o formato: usuario@exemplo.com"
- **Senha curta:** "A senha deve ter no mínimo 6 caracteres"
- **Senhas diferentes:** "As senhas não coincidem"
- **Nome curto:** "Nome deve ter no mínimo 3 caracteres"
- **Valor inválido:** "Valor inválido. Digite um número positivo"
- **Erro de conexão:** Mostra detalhes do erro do banco

## 📝 Exemplo de Uso Completo

```bash
# 1. Garantir que tudo está rodando
docker compose ps
pnpm dev

# 2. Em outro terminal, criar usuário
pnpm create-user

# 3. Fazer login no sistema
# Acessar: http://localhost:3000/login
# Usar as credenciais criadas

# 4. Verificar no Prisma Studio
pnpm db:studio
```

## 🎉 Resultado Final

Após criar um usuário, você terá:

- ✅ **Usuário** no banco de dados
- ✅ **Banca inicial** configurada
- ✅ **Senha** com hash seguro
- ✅ **Acesso** ao sistema via login
- ✅ **Dashboard** funcional

O usuário pode imediatamente:

- Fazer login
- Ver o dashboard
- Criar apostas
- Gerenciar a banca
- Ver estatísticas

---

**💡 Dica:** O script permite criar múltiplos usuários em sequência, ideal para configurar o sistema com vários usuários de teste.
