const BASE = 'http://localhost:3333'

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

async function main() {
  const TS = Date.now()
  const results = []

  // Setup: customer + grillmaster
  const [, cu] = await api('POST', '/auth/register', { name: 'Cliente Pedido', email: 'oc.cu.' + TS + '@t.com', password: 'senha123' })
  const [, gmu] = await api('POST', '/auth/register', { name: 'GM Pedido', email: 'oc.gm.' + TS + '@t.com', password: 'senha123', role: 'GRILLMASTER' })
  if (!cu.token || !gmu.token) { console.error('FALHA register:', cu, gmu); process.exit(1) }

  const [, gm] = await api('POST', '/grillmasters', { bio: 'Churrasqueiro top', experience: 5, pricePerHour: 100, city: 'SP', state: 'SP', galleryUrls: [] }, gmu.token)
  if (!gm.id) { console.error('FALHA grillmaster:', gm); process.exit(1) }
  console.log('Setup OK — customer:', cu.user?.id?.slice(0, 8), '| GM id:', gm.id.slice(0, 8), '| pricePerHour: 100')

  // ─── [1] Criação básica de pedido ───
  const [s1, r1] = await api('POST', '/orders', {
    grillmasterId: gm.id,
    eventDate: '2026-12-01T18:00:00',
    eventAddress: 'Rua Teste, 123, São Paulo, SP',
    eventHours: 4,
    guestCount: 10,
  }, cu.token)
  const p1 = s1 === 201 && r1.id && r1.status === 'PENDING' && r1.totalPrice === 400
  console.log('\n[1] Criação básica (4h × R$100): HTTP', s1, '| status:', r1.status, '| totalPrice:', r1.totalPrice, '| id:', r1.id?.slice(0, 8))
  console.log('  ' + (p1 ? 'PASS ✓' : 'FAIL ✗'))
  results.push(p1)
  const orderId = r1.id

  // ─── [2] Sem autenticação → 401 ───
  const [s2] = await api('POST', '/orders', {
    grillmasterId: gm.id,
    eventDate: '2026-12-02T18:00:00',
    eventAddress: 'Rua Sem Auth, 1, SP',
    eventHours: 2,
    guestCount: 5,
  }, null)
  const p2 = s2 === 401
  console.log('\n[2] Sem auth → 401: HTTP', s2)
  console.log('  ' + (p2 ? 'PASS ✓' : 'FAIL ✗'))
  results.push(p2)

  // ─── [3] Endereço muito curto → 400 ───
  const [s3, r3] = await api('POST', '/orders', {
    grillmasterId: gm.id,
    eventDate: '2026-12-03T18:00:00',
    eventAddress: 'Rua',  // < 5 chars
    eventHours: 2,
    guestCount: 5,
  }, cu.token)
  const p3 = s3 === 400
  console.log('\n[3] Endereço curto → 400: HTTP', s3, '|', r3.error?.slice(0, 60))
  console.log('  ' + (p3 ? 'PASS ✓' : 'FAIL ✗'))
  results.push(p3)

  // ─── [4] Campo obrigatório ausente (sem guestCount) → 400 ───
  const [s4, r4] = await api('POST', '/orders', {
    grillmasterId: gm.id,
    eventDate: '2026-12-04T18:00:00',
    eventAddress: 'Rua Teste, 456, SP',
    eventHours: 2,
    // guestCount ausente
  }, cu.token)
  const p4 = s4 === 400
  console.log('\n[4] Sem guestCount → 400: HTTP', s4, '|', r4.error?.slice(0, 60))
  console.log('  ' + (p4 ? 'PASS ✓' : 'FAIL ✗'))
  results.push(p4)

  // ─── [5] eventHours mínimo (< 1) → 400 ───
  const [s5, r5] = await api('POST', '/orders', {
    grillmasterId: gm.id,
    eventDate: '2026-12-05T18:00:00',
    eventAddress: 'Rua Teste, 789, SP',
    eventHours: 0,
    guestCount: 5,
  }, cu.token)
  const p5 = s5 === 400
  console.log('\n[5] eventHours=0 → 400: HTTP', s5, '|', r5.error?.slice(0, 60))
  console.log('  ' + (p5 ? 'PASS ✓' : 'FAIL ✗'))
  results.push(p5)

  // ─── [6] Sem grillmaster (opcional) → 201 com totalPrice=0 ───
  const [s6, r6] = await api('POST', '/orders', {
    eventDate: '2026-12-06T18:00:00',
    eventAddress: 'Rua Sem GM, 100, SP',
    eventHours: 3,
    guestCount: 8,
  }, cu.token)
  const p6 = s6 === 201 && r6.totalPrice === 0 && r6.grillmasterId === null
  console.log('\n[6] Sem grillmaster → 201 totalPrice=0: HTTP', s6, '| totalPrice:', r6.totalPrice, '| grillmasterId:', r6.grillmasterId)
  console.log('  ' + (p6 ? 'PASS ✓' : 'FAIL ✗'))
  results.push(p6)

  // ─── [7] GET /orders lista o pedido criado ───
  const [s7, r7] = await api('GET', '/orders', null, cu.token)
  const found7 = Array.isArray(r7) && r7.some(o => o.id === orderId)
  const p7 = s7 === 200 && found7
  console.log('\n[7] GET /orders lista o pedido: HTTP', s7, '| pedidos:', Array.isArray(r7) ? r7.length : 'ERR', '| encontrado:', found7)
  console.log('  ' + (p7 ? 'PASS ✓' : 'FAIL ✗'))
  results.push(p7)

  // ─── [8] GET /orders/:id retorna o pedido ───
  const [s8, r8] = await api('GET', '/orders/' + orderId, null, cu.token)
  const p8 = s8 === 200 && r8.id === orderId && r8.grillmaster?.id === gm.id
  console.log('\n[8] GET /orders/:id: HTTP', s8, '| id:', r8.id?.slice(0, 8), '| grillmaster:', r8.grillmaster?.id?.slice(0, 8))
  console.log('  ' + (p8 ? 'PASS ✓' : 'FAIL ✗'))
  results.push(p8)

  // ─── [9] GM não pode ver pedido do cliente (GRILLMASTER ainda não confirmou) ───
  const [s9, r9] = await api('GET', '/orders/' + orderId, null, gmu.token)
  // GM só pode ver pedidos que estão vinculados ao seu perfil grillmaster
  // Como o pedido foi criado com grillmasterId do gm, ele DEVE conseguir ver
  const p9 = s9 === 200 && r9.id === orderId
  console.log('\n[9] GM pode ver pedido vinculado: HTTP', s9, '| id:', r9.id?.slice(0, 8))
  console.log('  ' + (p9 ? 'PASS ✓' : 'FAIL ✗'))
  results.push(p9)

  // ─── [10] Outro cliente não pode ver pedido alheio ───
  const [, cu2] = await api('POST', '/auth/register', { name: 'Intruso OC', email: 'oc.int.' + TS + '@t.com', password: 'senha123' })
  const [s10, r10] = await api('GET', '/orders/' + orderId, null, cu2.token)
  const p10 = s10 === 404
  console.log('\n[10] Cliente intruso não pode ver pedido alheio → 404: HTTP', s10, '|', r10.error?.slice(0, 60))
  console.log('  ' + (p10 ? 'PASS ✓' : 'FAIL ✗'))
  results.push(p10)

  // ─── [11] eventHours default=4 quando omitido ───
  const [s11, r11] = await api('POST', '/orders', {
    grillmasterId: gm.id,
    eventDate: '2026-12-11T18:00:00',
    eventAddress: 'Rua Default Hours, 1, SP',
    guestCount: 5,
    // eventHours omitido — deve usar default 4
  }, cu.token)
  const p11 = s11 === 201 && r11.eventHours === 4 && r11.totalPrice === 400
  console.log('\n[11] eventHours default=4: HTTP', s11, '| eventHours:', r11.eventHours, '| totalPrice:', r11.totalPrice)
  console.log('  ' + (p11 ? 'PASS ✓' : 'FAIL ✗'))
  results.push(p11)

  // ─── [12] Pedido com notes ───
  const [s12, r12] = await api('POST', '/orders', {
    grillmasterId: gm.id,
    eventDate: '2026-12-12T18:00:00',
    eventAddress: 'Rua Com Notas, 55, SP',
    eventHours: 2,
    guestCount: 15,
    notes: 'CORTES: Picanha 2kg, Fraldinha 1.5kg',
  }, cu.token)
  const p12 = s12 === 201 && r12.notes === 'CORTES: Picanha 2kg, Fraldinha 1.5kg'
  console.log('\n[12] Pedido com notes: HTTP', s12, '| notes:', r12.notes?.slice(0, 50))
  console.log('  ' + (p12 ? 'PASS ✓' : 'FAIL ✗'))
  results.push(p12)

  // Resultado final
  const passed = results.filter(Boolean).length
  console.log('\n=== RESULTADO BACKEND:', passed === results.length ? 'PASS ✓' : 'FAIL ✗', '(' + passed + '/' + results.length + ') ===')
}

main().catch(console.error).finally(() => process.exit(0))
