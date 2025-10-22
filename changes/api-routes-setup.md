# Configuração de Rotas API e Server Actions

**Data**: 30/09/2025  
**Tipo**: Nova Feature  
**Autor**: Sistema

## 📝 Descrição
Implementação completa de Server Actions e validações para integrar o banco de dados PostgreSQL com o frontend. Sistema completo de CRUD para Bankrolls e Apostas, além de endpoints para estatísticas.

## 🔧 Arquivos Criados

### Validações (Zod Schemas)
1. **lib/validations/bankroll.ts** - Schemas de validação para Bankrolls
2. **lib/validations/bet.ts** - Schemas de validação para Bets

### Server Actions
3. **lib/actions/bankroll.ts** - CRUD de Bankrolls
4. **lib/actions/bet.ts** - CRUD de Apostas
5. **lib/actions/stats.ts** - Estatísticas e relatórios

### Tipos TypeScript
6. **types/index.ts** - Tipos e interfaces do sistema

## 📚 Estrutura das Server Actions

### 🏦 Bankroll Actions (`lib/actions/bankroll.ts`)

#### `createBankroll(data)`
Cria uma nova banca para o usuário.

**Input:**
```typescript
{
  name: string
  initialBalance: number
  currency?: string (default: 'BRL')
}
```

**Output:**
```typescript
{
  success: true
  data: Bankroll
}
```

#### `getBankrolls()`
Retorna todas as bancas do usuário com contagem de apostas.

**Output:**
```typescript
{
  success: true
  data: BankrollWithCount[]
}
```

#### `getBankrollById(id)`
Busca uma banca específica por ID com últimas 10 apostas.

**Input:** `id: string`

**Output:**
```typescript
{
  success: true
  data: BankrollWithBets
}
```

#### `updateBankroll(data)`
Atualiza nome e status (ativo/inativo) de uma banca.

**Input:**
```typescript
{
  id: string
  name?: string
  isActive?: boolean
}
```

#### `updateBankrollBalance(data)`
Atualiza o saldo da banca.

**Input:**
```typescript
{
  id: string
  amount: number
  operation: 'add' | 'subtract' | 'set'
}
```

**Operações:**
- `add` - Adiciona valor ao saldo
- `subtract` - Subtrai valor do saldo (valida se há saldo)
- `set` - Define um valor fixo

#### `deleteBankroll(id)`
Deleta uma banca (só permite se não houver apostas).

**Input:** `id: string`

#### `getActiveBankroll()`
Retorna a banca ativa principal do usuário.

**Output:**
```typescript
{
  success: true
  data: Bankroll
}
```

---

### 🎲 Bet Actions (`lib/actions/bet.ts`)

#### `createBet(data)`
Cria uma nova aposta e desconta da banca.

**Input:**
```typescript
{
  bankrollId: string
  sport: Sport
  event: string
  competition?: string
  market: string
  selection: string
  odds: number
  stake: number
  eventDate: Date
  bookmaker?: string
  notes?: string
  tags?: string[]
}
```

**Validações:**
- Verifica se a banca pertence ao usuário
- Valida se há saldo suficiente
- Desconta o stake automaticamente
- Tudo em uma transação atômica

**Output:**
```typescript
{
  success: true
  data: BetWithBankroll
}
```

#### `getBets(filters?)`
Busca apostas com filtros e paginação.

**Input (todos opcionais):**
```typescript
{
  bankrollId?: string
  sport?: Sport
  status?: BetStatus
  startDate?: Date
  endDate?: Date
  limit?: number (default: 50, max: 100)
  offset?: number (default: 0)
}
```

**Output:**
```typescript
{
  success: true
  data: BetWithBankroll[]
  pagination: {
    total: number
    limit: number
    offset: number
  }
}
```

#### `getBetById(id)`
Busca uma aposta específica.

**Input:** `id: string`

**Output:**
```typescript
{
  success: true
  data: BetWithBankroll
}
```

#### `updateBet(data)`
Atualiza uma aposta (só pendentes).

