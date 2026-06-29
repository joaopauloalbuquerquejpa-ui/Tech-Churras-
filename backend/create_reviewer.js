'use strict'
// Cria usuário de teste para o revisor do Google Play Console
// Executar com: railway run -- node backend/create_reviewer.js
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const bcrypt = require('bcryptjs')

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const EMAIL    = 'teste@techchurras.com.br'
const NAME     = 'Google Play Reviewer'
const PASSWORD = 'Teste@2024'

;(async () => {
  console.log('\n👤 Criando usuário de teste para o revisor do Google Play...\n')

  const hash = await bcrypt.hash(PASSWORD, 10)
  const existing = await prisma.user.findUnique({ where: { email: EMAIL } })

  let user
  if (existing) {
    console.log('Usuário já existe — atualizando...')
    user = await prisma.user.update({
      where: { email: EMAIL },
      data: { name: NAME, password: hash, role: 'CUSTOMER' },
    })
  } else {
    user = await prisma.user.create({
      data: { email: EMAIL, name: NAME, password: hash, role: 'CUSTOMER' },
    })
  }

  console.log('✅ Usuário criado com sucesso!')
  console.log(`   ID:    ${user.id}`)
  console.log(`   Email: ${user.email}`)
  console.log(`   Nome:  ${user.name}`)
  console.log(`   Role:  ${user.role}`)
  console.log('\n📋 Credenciais para o Play Console:')
  console.log(`   Email: ${EMAIL}`)
  console.log(`   Senha: ${PASSWORD}`)
  console.log('\n')
  await prisma.$disconnect()
})().catch(async e => {
  console.error('❌ Erro:', e.message)
  await prisma.$disconnect()
  process.exit(1)
})
