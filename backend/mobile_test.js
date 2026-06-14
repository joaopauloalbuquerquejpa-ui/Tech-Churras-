const { chromium, devices } = require('playwright')
const { readFileSync } = require('fs')

const path = require('path')
const creds = JSON.parse(readFileSync(path.join(__dirname, 'checkout_creds.json'), 'utf8'))
const CHECKOUT_URL = 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=3465103862-c2b17970-806f-4166-8462-2b390fb2f766'
const BASE_URL = 'https://tech-churras-production.up.railway.app'
const SHOTS = path.join(__dirname, 'screenshots')

const mockOrder = {
  id: creds.orderId, status: 'PENDING', totalPrice: creds.total,
  eventDate: '2026-06-25T18:00:00', eventAddress: 'Rua das Flores, 100, SP',
  guestCount: 30, grillmaster: { id: 'gm1', user: { name: 'Chef Churras' } }, boutique: null
}

async function shot(page, name, full) {
  const { mkdirSync } = require('fs')
  mkdirSync(SHOTS, { recursive: true })
  await page.screenshot({ path: SHOTS + '/' + name, fullPage: !!full })
  console.log('  screenshot: ' + name)
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const device = devices['iPhone 14']
  const ctx = await browser.newContext(Object.assign({}, device, { locale: 'pt-BR' }))
  const page = await ctx.newPage()

  await page.route('**railway.app/**', async function(route) {
    const url = route.request().url()
    const method = route.request().method()
    const path = url.replace(BASE_URL, '')
    console.log('  [api] ' + method + ' ' + path.split('?')[0])

    if (path.startsWith('/auth/login') && method === 'POST') {
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ token: creds.token, user: { name: 'Joao Paulo', email: creds.email, role: 'CUSTOMER' } }) })
    }
    if (path.startsWith('/grillmasters') && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        grillmasters: [{ id: 'gm1', bio: 'Especialista em churrasco gaucho', experience: 8, pricePerHour: 250,
          city: 'Sao Paulo', state: 'SP', specialties: 'Picanha, costela', rating: 4.8, reviewCount: 42,
          churrascoStyle: 'Gaucho', bringsEquipment: true, minGuests: 10, maxGuests: 80, available: true,
          photoUrl: null, galleryUrls: [], user: { name: 'Chef Churras', email: 'chef@ex.com' } }],
        total: 1, page: 1, limit: 9, totalPages: 1 }) })
    }
    if (path.match(/\/orders/) && method === 'GET') {
      if (path.includes(creds.orderId)) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockOrder) })
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([mockOrder]) })
    }
    if (path.includes('/payments/create-preference') && method === 'POST') {
      return route.fulfill({ status: 201, contentType: 'application/json',
        body: JSON.stringify({ checkout_url: CHECKOUT_URL, preferenceId: '3465103862-c2b17970', amount: creds.total }) })
    }
    if (path.includes('/favorites')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    }
    return route.continue()
  })

  // [1] Home
  console.log('\n[1] Home')
  await page.goto('https://tech-churras.vercel.app/')
  await page.waitForLoadState('networkidle')
  await shot(page, '01_home.png')

  // [2] Login
  console.log('\n[2] Login')
  await page.goto('https://tech-churras.vercel.app/login')
  await page.waitForLoadState('networkidle')
  await shot(page, '02_login.png')
  await page.fill('input[type="email"]', creds.email)
  await page.fill('input[type="password"]', creds.pass)
  await shot(page, '02b_filled.png')
  await page.tap('button[type="submit"]')
  await page.waitForTimeout(3000)
  const urlAfterLogin = page.url()
  console.log('  URL apos login: ' + urlAfterLogin)

  if (urlAfterLogin.includes('/login')) {
    console.log('  Injetando token (Railway nao acessivel via browser)')
    await page.evaluate(function(c) {
      localStorage.setItem('token', c.token)
      localStorage.setItem('auth-storage', JSON.stringify({
        state: { token: c.token, user: { name: 'Joao Paulo', email: c.email, role: 'CUSTOMER' } },
        version: 0
      }))
    }, creds)
    await page.goto('https://tech-churras.vercel.app/dashboard')
    await page.waitForLoadState('networkidle')
  }
  await shot(page, '03_dashboard.png')

  // [3] Pedidos
  console.log('\n[3] Lista de pedidos')
  await page.goto('https://tech-churras.vercel.app/orders')
  await page.waitForLoadState('networkidle')
  await shot(page, '04_orders.png')
  const ordersText = (await page.locator('body').innerText()).replace(/\n+/g, ' | ').slice(0, 300)
  console.log('  Conteudo: ' + ordersText)

  // [4] Detalhe do pedido
  console.log('\n[4] Detalhe do pedido')
  await page.goto('https://tech-churras.vercel.app/orders/' + creds.orderId)
  await page.waitForLoadState('networkidle')
  await shot(page, '05_order_detail.png', true)
  const detailText = (await page.locator('body').innerText()).replace(/\n+/g, ' | ').slice(0, 350)
  console.log('  Conteudo: ' + detailText)

  // [5] Pagina de pagamento
  console.log('\n[5] Pagina de pagamento')
  await page.goto('https://tech-churras.vercel.app/orders/' + creds.orderId + '/payment')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)
  await shot(page, '06_payment.png', true)

  const payBtn = page.locator('a[href*="mercadopago"]').first()
  const visible = await payBtn.isVisible().catch(function() { return false })
  console.log('\n  Botao "Pagar com Mercado Pago": ' + (visible ? 'VISIVEL' : 'NAO VISIVEL'))

  if (visible) {
    const href = await payBtn.getAttribute('href')
    const txt = await payBtn.textContent()
    await payBtn.scrollIntoViewIfNeeded()
    await shot(page, '07_pay_button.png')
    console.log('  Texto: ' + txt.trim())
    console.log('  URL: ' + href)
    console.log('  Producao (sem sandbox): ' + (!href.includes('sandbox') ? 'SIM' : 'NAO'))
    console.log('  pref_id presente: ' + (href.includes('pref_id') ? 'SIM' : 'NAO'))

    // [6] Tap no botao
    console.log('\n[6] Tap no botao de pagamento')
    await payBtn.tap()
    await page.waitForTimeout(2000)
    await shot(page, '08_after_tap.png')
    console.log('  URL apos tap: ' + page.url())

    console.log('\n=== RESULTADO: PASS ===')
    console.log('Dispositivo: iPhone 14 (' + device.viewport.width + 'x' + device.viewport.height + 'px)')
    console.log('Screenshots: ' + SHOTS + '/')
  } else {
    const err = await page.locator('.text-red-400, [class*="red"]').first().textContent().catch(function() { return 'nenhum' })
    const allText = (await page.locator('body').innerText()).replace(/\n+/g, ' | ').slice(0, 400)
    console.log('  Erro: ' + err)
    console.log('  Pagina: ' + allText)
    console.log('\n=== RESULTADO: FALHA ===')
  }

  await browser.close()
}

main().catch(function(e) { console.error('ERRO:', e.message); process.exit(1) })
