// Roda servidor + testes no mesmo processo com mesma JWT_SECRET
const { spawn } = require('child_process')
const path = require('path')

const BASE = 'http://localhost:3333'

async function waitForServer(retries = 20) {
  for (let i = 0; i < retries; i++) {
    await new Promise(r => setTimeout(r, 2000))
    try {
      const r = await fetch(BASE + '/health')
      if (r.ok) return true
    } catch {}
    process.stdout.write('.')
  }
  throw new Error('Servidor nao subiu')
}

async function api(method, path_, body, token) {
  const h = { 'Content-Type': 'application/json' }
  if (token) h['Authorization'] = 'Bearer ' + token
  const r = await fetch(BASE + path_, {
    method,
    headers: h,
    body: body ? JSON.stringify(body) : undefined,
  })
  return [r.status, await r.json()]
}

async function runTests() {
  console.log('\nServidor pronto. Iniciando testes de cancelamento...\n')
  const TS = Date.now()

  // Setup
  const [, cu]  = await api('POST', '/auth/register', { name: 'Cliente Cancel', email: 'c.cu.' + TS + '@t.com', password: 's123' })
  const [, gmu] = await api('POST', '/auth/register', { name: 'GM Cancel', email: 'c.gm.' + TS + '@t.com', password: 's123' })
  if (!cu.token || !gmu.token) { console.error('FALHA register:', cu, gmu); process.exit(1) }

  const [sgm, gm] = await api('POST', '/grillmasters', { bio: 'x', experience: 1, pricePerHour: 500, city: 'SP', state: 'SP', galleryUrls: [] }, gmu.token)
  if (!gm.id) { console.error('FALHA grillmaster:', sgm, gm); process.exit(1) }
  console.log('Setup OK — GM id:', gm.id.slice(0,8), '| pricePerHour: 500')

  const results = []

  // 1. Cancelar PENDING (gratis)
  const [, o1] = await api('POST', '/orders', { grillmasterId: gm.id, eventDate: '2026-08-01T18:00:00', eventAddress: 'Rua A, SP', eventHours: 4, guestCount: 20 }, cu.token)
  const [s1, r1] = await api('PATCH', '/orders/' + o1.id + '/cancel', { reason: 'Mudei de planos' }, cu.token)
  const p1 = s1 === 200 && r1.status === 'CANCELLED' && r1.cancellationFee == null
  results.push(p1)
  console.log('[1] Cancelar PENDING — HTTP', s1, '| status:', r1.status, '| fee:', r1.cancellationFee, '| motivo:', r1.cancellationReason)
  console.log('    ' + (p1 ? 'PASS ✓' : 'FAIL ✗'))

  // 2. Cancelar CONFIRMED >48h (gratis)
  const [, o2] = await api('POST', '/orders', { grillmasterId: gm.id, eventDate: '2026-09-15T18:00:00', eventAddress: 'Rua B, SP', eventHours: 3, guestCount: 15 }, cu.token)
  const [sc2] = await api('PATCH', '/orders/' + o2.id + '/status', { status: 'CONFIRMED' }, gmu.token)
  const [s2, r2] = await api('PATCH', '/orders/' + o2.id + '/cancel', { reason: 'Evento desmarcado' }, cu.token)
  const p2 = s2 === 200 && r2.status === 'CANCELLED' && r2.cancellationFee == null
  results.push(p2)
  console.log('[2] Cancelar CONFIRMED >48h — confirmar HTTP', sc2, '| cancel HTTP', s2, '| fee:', r2.cancellationFee)
  console.log('    ' + (p2 ? 'PASS ✓' : 'FAIL ✗'))

  // 3. Cancelar CONFIRMED <24h (multa 50%)
  const nearDate = new Date(Date.now() + 10 * 3600 * 1000).toISOString()
  const [, o3] = await api('POST', '/orders', { grillmasterId: gm.id, eventDate: nearDate, eventAddress: 'Rua C, SP', eventHours: 2, guestCount: 10 }, cu.token)
  const [sc3] = await api('PATCH', '/orders/' + o3.id + '/status', { status: 'CONFIRMED' }, gmu.token)
  const [s3, r3] = await api('PATCH', '/orders/' + o3.id + '/cancel', { reason: 'Emergencia' }, cu.token)
  const expectedFee = o3.totalPrice * 0.5
  const p3 = s3 === 200 && r3.status === 'CANCELLED' && r3.cancellationFee === expectedFee
  results.push(p3)
  console.log('[3] Cancelar CONFIRMED <24h — confirmar HTTP', sc3, '| cancel HTTP', s3, '| totalPrice:', o3.totalPrice, '| fee:', r3.cancellationFee, '| esperado:', expectedFee)
  console.log('    ' + (p3 ? 'PASS ✓' : 'FAIL ✗'))

  // 4. Tentar cancelar ja CANCELLED
  const [s4, r4] = await api('PATCH', '/orders/' + o1.id + '/cancel', {}, cu.token)
  const p4 = s4 === 400
  results.push(p4)
  console.log('[4] Cancelar ja CANCELLED — HTTP', s4, '|', r4.error)
  console.log('    ' + (p4 ? 'PASS ✓' : 'FAIL ✗'))

  // 5. Intruso cancelando pedido alheio
  const [, intruso] = await api('POST', '/auth/register', { name: 'Intruso', email: 'int.' + TS + '@t.com', password: 's123' })
  const [, o5] = await api('POST', '/orders', { grillmasterId: gm.id, eventDate: '2026-09-20T18:00:00', eventAddress: 'Rua D, SP', eventHours: 2, guestCount: 8 }, cu.token)
  const [s5, r5] = await api('PATCH', '/orders/' + o5.id + '/cancel', { reason: 'Hack' }, intruso.token)
  const p5 = s5 === 400
  results.push(p5)
  console.log('[5] Intruso cancelando alheio — HTTP', s5, '|', r5.error)
  console.log('    ' + (p5 ? 'PASS ✓' : 'FAIL ✗'))

  // 6. Cancelar IN_PROGRESS
  const [, o6] = await api('POST', '/orders', { grillmasterId: gm.id, eventDate: nearDate, eventAddress: 'Rua E, SP', eventHours: 3, guestCount: 12 }, cu.token)
  await api('PATCH', '/orders/' + o6.id + '/status', { status: 'CONFIRMED' }, gmu.token)
  await api('PATCH', '/orders/' + o6.id + '/status', { status: 'IN_PROGRESS' }, gmu.token)
  const [s6, r6] = await api('PATCH', '/orders/' + o6.id + '/cancel', { reason: 'Too late' }, cu.token)
  const p6 = s6 === 400
  results.push(p6)
  console.log('[6] Cancelar IN_PROGRESS — HTTP', s6, '|', r6.error)
  console.log('    ' + (p6 ? 'PASS ✓' : 'FAIL ✗'))

  const passed = results.filter(Boolean).length
  console.log('\n=== RESULTADO BACKEND:', passed === results.length ? 'PASS ✓' : 'FAIL ✗', '(' + passed + '/' + results.length + ') ===')
}

// Iniciar servidor como processo filho (herda env vars)
const server = spawn(process.execPath, [], {
  env: process.env,
  stdio: ['ignore', 'pipe', 'pipe'],
})

// Usar tsx via require do mesmo node_modules
const tsxPath = path.join(__dirname, 'node_modules', '.bin', 'tsx')
const server2 = spawn(tsxPath, ['src/server.ts'], {
  env: process.env,
  cwd: __dirname,
  stdio: ['ignore', 'pipe', 'pipe'],
})

server2.stdout.on('data', d => { if (d.toString().includes('rodando')) process.stdout.write('') })
server2.stderr.on('data', () => {})

waitForServer()
  .then(runTests)
  .catch(e => { console.error('ERRO:', e.message); process.exit(1) })
  .finally(() => { server2.kill(); process.exit(0) })
