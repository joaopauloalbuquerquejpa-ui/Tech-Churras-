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

  // Setup: register customer + grillmaster
  const [, cu] = await api('POST', '/auth/register', { name: 'Cliente Confirm', email: 'conf.cu.' + TS + '@t.com', password: 'senha123' })
  const [, gmu] = await api('POST', '/auth/register', { name: 'GM Confirm', email: 'conf.gm.' + TS + '@t.com', password: 'senha123', role: 'GRILLMASTER' })
  if (!cu.token || !gmu.token) { console.error('FALHA register:', cu, gmu); process.exit(1) }

  const [sgm, gm] = await api('POST', '/grillmasters', { bio: 'Especialista', experience: 5, pricePerHour: 300, city: 'SP', state: 'SP', galleryUrls: [] }, gmu.token)
  if (!gm.id) { console.error('FALHA grillmaster:', sgm, gm); process.exit(1) }
  console.log('Setup OK — GM id:', gm.id.slice(0, 8))

  const results = []

  // --- 1. Cliente cria pedido (PENDING) ---
  const [so, order] = await api('POST', '/orders', { grillmasterId: gm.id, eventDate: '2026-09-01T18:00:00', eventAddress: 'Rua das Flores, 100, SP', eventHours: 4, guestCount: 30 }, cu.token)
  if (!order.id) { console.error('FALHA criar pedido:', so, order); process.exit(1) }
  console.log('\n[1] Pedido criado: status=' + order.status + ' id=' + order.id.slice(0, 8))
  const p1 = order.status === 'PENDING'
  results.push(p1)
  console.log('  ' + (p1 ? 'PASS ✓ status = PENDING' : 'FAIL ✗'))

  // --- 2. Intruso tenta confirmar (deve ser HTTP 400) ---
  const [, intruder] = await api('POST', '/auth/register', { name: 'Intruso', email: 'int.' + TS + '@t.com', password: 'senha123', role: 'GRILLMASTER' })
  const [si, ri] = await api('PATCH', '/orders/' + order.id + '/status', { status: 'CONFIRMED' }, intruder.token)
  const p2 = si === 400
  console.log('\n[2] Intruso confirma pedido alheio: HTTP', si, '|', ri.error)
  console.log('  ' + (p2 ? 'PASS ✓ rejeitado' : 'FAIL ✗ deveria ser 400'))
  results.push(p2)

  // --- 3. Cliente tenta confirmar (deve ser HTTP 400) ---
  const [sc, rc] = await api('PATCH', '/orders/' + order.id + '/status', { status: 'CONFIRMED' }, cu.token)
  const p3 = sc === 400
  console.log('\n[3] Cliente confirma proprio pedido (nao pode): HTTP', sc, '|', rc.error)
  console.log('  ' + (p3 ? 'PASS ✓ rejeitado' : 'FAIL ✗ deveria ser 400'))
  results.push(p3)

  // --- 4. GM confirma (PENDING → CONFIRMED) ---
  const [s4, r4] = await api('PATCH', '/orders/' + order.id + '/status', { status: 'CONFIRMED' }, gmu.token)
  const p4 = s4 === 200 && r4.status === 'CONFIRMED'
  console.log('\n[4] GM confirma pedido: HTTP', s4, '| status:', r4.status, '| detail:', r4.statusDetail)
  console.log('  ' + (p4 ? 'PASS ✓' : 'FAIL ✗'))
  results.push(p4)

  // --- 5. GM avanca para IN_PROGRESS ---
  const [s5, r5] = await api('PATCH', '/orders/' + order.id + '/status', { status: 'IN_PROGRESS' }, gmu.token)
  const p5 = s5 === 200 && r5.status === 'IN_PROGRESS'
  console.log('\n[5] GM inicia servico: HTTP', s5, '| status:', r5.status)
  console.log('  ' + (p5 ? 'PASS ✓' : 'FAIL ✗'))
  results.push(p5)

  // --- 6. GM conclui (IN_PROGRESS → COMPLETED) ---
  const [s6, r6] = await api('PATCH', '/orders/' + order.id + '/status', { status: 'COMPLETED' }, gmu.token)
  const p6 = s6 === 200 && r6.status === 'COMPLETED'
  console.log('\n[6] GM conclui pedido: HTTP', s6, '| status:', r6.status)
  console.log('  ' + (p6 ? 'PASS ✓' : 'FAIL ✗'))
  results.push(p6)

  // --- 7. GM verifica dashboard (GET /grillmasters/me/orders) ---
  const [s7, r7] = await api('GET', '/grillmasters/me/orders', null, gmu.token)
  const hasOrder = Array.isArray(r7.orders) && r7.orders.some(o => o.id === order.id)
  const p7 = s7 === 200 && hasOrder
  console.log('\n[7] Dashboard GM: HTTP', s7, '| orders:', r7.orders?.length ?? 'N/A', '| pedido aparece:', hasOrder)
  console.log('  ' + (p7 ? 'PASS ✓' : 'FAIL ✗'))
  results.push(p7)

  const passed = results.filter(Boolean).length
  console.log('\n=== RESULTADO BACKEND:', passed === results.length ? 'PASS ✓' : 'FAIL ✗', '(' + passed + '/' + results.length + ') ===')
}

main().catch(console.error).finally(() => process.exit(0))
