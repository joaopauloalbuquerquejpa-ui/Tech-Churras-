/**
 * Seed do açougue de teste para validar o wizard ponta a ponta.
 * Uso: npx tsx src/scripts/seed-acougue-teste.ts
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const EMAIL = 'acougue@techchurras.com.br'
if (!process.env.SEED_ACOUGUE_PASSWORD) throw new Error('SEED_ACOUGUE_PASSWORD não definida no .env')
const PASSWORD: string = process.env.SEED_ACOUGUE_PASSWORD

async function main() {
  // 1. Garante que o usuário do açougue existe
  let user = await prisma.user.findUnique({ where: { email: EMAIL } })
  if (!user) {
    const hashed = await bcrypt.hash(PASSWORD, 12)
    user = await prisma.user.create({
      data: {
        name: 'Açougue Fundador SP',
        email: EMAIL,
        password: hashed,
        role: 'BOUTIQUE',
        onboardingCompleted: true,
      },
    })
    console.log(`✅ Usuário criado: ${EMAIL}`)
  } else {
    console.log(`✅ Usuário já existe: ${EMAIL}`)
  }

  // 2. Garante que o perfil de açougue existe e está aprovado
  let boutique = await prisma.boutique.findUnique({ where: { userId: user.id } })
  if (!boutique) {
    boutique = await prisma.boutique.create({
      data: {
        userId: user.id,
        name: 'Açougue Fundador SP',
        description: 'Cortes nobres selecionados para os melhores churrascos de São Paulo. Parceiro fundador da Tech Churras.',
        city: 'São Paulo',
        state: 'SP',
        address: 'Av. Paulista, 1000',
        phone: '11970593650',
        approved: true,
        open: true,
        referralCode: 'ACOUGUE001',
        trialEndsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        latitude: -23.5614,
        longitude: -46.6558,
      },
    })
    console.log('✅ Perfil de açougue criado')
  } else if (!boutique.approved) {
    boutique = await prisma.boutique.update({
      where: { id: boutique.id },
      data: { approved: true, open: true, trialEndsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
    })
    console.log('✅ Açougue aprovado')
  } else {
    console.log('✅ Açougue já existe e está aprovado')
  }

  const boutiqueId = boutique.id

  // 3. Limpa produtos e kits antigos para evitar duplicatas
  await prisma.orderItem.deleteMany({ where: { product: { boutiqueId } } })
  await prisma.kitChurrasco.deleteMany({ where: { boutiqueId } })
  await prisma.product.deleteMany({ where: { boutiqueId } })
  console.log('🧹 Produtos e kits anteriores removidos')

  // 4. Cria produtos individuais
  const produtos = await prisma.product.createManyAndReturn({
    data: [
      // Carnes nobres
      { boutiqueId, name: 'Picanha Angus', description: 'Picanha Angus premium, marmoreio alto, peça inteira', price: 94.90, unit: 'kg', category: 'CARNE' },
      { boutiqueId, name: 'Costela Bovina Minga', description: 'Costela minga com osso, ideal para fogo baixo e lento', price: 48.90, unit: 'kg', category: 'CARNE' },
      { boutiqueId, name: 'Fraldinha', description: 'Corte nobre com gordura entremeada, ótima para grelha', price: 72.90, unit: 'kg', category: 'CARNE' },
      { boutiqueId, name: 'Maminha', description: 'Carne macia e suculenta, preferida das famílias paulistanas', price: 62.90, unit: 'kg', category: 'CARNE' },
      { boutiqueId, name: 'Linguiça Artesanal Toscana', description: 'Linguiça de porco artesanal com ervas italianas, produção própria', price: 42.90, unit: 'kg', category: 'CARNE' },
      { boutiqueId, name: 'Frango Inteiro Temperado', description: 'Frango caipira temperado na vinha d\'alho, pronto para grelha', price: 28.90, unit: 'kg', category: 'CARNE' },
      { boutiqueId, name: 'Coração de Frango', description: 'Coração de frango limpo e temperado', price: 22.90, unit: 'kg', category: 'CARNE' },
      { boutiqueId, name: 'Queijo Coalho Premium', description: 'Queijo coalho nordestino firme, ideal para espeto', price: 38.90, unit: 'kg', category: 'CARNE' },
      // Temperos e sal
      { boutiqueId, name: 'Sal Grosso Marinho', description: 'Sal grosso marinho extra, embalagem 2kg', price: 12.90, unit: 'un', category: 'SAL_TEMPERO' },
      { boutiqueId, name: 'Tempero Chimichurri Artesanal', description: 'Blend artesanal de ervas e especiarias para carnes, pote 200g', price: 24.90, unit: 'un', category: 'SAL_TEMPERO' },
      // Carvão
      { boutiqueId, name: 'Carvão Premium 8kg', description: 'Carvão de eucalipto certificado, acendimento rápido e duradouro', price: 42.90, unit: 'un', category: 'CARVAO' },
      // Acompanhamentos
      { boutiqueId, name: 'Farofa Temperada Artesanal', description: 'Farofa de mandioca com bacon e ervas, pote 500g', price: 22.90, unit: 'un', category: 'ACOMPANHAMENTO' },
      { boutiqueId, name: 'Vinagrete Fresco', description: 'Vinagrete preparado na hora com tomate, cebola e pimentão, pote 500ml', price: 18.90, unit: 'un', category: 'ACOMPANHAMENTO' },
    ],
  })
  console.log(`✅ ${produtos.length} produtos criados`)

  // 5. Cria os kits
  const kits = [
    {
      boutiqueId,
      name: 'Kit Família (até 12 pessoas)',
      description: 'Perfeito para reunião de família ou aniversário íntimo. Carnes selecionadas com acompanhamentos artesanais.',
      price: 489.90,
      discountPrice: 449.90,
      minGuests: 6,
      maxGuests: 12,
      items: '2kg Picanha Angus · 1.5kg Costela Bovina · 1kg Linguiça Toscana · 0.5kg Queijo Coalho · Sal Grosso · Farofa Artesanal · Vinagrete',
    },
    {
      boutiqueId,
      name: 'Kit Clássico (até 25 pessoas)',
      description: 'O kit mais completo para churrascos de fim de semana. Combinação equilibrada de carnes nobres e complementos.',
      price: 890.00,
      discountPrice: 820.00,
      minGuests: 13,
      maxGuests: 25,
      items: '3kg Picanha Angus · 2kg Costela Bovina · 1.5kg Fraldinha · 1.5kg Linguiça Toscana · 1kg Frango Temperado · 1kg Queijo Coalho · Sal Grosso · Chimichurri · Farofa · Vinagrete · Carvão 8kg',
    },
    {
      boutiqueId,
      name: 'Kit Gaúcho Premium (até 40 pessoas)',
      description: 'A experiência churrasco completa para grandes eventos. Cortes nobres em abundância, do jeito que o sul ensinou.',
      price: 1590.00,
      discountPrice: 1450.00,
      minGuests: 26,
      maxGuests: 40,
      items: '5kg Picanha Angus · 4kg Costela Bovina · 2kg Fraldinha · 2kg Maminha · 2kg Linguiça Toscana · 1.5kg Frango Temperado · 1kg Coração de Frango · 1.5kg Queijo Coalho · 2× Sal Grosso · Chimichurri · 2× Farofa · 2× Vinagrete · 2× Carvão 8kg',
    },
  ]

  for (const kit of kits) {
    await prisma.kitChurrasco.create({ data: kit })
  }
  console.log(`✅ ${kits.length} kits criados`)

  // 6. Resumo final
  const totalProdutos = await prisma.product.count({ where: { boutiqueId } })
  const totalKits = await prisma.kitChurrasco.count({ where: { boutiqueId } })

  console.log('\n🔥 Açougue de teste pronto para o wizard!')
  console.log(`   Açougue: ${boutique.name} (${boutique.id})`)
  console.log(`   Produtos: ${totalProdutos}`)
  console.log(`   Kits: ${totalKits}`)
  console.log('\n   Faça login em acougue@techchurras.com.br para ver o painel.')
  console.log('   Faça um pedido de teste pelo wizard — o açougue aparecerá na seleção.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
