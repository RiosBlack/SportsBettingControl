# Configuração Prisma ORM e Schema de Banco de Dados

**Data**: 30/09/2025  
**Tipo**: Nova Feature  
**Autor**: Sistema

## 📝 Descrição
Implementação do Prisma ORM como camada de acesso ao banco de dados PostgreSQL, incluindo schema completo para autenticação de usuários e gerenciamento de apostas esportivas.

## 🔧 Arquivos Criados/Modificados

### Novos Arquivos
1. **prisma/schema.prisma** - Schema do banco de dados
2. **prisma/migrations/20250930172337_initial_schema/migration.sql** - Migration inicial
3. **lib/prisma.ts** - Cliente Prisma configurado para Next.js

### Dependências Instaladas
```json
{
  "dependencies": {
    "@prisma/client": "^6.16.3"
  },
  "devDependencies": {
    "prisma": "^6.16.3"
  }
}
```

## 🗄️ Estrutura do Banco de Dados

### 📊 Modelos Criados

#### 1. **User** (Usuários e Autenticação)
Tabela principal para autenticação e gerenciamento de usuários.

**Campos:**
- `id` - ID único (CUID)
- `name` - Nome do usuário
- `email` - Email (único)
- `password` - Hash da senha
- `emailVerified` - Data de verificação do email
- `image` - URL da foto do perfil
- `createdAt` / `updatedAt` - Timestamps

**Relacionamentos:**
- Um usuário pode ter múltiplas contas (Account)
- Um usuário pode ter múltiplas sessões (Session)
- Um usuário pode ter múltiplas bancas (Bankroll)
- Um usuário pode ter múltiplas apostas (Bet)

#### 2. **Account** (Contas OAuth)
Suporte para autenticação via provedores externos (Google, GitHub, etc.)

**Campos:**
- Provider, tokens de acesso, refresh tokens
- Relacionado ao modelo User

#### 3. **Session** (Sessões)
Gerenciamento de sessões de usuário para autenticação.

**Campos:**
- Session token (único)
- Data de expiração
- Relacionado ao modelo User

#### 4. **VerificationToken** (Tokens de Verificação)
Tokens para verificação de email e reset de senha.

#### 5. **Bankroll** (Gestão de Banca)
Gerenciamento das bancas/carteiras de apostas.

**Campos:**
- `id` - ID único
- `userId` - Referência ao usuário
- `name` - Nome da banca (padrão: "Banca Principal")
- `initialBalance` - Saldo inicial
- `currentBalance` - Saldo atual
- `currency` - Moeda (padrão: BRL)
- `isActive` - Status ativo/inativo
- `createdAt` / `updatedAt` - Timestamps

**Relacionamentos:**
- Pertence a um usuário (User)
- Pode ter múltiplas apostas (Bet)

#### 6. **Bet** (Apostas)
Registro completo de apostas esportivas.

**Campos Principais:**
- `id` - ID único
- `userId` - Referência ao usuário
- `bankrollId` - Referência à banca
- `sport` - Esporte (enum)
- `event` - Nome do evento
- `competition` - Campeonato/Liga
- `market` - Tipo de mercado
- `selection` - Seleção escolhida
- `odds` - Cotação (Decimal 10,2)
- `stake` - Valor apostado (Decimal 10,2)
- `status` - Status da aposta (enum)
- `result` - Resultado (enum)
- `profit` - Lucro/Prejuízo
- `eventDate` - Data do evento
- `placedAt` - Data da aposta
- `settledAt` - Data de finalização
- `bookmaker` - Casa de apostas
- `notes` - Observações
- `tags` - Tags para categorização (array)

**Relacionamentos:**
- Pertence a um usuário (User)
- Pertence a uma banca (Bankroll)

**Índices:**
- userId, bankrollId, status, sport, eventDate (para queries otimizadas)

### 🏷️ Enums Criados

#### **Sport** (Esportes)
```typescript
FUTEBOL | BASQUETE | TENIS | VOLEI | FUTSAL | HANDEBOL | 
BASEBALL | FUTEBOL_AMERICANO | HOCKEY | MMA | BOXE | ESPORTS | OUTROS
```

#### **BetStatus** (Status da Aposta)
```typescript
PENDENTE | GANHA | PERDIDA | ANULADA | CASHOUT
```

#### **BetResult** (Resultado da Aposta)
```typescript
WIN | LOSS | VOID | HALF_WIN | HALF_LOSS
```

