// setup_test_data.js — executar com: railway run -- node setup_test_data.js
'use strict'
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const bcrypt = require('bcryptjs')

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const TEST_EMAILS = [
  'carlos.grill@teste.com', 'roberto.grill@teste.com', 'fernanda.grill@teste.com',
  'premium.acougue@teste.com', 'bomsabor.acougue@teste.com', 'maria.cliente@teste.com',
]

async function cleanup() {
  console.log('\n🧹 Limpando dados de teste anteriores...')
  for (const email of TEST_EMAILS) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) continue
    try {
      if (user.role === 'GRILLMASTER') {
        const gm = await prisma.grillmaster.findUnique({ where: { userId: user.id } })
        if (gm) {
          const orders = await prisma.order.findMany({ where: { grillmasterId: gm.id } })
          for (const o of orders) {
            await prisma.orderItem.deleteMany({ where: { orderId: o.id } })
            await prisma.review.deleteMany({ where: { orderId: o.id } })
            await prisma.message.deleteMany({ where: { orderId: o.id } })
          }
          await prisma.order.deleteMany({ where: { grillmasterId: gm.id } })
          await prisma.grillmaster.delete({ where: { userId: user.id } })
        }
      }
      if (user.role === 'BOUTIQUE') {
        const b = await prisma.boutique.findUnique({ where: { userId: user.id } })
        if (b) {
          const orders = await prisma.order.findMany({ where: { boutiqueId: b.id } })
          for (const o of orders) {
            await prisma.orderItem.deleteMany({ where: { orderId: o.id } })
            await prisma.review.deleteMany({ where: { orderId: o.id } })
            await prisma.message.deleteMany({ where: { orderId: o.id } })
          }
          await prisma.order.deleteMany({ where: { boutiqueId: b.id } })
          await prisma.product.deleteMany({ where: { boutiqueId: b.id } })
          await prisma.boutique.delete({ where: { userId: user.id } })
        }
      }
      if (user.role === 'CUSTOMER') {
        const orders = await prisma.order.findMany({ where: { customerId: user.id } })
        for (const o of orders) {
          await prisma.orderItem.deleteMany({ where: { orderId: o.id } })
          await prisma.review.deleteMany({ where: { orderId: o.id } })
          await prisma.message.deleteMany({ where: { orderId: o.id } })
        }
        await prisma.order.deleteMany({ where: { customerId: user.id } })
        await prisma.address.deleteMany({ where: { userId: user.id } })
      }
      await prisma.user.delete({ where: { id: user.id } })
      console.log(`  ✓ ${email} removido`)
    } catch (e) {
      console.log(`  ⚠ Erro ao remover ${email}:`, e.message)
    }
  }
}

