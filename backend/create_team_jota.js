'use strict'
/**
 * Cria o perfil "Team Jota Albuquerque" — primeiro grillmaster oficial da Tech Churras SP
 * Executa: node create_team_jota.js
 */

const API = 'https://tech-churras-production.up.railway.app'

const GM_EMAIL    = 'team.jota@techchurras.com.br'
const GM_PASSWORD = 'TechChurras@2025!'
const GM_NAME     = 'Team Jota Albuquerque'
const GM_PHONE    = '11970593650'
const PHOTO_URL   = 'https://www.techchurras.com.br/jota.jpg'
const LAT_SP      = -23.5613
const LNG_SP      = -46.6558

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = 'Bearer ' + token
  const res = await fetch(API + path, { method, headers, body: body ? JSON.stringify(body) : undefined })
  const data = await res.json()
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(data)}`)
  return data
}

;(async () => {
  console.log('\n🔥 Criando Team Jota Albuquerque...\n')

  // 1. Registrar ou logar
  console.log('1. Conta grillmaster...')
  let token, userId
  try {
    const reg = await req('POST', '/auth/register', {
      name: GM_NAME, email: GM_EMAIL, password: GM_PASSWORD,
      phone: GM_PHONE, role: 'GRILLMASTER',
    })
    token = reg.token; userId = reg.user?.id
    console.log('   ✅ Conta criada — userId:', userId)
  } catch {
    console.log('   ⚠️  Já existe, fazendo login...')
    const login = await req('POST', '/auth/login', { email: GM_EMAIL, password: GM_PASSWORD })
    token = login.token; userId = login.user?.id
    console.log('   ✅ Login OK — userId:', userId)
  }

  // 2. Criar perfil grillmaster
  console.log('2. Criando perfil...')
  let gmId
  try {
    const gm = await req('POST', '/grillmasters', {
      bio: 'Sou o Jota — fundador da Tech Churras e chef parrillero com mais de 10 anos de experiência em eventos premium em São Paulo. Minha equipe domina desde os cortes wagyu mais nobres até o hambúrguer artesanal perfeito. Cada evento é tratado como uma experiência única — mise en place impecável, temperos autorais e aquele ponto de brasa que só quem viveu a parrilla argentina de verdade conhece. Atendemos toda a região de São Paulo.',
      experience: 10,
      pricePerHour: 180,
      city: 'São Paulo',
      state: 'SP',
      specialties: 'Chef Parrillero, Cortes Premium Wagyu, Especialista em Burgers Artesanais, Picanha na Brasa, Churrasco Gourmet, Mise en Place Profissional, Parrilla Argentina, Costela Fogo de Chão, Cordeiro Assado',
      available: false,
      photoUrl: PHOTO_URL,
      churrascoStyle: 'Parrilla argentina com alma brasileira — cada corte no ponto certo, tempero autoral e mise en place que impressiona qualquer convidado.',
      bringsEquipment: true,
      minGuests: 10,
      maxGuests: 300,
      instagram: '@techchurras',
    }, token)
    gmId = gm.id
    console.log('   ✅ Perfil criado — gmId:', gmId)
  } catch (e) {
    if (e.message.includes('já existe') || e.message.includes('ja existe')) {
      console.log('   ⚠️  Perfil já existe, buscando...')
      const r = await fetch(API + '/grillmasters/me', { headers: { Authorization: 'Bearer ' + token } })
      const gm = await r.json(); gmId = gm.id
      console.log('   ✅ Encontrado — gmId:', gmId)
    } else throw e
  }

  // 3. Aprovar
  console.log('3. Aprovando...')
  await req('PATCH', `/admin/grillmasters/${gmId}/approve`, {}, token)
  console.log('   ✅ Aprovado')

  // 4. Rating 5 + coords + certificação fundador
  console.log('4. Rating, coords e certificação...')
  const now = new Date().toISOString()
  await req('PATCH', `/admin/grillmasters/${gmId}/profile`, {
    rating: 5.0,
    latitude: LAT_SP,
    longitude: LNG_SP,
    certifiedAt: now,
    certificationCode: 'TC-FUNDADOR-001',
    trainingModules: [1, 2, 3, 4, 5],
    uniformSent: true,
    uniformSentAt: now,
  }, token)
  console.log('   ✅ Rating 5.0 · TC-FUNDADOR-001 · Av. Paulista SP')

  console.log('\n🏆 CRIADO COM SUCESSO!\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  Nome:          Team Jota Albuquerque')
  console.log('  Email:         team.jota@techchurras.com.br')
  console.log('  Senha:         TechChurras@2025!')
  console.log('  GM ID:        ', gmId)
  console.log('  Certificação:  TC-FUNDADOR-001')
  console.log('  Status:        Aprovado · Disponível: NÃO (ainda sem dias definidos)')
  console.log('  Cobertura:     São Paulo inteiro (Av. Paulista como base)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\nAcesse: https://www.techchurras.com.br/grillmasters/dashboard')
  console.log('com o email/senha acima para definir os dias disponíveis.\n')

})().catch(e => { console.error('\n❌ Erro:', e.message); process.exit(1) })
