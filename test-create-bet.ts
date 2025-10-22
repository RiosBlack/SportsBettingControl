// Script para testar criação de aposta
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testCreateBet() {
  try {
    console.log('🔍 Buscando usuário e banca...')
    
    // Buscar usuário de teste
    const user = await prisma.user.findUnique({
      where: { email: 'teste@teste.com' },
    })

    if (!user) {
      console.error('❌ Usuário não encontrado')
      return
    }

    console.log('✅ Usuário encontrado:', user.id)

    // Buscar banca do usuário
    const bankroll = await prisma.bankroll.findFirst({
      where: { userId: user.id },
    })

    if (!bankroll) {
      console.error('❌ Banca não encontrada')
      return
    }

    console.log('✅ Banca encontrada:', bankroll.id, 'Saldo:', bankroll.currentBalance)

    // Criar aposta de teste
    console.log('\n🎲 Criando aposta...')
    const bet = await prisma.bet.create({
      data: {
        userId: user.id,
        bankrollId: bankroll.id,
        sport: 'FUTEBOL',
        event: 'Corinthians x São Paulo',
        competition: 'Paulistão',
        market: 'Ambas Marcam',
        selection: 'Sim',
        odds: 1.85,
        stake: 50,
        eventDate: new Date('2025-10-15T20:00:00'),
        bookmaker: 'Bet365',
        notes: 'Teste de criação via script',
        tags: ['teste', 'paulistao'],
      },
    })

    console.log('✅ Aposta criada com sucesso!')
    console.log('  ID:', bet.id)
    console.log('  Evento:', bet.event)
    console.log('  Odd:', bet.odds)
    console.log('  Stake:', bet.stake)
    console.log('  Status:', bet.status)

    // Atualizar saldo da banca
    await prisma.bankroll.update({
      where: { id: bankroll.id },
      data: {
        currentBalance: {
          decrement: 50,
        },
      },
    })

    console.log('✅ Saldo da banca atualizado!')

    // Verificar contagem
    const totalBets = await prisma.bet.count()
    console.log(`\n📊 Total de apostas no banco: ${totalBets}`)

  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCreateBet()

