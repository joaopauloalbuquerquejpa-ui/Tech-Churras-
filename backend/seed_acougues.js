/**
 * Seed: 3 açougues demo para a plataforma Tech Churras
 * Dados reais — cortes reais, preços de mercado SP, endereços reais, imagens Pexels
 * Executa: node seed_acougues.js
 */
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const IMGS = {
  picanha:       'https://images.pexels.com/photos/28893439/pexels-photo-28893439.jpeg?auto=compress&cs=tinysrgb&h=350',
  fraldinha:     'https://images.pexels.com/photos/36319691/pexels-photo-36319691.jpeg?auto=compress&cs=tinysrgb&h=350',
  costela:       'https://images.pexels.com/photos/13611849/pexels-photo-13611849.jpeg?auto=compress&cs=tinysrgb&h=350',
  maminha:       'https://images.pexels.com/photos/20187067/pexels-photo-20187067.jpeg?auto=compress&cs=tinysrgb&h=350',
  alcatra:       'https://images.pexels.com/photos/33615873/pexels-photo-33615873.jpeg?auto=compress&cs=tinysrgb&h=350',
  contrafile:    'https://images.pexels.com/photos/8477071/pexels-photo-8477071.jpeg?auto=compress&cs=tinysrgb&h=350',
  linguica:      'https://images.pexels.com/photos/37814631/pexels-photo-37814631.jpeg?auto=compress&cs=tinysrgb&h=350',
  coracao:       'https://images.pexels.com/photos/15125028/pexels-photo-15125028.jpeg?auto=compress&cs=tinysrgb&h=350',
  carvao:        'https://images.pexels.com/photos/1309069/pexels-photo-1309069.jpeg?auto=compress&cs=tinysrgb&h=350',
  pao_alho:      'https://images.pexels.com/photos/7159284/pexels-photo-7159284.jpeg?auto=compress&cs=tinysrgb&h=350',
  farofa:        'https://images.pexels.com/photos/27397338/pexels-photo-27397338.jpeg?auto=compress&cs=tinysrgb&h=350',
  vinagrete:     'https://images.pexels.com/photos/5393660/pexels-photo-5393660.jpeg?auto=compress&cs=tinysrgb&h=350',
  queijo_coalho: 'https://images.pexels.com/photos/17615597/pexels-photo-17615597.jpeg?auto=compress&cs=tinysrgb&h=350',
  kit:           'https://images.pexels.com/photos/34027185/pexels-photo-34027185.jpeg?auto=compress&cs=tinysrgb&h=350',
}

