const BASE = 'http://localhost:3333'

async function api(method, path, body, token) {
  const h = { 'Content-Type': 'application/json' }
  if (token) h['Authorization'] = 'Bearer ' + token
  const r = await fetch(BASE + path, {
    method,
    headers: h,
    body: body ? JSON.stringify(body) : undefined,
  })
  return [r.status, await r.json()]
}

async function main() {
  const TS = Date.now()

  const [, cu]  = await api('POST', '/auth/register', { name: 'Cliente Cancel', email: 'cancel.cu.' + TS + '@t.com', password: 'senha123' })
  const [, gmu] = await api('POST', '/auth/register', { name: 'GM Cancel', email: 'cancel.gm.' + TS + '@t.com', password: 'senha123' })
  const [sgm, gm] = await api('POST', '/grillmasters', { bio: 'x', experience: 1, pricePerHour: 500, city: 'SP', state: 'SP', galleryUrls: [] }, gmu.token)
  if (!gm.id) { console.error('FALHA ao criar grillmaster:', sgm, JSON.stringify(gm)); process.exit(1) }
  console.log('Setup OK — GM id:', gm.id, '| pricePerHour: 500')

  // --- 1. Cancelar PENDING (gratis) ---
  const [, o1] = await api('POST', '/orders', { grillmasterId: gm.id, eventDate: '2026-08-01T18:00:00', eventAddress: 'Rua A, 1, SP', eventHours: 4, guestCount: 20 }, cu.token)
  if (!o1.id) { console.error('FALHA ao criar pedido 1:', JSON.stringify(o1)); process.exit(1) }
  const [s1, r1] = await api('PATCH', '/orders/' + o1.id + '/cancel', { reason: 'Mudei de planos' }, cu.token)
  const pass1 = s1 === 200 && r1.status === 'CANCELLED' && r1.cancellationFee == null
  console.log('\n[1] Cancelar PENDING (gratis)')
  console.log('  HTTP', s1, '| status:', r1.status, '| fee:', r1.cancellationFee, '| motivo:', r1.cancellationReason)
  console.log('  ', pass1 ? 'PASS ✓' : 'FAIL ✗')

  // --- 2. Cancelar CONFIRMED >48h (gratis) ---
  const [, o2] = await api('POST', '/orders', { grillmasterId: gm.id, eventDate: '2026-09-15T18:00:00', eventAddress: 'Rua B, 2, SP', eventHours: 3, guestCount: 15 }, cu.token)
  if (!o2.id) { console.error('FALHA pedido 2:', JSON.stringify(o2)); process.exit(1) }
  const [sc2, rc2] = await api('PATCH', '/orders/' + o2.id + '/status', { status: 'CONFIRMED' }, gmu.token)
  console.log('\n[2] Confirmar pedido 2:', sc2, rc2.status || rc2.error)
  const [s2, r2] = await api('PATCH', '/orders/' + o2.id + '/cancel', { reason: 'Evento desmarcado' }, cu.token)
  const pass2 = s2 === 200 && r2.status === 'CANCELLED' && r2.cancellationFee == null
  console.log('  Cancelar CONFIRMED >48h (gratis)')
  console.log('  HTTP', s2, '| status:', r2.status, '| fee:', r2.cancellationFee)
  console.log('  ', pass2 ? 'PASS ✓' : 'FAIL ✗')

  // --- 3. Cancelar CONFIRMED <24h (multa 50%) ---
  const nearDate = new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString()
  const [, o3] = await api('POST', '/orders', { grillmasterId: gm.id, eventDate: nearDate, eventAddress: 'Rua C, 3, SP', eventHours: 2, guestCount: 10 }, cu.token)
  if (!o3.id) { console.error('FALHA pedido 3:', JSON.stringify(o3)); process.exit(1) }
  const [sc3, rc3] = await api('PATCH', '/orders/' + o3.id + '/status', { status: 'CONFIRMED' }, gmu.token)
  console.log('\n[3] Confirmar pedido 3 (evento em 10h):', sc3, rc3.status || rc3.error)
  const [s3, r3] = await api('PATCH', '/orders/' + o3.id + '/cancel', { reason: 'Emergencia' }, cu.token)
  const expectedFee3 = o3.totalPrice * 0.5
  const pass3 = s3 === 200 && r3.status === 'CANCELLED' && r3.cancellationFee === expectedFee3
  console.log('  Cancelar CONFIRMED <24h (multa 50%)')
  console.log('  HTTP', s3, '| totalPrice:', o3.totalPrice, '| fee:', r3.cancellationFee, '| esperado:', expectedFee3)
  console.log('  ', pass3 ? 'PASS ✓' : 'FAIL ✗')

  // --- 4. Tentar cancelar pedido ja CANCELLED ---
  const [s4, r4] = await api('PATCH', '/orders/' + o1.id + '/cancel', { reason: 'Segunda tentativa' }, cu.token)
  const pass4 = s4 === 400
  console.log('\n[4] Cancelar pedido ja CANCELLED')
  console.log('  HTTP', s4, '|', r4.error)
  console.log('  ', pass4 ? 'PASS ✓' : 'FAIL ✗')

  // --- 5. Intruso tentando cancelar pedido alheio ---
  const [, intruso] = await api('POST', '/auth/register', { name: 'Intruso', email: 'intruso.' + TS + '@t.com', password: 'senha123' })
  const [, o5] = await api('POST', '/orders', { grillmasterId: gm.id, eventDate: '2026-09-20T18:00:00', eventAddress: 'Rua D, 4, SP', eventHours: 2, guestCount: 8 }, cu.token)
  const [s5, r5] = await api('PATCH', '/orders/' + o5.id + '/cancel', { reason: 'Intruso' }, intruso.token)
  const pass5 = s5 === 400
  console.log('\n[5] Intruso cancelando pedido alheio')
  console.log('  HTTP', s5, '|', r5.error)
  console.log('  ', pass5 ? 'PASS ✓' : 'FAIL ✗')

  // --- 6. Tentar cancelar IN_PROGRESS ---
  const [, o6] = await api('POST', '/orders', { grillmasterId: gm.id, eventDate: nearDate, eventAddress: 'Rua E, 5, SP', eventHours: 3, guestCount: 12 }, cu.token)
  await api('PATCH', '/orders/' + o6.id + '/status', { status: 'CONFIRMED' }, gmu.token)
  await api('PATCH', '/orders/' + o6.id + '/status', { status: 'IN_PROGRESS' }, gmu.token)
  const [s6, r6] = await api('PATCH', '/orders/' + o6.id + '/cancel', { reason: 'Too late' }, cu.token)
  const pass6 = s6 === 400
  console.log('\n[6] Cancelar pedido IN_PROGRESS')
  console.log('  HTTP', s6, '|', r6.error)
  console.log('  ', pass6 ? 'PASS ✓' : 'FAIL ✗')

  const all = [pass1, pass2, pass3, pass4, pass5, pass6]
  console.log('\n=== RESULTADO BACKEND:', all.every(Boolean) ? 'PASS ✓ (todos os cenarios)' : 'FAIL ✗ (' + all.filter(Boolean).length + '/6)' + ' ===')
}

main().catch(console.error).finally(() => process.exit(0))
