const { chromium, devices } = require('playwright')
const path = require('path')
const { mkdirSync } = require('fs')

const BASE_URL = 'https://tech-churras-production.up.railway.app'
const SHOTS = path.join(__dirname, 'screenshots')

const CU_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM1ZTVhM2RhLWJkYmItNDk1NC1iMzRkLWU5OGE5YmJhZWQ4OSIsInJvbGUiOiJDVVNUT01FUiIsImlhdCI6MTc4MTI4MjU5MH0.oLHnJiRITktJGTBHS4lrGeEvJOqBoIdsJj60FZX6kc4'
const CU_USER = { id: '35e5a3da-bdbb-4954-b34d-e98a9bbaed89', name: 'Cliente Mob', email: 'mob.cu@t.com', role: 'CUSTOMER' }

const MOCK_GM_ID = 'mock-gm-aaa-111'
const MOCK_ORDER_ID = 'mock-order-bbb-222'

const MOCK_GM = {
  id: MOCK_GM_ID,
  bio: 'Especialista em cortes bovinos premium',
  experience: 8,
  pricePerHour: 150,
  available: true,
  city: 'São Paulo',
  state: 'SP',
  rating: 4.8,
  totalOrders: 42,
  approved: true,
  isChancelado: true,
  specialties: 'Churrasco, Assado, Costela',
  user: { name: 'José Grillmaster', email: 'jose.grill@t.com' },
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

function setupMocks(page, intercepted) {
  return page.route('**railway.app/**', async function(route) {
    const url = route.request().url()
    const method = route.request().method()
    const p = url.replace(BASE_URL, '').split('?')[0]
    console.log('  [api] ' + method + ' ' + p)

    if (p === '/grillmasters' && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([MOCK_GM]) })
    }
    if (p === '/boutiques' && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    }
    if (p === '/addresses' && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    }
    if (p === '/orders' && method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}')
      intercepted.orderBody = body
      intercepted.called = true
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: MOCK_ORDER_ID,
          status: 'PENDING',
          totalPrice: 600,
          grillmasterId: MOCK_GM_ID,
          eventDate: body.eventDate,
          eventAddress: body.eventAddress,
          eventHours: body.eventHours,
          guestCount: body.guestCount,
          notes: body.notes || null,
          boutique: null,
          items: [],
        }),
      })
    }
    if (p.includes('/messages') || p.includes('/favorites') || p.includes('/coupons')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    }
    return route.continue()
  })
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const device = devices['iPhone 14']
  const results = []

  console.log('\n=== FLUXO DE CRIAÇÃO DE PEDIDO (mobile) ===')

  const ctx = await browser.newContext(Object.assign({}, device, { locale: 'pt-BR' }))
  const page = await ctx.newPage()
  const intercepted = { called: false, orderBody: null }
  await setupMocks(page, intercepted)
  await injectAuth(page, CU_TOKEN, CU_USER)

  // [1] Navega para listagem de grillmasters
  console.log('\n[1] Abre listagem de grillmasters')
  await page.goto('https://tech-churras.vercel.app/grillmasters')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)
  await shot(page, 'oc_01_grillmasters_list.png', true)

  const pageText1 = (await page.locator('body').innerText()).replace(/\n+/g, ' | ').slice(0, 400)
  console.log('  Pagina: ' + pageText1)

  const hasGM = pageText1.toLowerCase().includes('churrasqueiro') || pageText1.includes('José') || pageText1.includes('JG')
  console.log('  Grillmaster visivel: ' + (hasGM ? 'SIM' : 'NAO'))
  results.push({ name: 'Listagem de grillmasters renderiza', pass: hasGM })

  // [2] Clica em "Contratar"
  console.log('\n[2] Clica no botão Contratar')
  const contratarBtn = page.locator('a[href*="novo"], a[href*="contratar"], button').filter({ hasText: /Contratar/i }).first()
  const contratarVisible = await contratarBtn.isVisible().catch(function() { return false })
  console.log('  Botão Contratar visível: ' + (contratarVisible ? 'SIM' : 'NAO'))

  if (contratarVisible) {
    await contratarBtn.tap()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
  } else {
    // Navega diretamente com grillmasterId
    console.log('  Fallback: navegando diretamente para /menu/novo?grillmasterId=')
    await page.goto('https://tech-churras.vercel.app/menu/novo?grillmasterId=' + MOCK_GM_ID)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
  }
  await shot(page, 'oc_02_form_step1.png', true)

  const formUrl = page.url()
  const onForm = formUrl.includes('/menu/novo') || formUrl.includes('/orders/new')
  console.log('  URL: ' + formUrl)
  console.log('  Na pagina do formulario: ' + (onForm ? 'SIM' : 'NAO'))
  results.push({ name: 'Navega para formulario de pedido', pass: onForm })

  // [3] Step 1: Grillmaster já selecionado pelo URL param
  console.log('\n[3] Step 1 — grillmaster pre-selecionado')
  const step1Text = (await page.locator('body').innerText()).replace(/\n+/g, ' | ').slice(0, 400)
  console.log('  Pagina: ' + step1Text)

  const hasStep1 = step1Text.includes('Grillmaster') || step1Text.includes('Monte Seu Churrasco') || step1Text.includes('Selecionar')
  console.log('  Step 1 visivel: ' + (hasStep1 ? 'SIM' : 'NAO'))
  results.push({ name: 'Step 1 (grillmaster) renderiza', pass: hasStep1 })

  // Se José Grillmaster aparece, clicar nele para selecionar
  const gmCard = page.locator('div').filter({ hasText: 'José Grillmaster' }).first()
  const gmCardVisible = await gmCard.isVisible().catch(function() { return false })
  if (gmCardVisible) {
    await gmCard.tap()
    await page.waitForTimeout(500)
    console.log('  Selecionou José Grillmaster')
  }

  // Clicar Próximo
  const nextBtn1 = page.locator('button').filter({ hasText: /Próximo|Proximo/i }).first()
  await nextBtn1.tap()
  await page.waitForTimeout(1000)
  await shot(page, 'oc_03_form_step2.png', true)

  // [4] Step 2: preenche dados do evento
  console.log('\n[4] Step 2 — preenche dados do evento')
  const step2Text = (await page.locator('body').innerText()).replace(/\n+/g, ' | ').slice(0, 200)
  console.log('  Pagina: ' + step2Text.slice(0, 120))
  const onStep2 = step2Text.includes('Evento') || step2Text.includes('Data') || step2Text.includes('Endere')
  console.log('  Step 2 visivel: ' + (onStep2 ? 'SIM' : 'NAO'))
  results.push({ name: 'Step 2 (evento) renderiza', pass: onStep2 })

  // Preenche data
  const dateInput = page.locator('input[type="date"]').first()
  await dateInput.fill('2026-12-15')
  await page.waitForTimeout(300)

  // Preenche endereço
  const addressInput = page.locator('input[placeholder*="Rua"], input[placeholder*="ndere"]').first()
  await addressInput.fill('Rua das Palmeiras, 200, Moema, São Paulo, SP')
  await page.waitForTimeout(300)

  await shot(page, 'oc_04_step2_filled.png')

  // Clicar Próximo
  const nextBtn2 = page.locator('button').filter({ hasText: /Próximo|Proximo/i }).first()
  await nextBtn2.tap()
  await page.waitForTimeout(1000)
  await shot(page, 'oc_05_form_step3.png', true)

  // [5] Step 3: pular açougue
  console.log('\n[5] Step 3 — pular açougue')
  const step3Text = (await page.locator('body').innerText()).replace(/\n+/g, ' | ').slice(0, 200)
  console.log('  Pagina: ' + step3Text.slice(0, 120))
  const onStep3 = step3Text.includes('Açougue') || step3Text.includes('Acougue') || step3Text.includes('butique') || step3Text.includes('parceiro')
  console.log('  Step 3 visivel: ' + (onStep3 ? 'SIM' : 'NAO'))
  results.push({ name: 'Step 3 (açougue) renderiza', pass: onStep3 })

  // Clicar "Continuar sem açougue" ou Próximo
  const skipBtn = page.locator('button').filter({ hasText: /sem açougue|sem acougue/i }).first()
  const skipVisible = await skipBtn.isVisible().catch(function() { return false })
  if (skipVisible) {
    console.log('  Clicando "Continuar sem açougue"')
    await skipBtn.tap()
  } else {
    const nextBtn3 = page.locator('button').filter({ hasText: /Próximo|Proximo/i }).first()
    await nextBtn3.tap()
  }
  await page.waitForTimeout(1000)
  await shot(page, 'oc_06_form_step4.png', true)

  // [6] Step 4: cortes (sem boutique, apenas avança)
  console.log('\n[6] Step 4 — cortes (sem boutique)')
  const step4Text = (await page.locator('body').innerText()).replace(/\n+/g, ' | ').slice(0, 200)
  console.log('  Pagina: ' + step4Text.slice(0, 120))
  const onStep4 = step4Text.includes('Cortes') || step4Text.includes('cortes') || step4Text.includes('acompanhamento') || step4Text.includes('Açougue sem') || step4Text.includes('optou')
  console.log('  Step 4 visivel: ' + (onStep4 ? 'SIM' : 'NAO'))
  results.push({ name: 'Step 4 (cortes) renderiza', pass: onStep4 })

  const nextBtn4 = page.locator('button').filter({ hasText: /Próximo|Proximo/i }).first()
  await nextBtn4.tap()
  await page.waitForTimeout(1000)
  await shot(page, 'oc_07_form_step5.png', true)

  // [7] Step 5: confirma pedido
  console.log('\n[7] Step 5 — confirmação do pedido')
  const step5Text = (await page.locator('body').innerText()).replace(/\n+/g, ' | ').slice(0, 500)
  console.log('  Pagina: ' + step5Text.slice(0, 300))
  const onStep5 = step5Text.includes('Confirme') || step5Text.includes('confirme') || step5Text.includes('Total') || step5Text.includes('termos')
  console.log('  Step 5 visivel: ' + (onStep5 ? 'SIM' : 'NAO'))
  results.push({ name: 'Step 5 (confirmação) renderiza', pass: onStep5 })

  // Aceita os termos
  const termsCheckbox = page.locator('input[type="checkbox"]').first()
  const termsVisible = await termsCheckbox.isVisible().catch(function() { return false })
  console.log('  Checkbox de termos visível: ' + (termsVisible ? 'SIM' : 'NAO'))
  if (termsVisible) {
    await termsCheckbox.tap()
    await page.waitForTimeout(300)
  }

  await shot(page, 'oc_08_terms_checked.png')

  // Clica "Confirmar Meu Churrasco"
  console.log('\n[8] Submete o pedido')
  const confirmBtn = page.locator('button').filter({ hasText: /Confirmar Meu Churrasco|Confirmar/i }).first()
  const confirmVisible = await confirmBtn.isVisible().catch(function() { return false })
  console.log('  Botão confirmar visível: ' + (confirmVisible ? 'SIM' : 'NAO'))

  if (confirmVisible) {
    await confirmBtn.tap()
    await page.waitForTimeout(4000)
  }

  const finalUrl = page.url()
  console.log('  URL final: ' + finalUrl)
  const redirectedToPayment = finalUrl.includes('/payment') && finalUrl.includes(MOCK_ORDER_ID)
  console.log('  POST /orders interceptado: ' + (intercepted.called ? 'SIM' : 'NAO'))
  if (intercepted.orderBody) {
    console.log('  Body enviado: grillmasterId=' + intercepted.orderBody.grillmasterId?.slice(0, 12) +
      ' | address=' + (intercepted.orderBody.eventAddress?.slice(0, 30) || 'null') +
      ' | eventHours=' + intercepted.orderBody.eventHours +
      ' | guestCount=' + intercepted.orderBody.guestCount)
  }
  console.log('  Redirecionado para /payment: ' + (redirectedToPayment ? 'SIM' : 'NAO'))
  await shot(page, 'oc_09_after_submit.png', true)

  results.push({ name: 'POST /orders interceptado', pass: intercepted.called })
  results.push({ name: 'Redirecionado para /orders/:id/payment', pass: redirectedToPayment })

  // [9] Verifica body do POST
  console.log('\n[9] Valida body do POST /orders')
  const body = intercepted.orderBody || {}
  const bodyValid = body.grillmasterId === MOCK_GM_ID &&
    body.eventAddress && body.eventAddress.length >= 5 &&
    typeof body.eventHours === 'number' && body.eventHours >= 1 &&
    typeof body.guestCount === 'number' && body.guestCount >= 1
  console.log('  grillmasterId:', body.grillmasterId?.slice(0, 20))
  console.log('  eventAddress:', body.eventAddress?.slice(0, 40))
  console.log('  eventHours:', body.eventHours, '| guestCount:', body.guestCount)
  console.log('  Body válido: ' + (bodyValid ? 'SIM' : 'NAO'))
  results.push({ name: 'Body do POST tem campos corretos', pass: bodyValid })

  await ctx.close()
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