**Input:**
```typescript
{
  id: string
  sport?: Sport
  event?: string
  competition?: string
  market?: string
  selection?: string
  odds?: number
  stake?: number
  eventDate?: Date
  bookmaker?: string
  notes?: string
  tags?: string[]
}
```

**Restrições:**
- Só permite editar apostas com status `PENDENTE`
- Não permite alterar bankrollId

#### `settleBet(data)`
Finaliza uma aposta (win/loss/void/cashout).

**Input:**
```typescript
{
  id: string
  status: 'GANHA' | 'PERDIDA' | 'ANULADA' | 'CASHOUT'
  result?: BetResult
}
```

**Lógica:**
- `GANHA`: Calcula lucro e adiciona (stake + lucro) à banca
- `PERDIDA`: Registra prejuízo (stake já foi descontado)
- `ANULADA`: Devolve o stake à banca
- `CASHOUT`: Requer cálculo manual do lucro

**Output:**
```typescript
{
  success: true
  data: BetWithBankroll
}
```

#### `deleteBet(id)`
Deleta uma aposta.

**Input:** `id: string`

**Comportamento:**
- Se `PENDENTE`: Devolve stake à banca
- Se finalizada: Apenas deleta (não afeta saldo)

---

### 📊 Stats Actions (`lib/actions/stats.ts`)

#### `getUserStats()`
Estatísticas gerais do usuário.

**Output:**
```typescript
{
  success: true
  data: {
    totalBets: number
    wonBets: number
    lostBets: number
    voidBets: number
    pendingBets: number
    settledBets: number
    totalBankrolls: number
    totalProfit: number
    totalStaked: number
    roi: number (%)
    winRate: number (%)
    avgOdds: number
  }
}
```

#### `getStatsBySport()`
Estatísticas por esporte.

**Output:**
```typescript
{
  success: true
  data: SportStats[]
}
```

Cada esporte retorna:
```typescript
{
  sport: string
  totalBets: number
  won: number
  lost: number
  pending: number
  winRate: number (%)
  totalProfit: number
  totalStaked: number
  roi: number (%)
}
```

#### `getMonthlyStats(year?)`
Estatísticas mensais do ano.

**Input:** `year?: number` (default: ano atual)

**Output:**
```typescript
{
  success: true
  data: MonthlyStats[] // Array de 12 meses
}
```

Cada mês retorna:
```typescript
{
  month: number (1-12)
  totalBets: number
  won: number
  lost: number
  pending: number
  totalProfit: number
  totalStaked: number
  winRate: number (%)
  roi: number (%)
}
```

#### `getTopProfitableBets(limit?)`
Top apostas mais lucrativas.

**Input:** `limit?: number` (default: 10)

**Output:**
```typescript
{
  success: true
  data: BetWithBankroll[]
}
```

#### `getRecentBets(limit?)`
Apostas mais recentes.

**Input:** `limit?: number` (default: 10)

**Output:**
```typescript
{
  success: true
  data: BetWithBankroll[]
}
```

#### `getBankrollStats(bankrollId)`
Estatísticas de uma banca específica.

**Input:** `bankrollId: string`

**Output:**
```typescript
{
  success: true
  data: BankrollStats
}
```

Retorna:
```typescript
{
  bankrollId: string
  bankrollName: string
  initialBalance: number
  currentBalance: number
  profitLoss: number
  profitLossPercentage: number (%)
  totalBets: number
  wonBets: number
  lostBets: number
  pendingBets: number
  settledBets: number
  winRate: number (%)
  totalProfit: number
  totalStaked: number
  roi: number (%)
}
```

---

## 🔐 Segurança e Validação

### Autenticação
✅ Todas as actions verificam autenticação via `auth()`  
✅ Verificam se recursos pertencem ao usuário  
✅ Retornam erro se não autenticado

### Validação de Inputs
✅ Todos os inputs validados com Zod  
✅ Tipos fortes com TypeScript  
✅ Mensagens de erro claras

