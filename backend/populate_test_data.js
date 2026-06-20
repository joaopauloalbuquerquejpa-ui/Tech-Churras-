'use strict'
/**
 * Popula dados de teste: coordenadas do Team Jota GM + produtos e localização do Dustbbq
 * Executa: node populate_test_data.js
 */

const API = 'https://tech-churras-production.up.railway.app'

const ADMIN_EMAIL    = 'joaopauloalbuquerque.jpa@gmail.com'
const ADMIN_PASSWORD = 'JotaAdmin@TechChurras2025!'
const GM_EMAIL       = 'techchurras@gmail.com'
const GM_PASSWORD    = 'TechChurras@2025!'
const BTQ_EMAIL      = 'premium.acougue@teste.com'
const BTQ_PASSWORD   = '123456'

// Coordenadas: Av. Paulista (base do Team Jota)
const LAT_GM  = -23.5613
const LNG_GM  = -46.6558

// Coordenadas: Pinheiros (endereço fictício do Dustbbq)
const LAT_BTQ = -23.5640
const LNG_BTQ = -46.6900

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = 'Bearer ' + token
  const res = await fetch(API + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(data)}`)
  return data
}

;(async () => {
  console.log('\n🔥 Populando dados de teste Tech Churras...\n')

  // ── 1. Login admin ───────────────────────────────────────────────────────
  console.log('1. Login admin...')
  const { token: adminToken } = await req('POST', '/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  console.log('   ✅ Admin autenticado')

  // ── 2. Login GM ──────────────────────────────────────────────────────────
  console.log('2. Login Team Jota GM...')
  const { token: gmToken, user: gmUser } = await req('POST', '/auth/login', { email: GM_EMAIL, password: GM_PASSWORD })
  console.log('   ✅ GM autenticado — userId:', gmUser?.id)

  // ── 3. Buscar perfil GM via admin ───────────────────────────────────────
  console.log('3. Buscando perfil GM via admin...')
  const allGMs = await req('GET', '/admin/grillmasters', null, adminToken)
  const teamJota = Array.isArray(allGMs) ? allGMs.find(g => g.user?.email === GM_EMAIL || g.user?.name?.includes('Jota')) : null
  if (!teamJota) throw new Error('GM Team Jota não encontrado. GMs disponíveis: ' + JSON.stringify(allGMs?.map(g => g.user?.email)))
  const gmId = teamJota.id
  console.log('   ✅ GM ID:', gmId, '| Nome:', teamJota.user?.name)

  // ── 4. Atualizar coords do GM via admin ──────────────────────────────────
  console.log('4. Atualizando coordenadas do Team Jota...')
  await req('PATCH', `/admin/grillmasters/${gmId}/profile`, {
    latitude: LAT_GM,
    longitude: LNG_GM,
    rating: 5.0,
  }, adminToken)
  console.log('   ✅ Coords GM: Av. Paulista SP (-23.5613, -46.6558)')

  // ── 5. Registrar/logar açougue de teste ─────────────────────────────────
  console.log('5. Registrando/logando Açougue Premium SP...')
  let boutiqueToken, btqUser
  try {
    const reg = await req('POST', '/auth/register', {
      name: 'Açougue Premium SP',
      email: BTQ_EMAIL,
      password: BTQ_PASSWORD,
      phone: '11988880000',
      role: 'BOUTIQUE',
    })
    boutiqueToken = reg.token; btqUser = reg.user
    console.log('   ✅ Conta criada — userId:', btqUser?.id)
  } catch {
    const login = await req('POST', '/auth/login', { email: BTQ_EMAIL, password: BTQ_PASSWORD })
    boutiqueToken = login.token; btqUser = login.user
    console.log('   ✅ Login OK — userId:', btqUser?.id)
  }

  // ── 6. Verificar/criar perfil de boutique ────────────────────────────────
  console.log('6. Verificando perfil boutique...')
  let boutiqueId
  try {
    const myBoutique = await req('GET', '/boutiques/my', null, boutiqueToken)
    boutiqueId = myBoutique.id
    console.log('   ✅ Boutique existente — ID:', boutiqueId, '| Nome:', myBoutique.name)
  } catch {
    console.log('   Criando perfil boutique...')
    const created = await req('POST', '/boutiques', {
      name: 'Açougue Premium SP',
      description: 'Açougue premium com os melhores cortes de São Paulo, especializado em carnes para churrasco.',
      address: 'Rua Teodoro Sampaio, 1200, Pinheiros, São Paulo, SP',
      city: 'São Paulo',
      state: 'SP',
      phone: '11999990000',
      lat: LAT_BTQ,
      lng: LNG_BTQ,
      openTime: '08:00',
      closeTime: '20:00',
      workDays: ['MON','TUE','WED','THU','FRI','SAT'],
    }, boutiqueToken)
    boutiqueId = created.id
    console.log('   ✅ Boutique criada — ID:', boutiqueId)
  }

  // ── 7. Aprovar via admin ─────────────────────────────────────────────────
  console.log('7. Aprovando açougue...')
  try {
    await req('PATCH', `/admin/boutiques/${boutiqueId}/approve`, {}, adminToken)
    console.log('   ✅ Aprovado')
  } catch (e) {
    console.log('   ⚠️  Já aprovado:', e.message.slice(0, 60))
  }

  // ── 8. Adicionar produtos ─────────────────────────────────────────────────
  console.log('8. Adicionando produtos ao Açougue Premium SP...')
  const produtos = [
    { name: 'Picanha', category: 'CARNE', price: 90, unit: 'kg', description: 'Picanha bovina premium, peça inteira com capa de gordura', available: true },
    { name: 'Fraldinha', category: 'CARNE', price: 65, unit: 'kg', description: 'Corte macio e suculento, ideal para brasa', available: true },
    { name: 'Costela Bovina', category: 'CARNE', price: 46, unit: 'kg', description: 'Costela janela, perfeita para fogo lento', available: true },
    { name: 'Frango Inteiro', category: 'CARNE', price: 19, unit: 'kg', description: 'Frango caipira fresco', available: true },
    { name: 'Linguiça Toscana', category: 'CARNE', price: 33, unit: 'kg', description: 'Linguiça artesanal temperada', available: true },
    { name: 'Pão de Alho', category: 'ACOMPANHAMENTO', price: 13, unit: 'un', description: 'Pão de alho artesanal com manteiga e ervas', available: true },
    { name: 'Queijo Coalho', category: 'ACOMPANHAMENTO', price: 25, unit: 'kg', description: 'Queijo coalho artesanal para grelha', available: true },
    { name: 'Carvão 5kg', category: 'CARVAO', price: 30, unit: 'un', description: 'Carvão vegetal premium 5kg', available: true },
    { name: 'Sal Grosso', category: 'SAL_TEMPERO', price: 9, unit: 'kg', description: 'Sal grosso para temperar carnes', available: true },
  ]

  // Verificar produtos já existentes para não duplicar
  const existingProds = await req('GET', `/boutiques/${boutiqueId}/products`, null, boutiqueToken).catch(() => [])
  const existingNames = new Set((Array.isArray(existingProds) ? existingProds : existingProds?.products ?? []).map(p => p.name))
  console.log('   Produtos existentes:', existingNames.size)

  let produtosAdicionados = 0
  for (const produto of produtos) {
    if (existingNames.has(produto.name)) {
      console.log(`   ⏭️  ${produto.name} já existe`)
      continue
    }
    try {
      await req('POST', '/boutiques/products', produto, boutiqueToken)
      console.log(`   ✅ ${produto.name}`)
      produtosAdicionados++
    } catch (e) {
      console.log(`   ⚠️  ${produto.name}: ${e.message.slice(0, 80)}`)
    }
  }

  console.log(`\n   ${produtosAdicionados}/${produtos.length} produtos adicionados`)

  // ── 10. Verificar resultado ──────────────────────────────────────────────
  console.log('\n10. Verificando resultado final...')
  const boutiqueCheck = await req('GET', `/boutiques/${boutiqueId}`, null, adminToken).catch(() => null)
  const productsCheck = await req('GET', `/boutiques/${boutiqueId}/products`, null, adminToken).catch(() => ({ products: [] }))
  console.log(`   Boutique: ${boutiqueCheck?.name ?? '?'} | status: ${boutiqueCheck?.status ?? '?'}`)
  console.log(`   Produtos: ${productsCheck?.products?.length ?? productsCheck?.length ?? 0} cadastrados`)

  console.log('\n✅ PRONTO! Teste o kit-perfeito agora:\n')
  console.log('POST /ai/kit-perfeito')
  console.log('{ "eventAddress": "Rua Augusta 1500, Consolacao, Sao Paulo SP", "guests": 12, "occasion": "Aniversario", "customerName": "Joao Paulo" }')
  console.log()
})().catch(e => { console.error('\n❌ Erro:', e.message); process.exit(1) })
