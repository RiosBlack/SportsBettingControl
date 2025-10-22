#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const readline = require('readline')

// Configurar interface de leitura do terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// Função para fazer perguntas no terminal
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim())
    })
  })
}

// Função para validar email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Função para validar senha
function isValidPassword(password) {
  if (password.length < 6) {
    return { valid: false, message: 'A senha deve ter no mínimo 6 caracteres' }
  }
  return { valid: true }
}

// Função principal
async function createUser() {
  console.log('🚀 === CRIADOR DE USUÁRIOS === 🚀\n')
  console.log('Este script irá criar um novo usuário no sistema de apostas esportivas.\n')
  console.log('💡 Dica: Use Ctrl+C para cancelar a qualquer momento.\n')

  try {
    // Inicializar Prisma
    const prisma = new PrismaClient()

    // Coletar dados do usuário
    let name, email, password, confirmPassword

    // Nome
    do {
      name = await askQuestion('📝 Digite o nome completo: ')
      if (!name || name.length < 3) {
        console.log('❌ Nome deve ter no mínimo 3 caracteres\n')
      }
    } while (!name || name.length < 3)

    // Email
    do {
      email = await askQuestion('📧 Digite o email: ')
      if (!email) {
        console.log('❌ Email é obrigatório\n')
      } else if (!isValidEmail(email)) {
        console.log('❌ Email inválido. Use o formato: usuario@exemplo.com\n')
      } else {
        // Verificar se email já existe
        const existingUser = await prisma.user.findUnique({
          where: { email }
        })
        if (existingUser) {
          console.log('❌ Este email já está em uso. Tente outro.\n')
          email = ''
        }
      }
    } while (!email || !isValidEmail(email))

    // Senha
    do {
      password = await askQuestion('🔒 Digite a senha: ')
      const validation = isValidPassword(password)
      if (!validation.valid) {
        console.log(`❌ ${validation.message}\n`)
      }
    } while (!isValidPassword(password).valid)

    // Confirmar senha
    do {
      confirmPassword = await askQuestion('🔒 Confirme a senha: ')
      if (password !== confirmPassword) {
        console.log('❌ As senhas não coincidem. Tente novamente.\n')
      }
    } while (password !== confirmPassword)

    // Perguntar sobre banca inicial
    console.log('\n💰 === CONFIGURAÇÃO DA BANCA ===')
    const createBankroll = await askQuestion('Deseja criar uma banca inicial? (s/n): ')
    
    let initialBalance = 0
    if (createBankroll.toLowerCase() === 's' || createBankroll.toLowerCase() === 'sim') {
      do {
        const balanceInput = await askQuestion('💵 Digite o valor inicial da banca (R$): ')
        const balance = parseFloat(balanceInput.replace(',', '.'))
        
        if (isNaN(balance) || balance < 0) {
          console.log('❌ Valor inválido. Digite um número positivo.\n')
        } else {
          initialBalance = balance
        }
      } while (isNaN(initialBalance) || initialBalance < 0)
    }

    // Confirmar criação
    console.log('\n📋 === RESUMO ===')
    console.log(`Nome: ${name}`)
    console.log(`Email: ${email}`)
    console.log(`Banca inicial: R$ ${initialBalance.toFixed(2)}`)
    
    const confirm = await askQuestion('\n✅ Confirma a criação do usuário? (s/n): ')
    
    if (confirm.toLowerCase() !== 's' && confirm.toLowerCase() !== 'sim') {
      console.log('❌ Operação cancelada.')
      await prisma.$disconnect()
      rl.close()
      return
    }

    // Criar usuário
    console.log('\n🔄 Criando usuário...')
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Criar usuário no banco
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    // Criar banca inicial
    const bankroll = await prisma.bankroll.create({
      data: {
        userId: user.id,
        name: 'Banca Principal',
        initialBalance: initialBalance,
        currentBalance: initialBalance,
      },
    })

    console.log('✅ Usuário criado com sucesso!')
    console.log(`\n📊 === DADOS CRIADOS ===`)
    console.log(`ID do usuário: ${user.id}`)
    console.log(`ID da banca: ${bankroll.id}`)
    console.log(`Saldo inicial: R$ ${initialBalance.toFixed(2)}`)
    
    console.log('\n🎉 === USUÁRIO PRONTO PARA USO ===')
    console.log(`Email: ${email}`)
    console.log(`Senha: ${'*'.repeat(password.length)}`)
    console.log('\nO usuário pode fazer login em: http://localhost:3000/login')

    // Perguntar se quer criar outro usuário
    const createAnother = await askQuestion('\n🔄 Deseja criar outro usuário? (s/n): ')
    
    if (createAnother.toLowerCase() === 's' || createAnother.toLowerCase() === 'sim') {
      console.log('\n' + '='.repeat(50) + '\n')
      await createUser() // Recursão para criar outro usuário
    } else {
      console.log('\n👋 Obrigado por usar o criador de usuários!')
    }

    // Fechar conexões
    await prisma.$disconnect()
    rl.close()

  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error.message)
    rl.close()
    process.exit(1)
  }
}

// Executar script
createUser().catch((error) => {
  console.error('❌ Erro fatal:', error)
  process.exit(1)
})