const ACOUGUES = [
  // ────────────────────────────────────────────────────────────────────
  // 1. CASA DE CARNES JARDIM AMÉRICA — Premium, Zona Sul
  // ────────────────────────────────────────────────────────────────────
  {
    user: {
      name: 'Casa de Carnes Jardim América',
      email: 'jardimamerica@techchurras.com.br',
      password: 'Churras@2024',
      role: 'BOUTIQUE',
    },
    boutique: {
      name: 'Casa de Carnes Jardim América',
      description: 'Há 22 anos fornecendo os melhores cortes para churrascos em São Paulo. Selecionamos diariamente peças nobres com rastreabilidade garantida — picanha com capa de gordura perfeita, fraldinha marmoreada e linguiça artesanal feita na casa.',
      address: 'Rua José Maria Lisboa, 550',
      city: 'São Paulo',
      state: 'SP',
      phone: '(11) 3062-4455',
      instagram: '@casadecarnesjardimamerica',
      openingHours: 'Seg–Sex: 7h–19h | Sáb: 6h–17h | Dom: 7h–13h',
      logoUrl: 'https://images.pexels.com/photos/37951011/pexels-photo-37951011.jpeg?auto=compress&cs=tinysrgb&h=350',
      facadeUrl: 'https://images.pexels.com/photos/947174/pexels-photo-947174.jpeg?auto=compress&cs=tinysrgb&h=350',
      approved: true,
      open: true,
    },
    products: [
      { name: 'Picanha',           description: 'Picanha com capa de gordura perfeita, Nelore certificado. Ideal para churrasco a bafo ou na brasa.',        price: 89.90, unit: 'kg',  category: 'CARNE',          imageUrl: IMGS.picanha },
      { name: 'Fraldinha',         description: 'Fraldinha marmoreada, macia e suculenta. Um dos cortes mais pedidos nos churrascos paulistanos.',             price: 54.90, unit: 'kg',  category: 'CARNE',          imageUrl: IMGS.fraldinha },
      { name: 'Maminha',           description: 'Maminha inteira, corte nobre da alcatra. Macia, com pouquíssima gordura e sabor acentuado.',                 price: 42.90, unit: 'kg',  category: 'CARNE',          imageUrl: IMGS.maminha },
      { name: 'Linguiça Toscana Artesanal', description: 'Feita na casa com tempero especial da família. Ervas frescas, alho e pimenta calabresa.',          price: 32.90, unit: 'kg',  category: 'CARNE',          imageUrl: IMGS.linguica },
      { name: 'Carvão Premium 5kg', description: 'Carvão de eucalipto virgem, baixa fumaça, alta temperatura. 5kg para um churrasco completo.',              price: 32.90, unit: 'pct', category: 'CARVAO',         imageUrl: IMGS.carvao },
      { name: 'Farofa de Bacon',   description: 'Farofa crocante com bacon defumado, manteiga e tempero caseiro. Embalagem 500g, pronta para servir.',       price: 22.90, unit: 'pct', category: 'ACOMPANHAMENTO', imageUrl: IMGS.farofa },
      { name: 'Vinagrete Caseiro', description: 'Vinagrete fresco de tomate, cebola, pimentão e cheiro-verde. Embalagem 500ml, feito no dia.',               price: 14.90, unit: 'pct', category: 'ACOMPANHAMENTO', imageUrl: IMGS.vinagrete },
      { name: 'Pão de Alho (6un)', description: 'Pão de alho artesanal com manteiga, alho assado e ervas finas. Dourado e crocante, pronto para grelhar.',  price: 16.90, unit: 'pct', category: 'ACOMPANHAMENTO', imageUrl: IMGS.pao_alho },
    ],
    kits: [
      {
        name: 'Kit Premium 8 Pessoas',
        description: 'O kit mais completo para um churrasco memorável. Picanha 2kg + Fraldinha 1,5kg + Linguiça Toscana 1kg + Farofa de Bacon + Vinagrete + Carvão 5kg. Tudo selecionado e embalado separadamente com identificação.',
        price: 420.00,
        discountPrice: 380.00,
        minGuests: 6,
        maxGuests: 10,
        coverImageUrl: IMGS.kit,
        items: JSON.stringify([
          { name: 'Picanha',                   qty: 2,   unit: 'kg' },
          { name: 'Fraldinha',                 qty: 1.5, unit: 'kg' },
          { name: 'Linguiça Toscana Artesanal', qty: 1, unit: 'kg' },
          { name: 'Farofa de Bacon',           qty: 1,   unit: 'pct' },
          { name: 'Vinagrete Caseiro',         qty: 1,   unit: 'pct' },
          { name: 'Carvão Premium 5kg',        qty: 1,   unit: 'pct' },
        ]),
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────
  // 2. AÇOUGUE DO CARLÃO — Tradicional, Mooca
  // ────────────────────────────────────────────────────────────────────
  {
    user: {
      name: 'Açougue do Carlão',
      email: 'carlao@techchurras.com.br',
      password: 'Churras@2024',
      role: 'BOUTIQUE',
    },
    boutique: {
      name: 'Açougue do Carlão',
      description: 'Tradição desde 1987 na Mooca. Três gerações de família dedicadas a oferecer carne fresca de manhã cedo. Aqui o preço é justo, o corte é caprichado e você sempre sai com o que precisa para um churrasco de respeito.',
      address: 'Rua da Mooca, 2850',
      city: 'São Paulo',
      state: 'SP',
      phone: '(11) 2604-7788',
      instagram: '@acougueodocarlao',
      openingHours: 'Seg–Sáb: 6h–18h | Dom: 6h–12h',
      logoUrl: 'https://images.pexels.com/photos/5643415/pexels-photo-5643415.jpeg?auto=compress&cs=tinysrgb&h=350',
      facadeUrl: 'https://images.pexels.com/photos/10330689/pexels-photo-10330689.jpeg?auto=compress&cs=tinysrgb&h=350',
      approved: true,
      open: true,
    },
    products: [
      { name: 'Fraldinha',          description: 'Fraldinha fresca, abatida na semana. Corte perfeito para a grelha — fica pronta em 15 minutos e derrete na boca.',  price: 49.90, unit: 'kg',  category: 'CARNE',          imageUrl: IMGS.fraldinha },
      { name: 'Costela de Boi',     description: 'Costela janela com osso, peça inteira para churrasco a bafo. Gordura bem distribuída, sabor incomparável.',          price: 38.90, unit: 'kg',  category: 'CARNE',          imageUrl: IMGS.costela },
      { name: 'Alcatra',            description: 'Alcatra centro, corte nobre e versátil. Vai bem na grelha e agrada até quem não gosta de muita gordura.',            price: 44.90, unit: 'kg',  category: 'CARNE',          imageUrl: IMGS.alcatra },
      { name: 'Coração de Frango',  description: 'Coração de frango temperado com alho e limão, pronto para o espeto. Clássico de todo churrasco brasileiro.',         price: 16.90, unit: 'kg',  category: 'CARNE',          imageUrl: IMGS.coracao },
      { name: 'Linguiça Mista',     description: 'Linguiça suína e bovina, tempero tradicional. Crocante por fora, suculenta por dentro. O acompanhamento perfeito.', price: 21.90, unit: 'kg',  category: 'CARNE',          imageUrl: IMGS.linguica },
      { name: 'Carvão 5kg',         description: 'Carvão de boa queima para o seu churrasco. 5kg suficientes para até 3 horas de fogo.',                              price: 25.90, unit: 'pct', category: 'CARVAO',         imageUrl: IMGS.carvao },
      { name: 'Vinagrete Tradicional', description: 'Receita da família do Carlão. Tomate, cebola, salsinha, vinagre e um toque de pimenta. 500ml.',                  price: 10.90, unit: 'pct', category: 'ACOMPANHAMENTO', imageUrl: IMGS.vinagrete },
      { name: 'Farofa Tradicional', description: 'Farofa de mandioca com manteiga e sal, do jeito antigo. Simples e deliciosa. Embalagem 500g.',                     price: 13.90, unit: 'pct', category: 'ACOMPANHAMENTO', imageUrl: IMGS.farofa },
    ],
    kits: [
      {
        name: 'Kit Família 10 Pessoas',
        description: 'Churrasco farto para família grande. Fraldinha 2kg + Costela 2kg + Linguiça Mista 1kg + Farofa + Vinagrete + Carvão 5kg. Custo-benefício imbatível, o kit mais pedido do bairro.',
        price: 320.00,
        discountPrice: 290.00,
        minGuests: 8,
        maxGuests: 12,
        coverImageUrl: IMGS.kit,
        items: JSON.stringify([
          { name: 'Fraldinha',             qty: 2, unit: 'kg' },
          { name: 'Costela de Boi',        qty: 2, unit: 'kg' },
          { name: 'Linguiça Mista',        qty: 1, unit: 'kg' },
          { name: 'Farofa Tradicional',    qty: 1, unit: 'pct' },
          { name: 'Vinagrete Tradicional', qty: 1, unit: 'pct' },
          { name: 'Carvão 5kg',            qty: 1, unit: 'pct' },
        ]),
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────
  // 3. BONFIM CARNES SELECIONADAS — Curado, Pinheiros
  // ────────────────────────────────────────────────────────────────────
  {
    user: {
      name: 'Bonfim Carnes Selecionadas',
      email: 'bonfim@techchurras.com.br',
      password: 'Churras@2024',
      role: 'BOUTIQUE',
    },
    boutique: {
      name: 'Bonfim Carnes Selecionadas',
      description: 'Em Pinheiros desde 2008, o Bonfim se especializou em curadoria de cortes para quem leva o churrasco a sério. Trabalhamos com fornecedores certificados, gado Nelore e Angus. Além das carnes, temos os melhores acompanhamentos prontos para fechar o cardápio perfeito.',
      address: 'Rua Teodoro Sampaio, 1230',
      city: 'São Paulo',
      state: 'SP',
      phone: '(11) 3815-2244',
      instagram: '@bonfimcarnes',
      openingHours: 'Seg–Sex: 7h–20h | Sáb: 7h–18h | Dom: 8h–14h',
      logoUrl: 'https://images.pexels.com/photos/13279395/pexels-photo-13279395.jpeg?auto=compress&cs=tinysrgb&h=350',
      facadeUrl: 'https://images.pexels.com/photos/947174/pexels-photo-947174.jpeg?auto=compress&cs=tinysrgb&h=350',
      approved: true,
      open: true,
    },
    products: [
      { name: 'Picanha Angus',      description: 'Picanha Angus certificada, com marmoreio acima da média. Para quem quer o melhor da grelha sem ir para um restaurante.',  price: 84.90, unit: 'kg',  category: 'CARNE',          imageUrl: IMGS.picanha },
      { name: 'Contrafilé',         description: 'Contrafilé alto e bem marmoreado, corte ideal para bife na grelha. Temperatura alta por 4 min de cada lado, perfeito.',   price: 48.90, unit: 'kg',  category: 'CARNE',          imageUrl: IMGS.contrafile },
      { name: 'Alcatra Especial',   description: 'Alcatra selecionada, peça inteira. Versatilidade para vaca atolada, assado de panela ou direto na brasa.',                price: 44.90, unit: 'kg',  category: 'CARNE',          imageUrl: IMGS.alcatra },
      { name: 'Costela Ripa',       description: 'Costela ripa (sem osso), fácil de cortar e servir. Ideal para defumação ou forno por 6h. O must-have do churrasco lento.',price: 36.90, unit: 'kg',  category: 'CARNE',          imageUrl: IMGS.costela },
      { name: 'Linguiça Portuguesa', description: 'Linguiça portuguesa defumada, com páprica e vinho branco. Importada e nacional, fresca toda semana.',                   price: 26.90, unit: 'kg',  category: 'CARNE',          imageUrl: IMGS.linguica },
      { name: 'Carvão Especial 5kg', description: 'Carvão de madeira nativa densa, queima lenta e intensa. Ideal para defumação e churrascos longos. 5kg.',               price: 27.90, unit: 'pct', category: 'CARVAO',         imageUrl: IMGS.carvao },
      { name: 'Queijo Coalho (300g)', description: 'Queijo coalho mineiro, 300g em peça. Na grelha por 3 min de cada lado — carameliza por fora, derrete por dentro.',    price: 19.90, unit: 'pct', category: 'ACOMPANHAMENTO', imageUrl: IMGS.queijo_coalho },
      { name: 'Pão de Alho Especial (6un)', description: 'Pão de alho recheado com catupiry e alho negro. Receita exclusiva Bonfim. 6 unidades, prontas para grelhar.', price: 21.90, unit: 'pct', category: 'ACOMPANHAMENTO', imageUrl: IMGS.pao_alho },
      { name: 'Farofa de Alho (500g)', description: 'Farofa artesanal com alho dourado, manteiga e ervas secas. Acompanhamento clássico para qualquer corte.',            price: 15.90, unit: 'pct', category: 'ACOMPANHAMENTO', imageUrl: IMGS.farofa },
    ],
    kits: [
      {
        name: 'Kit Churrasco Completo 12 Pessoas',
        description: 'O kit mais completo do catálogo. Picanha Angus 2kg + Contrafilé 1,5kg + Alcatra 1kg + Costela Ripa 2kg + Linguiça 1kg + Queijo Coalho + Pão de Alho + Carvão. Tudo embalado e identificado — o churrasqueiro busca tudo em uma parada só.',
        price: 370.00,
        discountPrice: 340.00,
        minGuests: 10,
        maxGuests: 15,
        coverImageUrl: IMGS.kit,
        items: JSON.stringify([
          { name: 'Picanha Angus',              qty: 2,   unit: 'kg' },
          { name: 'Contrafilé',                 qty: 1.5, unit: 'kg' },
          { name: 'Alcatra Especial',           qty: 1,   unit: 'kg' },
          { name: 'Costela Ripa',               qty: 2,   unit: 'kg' },
          { name: 'Linguiça Portuguesa',        qty: 1,   unit: 'kg' },
          { name: 'Queijo Coalho (300g)',       qty: 2,   unit: 'pct' },
          { name: 'Pão de Alho Especial (6un)', qty: 1,   unit: 'pct' },
          { name: 'Carvão Especial 5kg',        qty: 1,   unit: 'pct' },
        ]),
      },
    ],
  },
]

async function seed() {
  console.log('🥩 Criando 3 açougues demo na Tech Churras...\n')

  for (const data of ACOUGUES) {
    console.log(`→ ${data.boutique.name}`)

    // 1. Verifica se já existe
    const existing = await prisma.user.findUnique({ where: { email: data.user.email } })
    if (existing) {
      console.log(`  ⚠️  Já existe. Pulando.\n`)
      continue
    }

    // 2. Cria user
    const hashedPassword = await bcrypt.hash(data.user.password, 10)
    const user = await prisma.user.create({
      data: {
        name: data.user.name,
        email: data.user.email,
        password: hashedPassword,
        role: data.user.role,
      },
    })

    // 3. Calcula trial (60 dias)
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 60)

    // 4. Cria boutique
    const boutique = await prisma.boutique.create({
      data: {
        userId: user.id,
        trialEndsAt,
        ...data.boutique,
      },
    })

    // 5. Cria produtos
    for (const p of data.products) {
      await prisma.product.create({
        data: { boutiqueId: boutique.id, ...p },
      })
    }
    console.log(`  ✅ ${data.products.length} produtos criados`)

    // 6. Cria kits
    for (const k of data.kits) {
      await prisma.kitChurrasco.create({
        data: { boutiqueId: boutique.id, ...k },
      })
    }
    console.log(`  ✅ ${data.kits.length} kit(s) criado(s)`)
    console.log(`  📧 Login: ${data.user.email} / ${data.user.password}\n`)
  }

  console.log('🎉 Seed concluído! 3 açougues prontos na plataforma.')
}

seed()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
