# 🚀 Quick Start - API

## Server Actions Disponíveis

### 🏦 Bankrolls
\`\`\`typescript
import {
  createBankroll,
  getBankrolls,
  getBankrollById,
  updateBankroll,
  updateBankrollBalance,
  deleteBankroll,
  getActiveBankroll,
} from '@/lib/actions/bankroll'
\`\`\`

### 🎲 Apostas
\`\`\`typescript
import {
  createBet,
  getBets,
  getBetById,
  updateBet,
  settleBet,
  deleteBet,
} from '@/lib/actions/bet'
\`\`\`

### 📊 Estatísticas
\`\`\`typescript
import {
  getUserStats,
  getStatsBySport,
  getMonthlyStats,
  getTopProfitableBets,
  getRecentBets,
  getBankrollStats,
} from '@/lib/actions/stats'
\`\`\`

## Exemplo Rápido

\`\`\`typescript
'use server'

import { createBankroll, createBet, settleBet } from '@/lib/actions'

// 1. Criar banca
const bankroll = await createBankroll({
  name: 'Minha Banca',
  initialBalance: 1000,
})

// 2. Criar aposta
const bet = await createBet({
  bankrollId: bankroll.data!.id,
  sport: 'FUTEBOL',
  event: 'Flamengo x Palmeiras',
  market: 'Resultado Final',
  selection: 'Flamengo',
  odds: 2.5,
  stake: 100,
  eventDate: new Date('2025-10-10'),
})

// 3. Finalizar (após o jogo)
await settleBet({
  id: bet.data!.id,
  status: 'GANHA',
  result: 'WIN',
})
\`\`\`

## Ver mais

- [API_REFERENCE.md](./API_REFERENCE.md) - Referência completa
- [changes/api-routes-setup.md](./changes/api-routes-setup.md) - Documentação detalhada
