'use strict'
// railway run -- node backend/ativar_team_jota.js
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const CERT = 'TC-FUNDADOR-001'

;(async () => {
  const gm = await prisma.grillmaster.findFirst({ where: { certificationCode: CERT } })
  if (!gm) { console.error('Team Jota não encontrado'); process.exit(1) }

  // 1. Liga disponibilidade global
  await prisma.grillmaster.update({
    where: { id: gm.id },
    data: { available: true },
  })
  console.log('✅ available = true')

  // 2. Gera todas as datas dos próximos 12 meses
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dates = []
  for (let i = 1; i <= 365; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    d.setUTCHours(12, 0, 0, 0)
    dates.push(d)
  }

  // 3. Upsert em lotes de 50
  let criados = 0
  for (let i = 0; i < dates.length; i += 50) {
    const lote = dates.slice(i, i + 50)
    await Promise.all(lote.map(date =>
      prisma.grillmasterSchedule.upsert({
        where: { grillmasterId_date: { grillmasterId: gm.id, date } },
        update: { available: true },
        create: { grillmasterId: gm.id, date, available: true },
      })
    ))
    criados += lote.length
    process.stdout.write(`\r   ${criados}/365 datas...`)
  }

  console.log('\n✅ 365 dias marcados como disponíveis')
  console.log('\n🔥 Team Jota ATIVO — cobre toda São Paulo pelos próximos 12 meses\n')
})().catch(e => { console.error('Erro:', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
