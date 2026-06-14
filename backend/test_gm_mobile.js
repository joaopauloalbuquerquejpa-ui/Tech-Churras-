const { chromium, devices } = require('playwright')
const path = require('path')
const { mkdirSync } = require('fs')

const BASE_URL = 'https://tech-churras-production.up.railway.app'
const SHOTS = path.join(__dirname, 'screenshots')

const GM_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjI4ZTNiZDBiLTEzMGYtNDcyMS04OTRmLTlhODZjMTIxMWRlOSIsInJvbGUiOiJHUklMTE1BU1RFUiIsImlhdCI6MTc4MTI3OTQ4NX0.U8ec749Dh26C7P3WMoficAXIBvaBz-GH8ptwZFWlnQk'
const GM_USER = { id: '28e3bd0b-130f-4721-894f-9a86c1211de9', name: 'GM UI', email: 'ui.gm@t.com', role: 'GRILLMASTER' }
const ORDER_ID = 'b8dfe8a9-4799-4f5f-9ff0-c47d706b10f7'

// Mutable state to simulate status advancement
let orderStatus = 'PENDING'
let orderDetail = null

const mockOrder = {
  id: ORDER_ID,
  status: 'PENDING',
  statusDetail: null,
  totalPrice: 600,
  eventDate: '2026-10-01T18:00:00',
  eventAddress: 'Rua UI, 1, SP',
  eventHours: 3,
  guestCount: 20,
  grillmaster: { id: 'gm-profile-id', user: { id: GM_USER.id, name: GM_USER.name }, pricePerHour: 200 },
  customer: { id: 'cu-id', name: 'Cliente UI' },
  boutique: null,
  items: [],
}

