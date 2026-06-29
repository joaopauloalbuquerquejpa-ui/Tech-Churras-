'use strict'
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

;(async () => {
  // Verifica estado atual
  const existing = await prisma.user.findUnique({ where: { email: 'techchurras@gmail.com' }, select: { name: true, email: true, role: true } })
  const teamJota = await prisma.user.findUnique({ where: { email: 'team.jota@techchurras.com.br' }, select: { name: true, email: true, role: true } })

  console.log('techchurras@gmail.com:', JSON.stringify(existing))
  console.log('team.jota@techchurras.com.br:', JSON.stringify(teamJota))

  if (existing && teamJota) {
    // Move conta antiga para temp
    await prisma.user.update({ where: { email: 'techchurras@gmail.com' }, data: { email: 'old.techchurras@temp.invalid' } })
    // Passa email pro Team Jota
    const updated = await prisma.user.update({ where: { email: 'team.jota@techchurras.com.br' }, data: { email: 'techchurras@gmail.com' } })
    console.log('✅ Feito:', updated.name, '→', updated.email)
  } else if (existing && !teamJota) {
    console.log('Team Jota já tem esse email ou foi atualizado antes')
  } else if (!existing && teamJota) {
    // Já foi movido — só atualiza Team Jota
    const updated = await prisma.user.update({ where: { email: 'team.jota@techchurras.com.br' }, data: { email: 'techchurras@gmail.com' } })
    console.log('✅ Feito:', updated.name, '→', updated.email)
  } else {
    // Verifica se Team Jota já tem o email certo
    const tj2 = await prisma.user.findUnique({ where: { email: 'techchurras@gmail.com' }, select: { name: true, email: true, role: true } })
    console.log('Estado atual techchurras@gmail.com:', JSON.stringify(tj2))
  }
})().catch(e => console.error('Erro:', e.message)).finally(() => prisma.$disconnect())
