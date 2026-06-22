'use strict'
/**
 * Cadastra os membros da Team Jota na plataforma.
 * Preencha o array MEMBROS abaixo com os dados reais de cada churrasqueiro.
 * Execute: node criar_equipe_jota.js
 *
 * Cada membro será criado com:
 * - Conta de usuário (GRILLMASTER)
 * - Perfil aprovado automaticamente
 * - Badge "Chancelado" (Team Jota)
 * - Rating inicial 5.0
 * - Senha temporária: TechChurras@2025! (peça para cada um trocar no primeiro login)
 */

const API = 'https://tech-churras-production.up.railway.app'
const SENHA_PADRAO = 'TechChurras@2025!'

// ══════════════════════════════════════════════════════════════
// PREENCHA OS DADOS DOS 12 MEMBROS AQUI
// ══════════════════════════════════════════════════════════════
const MEMBROS = [
  {
    name: 'Nome Completo 1',
    email: 'membro1@email.com',
    phone: '11999999001',            // apenas dígitos, com DDD
    pricePerHour: 180,               // R$/hora
    specialties: 'Churrasco tradicional, Picanha, Costela',
    city: 'São Paulo',
    instagram: '@membro1',           // opcional, '' se não tiver
  },
  {
    name: 'Nome Completo 2',
    email: 'membro2@email.com',
    phone: '11999999002',
    pricePerHour: 180,
    specialties: 'Churrasco tradicional, Fraldinha, Maminha',
    city: 'São Paulo',
    instagram: '',
  },
  {
    name: 'Nome Completo 3',
    email: 'membro3@email.com',
    phone: '11999999003',
    pricePerHour: 180,
    specialties: 'Churrasco gourmet, Wagyu, Cordeiro',
    city: 'São Paulo',
    instagram: '',
  },
  {
    name: 'Nome Completo 4',
    email: 'membro4@email.com',
    phone: '11999999004',
    pricePerHour: 180,
    specialties: 'Parrilla argentina, Cortes especiais',
    city: 'São Paulo',
    instagram: '',
  },
  {
    name: 'Nome Completo 5',
    email: 'membro5@email.com',
    phone: '11999999005',
    pricePerHour: 180,
    specialties: 'Churrasco tradicional, Linguiça artesanal',
    city: 'São Paulo',
    instagram: '',
  },
  {
    name: 'Nome Completo 6',
    email: 'membro6@email.com',
    phone: '11999999006',
    pricePerHour: 180,
    specialties: 'Churrasco tradicional, Porco, Fraldinha',
    city: 'São Paulo',
    instagram: '',
  },
  {
    name: 'Nome Completo 7',
    email: 'membro7@email.com',
    phone: '11999999007',
    pricePerHour: 180,
    specialties: 'Churrasco corporativo, Grandes eventos',
    city: 'São Paulo',
    instagram: '',
  },
  {
    name: 'Nome Completo 8',
    email: 'membro8@email.com',
    phone: '11999999008',
    pricePerHour: 180,
    specialties: 'Hambúrguer artesanal, Churrasco gourmet',
    city: 'São Paulo',
    instagram: '',
  },
  {
    name: 'Nome Completo 9',
    email: 'membro9@email.com',
    phone: '11999999009',
    pricePerHour: 180,
    specialties: 'Churrasco tradicional, Costela fogo de chão',
    city: 'São Paulo',
    instagram: '',
  },
  {
    name: 'Nome Completo 10',
    email: 'membro10@email.com',
    phone: '11999999010',
    pricePerHour: 180,
    specialties: 'Churrasco tradicional, Fraldinha, Asado',
    city: 'São Paulo',
    instagram: '',
  },
  {
    name: 'Nome Completo 11',
    email: 'membro11@email.com',
    phone: '11999999011',
    pricePerHour: 180,
    specialties: 'Churrasco tradicional, Eventos familiares',
    city: 'São Paulo',
    instagram: '',
  },
  {
    name: 'Nome Completo 12',
    email: 'membro12@email.com',
    phone: '11999999012',
    pricePerHour: 180,
    specialties: 'Parrilla, Cortes nobres, Eventos premium',
    city: 'São Paulo',
    instagram: '',
  },
]
// ══════════════════════════════════════════════════════════════

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = 'Bearer ' + token
  const res = await fetch(API + path, { method, headers, body: body ? JSON.stringify(body) : undefined })
  const data = await res.json()
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(data)}`)
  return data
}

async function getAdminToken() {
  const login = await req('POST', '/auth/login', {
    email: 'joao@techchurras.com.br',
    password: process.env.ADMIN_PASS || 'TechChurras@2025!',
  })
  return login.token
}

async function criarMembro(membro, adminToken, idx) {
  const label = `[${idx + 1}/${MEMBROS.length}] ${membro.name}`
  process.stdout.write(`${label}... `)

  let token, gmId

  // 1. Registrar conta
  try {
    const reg = await req('POST', '/auth/register', {
      name: membro.name,
      email: membro.email,
      password: SENHA_PADRAO,
      phone: membro.phone,
      role: 'GRILLMASTER',
    })
    token = reg.token
  } catch {
    const login = await req('POST', '/auth/login', { email: membro.email, password: SENHA_PADRAO })
    token = login.token
  }

  // 2. Criar ou buscar perfil
  try {
    const gm = await req('POST', '/grillmasters', {
      bio: `Churrasqueiro profissional certificado pela Tech Churras. Membro da Team Jota Albuquerque — equipe de elite para eventos em São Paulo. ${membro.specialties}.`,
      experience: 5,
      pricePerHour: membro.pricePerHour,
      city: membro.city,
      state: 'SP',
      specialties: membro.specialties,
      available: false,
      churrascoStyle: 'Churrasco profissional com mise en place e atendimento premium.',
      bringsEquipment: true,
      minGuests: 10,
      maxGuests: 200,
      instagram: membro.instagram || '',
    }, token)
    gmId = gm.id
  } catch {
    const r = await fetch(API + '/grillmasters/me', { headers: { Authorization: 'Bearer ' + token } })
    const gm = await r.json()
    gmId = gm.id
  }

  // 3. Aprovar + isChancelado
  await req('PATCH', `/admin/grillmasters/${gmId}/approve`, {
    isChancelado: true,
    pricePerHour: membro.pricePerHour,
  }, adminToken)

  // 4. Rating 5.0 + coords SP
  const now = new Date().toISOString()
  await req('PATCH', `/admin/grillmasters/${gmId}/profile`, {
    rating: 5.0,
    latitude: -23.5613 + (Math.random() - 0.5) * 0.1,
    longitude: -46.6558 + (Math.random() - 0.5) * 0.1,
    certifiedAt: now,
    trainingModules: [1, 2, 3],
    uniformSent: true,
    uniformSentAt: now,
  }, adminToken)

  console.log('✅')
  return { ...membro, gmId, senha: SENHA_PADRAO }
}

;(async () => {
  console.log('\n🔥 Cadastrando equipe Team Jota — ' + MEMBROS.length + ' membros\n')

  const adminToken = await getAdminToken()

  const resultados = []
  for (let i = 0; i < MEMBROS.length; i++) {
    try {
      const r = await criarMembro(MEMBROS[i], adminToken, i)
      resultados.push({ ...r, status: 'OK' })
    } catch (e) {
      console.log('❌ ' + e.message)
      resultados.push({ ...MEMBROS[i], status: 'ERRO: ' + e.message })
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('RESULTADO FINAL')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  resultados.forEach(r => {
    console.log(`${r.status === 'OK' ? '✅' : '❌'} ${r.name}`)
    console.log(`   Email: ${r.email}  |  Senha: ${r.senha}`)
    if (r.gmId) console.log(`   GM ID: ${r.gmId}`)
    if (r.status !== 'OK') console.log(`   Erro: ${r.status}`)
  })
  console.log('\nPróximo passo: cada membro loga em techchurras.com.br/login')
  console.log('e marca seus dias disponíveis no painel.\n')

})().catch(e => { console.error('\n❌ Erro fatal:', e.message); process.exit(1) })
