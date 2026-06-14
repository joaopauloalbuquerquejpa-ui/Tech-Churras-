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

  // Setup
  const [, cu]  = await api('POST', '/auth/register', { name: 'Cliente Rev', email: 'rev.cu.' + TS + '@t.com', password: 'senha123' })
  const [, gmu] = await api('POST', '/auth/register', { name: 'GM Rev', email: 'rev.gm.' + TS + '@t.com', password: 'senha123', role: 'GRILLMASTER' })
  if (!cu.token || !gmu.token) { console.error('FALHA register:', cu, gmu); process.exit(1) }

  const [, gm] = await api('POST', '/grillmasters', { bio: 'Rev test', experience: 3, pricePerHour: 200, city: 'SP', state: 'SP', galleryUrls: [] }, gmu.token)
  if (!gm.id) { console.error('FALHA grillmaster'); process.exit(1) }
  console.log('Setup OK — GM id:', gm.id.slice(0, 8))

  // Criar pedido e levar até COMPLETED
  const [, order] = await api('POST', '/orders', { grillmasterId: gm.id, eventDate: '2026-09-01T18:00:00', eventAddress: 'Rua Rev, 1, SP', eventHours: 3, guestCount: 20 }, cu.token)
  await api('PATCH', '/orders/' + order.id + '/status', { status: 'CONFIRMED' }, gmu.token)
  await api('PATCH', '/orders/' + order.id + '/status', { status: 'IN_PROGRESS' }, gmu.token)
  const [sc, rc] = await api('PATCH', '/orders/' + order.id + '/status', { status: 'COMPLETED' }, gmu.token)
  console.log('Pedido COMPLETED:', sc, rc.status)
  if (rc.status !== 'COMPLETED') { console.error('Falha ao completar pedido'); process.exit(1) }

  const results = []

  // --- 1. GM avalia cliente (5 estrelas) ---
  const [s1, r1] = await api('POST', '/reviews/customer', { orderId: order.id, customerRating: 5, customerComment: 'Otimo cliente!' }, gmu.token)
  const p1 = s1 === 201 && r1.customerRating === 5
  console.log('\n[1] GM avalia cliente: HTTP', s1, '| customerRating:', r1.customerRating, '| comment:', r1.customerComment)
  console.log('  ' + (p1 ? 'PASS ✓' : 'FAIL ✗'))
  results.push(p1)

  // --- 2. GM tenta avaliar de novo (duplicata) ---
  const [s2, r2] = await api('POST', '/reviews/customer', { orderId: order.id, customerRating: 3 }, gmu.token)
  const p2 = s2 === 400
  console.log('\n[2] GM duplica avaliacao: HTTP', s2, '|', r2.error)
  console.log('  ' + (p2 ? 'PASS ✓' : 'FAIL ✗'))
  results.push(p2)

  // --- 3. Outro GM tenta avaliar cliente alheio ---
  const [, gmu2] = await api('POST', '/auth/register', { name: 'GM2', email: 'rev.gm2.' + TS + '@t.com', password: 'senha123', role: 'GRILLMASTER' })
  const [s3, r3] = await api('POST', '/reviews/customer', { orderId: order.id, customerRating: 2 }, gmu2.token)
  const p3 = s3 === 400
  console.log('\n[3] GM nao designado avalia: HTTP', s3, '|', r3.error)
  console.log('  ' + (p3 ? 'PASS ✓' : 'FAIL ✗'))
  results.push(p3)

  // --- 4. Cliente avalia o GM (4 estrelas + comentario) ---
  const [s4, r4] = await api('POST', '/reviews', { orderId: order.id, grillRating: 4, grillComment: 'Excelente churrasco!' }, cu.token)
  const p4 = s4 === 201 && r4.grillRating === 4
  console.log('\n[4] Cliente avalia GM: HTTP', s4, '| grillRating:', r4.grillRating, '| comment:', r4.grillComment)
  console.log('  ' + (p4 ? 'PASS ✓' : 'FAIL ✗'))
  results.push(p4)

  // --- 5. Cliente tenta avaliar de novo (duplicata) ---
  const [s5, r5] = await api('POST', '/reviews', { orderId: order.id, grillRating: 1 }, cu.token)
  const p5 = s5 === 400
  console.log('\n[5] Cliente duplica avaliacao: HTTP', s5, '|', r5.error)
  console.log('  ' + (p5 ? 'PASS ✓' : 'FAIL ✗'))
  results.push(p5)

  // --- 6. Intruso tenta avaliar pedido alheio (como cliente) ---
  const [, intruder] = await api('POST', '/auth/register', { name: 'Intruso', email: 'rev.int.' + TS + '@t.com', password: 'senha123' })
  const [s6, r6] = await api('POST', '/reviews', { orderId: order.id, grillRating: 5 }, intruder.token)
  const p6 = s6 === 400
  console.log('\n[6] Intruso avalia pedido alheio: HTTP', s6, '|', r6.error)
  console.log('  ' + (p6 ? 'PASS ✓' : 'FAIL ✗'))
  results.push(p6)

  // --- 7. Avaliar pedido nao COMPLETED ---
  const [, order2] = await api('POST', '/orders', { grillmasterId: gm.id, eventDate: '2026-10-01T18:00:00', eventAddress: 'Rua Rev, 2, SP', eventHours: 2, guestCount: 10 }, cu.token)
  const [s7, r7] = await api('POST', '/reviews', { orderId: order2.id, grillRating: 5 }, cu.token)
  const p7 = s7 === 400
  console.log('\n[7] Avaliar pedido PENDING: HTTP', s7, '|', r7.error)
  console.log('  ' + (p7 ? 'PASS ✓' : 'FAIL ✗'))
  results.push(p7)

  // --- 8. Verificar media do GM atualizada ---
  const [s8, r8] = await api('GET', '/grillmasters/' + gm.id, null, null)
  const p8 = s8 === 200 && r8.rating === 4
  console.log('\n[8] Rating medio do GM atualizado: HTTP', s8, '| rating:', r8.rating, '| esperado: 4')
  console.log('  ' + (p8 ? 'PASS ✓' : 'FAIL ✗'))
  results.push(p8)

  // --- 9. Verificar media do cliente atualizada ---
  const [s9, r9] = await api('GET', '/orders/' + order.id, null, cu.token)
  const p9 = s9 === 200 && r9.customer?.averageRating === 5
  console.log('\n[9] Rating medio do cliente atualizado: HTTP', s9, '| averageRating:', r9.customer?.averageRating, '| esperado: 5')
  console.log('  ' + (p9 ? 'PASS ✓' : 'FAIL ✗'))
  results.push(p9)

  const passed = results.filter(Boolean).length
  console.log('\n=== RESULTADO BACKEND:', passed === results.length ? 'PASS ✓' : 'FAIL ✗', '(' + passed + '/' + results.length + ') ===')
}

main().catch(console.error).finally(() => process.exit(0))
