'use strict'
// Executar com: railway run -- node backend/create_admin.js
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const bcrypt = require('bcryptjs')

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const EMAIL    = 'joaopauloalbuquerque.jpa@gmail.com'
const NAME     = 'João Paulo Albuquerque'
const PASSWORD = 'JotaAdmin@TechChurras2025!'
const PHONE    = '11970593650'

;(async () => {
  console.log('\n🔐 Criando conta admin principal...\n')

  const hash = await bcrypt.hash(PASSWORD, 10)

  const existing = await prisma.user.findUnique({ where: { email: EMAIL } })

  let user
  if (existing) {
    console.log('Conta existente encontrada — atualizando para ADMIN...')
    user = await prisma.user.update({
      where: { email: EMAIL },
      data: { name: NAME, password: hash, role: 'ADMIN', phone: PHONE },
    })
  } else {
    console.log('Criando nova conta...')
    user = await prisma.user.create({
      data: { name: NAME, email: EMAIL, password: hash, role: 'ADMIN', phone: PHONE },
    })
  }

  console.log('\n✅ Conta admin criada/atualizada!\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  Nome:    ', NAME)
  console.log('  Email:   ', EMAIL)
  console.log('  Senha:    JotaAdmin@TechChurras2025!')
  console.log('  Role:     ADMIN (acesso total)')
  console.log('  User ID: ', user.id)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\nAcessos disponíveis:')
  console.log('  /admin              — painel administrativo')
  console.log('  /grillmasters/dashboard — gerenciar churrasqueiros')
  console.log('  /boutiques/dashboard    — gerenciar açougues')
  console.log('  /dashboard              — visão do cliente')
  console.log('\nGuarde essa senha em local seguro!\n')

})().catch(e => { console.error('Erro:', e.message); process.exit(1) })
   .finally(() => prisma.$disconnect())