### Integridade de Dados
✅ Transações atômicas para operações críticas  
✅ Validação de saldo antes de criar apostas  
✅ Prevenção de deleção em cascata acidental  
✅ Revalidação automática de páginas

### Validações de Negócio
✅ Stake não pode exceder saldo da banca  
✅ Não permite editar apostas finalizadas  
✅ Não permite deletar bancas com apostas  
✅ Odds mínimo 1.01, máximo 1000  
✅ Valores monetários sempre positivos

---

## 💻 Exemplos de Uso

### Criar uma Banca
```typescript
import { createBankroll } from '@/lib/actions/bankroll'

const result = await createBankroll({
  name: 'Banca Principal',
  initialBalance: 1000,
  currency: 'BRL',
})

if (result.success) {
  console.log('Banca criada:', result.data)
} else {
  console.error(result.error)
}
```

### Criar uma Aposta
```typescript
import { createBet } from '@/lib/actions/bet'

const result = await createBet({
  bankrollId: 'clx...',
  sport: 'FUTEBOL',
  event: 'Flamengo x Palmeiras',
  competition: 'Brasileirão',
  market: 'Resultado Final',
  selection: 'Flamengo',
  odds: 2.5,
  stake: 100,
  eventDate: new Date('2025-10-05'),
  bookmaker: 'Bet365',
  tags: ['brasileirao', 'flamengo'],
})
```

### Finalizar Aposta (Ganhou)
```typescript
import { settleBet } from '@/lib/actions/bet'

const result = await settleBet({
  id: 'clx...',
  status: 'GANHA',
  result: 'WIN',
})

// Automaticamente:
// - Calcula lucro
// - Adiciona ganhos à banca
// - Define settledAt
```

### Buscar Apostas com Filtros
```typescript
import { getBets } from '@/lib/actions/bet'

const result = await getBets({
  sport: 'FUTEBOL',
  status: 'PENDENTE',
  startDate: new Date('2025-01-01'),
  limit: 20,
  offset: 0,
})

if (result.success) {
  console.log(`Total: ${result.pagination?.total}`)
  console.log(`Apostas:`, result.data)
}
```

### Obter Estatísticas
```typescript
import { 
  getUserStats, 
  getStatsBySport,
  getMonthlyStats 
} from '@/lib/actions/stats'

// Estatísticas gerais
const stats = await getUserStats()
console.log(`Win Rate: ${stats.data?.winRate}%`)
console.log(`ROI: ${stats.data?.roi}%`)

// Por esporte
const sportStats = await getStatsBySport()

// Mensais
const monthly = await getMonthlyStats(2025)
```

---

## 🎨 Uso no Frontend

### Em Server Components
```typescript
// app/dashboard/page.tsx
import { getUserStats } from '@/lib/actions/stats'
import { getBankrolls } from '@/lib/actions/bankroll'

export default async function DashboardPage() {
  const [stats, bankrolls] = await Promise.all([
    getUserStats(),
    getBankrolls(),
  ])

  return (
    <div>
      <h1>Win Rate: {stats.data?.winRate}%</h1>
      <BankrollList bankrolls={bankrolls.data} />
    </div>
  )
}
```

### Em Client Components (com useActionState ou useTransition)
```typescript
'use client'

import { useActionState } from 'react'
import { createBankroll } from '@/lib/actions/bankroll'

export function CreateBankrollForm() {
  const [state, dispatch, pending] = useActionState(
    async (_: any, formData: FormData) => {
      const result = await createBankroll({
        name: formData.get('name') as string,
        initialBalance: Number(formData.get('balance')),
      })
      return result
    },
    null
  )

  return (
    <form action={dispatch}>
      <input name="name" placeholder="Nome da banca" />
      <input name="balance" type="number" />
      <button disabled={pending}>Criar</button>
      {state?.error && <p>{state.error}</p>}
    </form>
  )
}
```

