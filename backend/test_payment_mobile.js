const { chromium, devices } = require('playwright')
const path = require('path')
const { mkdirSync } = require('fs')

const BASE_URL = 'https://tech-churras-production.up.railway.app'
const SHOTS = path.join(__dirname, 'screenshots')

const CU_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM1ZTVhM2RhLWJkYmItNDk1NC1iMzRkLWU5OGE5YmJhZWQ4OSIsInJvbGUiOiJDVVNUT01FUiIsImlhdCI6MTc4MTI4MjU5MH0.oLHnJiRITktJGTBHS4lrGeEvJOqBoIdsJj60FZX6kc4'
const CU_USER = { id: '35e5a3da-bdbb-4954-b34d-e98a9bbaed89', name: 'Cliente Mob', email: 'mob.cu@t.com', role: 'CUSTOMER' }

const ORDER_PENDING_ID = 'pay-order-pending-111'
const ORDER_CONFIRMED_ID = 'pay-order-confirmed-222'
const MOCK_CHECKOUT_URL = 'https://sandbox.mercadopago.com/checkout/v1/redirect?pref_id=TEST-mock-pref-abc123'

function mockOrderPending() {
  return {
    id: ORDER_PENDING_ID,
    status: 'PENDING',
    paymentStatus: null,
    totalPrice: 400,
    eventDate: '2026-12-20T18:00:00.000Z',
    eventAddress: 'Rua Pagamento, 99, São Paulo, SP',
    eventHours: 4,
    guestCount: 12,
    grillmaster: { id: 'gm-pay-1', user: { id: 'user-gm-1', name: 'José Grillmaster' }, pricePerHour: 100 },
    customer: { id: CU_USER.id, name: CU_USER.name, averageRating: null },
    boutique: null,
    items: [],
    review: null,
  }
}

function mockOrderConfirmed() {
  return Object.assign(mockOrderPending(), { id: ORDER_CONFIRMED_ID, status: 'CONFIRMED' })
}

async function shot(page, name, full) {
  mkdirSync(SHOTS, { recursive: true })
  await page.screenshot({ path: path.join(SHOTS, name), fullPage: !!full })
  console.log('  screenshot: ' + name)
}

