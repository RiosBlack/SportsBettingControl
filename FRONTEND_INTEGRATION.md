# 🎨 Guia de Integração Frontend-Backend

## ✅ O que foi integrado

### Dashboard Principal (`/dashboard`)
- ✅ Busca dados reais de estatísticas
- ✅ Lista bancas reais
- ✅ Mostra apostas recentes
- ✅ Calcula ROI, Win Rate e métricas

### Gestão de Bancas (`/dashboard/bankrolls`)
- ✅ Lista todas as bancas
- ✅ Criar nova banca
- ✅ Atualizar saldo (adicionar/subtrair/definir)
- ✅ Ativar/desativar banca
- ✅ Ver estatísticas por banca

### Criar Aposta (`/dashboard/bets/new`)
- ✅ Formulário integrado com server actions
- ✅ Validação de saldo
- ✅ Seleção de banca
- ✅ Todos os campos necessários
- ✅ Toast notifications

### Sistema
- ✅ Autenticação funcionando
- ✅ Proteção de rotas
- ✅ Toast notifications (sonner)
- ✅ Theme provider
- ✅ Validação com Zod

## 📝 Páginas Criadas

1. **`/login`** - Página de login
2. **`/register`** - Página de registro
3. **`/dashboard`** - Dashboard principal com dados reais
4. **`/dashboard/bankrolls`** - Gerenciamento de bancas
5. **`/dashboard/bets/new`** - Criar nova aposta

## 🔜 Próximas Páginas a Criar

### 1. Lista de Apostas (`/dashboard/bets/page.tsx`)

```typescript
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getBets } from '@/lib/actions/bet'
import { BetsList } from './_components/bets-list'

export default async function BetsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const betsResult = await getBets({ limit: 50 })
  const bets = betsResult.data || []

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <h1>Minhas Apostas</h1>
      <BetsList bets={bets} />
    </div>
  )
}
```

### 2. Componente Lista de Apostas (`/dashboard/bets/_components/bets-list.tsx`)

```typescript
'use client'

import { useTransition } from 'react'
import { settleBet, deleteBet } from '@/lib/actions/bet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { BetWithBankroll } from '@/types'

interface BetsListProps {
  bets: BetWithBankroll[]
}

export function BetsList({ bets }: BetsListProps) {
  const [isPending, startTransition] = useTransition()

  const handleSettle = (betId: string, status: 'GANHA' | 'PERDIDA') => {
    startTransition(async () => {
      const result = await settleBet({
        id: betId,
        status,
        result: status === 'GANHA' ? 'WIN' : 'LOSS',
      })

      if (result.success) {
        toast.success(`Aposta finalizada como ${status}`)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Evento</TableHead>
            <TableHead>Mercado</TableHead>
            <TableHead>Odd</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Lucro/Prejuízo</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bets.map((bet) => (
            <TableRow key={bet.id}>
              <TableCell>
                <Badge>{bet.status}</Badge>
              </TableCell>
              <TableCell>{bet.event}</TableCell>
              <TableCell>{bet.market}</TableCell>
              <TableCell>{Number(bet.odds).toFixed(2)}</TableCell>
              <TableCell>R$ {Number(bet.stake).toFixed(2)}</TableCell>
              <TableCell>
                {bet.profit !== null && (
                  <span className={Number(bet.profit) >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {Number(bet.profit) >= 0 ? '+' : ''}R$ {Number(bet.profit).toFixed(2)}
                  </span>
                )}
              </TableCell>
              <TableCell>
                {bet.status === 'PENDENTE' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSettle(bet.id, 'GANHA')}
                      disabled={isPending}
                    >
                      Ganhou
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleSettle(bet.id, 'PERDIDA')}
                      disabled={isPending}
                    >
                      Perdeu
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

### 3. Página de Estatísticas (`/dashboard/stats/page.tsx`)

```typescript
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { 
  getUserStats, 
  getStatsBySport,
  getMonthlyStats 
} from '@/lib/actions/stats'
import { StatsCharts } from './_components/stats-charts'