async function shot(page, name, full) {
  mkdirSync(SHOTS, { recursive: true })
  await page.screenshot({ path: path.join(SHOTS, name), fullPage: !!full })
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
    const p = url.replace(BASE_URL, '')
    console.log('  [api] ' + method + ' ' + p.split('?')[0])

    // Auth
    if (p.startsWith('/auth/') && method === 'POST') {
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ token: GM_TOKEN, user: GM_USER }) })
    }

    // Grillmaster dashboard orders
    if (p === '/grillmasters/me/orders' && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({
          grillmaster: { id: 'gm-profile-id', rating: 4.8, totalOrders: 10, pricePerHour: 200, city: 'SP', state: 'SP', isChancelado: false },
          orders: [Object.assign({}, mockOrder, { status: orderStatus, statusDetail: orderDetail })],
        }) })
    }

    // Order detail
    if (p.includes(ORDER_ID) && p.match(/\/orders\/[^/]+$/) && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify(Object.assign({}, mockOrder, { status: orderStatus, statusDetail: orderDetail })) })
    }

    // Advance status
    if (p.includes(ORDER_ID) && p.endsWith('/status') && method === 'PATCH') {
      const body = JSON.parse(route.request().postData() || '{}')
      orderStatus = body.status
      orderDetail = body.status === 'CONFIRMED' ? 'Pedido confirmado' : body.status === 'IN_PROGRESS' ? 'Churrasqueiro chegou' : 'Finalizado'
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify(Object.assign({}, mockOrder, { status: orderStatus, statusDetail: orderDetail })) })
    }

    // Messages
    if (p.includes('/messages') && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    }
    if (p.includes('/messages/read') && method === 'PATCH') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
    }

    return route.continue()
  })

  // [1] Inject GM auth and navigate to grillmaster dashboard
  console.log('\n[1] Autenticar como grillmaster')
  await page.goto('https://tech-churras.vercel.app/login')
  await page.waitForLoadState('networkidle')
  await page.evaluate(function(data) {
    localStorage.setItem('auth-storage', JSON.stringify({
      state: { token: data.token, user: data.user },
      version: 0,
    }))
  }, { token: GM_TOKEN, user: GM_USER })
  await page.goto('https://tech-churras.vercel.app/grillmasters/dashboard')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)
  await shot(page, 'gm_01_dashboard.png')
  const dashText = (await page.locator('body').innerText()).replace(/\n+/g, ' | ').slice(0, 300)
  console.log('  Dashboard: ' + dashText)

  // Verify pending order appears in dashboard
  const hasPending = dashText.includes('Aguardando') || dashText.includes('PENDING') || dashText.includes('Cliente UI')
  console.log('  Pedido PENDING no dashboard: ' + (hasPending ? 'SIM' : 'NAO'))

  // [2] Click on the order row (now a Link)
  console.log('\n[2] Clicar no pedido para ver detalhes')
  const orderLink = page.locator('a[href*="' + ORDER_ID + '"]').first()
  const linkVisible = await orderLink.isVisible().catch(function() { return false })
  console.log('  Link para pedido visivel: ' + (linkVisible ? 'SIM' : 'NAO'))

  if (linkVisible) {
    await orderLink.tap()
  } else {
    // fallback: navigate directly
    console.log('  Navegando diretamente para detalhe do pedido')
    await page.goto('https://tech-churras.vercel.app/orders/' + ORDER_ID)
  }
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)
  await shot(page, 'gm_02_order_detail.png', true)
  const detailText = (await page.locator('body').innerText()).replace(/\n+/g, ' | ').slice(0, 400)
  console.log('  Detalhe: ' + detailText)

  // [3] Find and click confirm button
  console.log('\n[3] Botao "Confirmar pedido"')
  const confirmBtn = page.locator('button', { hasText: 'Confirmar pedido' }).first()
  const confirmVisible = await confirmBtn.isVisible().catch(function() { return false })
  console.log('  Botao visivel: ' + (confirmVisible ? 'SIM' : 'NAO'))

  if (!confirmVisible) {
    const allBtns = await page.locator('button').allTextContents()
    console.log('  Botoes disponiveis: ' + allBtns.join(' | '))
    console.log('\n=== RESULTADO: FAIL — botao Confirmar pedido nao encontrado ===')
    await browser.close()
    process.exit(1)
  }

  await confirmBtn.scrollIntoViewIfNeeded()
  await shot(page, 'gm_03_confirm_button.png')
  await confirmBtn.tap()
  await page.waitForTimeout(2000)
  await shot(page, 'gm_04_after_confirm.png', true)

  const afterText = (await page.locator('body').innerText()).replace(/\n+/g, ' | ').slice(0, 400)
  console.log('  Apos confirmar: ' + afterText)
  const isConfirmed = afterText.includes('Confirmado') || afterText.includes('CONFIRMED')
  console.log('  Status CONFIRMED na pagina: ' + (isConfirmed ? 'SIM' : 'NAO'))

  // [4] Verify "Iniciar servico" button appears
  console.log('\n[4] Botao "Iniciar servico"')
  const startBtn = page.locator('button', { hasText: 'Iniciar servico' }).first()
  const startVisible = await startBtn.isVisible().catch(function() { return false })
  console.log('  Botao visivel: ' + (startVisible ? 'SIM' : 'NAO'))

  if (startVisible) {
    await startBtn.scrollIntoViewIfNeeded()
    await shot(page, 'gm_05_start_button.png')
    await startBtn.tap()
    await page.waitForTimeout(2000)
    await shot(page, 'gm_06_in_progress.png', true)
    const inProgressText = (await page.locator('body').innerText()).replace(/\n+/g, ' | ').slice(0, 300)
    console.log('  IN_PROGRESS: ' + inProgressText)
  }

  console.log('\n=== RESULTADO: ' + (confirmVisible && isConfirmed ? 'PASS ✓' : 'FAIL ✗') + ' ===')
  console.log('Viewport: iPhone 14 (' + device.viewport.width + 'x' + device.viewport.height + 'px)')
  console.log('Screenshots: ' + SHOTS + '/')

  await browser.close()
}

main().catch(function(e) { console.error('ERRO:', e.message, e.stack); process.exit(1) })