async function main() {
  await cleanup()

  const hash = await bcrypt.hash('123456', 10)
  const results = {}

  // ── GRILLMASTERS ──
  console.log('\n👨‍🍳 Criando Grillmasters...')

  const carlosUser = await prisma.user.create({
    data: { name: 'Carlos Mendes', email: 'carlos.grill@teste.com', password: hash, role: 'GRILLMASTER' }
  })
  const carlosGM = await prisma.grillmaster.create({
    data: {
      userId: carlosUser.id,
      bio: '15 anos de experiência em churrasco gaúcho',
      experience: 15, pricePerHour: 150, available: true,
      city: 'São Paulo', state: 'SP', rating: 5.0,
      approved: true, isChancelado: true,
      specialties: 'Picanha,Costela,Linguiça',
      churrascoStyle: 'Gaúcho', minGuests: 10, maxGuests: 100, bringsEquipment: true,
      totalOrders: 47,
    }
  })
  results.carlosGMId = carlosGM.id
  results.carlosUserId = carlosUser.id
  console.log(`  ✓ Carlos Mendes (Chancelado) — GM ID: ${carlosGM.id}`)

  const robertoUser = await prisma.user.create({
    data: { name: 'Roberto Silva', email: 'roberto.grill@teste.com', password: hash, role: 'GRILLMASTER' }
  })
  const robertoGM = await prisma.grillmaster.create({
    data: {
      userId: robertoUser.id,
      bio: 'Especialista em churrasco mineiro e espetinhos',
      experience: 8, pricePerHour: 120, available: true,
      city: 'São Paulo', state: 'SP', rating: 4.6,
      approved: true, isChancelado: false,
      specialties: 'Espetinho,Frango,Pão de Alho',
      churrascoStyle: 'Espetinho', minGuests: 5, maxGuests: 50, bringsEquipment: false,
      totalOrders: 23,
    }
  })
  results.robertoGMId = robertoGM.id
  console.log(`  ✓ Roberto Silva — GM ID: ${robertoGM.id}`)

  const fernandaUser = await prisma.user.create({
    data: { name: 'Fernanda Costa', email: 'fernanda.grill@teste.com', password: hash, role: 'GRILLMASTER' }
  })
  const fernandaGM = await prisma.grillmaster.create({
    data: {
      userId: fernandaUser.id,
      bio: 'Churrasco premium para eventos corporativos e casamentos',
      experience: 12, pricePerHour: 180, available: true,
      city: 'São Paulo', state: 'SP', rating: 4.8,
      approved: true, isChancelado: false,
      specialties: 'Picanha,Camarão,Vegano',
      churrascoStyle: 'Misto', minGuests: 20, maxGuests: 200, bringsEquipment: true,
      totalOrders: 61,
    }
  })
  results.fernandaGMId = fernandaGM.id
  console.log(`  ✓ Fernanda Costa — GM ID: ${fernandaGM.id}`)

  // ── AÇOUGUES ──
  console.log('\n🥩 Criando Açougues...')

  const premiumUser = await prisma.user.create({
    data: { name: 'Açougue Premium SP', email: 'premium.acougue@teste.com', password: hash, role: 'BOUTIQUE' }
  })
  const premiumBoutique = await prisma.boutique.create({
    data: {
      userId: premiumUser.id,
      name: 'Açougue Premium SP',
      description: 'Carnes selecionadas e produtos premium para o churrasco perfeito',
      city: 'São Paulo', state: 'SP',
      address: 'Av. Paulista, 1000, Bela Vista, São Paulo - SP',
      approved: true, open: true, rating: 4.9,
      referralCode: 'PREMIUM01',
    }
  })
  results.premiumBoutiqueId = premiumBoutique.id
  results.premiumUserId = premiumUser.id
  console.log(`  ✓ Açougue Premium SP — Boutique ID: ${premiumBoutique.id} — referralCode: PREMIUM01`)

  await prisma.product.createMany({ data: [
    { boutiqueId: premiumBoutique.id, name: 'Picanha',              price: 89.90, unit: 'kg', category: 'CARNE',         available: true, stockQuantity: 30 },
    { boutiqueId: premiumBoutique.id, name: 'Costela',              price: 45.90, unit: 'kg', category: 'CARNE',         available: true, stockQuantity: 20 },
    { boutiqueId: premiumBoutique.id, name: 'Linguiça Artesanal',   price: 32.90, unit: 'kg', category: 'CARNE',         available: true, stockQuantity: 15 },
    { boutiqueId: premiumBoutique.id, name: 'Frango (Coxa/Sobrecoxa)', price: 18.90, unit: 'kg', category: 'CARNE',      available: true, stockQuantity: 25 },
    { boutiqueId: premiumBoutique.id, name: 'Pão de Alho',          price: 12.90, unit: 'un', category: 'ACOMPANHAMENTO', available: true, stockQuantity: 50 },
    { boutiqueId: premiumBoutique.id, name: 'Queijo Coalho',        price: 24.90, unit: 'kg', category: 'ACOMPANHAMENTO', available: true, stockQuantity: 10 },
    { boutiqueId: premiumBoutique.id, name: 'Carvão Premium 5kg',   price: 29.90, unit: 'un', category: 'CARVAO',        available: true, stockQuantity: 40 },
    { boutiqueId: premiumBoutique.id, name: 'Sal Grosso 1kg',       price:  8.90, unit: 'un', category: 'SAL_TEMPERO',   available: true, stockQuantity: 30 },
  ]})
  console.log('    ✓ 8 produtos criados para Açougue Premium SP')

  const bomSaborUser = await prisma.user.create({
    data: { name: 'Casa de Carnes Bom Sabor', email: 'bomsabor.acougue@teste.com', password: hash, role: 'BOUTIQUE' }
  })
  const bomSaborBoutique = await prisma.boutique.create({
    data: {
      userId: bomSaborUser.id,
      name: 'Casa de Carnes Bom Sabor',
      description: 'Tradição e qualidade em carnes desde 1990',
      city: 'São Paulo', state: 'SP',
      address: 'Rua Augusta, 500, Consolação, São Paulo - SP',
      approved: true, open: true, rating: 4.6,
      referralCode: 'BOMSABOR1',
    }
  })
  results.bomSaborBoutiqueId = bomSaborBoutique.id
  console.log(`  ✓ Casa de Carnes Bom Sabor — Boutique ID: ${bomSaborBoutique.id} — referralCode: BOMSABOR1`)

  await prisma.product.createMany({ data: [
    { boutiqueId: bomSaborBoutique.id, name: 'Picanha Especial',    price: 79.90, unit: 'kg', category: 'CARNE',         available: true, stockQuantity: 25 },
    { boutiqueId: bomSaborBoutique.id, name: 'Costela Minga',       price: 39.90, unit: 'kg', category: 'CARNE',         available: true, stockQuantity: 18 },
    { boutiqueId: bomSaborBoutique.id, name: 'Alcatra',             price: 55.90, unit: 'kg', category: 'CARNE',         available: true, stockQuantity: 12 },
    { boutiqueId: bomSaborBoutique.id, name: 'Linguiça de Pernil',  price: 28.90, unit: 'kg', category: 'CARNE',         available: true, stockQuantity: 20 },
    { boutiqueId: bomSaborBoutique.id, name: 'Frango Inteiro',      price: 15.90, unit: 'kg', category: 'CARNE',         available: true, stockQuantity: 30 },
    { boutiqueId: bomSaborBoutique.id, name: 'Vinagrete Pronto',    price: 14.90, unit: 'un', category: 'ACOMPANHAMENTO', available: true, stockQuantity: 15 },
    { boutiqueId: bomSaborBoutique.id, name: 'Carvão 3kg',          price: 19.90, unit: 'un', category: 'CARVAO',        available: true, stockQuantity: 50 },
    { boutiqueId: bomSaborBoutique.id, name: 'Tempero Churrasco',   price:  9.90, unit: 'un', category: 'SAL_TEMPERO',   available: true, stockQuantity: 25 },
  ]})
  console.log('    ✓ 8 produtos criados para Casa de Carnes Bom Sabor')

  // ── CLIENTE ──
  console.log('\n👤 Criando cliente de teste...')
  const mariaUser = await prisma.user.create({
    data: { name: 'Maria Cliente', email: 'maria.cliente@teste.com', password: hash, role: 'CUSTOMER' }
  })
  await prisma.address.create({
    data: {
      userId: mariaUser.id,
      label: 'Casa',
      street: 'Rua dos Jardins', number: '150',
      complement: 'Apto 42',
      neighborhood: 'Jardim Paulista',
      city: 'São Paulo', state: 'SP',
      zipCode: '01310100',
      isDefault: true,
    }
  })
  results.mariaUserId = mariaUser.id
  console.log(`  ✓ Maria Cliente — User ID: ${mariaUser.id}`)

  // Salvar IDs para o smoke test
  const fs = require('fs')
  fs.writeFileSync('./test_ids.json', JSON.stringify(results, null, 2))
  console.log('\n💾 IDs salvos em test_ids.json')

  console.log('\n✅ DADOS DE TESTE CRIADOS COM SUCESSO')
  console.log('═══════════════════════════════════════')
  console.log('Credenciais (senha: 123456 para todos):')
  console.log('  GRILLMASTERS:')
  console.log('    carlos.grill@teste.com   (Chancelado, R$150/h)')
  console.log('    roberto.grill@teste.com  (R$120/h)')
  console.log('    fernanda.grill@teste.com (R$180/h)')
  console.log('  AÇOUGUES:')
  console.log('    premium.acougue@teste.com  referralCode: PREMIUM01')
  console.log('    bomsabor.acougue@teste.com referralCode: BOMSABOR1')
  console.log('  CLIENTE:')
  console.log('    maria.cliente@teste.com')
  console.log('  QR Codes:')
  console.log('    https://www.techchurras.com.br/r/PREMIUM01')
  console.log('    https://www.techchurras.com.br/r/BOMSABOR1')
}

main().catch(e => { console.error('ERRO:', e); process.exit(1) }).finally(() => prisma.$disconnect())