## 🚀 Como Usar

### 1. Importar o Cliente Prisma
```typescript
import { prisma } from '@/lib/prisma'
```

### 2. Exemplos de Uso

#### Criar um usuário
```typescript
const user = await prisma.user.create({
  data: {
    name: 'João Silva',
    email: 'joao@example.com',
    password: hashedPassword, // usar bcrypt
  },
})
```

#### Criar uma banca
```typescript
const bankroll = await prisma.bankroll.create({
  data: {
    userId: user.id,
    name: 'Banca Principal',
    initialBalance: 1000,
    currentBalance: 1000,
  },
})
```

#### Criar uma aposta
```typescript
const bet = await prisma.bet.create({
  data: {
    userId: user.id,
    bankrollId: bankroll.id,
    sport: 'FUTEBOL',
    event: 'Flamengo x Palmeiras',
    competition: 'Brasileirão',
    market: 'Resultado Final',
    selection: 'Flamengo',
    odds: 2.5,
    stake: 100,
    eventDate: new Date('2025-10-01'),
    bookmaker: 'Bet365',
    tags: ['brasileirao', 'flamengo'],
  },
})
```

#### Buscar apostas com filtros
```typescript
const bets = await prisma.bet.findMany({
  where: {
    userId: user.id,
    status: 'PENDENTE',
    sport: 'FUTEBOL',
  },
  include: {
    bankroll: true,
  },
  orderBy: {
    eventDate: 'desc',
  },
})
```

### 3. Comandos Prisma Úteis

```bash
# Gerar cliente após mudanças no schema
pnpm prisma generate

# Criar nova migration
pnpm prisma migrate dev --name nome_da_migration

# Aplicar migrations em produção
pnpm prisma migrate deploy

# Abrir Prisma Studio (GUI para visualizar dados)
pnpm prisma studio

# Resetar banco de dados (CUIDADO!)
pnpm prisma migrate reset

# Validar schema
pnpm prisma validate

# Formatar schema
pnpm prisma format
```

## 📊 Impactos

### ✅ Benefícios
- ORM type-safe com TypeScript
- Migrations automáticas e versionadas
- Schema centralizado e documentado
- Performance otimizada com índices
- Suporte completo para autenticação (Next Auth)
- Relacionamentos bem definidos
- Queries intuitivas e seguras

### 🎯 Funcionalidades Habilitadas
- Sistema de autenticação completo
- Gerenciamento de múltiplas bancas por usuário
- Registro detalhado de apostas
- Categorização por esportes e tags
- Tracking de lucros/prejuízos
- Histórico completo de apostas
- Suporte para OAuth providers

## ⏭️ Próximos Passos

1. **Implementar Autenticação**
   - Instalar e configurar NextAuth.js
   - Criar páginas de login/registro
   - Implementar hash de senhas com bcrypt

2. **Criar API Routes**
   - CRUD de usuários
   - CRUD de bankrolls
   - CRUD de apostas
   - Endpoints de estatísticas

3. **Implementar Validações**
   - Schemas Zod para validação de dados
   - Middlewares de autenticação
   - Regras de negócio

4. **Desenvolver Features**
   - Dashboard com estatísticas
   - Gráficos de performance
   - Filtros avançados
   - Exportação de dados

5. **Seeds (Opcional)**
   - Criar dados de exemplo para desenvolvimento
   - Script de seed para testes

## 🔐 Segurança

- ✅ Senhas devem ser hasheadas com bcrypt antes de salvar
- ✅ Use variáveis de ambiente para DATABASE_URL
- ✅ Implemente rate limiting nas APIs
- ✅ Valide e sanitize todos os inputs
- ✅ Use HTTPS em produção
- ✅ Implemente CORS adequadamente

## 📌 Observações Importantes

1. O Prisma Client é gerado automaticamente após migrations
2. Em desenvolvimento, o cliente é cached globalmente para evitar múltiplas instâncias
3. Todos os relacionamentos usam `onDelete: Cascade` para manter integridade
4. Os campos Decimal são usados para valores monetários (precisão)
5. Timestamps são gerenciados automaticamente pelo Prisma
6. Os índices foram criados nos campos mais consultados para otimização

## 📚 Recursos

- [Documentação Prisma](https://www.prisma.io/docs)
- [Prisma + Next.js](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

