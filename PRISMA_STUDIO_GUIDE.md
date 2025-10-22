# 📊 Guia Prisma Studio

## Como Abrir o Prisma Studio

### Opção 1: Comando Direto
```bash
pnpm prisma studio
```

### Opção 2: Com Porta Específica
```bash
pnpm prisma studio --port 5555
```

O Prisma Studio abrirá em: **http://localhost:5555**

## ✅ Dados de Teste Criados

Criamos dados de teste para você:

### 👤 Usuário
- **Email**: teste@teste.com
- **Senha**: senha123

### 🏦 Banca
- **Nome**: Banca de Teste
- **Saldo**: R$ 1.000,00

### 🎲 Aposta
- **Evento**: Flamengo x Palmeiras
- **Esporte**: Futebol
- **Odd**: 2.50
- **Valor**: R$ 100,00
- **Status**: PENDENTE

## 🚀 Como Testar a Aplicação

### 1. Iniciar o Servidor
```bash
pnpm dev
```

### 2. Fazer Login
- Acesse: http://localhost:3000/login
- Email: `teste@teste.com`
- Senha: `senha123`

### 3. Ver o Dashboard
Após login, você verá:
- ✅ Saldo total: R$ 1.000,00
- ✅ 1 banca
- ✅ 1 aposta pendente
- ✅ Estatísticas

## 🔄 Criando Novos Dados

### Via Interface (Recomendado)
1. Faça login na aplicação
2. Vá em "Minhas Bancas" → "Nova Banca"
3. Vá em "Nova Aposta" para criar apostas

### Via Prisma Studio
1. Abra: `pnpm prisma studio`
2. Clique na tabela desejada (users, bankrolls, bets)
3. Clique em "Add record"
4. Preencha os campos
5. Clique em "Save 1 change"

## 🗑️ Limpar Dados de Teste

Se quiser começar do zero:

```bash
# Resetar banco (CUIDADO: apaga tudo!)
pnpm prisma migrate reset

# Ou deletar apenas os dados de teste via SQL
docker compose exec postgres psql -U betting_user -d sports_betting -c "
DELETE FROM bets WHERE \"userId\" = 'cmg6vf0170000xnx9dgp2isq3';
DELETE FROM bankrolls WHERE \"userId\" = 'cmg6vf0170000xnx9dgp2isq3';
DELETE FROM users WHERE email = 'teste@teste.com';
"
```

## 📊 Verificar Dados via SQL

```bash
# Contar registros
docker compose exec postgres psql -U betting_user -d sports_betting -c "
SELECT 
  (SELECT COUNT(*) FROM users) as usuarios,
  (SELECT COUNT(*) FROM bankrolls) as bancas,
  (SELECT COUNT(*) FROM bets) as apostas;
"

# Ver todos os usuários
docker compose exec postgres psql -U betting_user -d sports_betting -c "
SELECT id, name, email, \"createdAt\" FROM users;
"

# Ver todas as bancas
docker compose exec postgres psql -U betting_user -d sports_betting -c "
SELECT id, name, \"initialBalance\", \"currentBalance\" FROM bankrolls;
"

# Ver todas as apostas
docker compose exec postgres psql -U betting_user -d sports_betting -c "
SELECT id, event, sport, odds, stake, status FROM bets;
"
```

## ⚠️ Troubleshooting

### Prisma Studio não abre?
```bash
# Verificar se a porta 5555 está em uso
lsof -ti:5555 | xargs kill -9

# Tentar novamente
pnpm prisma studio
```

### Dados não aparecem?
1. Verifique se o banco está rodando: `docker compose ps`
2. Verifique a conexão: `pnpm prisma db pull`
3. Regenere o client: `pnpm prisma generate`

### Erro de conexão?
1. Verifique o arquivo `.env`
2. Confirme que DATABASE_URL está correto
3. Teste a conexão: `docker compose exec postgres psql -U betting_user -d sports_betting -c "SELECT 1;"`

## 🎯 Comandos Úteis

```bash
# Abrir Prisma Studio
pnpm prisma studio

# Ver schema do banco
pnpm prisma db pull

# Aplicar mudanças do schema
pnpm prisma db push

# Criar migration
pnpm prisma migrate dev --name nome_da_migration

# Resetar banco (APAGA TUDO!)
pnpm prisma migrate reset

# Validar schema
pnpm prisma validate

# Formatar schema
pnpm prisma format
```

## 📱 Acessos Rápidos

- **Aplicação**: http://localhost:3000
- **Login**: http://localhost:3000/login
- **Dashboard**: http://localhost:3000/dashboard
- **Prisma Studio**: http://localhost:5555
- **PgAdmin**: http://localhost:5050

## 🔐 Credenciais

### App
- Email: teste@teste.com
- Senha: senha123

### PgAdmin
- Email: admin@admin.com
- Senha: admin

### PostgreSQL
- Host: localhost
- Port: 5432
- Database: sports_betting
- User: betting_user
- Password: betting_password