### Com useTransition para ações otimistas
```typescript
'use client'

import { useTransition } from 'react'
import { settleBet } from '@/lib/actions/bet'
import { toast } from 'sonner'

export function BetCard({ bet }: { bet: Bet }) {
  const [isPending, startTransition] = useTransition()

  const handleSettle = (status: BetStatus) => {
    startTransition(async () => {
      const result = await settleBet({
        id: bet.id,
        status,
      })

      if (result.success) {
        toast.success('Aposta finalizada!')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div>
      <h3>{bet.event}</h3>
      <button 
        onClick={() => handleSettle('GANHA')}
        disabled={isPending}
      >
        Ganhou
      </button>
      <button 
        onClick={() => handleSettle('PERDIDA')}
        disabled={isPending}
      >
        Perdeu
      </button>
    </div>
  )
}
```

---

## 📦 Tipos TypeScript

Todos os tipos estão disponíveis em `types/index.ts`:

```typescript
import type { 
  Bankroll,
  BankrollWithCount,
  Bet,
  BetWithBankroll,
  UserStats,
  SportStats,
  MonthlyStats,
  BankrollStats,
  ActionResponse,
  PaginatedResponse,
} from '@/types'
```

### ActionResponse
Tipo padrão de retorno:
```typescript
type ActionResponse<T> = 
  | { success: true; data: T; message?: string }
  | { error: string; success?: false }
```

### Enums
```typescript
import { Sport, BetStatus, BetResult } from '@/types'
```

---

## 🔄 Revalidação de Cache

Todas as mutations revalidam automaticamente:

```typescript
revalidatePath('/dashboard')
revalidatePath('/dashboard/bets')
revalidatePath('/dashboard/bankrolls')
```

Isso garante que os dados sempre estejam atualizados após operações.

---

## ⚠️ Tratamento de Erros

Todas as actions seguem o mesmo padrão:

```typescript
try {
  // Validação de autenticação
  // Validação de inputs
  // Operação no banco
  return { success: true, data }
} catch (error: any) {
  console.error('Contexto:', error)
  return { error: error.message || 'Mensagem genérica' }
}
```

No frontend:
```typescript
const result = await createBet(data)

if (result.error) {
  // Tratar erro
  toast.error(result.error)
} else {
  // Sucesso
  toast.success('Aposta criada!')
  console.log(result.data)
}
```

---

## 📊 Métricas Calculadas

### ROI (Return on Investment)
```
ROI = (Lucro Total / Total Apostado) × 100
```

### Win Rate
```
Win Rate = (Apostas Ganhas / Apostas Finalizadas) × 100
```
*Apostas anuladas não contam como finalizadas*

### Lucro/Prejuízo
```
Profit = (Stake × Odds) - Stake  // Se ganhou
Profit = -Stake                   // Se perdeu
```

### Profit/Loss da Banca
```
P/L = Saldo Atual - Saldo Inicial
P/L % = (P/L / Saldo Inicial) × 100
```

---

## ⏭️ Próximos Passos

1. **Criar componentes de UI**
   - Formulários de criação/edição
   - Listas e tabelas
   - Cards de estatísticas
   - Gráficos (recharts)

2. **Implementar páginas**
   - `/dashboard/bankrolls` - Gerenciar bancas
   - `/dashboard/bets` - Gerenciar apostas
   - `/dashboard/bets/new` - Nova aposta
   - `/dashboard/stats` - Estatísticas

3. **Adicionar features**
   - Filtros avançados
   - Exportar para CSV/PDF
   - Gráficos de performance
   - Histórico de transações

4. **Otimizações**
   - Cache de estatísticas
   - Paginação infinita
   - Loading skeletons
   - Optimistic updates

---

## 📚 Resumo

✅ **Server Actions criadas:** 25  
✅ **Validações Zod:** 7 schemas  
✅ **Tipos TypeScript:** 15+ tipos  
✅ **Segurança:** Autenticação em todas as rotas  
✅ **Transações:** Operações atômicas  
✅ **Revalidação:** Cache sempre atualizado  
✅ **Documentação:** Completa com exemplos  

Sistema completo de backend pronto para integração com o frontend! 🚀

