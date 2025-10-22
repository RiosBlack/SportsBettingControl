// Script de teste de conexão com banco de dados
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testConnection() {
  try {
    console.log('🔍 Testando conexão com o banco...')
    
    // Testar conexão
    await prisma.$connect()
    console.log('✅ Conectado ao banco de dados!')

    // Verificar tabelas
    const tableCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    console.log('📊 Tabelas no banco:', tableCount)

    // Criar usuário de teste
    console.log('\n🔨 Criando usuário de teste...')
    const hashedPassword = await bcrypt.hash('senha123', 10)
    
    const user = await prisma.user.create({
      data: {
        name: 'Usuário Teste',
        email: 'teste@teste.com',
        password: hashedPassword,
      },
    })
    console.log('✅ Usuário criado:', user.id, user.name, user.email)

    // Criar banca
    console.log('\n🏦 Criando banca de teste...')
    const bankroll = await prisma.bankroll.create({
      data: {
        userId: user.id,
        name: 'Banca de Teste',
        initialBalance: 1000,
        currentBalance: 1000,
      },
    })
    console.log('✅ Banca criada:', bankroll.id, bankroll.name, 'R$', bankroll.currentBalance)

    // Criar aposta
    console.log('\n🎲 Criando aposta de teste...')
    const bet = await prisma.bet.create({
      data: {
        userId: user.id,
        bankrollId: bankroll.id,
        sport: 'FUTEBOL',
        event: 'Flamengo x Palmeiras',
        market: 'Resultado Final',
        selection: 'Flamengo',
        odds: 2.5,
        stake: 100,
        eventDate: new Date(),
      },
    })
    console.log('✅ Aposta criada:', bet.id, bet.event)

    // Contar registros
    console.log('\n📊 Contagem final:')
    const [totalUsers, totalBankrolls, totalBets] = await Promise.all([
      prisma.user.count(),
      prisma.bankroll.count(),
      prisma.bet.count(),
    ])
    console.log(`  - Usuários: ${totalUsers}`)
    console.log(`  - Bancas: ${totalBankrolls}`)
    console.log(`  - Apostas: ${totalBets}`)

    console.log('\n✅ Teste concluído com sucesso!')
    console.log('\n💡 Agora você pode:')
    console.log('  1. Abrir Prisma Studio: pnpm prisma studio')
    console.log('  2. Fazer login no app com: teste@teste.com / senha123')

  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()

