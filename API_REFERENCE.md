# 📚 Referência de API - Sports Betting Control

## 🎯 Índice

- [Bankroll Actions](#-bankroll-actions)
- [Bet Actions](#-bet-actions)
- [Stats Actions](#-stats-actions)
- [Tipos TypeScript](#-tipos-typescript)
- [Validações](#-validações)

---

## 🏦 Bankroll Actions

### `createBankroll(data)`
Cria uma nova banca.

```typescript
import { createBankroll } from '@/lib/actions/bankroll'

const result = await createBankroll({
  name: 'Banca Principal',
  initialBalance: 1000,
  currency: 'BRL', // opcional
})
```

### `getBankrolls()`
Lista todas as bancas do usuário.

```typescript
import { getBankrolls } from '@/lib/actions/bankroll'

const result = await getBankrolls()
// result.data: BankrollWithCount[]
```

### `getBankrollById(id)`
Busca uma banca específica.

```typescript
import { getBankrollById } from '@/lib/actions/bankroll'

const result = await getBankrollById('bankroll_id')
```

### `updateBankroll(data)`
Atualiza uma banca.

```typescript
import { updateBankroll } from '@/lib/actions/bankroll'

const result = await updateBankroll({
  id: 'bankroll_id',
  name: 'Novo Nome',
  isActive: true,
})
```

### `updateBankrollBalance(data)`
Atualiza o saldo da banca.

```typescript
import { updateBankrollBalance } from '@/lib/actions/bankroll'

// Adicionar
await updateBankrollBalance({
  id: 'bankroll_id',
  amount: 500,
  operation: 'add',
})

// Subtrair
await updateBankrollBalance({
  id: 'bankroll_id',
  amount: 200,
  operation: 'subtract',
})

// Definir valor fixo
await updateBankrollBalance({
  id: 'bankroll_id',
  amount: 1000,
  operation: 'set',
})
```

### `deleteBankroll(id)`
Deleta uma banca (só se não houver apostas).

```typescript
import { deleteBankroll } from '@/lib/actions/bankroll'

const result = await deleteBankroll('bankroll_id')
```

### `getActiveBankroll()`
Retorna a banca ativa principal.

```typescript
import { getActiveBankroll } from '@/lib/actions/bankroll'

const result = await getActiveBankroll()
```

---

## 🎲 Bet Actions

### `createBet(data)`
Cria uma nova aposta.

```typescript
import { createBet } from '@/lib/actions/bet'

const result = await createBet({
  bankrollId: 'bankroll_id',
  sport: 'FUTEBOL',
  event: 'Flamengo x Palmeiras',
  competition: 'Brasileirão',
  market: 'Resultado Final',
  selection: 'Flamengo',
  odds: 2.5,
  stake: 100,
  eventDate: new Date('2025-10-05'),
  bookmaker: 'Bet365',
  notes: 'Flamengo jogando em casa',
  tags: ['brasileirao', 'flamengo'],
})
```

### `getBets(filters?)`
Lista apostas com filtros.

```typescript
import { getBets } from '@/lib/actions/bet'

// Todas as apostas
const all = await getBets()

// Com filtros
const filtered = await getBets({
  bankrollId: 'bankroll_id',
  sport: 'FUTEBOL',
  status: 'PENDENTE',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-12-31'),
  limit: 20,
  offset: 0,
})

console.log(filtered.pagination?.total) // Total de apostas
```

### `getBetById(id)`
Busca uma aposta específica.

```typescript
import { getBetById } from '@/lib/actions/bet'

const result = await getBetById('bet_id')
```

### `updateBet(data)`
Atualiza uma aposta pendente.

```typescript
import { updateBet } from '@/lib/actions/bet'

const result = await updateBet({
  id: 'bet_id',
  odds: 2.8,
  notes: 'Odds melhorada',
})
```

### `settleBet(data)`
Finaliza uma aposta.

```typescript
import { settleBet } from '@/lib/actions/bet'

// Aposta ganhou
await settleBet({
  id: 'bet_id',
  status: 'GANHA',
  result: 'WIN',
})

// Aposta perdeu
await settleBet({
  id: 'bet_id',
  status: 'PERDIDA',
  result: 'LOSS',
})

// Aposta anulada
await settleBet({
  id: 'bet_id',
  status: 'ANULADA',
  result: 'VOID',
})
```

### `deleteBet(id)`
Deleta uma aposta.

```typescript
import { deleteBet } from '@/lib/actions/bet'

const result = await deleteBet('bet_id')
```

---

## 📊 Stats Actions

### `getUserStats()`
Estatísticas gerais do usuário.

```typescript
import { getUserStats } from '@/lib/actions/stats'

const result = await getUserStats()

console.log(result.data)
// {
//   totalBets: 150,
//   wonBets: 80,
//   lostBets: 60,
//   voidBets: 2,
//   pendingBets: 8,
//   settledBets: 142,
//   totalBankrolls: 2,
//   totalProfit: 1250.50,
//   totalStaked: 10000,
//   roi: 12.51,
//   winRate: 56.34,
//   avgOdds: 2.15
// }
```

### `getStatsBySport()`
Estatísticas por esporte.

```typescript
import { getStatsBySport } from '@/lib/actions/stats'

const result = await getStatsBySport()
// Array com stats de cada esporte
```

### `getMonthlyStats(year?)`
Estatísticas mensais.

```typescript
import { getMonthlyStats } from '@/lib/actions/stats'

// Ano atual
const thisYear = await getMonthlyStats()

// Ano específico
const last = await getMonthlyStats(2024)

// Retorna array de 12 meses (jan-dez)
```

### `getTopProfitableBets(limit?)`
Top apostas mais lucrativas.

```typescript
import { getTopProfitableBets } from '@/lib/actions/stats'

const top10 = await getTopProfitableBets(10)
```

### `getRecentBets(limit?)`
Apostas mais recentes.

```typescript
import { getRecentBets } from '@/lib/actions/stats'

const recent = await getRecentBets(15)
```

### `getBankrollStats(bankrollId)`
Estatísticas de uma banca.

```typescript
import { getBankrollStats } from '@/lib/actions/stats'

const result = await getBankrollStats('bankroll_id')

console.log(result.data)
// {
//   bankrollId: 'clx...',
//   bankrollName: 'Banca Principal',
//   initialBalance: 1000,
//   currentBalance: 1250.50,
//   profitLoss: 250.50,
//   profitLossPercentage: 25.05,
//   totalBets: 50,
//   wonBets: 28,
//   lostBets: 20,
//   pendingBets: 2,
//   settledBets: 48,
//   winRate: 58.33,
//   totalProfit: 500,
//   totalStaked: 4000,
//   roi: 12.50
// }
```

---

## 🔷 Tipos TypeScript

```typescript
import type {
  // Modelos base
  Bankroll,
  Bet,
  User,
  
  // Com relações
  BankrollWithCount,
  BankrollWithBets,
  BetWithBankroll,
  BetWithRelations,
  
  // Estatísticas
  UserStats,
  SportStats,
  MonthlyStats,
  BankrollStats,
  
  // Responses
  ActionResponse,
  PaginatedResponse,
  
  // Enums
  Sport,
  BetStatus,
  BetResult,
  
  // Utilitários
  Optional,
  DeepPartial,
} from '@/types'
```

### ActionResponse
```typescript
type ActionResponse<T> = 
  | { success: true; data: T; message?: string }
  | { error: string; success?: false }
```

### PaginatedResponse
```typescript
type PaginatedResponse<T> = ActionResponse<T> & {
  pagination?: {
    total: number
    limit: number
    offset: number
  }
}
```

### Enums

#### Sport
```typescript
enum Sport {
  FUTEBOL
  BASQUETE
  TENIS
  VOLEI
  FUTSAL
  HANDEBOL
  BASEBALL
  FUTEBOL_AMERICANO
  HOCKEY
  MMA
  BOXE
  ESPORTS
  OUTROS
}
```

#### BetStatus
```typescript
enum BetStatus {
  PENDENTE  // Aguardando resultado
  GANHA     // Aposta vencedora
  PERDIDA   // Aposta perdida
  ANULADA   // Aposta cancelada/devolvida
  CASHOUT   // Encerrada antecipadamente
}
```

#### BetResult
```typescript
enum BetResult {
  WIN       // Ganhou
  LOSS      // Perdeu
  VOID      // Anulada
  HALF_WIN  // Meia vitória (Asian Handicap)
  HALF_LOSS // Meia derrota (Asian Handicap)
}
```

---

## ✅ Validações

### Bankroll
```typescript
import { CreateBankrollSchema } from '@/lib/validations/bankroll'

const data = CreateBankrollSchema.parse({
  name: 'Banca Principal',
  initialBalance: 1000,
})
```

**Regras:**
- `name`: mínimo 3 caracteres
- `initialBalance`: número positivo, máximo 1.000.000.000
- `currency`: string (default: 'BRL')

### Bet
```typescript
import { CreateBetSchema } from '@/lib/validations/bet'

const data = CreateBetSchema.parse({
  bankrollId: 'clx...',
  sport: 'FUTEBOL',
  event: 'Jogo',
  market: 'Mercado',
  selection: 'Seleção',
  odds: 2.5,
  stake: 100,
  eventDate: new Date(),
})
```

**Regras:**
- `event`: mínimo 3 caracteres
- `market`: mínimo 3 caracteres
- `selection`: mínimo 1 caractere
- `odds`: 1.01 - 1000
- `stake`: positivo, máximo 1.000.000
- `eventDate`: data válida
- `sport`: valor do enum Sport
- `tags`: array de strings (opcional)

---

## 🎨 Exemplos Práticos

### Fluxo Completo de Aposta

```typescript
// 1. Criar banca
const bankroll = await createBankroll({
  name: 'Banca Outubro',
  initialBalance: 1000,
})

// 2. Criar aposta
const bet = await createBet({
  bankrollId: bankroll.data!.id,
  sport: 'FUTEBOL',
  event: 'Flamengo x Corinthians',
  market: 'Ambas Marcam',
  selection: 'Sim',
  odds: 1.85,
  stake: 50,
  eventDate: new Date('2025-10-10'),
})

// 3. Finalizar aposta (após o jogo)
const result = await settleBet({
  id: bet.data!.id,
  status: 'GANHA',
  result: 'WIN',
})

// 4. Ver estatísticas
const stats = await getUserStats()
console.log(`ROI: ${stats.data?.roi}%`)
```

### Dashboard Completo

```typescript
// app/dashboard/page.tsx
import {
  getUserStats,
  getRecentBets,
  getTopProfitableBets,
} from '@/lib/actions/stats'
import { getBankrolls } from '@/lib/actions/bankroll'

export default async function DashboardPage() {
  const [stats, bankrolls, recent, topBets] = await Promise.all([
    getUserStats(),
    getBankrolls(),
    getRecentBets(5),
    getTopProfitableBets(5),
  ])

  return (
    <div>
      <StatsOverview stats={stats.data} />
      <BankrollList bankrolls={bankrolls.data} />
      <RecentBets bets={recent.data} />
      <TopBets bets={topBets.data} />
    </div>
  )
}
```

### Formulário com Validação

```typescript
'use client'

import { useActionState } from 'react'
import { createBet } from '@/lib/actions/bet'
import { toast } from 'sonner'

export function CreateBetForm({ bankrollId }: { bankrollId: string }) {
  const [state, dispatch, pending] = useActionState(
    async (_: any, formData: FormData) => {
      const result = await createBet({
        bankrollId,
        sport: formData.get('sport') as any,
        event: formData.get('event') as string,
        market: formData.get('market') as string,
        selection: formData.get('selection') as string,
        odds: Number(formData.get('odds')),
        stake: Number(formData.get('stake')),
        eventDate: new Date(formData.get('eventDate') as string),
      })

      if (result.success) {
        toast.success('Aposta criada!')
      }

      return result
    },
    null
  )

  return (
    <form action={dispatch}>
      {/* Campos do formulário */}
      <button disabled={pending}>
        {pending ? 'Criando...' : 'Criar Aposta'}
      </button>
      {state?.error && <p className="text-red-500">{state.error}</p>}
    </form>
  )
}
```

---

## 🔒 Segurança

Todas as actions:
✅ Verificam autenticação  
✅ Validam ownership dos recursos  
✅ Validam inputs com Zod  
✅ Usam transações quando necessário  
✅ Revalidam cache automaticamente  

---

## 📖 Documentação Completa

Para mais detalhes, consulte:
- [changes/api-routes-setup.md](./changes/api-routes-setup.md) - Documentação completa
- [DOCUMENTATION.md](./DOCUMENTATION.md) - Documentação geral do projeto