async function injectAuth(page, token, user) {
  await page.goto('https://tech-churras.vercel.app/login')
  await page.waitForLoadState('networkidle')
  await page.evaluate(function(data) {
    localStorage.setItem('auth-storage', JSON.stringify({ state: { token: data.token, user: data.user }, version: 0 }))
  }, { token: token, user: user })
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const device = devices['iPhone 14']
  const results = []

  // ===== PARTE 1: Pedido PENDING — página de pagamento renderiza =====
  console.log('\n=== PARTE 1: Página de pagamento (pedido PENDING) ===')
  {
    const ctx = await browser.newContext(Object.assign({}, device, { locale: 'pt-BR' }))
    const page = await ctx.newPage()
    let prefCallCount = 0

    await page.route('**railway.app/**', async function(route) {
      const url = route.request().url()
      const method = route.request().method()
      const p = url.replace(BASE_URL, '').split('?')[0]
      console.log('  [api] ' + method + ' ' + p)

      if (p === '/orders/' + ORDER_PENDING_ID && method === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockOrderPending()) })
      }
      if (p === '/payments/create-preference' && method === 'POST') {
        prefCallCount++
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ checkout_url: MOCK_CHECKOUT_URL, preferenceId: 'TEST-mock-pref-abc123', amount: 400 }),
        })
      }
      if (p.includes('/messages') || p.includes('/favorites')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
      }
      return route.continue()
    })

    await injectAuth(page, CU_TOKEN, CU_USER)

    // [1] Navega para a página de pagamento
    console.log('\n[1] Navega para /orders/:id/payment (pedido PENDING)')
    await page.goto('https://tech-churras.vercel.app/orders/' + ORDER_PENDING_ID + '/payment')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    await shot(page, 'pay_01_payment_page.png', true)

    const pageText = (await page.locator('body').innerText()).replace(/\n+/g, ' | ').slice(0, 600)
    console.log('  Pagina: ' + pageText)

    const hasPaymentTitle = pageText.includes('Pagamento')
    console.log('  Título "Pagamento" visível: ' + (hasPaymentTitle ? 'SIM' : 'NAO'))
    results.push({ name: 'Página de pagamento renderiza', pass: hasPaymentTitle })

    // [2] Card do pedido mostra nome do grillmaster e valor
    const hasOrderSummary = pageText.includes('José Grillmaster') && (pageText.includes('400') || pageText.includes('400,00'))
    console.log('  Card do pedido (nome + valor): ' + (hasOrderSummary ? 'SIM' : 'NAO'))
    results.push({ name: 'Card do pedido mostra grillmaster e total', pass: hasOrderSummary })

    // [3] POST /payments/create-preference foi chamado
    console.log('\n[3] POST /payments/create-preference chamado: ' + (prefCallCount > 0 ? 'SIM (' + prefCallCount + 'x)' : 'NAO'))
    results.push({ name: 'create-preference chamado automaticamente', pass: prefCallCount > 0 })

    // [4] Botão "Pagar com Mercado Pago" visível e com href correto
    console.log('\n[4] Botão "Pagar com Mercado Pago"')
    const mpLink = page.locator('a[href*="mercadopago"], a').filter({ hasText: /Mercado Pago/i }).first()
    const mpVisible = await mpLink.isVisible().catch(function() { return false })
    console.log('  Botão visível: ' + (mpVisible ? 'SIM' : 'NAO'))

    let mpHref = ''
    if (mpVisible) {
      mpHref = await mpLink.getAttribute('href') || ''
      console.log('  href: ' + mpHref.slice(0, 80))
    }
    const mpHrefCorrect = mpHref === MOCK_CHECKOUT_URL
    console.log('  href aponta para checkout_url mockado: ' + (mpHrefCorrect ? 'SIM' : 'NAO'))
    results.push({ name: 'Botão MP visível com href correto', pass: mpVisible && mpHrefCorrect })

    // [5] Métodos de pagamento listados
    const hasMethods = pageText.includes('Pix') || pageText.includes('Cartao') || pageText.includes('Cartão') || pageText.includes('Boleto')
    console.log('\n[5] Métodos de pagamento listados: ' + (hasMethods ? 'SIM' : 'NAO'))
    results.push({ name: 'Métodos de pagamento listados', pass: hasMethods })

    // [6] Link voltar para o pedido existe
    const backLink = page.locator('a[href*="/orders/' + ORDER_PENDING_ID + '"]').first()
    const backVisible = await backLink.isVisible().catch(function() { return false })
    console.log('\n[6] Link ← voltar ao pedido visível: ' + (backVisible ? 'SIM' : 'NAO'))
    results.push({ name: 'Link ← voltar ao pedido existe', pass: backVisible })

    await ctx.close()
  }

  // ===== PARTE 2: Pedido CONFIRMED → redireciona para detalhes =====
  console.log('\n=== PARTE 2: Pedido CONFIRMED → redireciona para /orders/:id ===')
  {
    const ctx = await browser.newContext(Object.assign({}, device, { locale: 'pt-BR' }))
    const page = await ctx.newPage()

    await page.route('**railway.app/**', async function(route) {
      const url = route.request().url()
      const method = route.request().method()
      const p = url.replace(BASE_URL, '').split('?')[0]
      console.log('  [api] ' + method + ' ' + p)

      if (p === '/orders/' + ORDER_CONFIRMED_ID && method === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockOrderConfirmed()) })
      }
      if (p.includes('/messages') || p.includes('/favorites')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
      }
      return route.continue()
    })

    await injectAuth(page, CU_TOKEN, CU_USER)

    // [7] Pedido CONFIRMED → não deve mostrar página de pagamento
    console.log('\n[7] Pedido CONFIRMED → redireciona para detalhes do pedido')
    await page.goto('https://tech-churras.vercel.app/orders/' + ORDER_CONFIRMED_ID + '/payment')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    await shot(page, 'pay_02_confirmed_redirect.png', true)

    const finalUrl = page.url()
    console.log('  URL final: ' + finalUrl)
    const redirected = finalUrl.includes('/orders/' + ORDER_CONFIRMED_ID) && !finalUrl.includes('/payment')
    console.log('  Redirecionado para detalhes (sem /payment): ' + (redirected ? 'SIM' : 'NAO'))
    results.push({ name: 'Pedido CONFIRMED redireciona de /payment', pass: redirected })

    await ctx.close()
  }

  // ===== PARTE 3: Erro no create-preference → mensagem de erro =====
  console.log('\n=== PARTE 3: Erro no create-preference → exibe erro ===')
  {
    const ctx = await browser.newContext(Object.assign({}, device, { locale: 'pt-BR' }))
    const page = await ctx.newPage()

    await page.route('**railway.app/**', async function(route) {
      const url = route.request().url()
      const method = route.request().method()
      const p = url.replace(BASE_URL, '').split('?')[0]
      console.log('  [api] ' + method + ' ' + p)

      if (p === '/orders/' + ORDER_PENDING_ID && method === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockOrderPending()) })
      }
      if (p === '/payments/create-preference' && method === 'POST') {
        return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'Pedido sem valor - nada a pagar' }) })
      }
      if (p.includes('/messages') || p.includes('/favorites')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
      }
      return route.continue()
    })

    await injectAuth(page, CU_TOKEN, CU_USER)

    // [8] Erro do MP → exibe mensagem de erro
    console.log('\n[8] Erro no create-preference → mensagem de erro visível')
    await page.goto('https://tech-churras.vercel.app/orders/' + ORDER_PENDING_ID + '/payment')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    await shot(page, 'pay_03_error.png', true)

    const errText = (await page.locator('body').innerText()).replace(/\n+/g, ' | ').slice(0, 400)
    console.log('  Pagina: ' + errText.slice(0, 200))
    const hasError = errText.toLowerCase().includes('erro') || errText.includes('sem valor') || errText.includes('Tente novamente')
    console.log('  Mensagem de erro visível: ' + (hasError ? 'SIM' : 'NAO'))
    results.push({ name: 'Erro no create-preference mostra mensagem', pass: hasError })

    await ctx.close()
  }

  await browser.close()

  // Resultado final
  console.log('\n=== RESULTADO MOBILE ===')
  results.forEach(function(r) {
    console.log('  ' + (r.pass ? 'PASS ✓' : 'FAIL ✗') + ' ' + r.name)
  })
  const passed = results.filter(function(r) { return r.pass }).length
  console.log('\n' + (passed === results.length ? 'PASS ✓' : 'FAIL ✗') + ' (' + passed + '/' + results.length + ')')
  console.log('Viewport: iPhone 14 (' + device.viewport.width + 'x' + device.viewport.height + 'px)')
  console.log('Screenshots: ' + SHOTS + '/')
}

main().catch(function(e) { console.error('ERRO:', e.message, e.stack); process.exit(1) })