export default async function StatsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const [stats, sportStats, monthlyStats] = await Promise.all([
    getUserStats(),
    getStatsBySport(),
    getMonthlyStats(),
  ])

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <h1>Estatísticas</h1>
      <StatsCharts 
        stats={stats.data}
        sportStats={sportStats.data}
        monthlyStats={monthlyStats.data}
      />
    </div>
  )
}
```

## 🎯 Padrão de Uso das Server Actions

### Em Server Components
```typescript
// app/dashboard/page.tsx
import { getUserStats } from '@/lib/actions/stats'

export default async function Page() {
  const result = await getUserStats()
  
  return <div>{result.data?.winRate}%</div>
}
```

### Em Client Components
```typescript
'use client'

import { useActionState, useTransition } from 'react'
import { createBet } from '@/lib/actions/bet'
import { toast } from 'sonner'

// Com useActionState (formulários)
export function MyForm() {
  const [state, formAction, pending] = useActionState(
    async (_: any, formData: FormData) => {
      const result = await createBet({
        // ... dados
      })
      
      if (result.success) {
        toast.success('Sucesso!')
      }
      
      return result
    },
    null
  )

  return (
    <form action={formAction}>
      {/* campos */}
      <button disabled={pending}>Enviar</button>
      {state?.error && <p>{state.error}</p>}
    </form>
  )
}

// Com useTransition (botões)
export function MyButton() {
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    startTransition(async () => {
      const result = await settleBet({ id: '...' , status: 'GANHA' })
      
      if (result.success) {
        toast.success('Aposta finalizada!')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <button onClick={handleClick} disabled={isPending}>
      {isPending ? 'Processando...' : 'Finalizar'}
    </button>
  )
}
```

## 📊 Componentes Disponíveis (shadcn/ui)

Todos os componentes estão em `/components/ui/`:

- Button, Input, Label, Textarea
- Card, CardHeader, CardTitle, CardDescription, CardContent
- Dialog, Alert, Badge, Progress
- Table, Select, Tabs
- Toast (via sonner)

## 🎨 Estilização

- **TailwindCSS** para estilos
- **Dark mode** suportado via theme-provider
- **Responsivo** com classes do Tailwind
- **shadcn/ui** para componentes consistentes

## 🔔 Notificações

```typescript
import { toast } from 'sonner'

// Sucesso
toast.success('Operação realizada!')

// Erro
toast.error('Algo deu errado')

// Info
toast.info('Informação importante')

// Loading
const toastId = toast.loading('Processando...')
// ... após conclusão
toast.success('Concluído!', { id: toastId })
```

## 🚀 Como Executar

```bash
# 1. Iniciar banco de dados
docker compose up -d

# 2. Executar migrations (se necessário)
pnpm prisma migrate dev

# 3. Iniciar aplicação
pnpm dev

# 4. Acessar
http://localhost:3000
```

## 📱 Páginas Disponíveis

- `/` - Home (redireciona para login ou dashboard)
- `/login` - Login
- `/register` - Registro
- `/dashboard` - Dashboard principal
- `/dashboard/bankrolls` - Gestão de bancas
- `/dashboard/bets/new` - Criar aposta

## ✅ Checklist de Integração

- [x] Autenticação funcionando
- [x] Dashboard com dados reais
- [x] Gestão de bancas
- [x] Criar aposta
- [x] Toast notifications
- [x] Theme provider
- [x] Validação de dados
- [ ] Lista completa de apostas
- [ ] Editar aposta
- [ ] Deletar aposta/banca
- [ ] Página de estatísticas
- [ ] Filtros avançados
- [ ] Exportar dados
- [ ] Gráficos (recharts)

## 🎯 Próximos Passos

1. Criar página de lista de apostas
2. Adicionar filtros (data, esporte, status)
3. Criar página de estatísticas com gráficos
4. Implementar edição de apostas
5. Adicionar deleção com confirmação
6. Criar exportação de dados (CSV)
7. Adicionar gráficos de performance

## 📚 Documentação

- [API_REFERENCE.md](./API_REFERENCE.md) - Referência completa de API
- [changes/api-routes-setup.md](./changes/api-routes-setup.md) - Documentação técnica
- [DOCUMENTATION.md](./DOCUMENTATION.md) - Documentação geral

