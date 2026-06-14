const { chromium, devices } = require('playwright')
const path = require('path')
const { mkdirSync } = require('fs')

const BASE_URL = 'https://tech-churras-production.up.railway.app'
const SHOTS = path.join(__dirname, 'screenshots')

const GM_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVhYTk2NTI1LTQxMjQtNGE1Zi05YzFjLWExNDBiNDkwY2IxZiIsInJvbGUiOiJHUklMTE1BU1RFUiIsImlhdCI6MTc4MTI4MjU5MH0.o1mWOwd3zUSWOKtHD-ny9YgyFqzMhrsw9cPCUB1aZZQ'
const GM_USER = { id: '5aa96525-4124-4a5f-9c1c-a140b490cb1f', name: 'GM Mob', email: 'mob.gm@t.com', role: 'GRILLMASTER' }
const CU_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM1ZTVhM2RhLWJkYmItNDk1NC1iMzRkLWU5OGE5YmJhZWQ4OSIsInJvbGUiOiJDVVNUT01FUiIsImlhdCI6MTc4MTI4MjU5MH0.oLHnJiRITktJGTBHS4lrGeEvJOqBoIdsJj60FZX6kc4'
const CU_USER = { id: '35e5a3da-bdbb-4954-b34d-e98a9bbaed89', name: 'Cliente Mob', email: 'mob.cu@t.com', role: 'CUSTOMER' }
const ORDER_ID = 'ee1d26e4-9fef-4757-99a0-7c461ba6b4a6'

function mockOrder(extraReview) {
  return {
    id: ORDER_ID, status: 'COMPLETED', statusDetail: 'Finalizado', totalPrice: 600,
    eventDate: '2026-09-01T18:00:00', eventAddress: 'Rua Mob, 1, SP', eventHours: 3, guestCount: 20,
    grillmaster: { id: '3b515309-5031-4fd0-a380-df6ebd5967b0', user: { id: GM_USER.id, name: GM_USER.name }, pricePerHour: 200 },
    customer: { id: CU_USER.id, name: CU_USER.name, averageRating: null },
    boutique: null, items: [],
    review: extraReview || null,
  }
}

async function shot(page, name, full) {
  mkdirSync(SHOTS, { recursive: true })
  await page.screenshot({ path: path.join(SHOTS, name), fullPage: !!full })
  console.log('  screenshot: ' + name)
}

function makeRoute(page, reviewState) {
  return page.route('**railway.app/**', async function(route) {
    const url = route.request().url()
    const method = route.request().method()
    const p = url.replace(BASE_URL, '')
    console.log('  [api] ' + method + ' ' + p.split('?')[0])

    if (p === '/orders/' + ORDER_ID && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockOrder(reviewState.review)) })
    }
    if (p.includes('/messages') || p.includes('/favorites')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    }
    if (p === '/reviews/customer' && method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}')
      reviewState.review = { customerRating: body.customerRating, customerComment: body.customerComment || null }
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'rev-1', ...reviewState.review }) })
    }
    if (p === '/reviews' && method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}')
      reviewState.review = Object.assign(reviewState.review || {}, { grillRating: body.grillRating, grillComment: body.grillComment || null })
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'rev-1', ...reviewState.review }) })
    }
    return route.continue()
  })
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

  // ===== PARTE 1: GM avalia cliente =====
  console.log('\n=== PARTE 1: Grillmaster avalia cliente ===')
  {
    const ctx = await browser.newContext(Object.assign({}, device, { locale: 'pt-BR' }))
    const page = await ctx.newPage()
    const reviewState = { review: null }
    await makeRoute(page, reviewState)
    await injectAuth(page, GM_TOKEN, GM_USER)

    // [1] GM navega para review-customer
    console.log('\n[1] GM acessa pagina de avaliar cliente')
    await page.goto('https://tech-churras.vercel.app/orders/' + ORDER_ID + '/review-customer')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    await shot(page, 'rev_01_gm_review_page.png', true)
    const pageText = (await page.locator('body').innerText()).replace(/\n+/g, ' | ').slice(0, 300)
    console.log('  Pagina: ' + pageText)

    const hasTitle = pageText.includes('Avaliar cliente') || pageText.includes('cliente')
    console.log('  Titulo "Avaliar cliente": ' + (hasTitle ? 'SIM' : 'NAO'))
    results.push({ name: 'Pagina review-customer renderiza', pass: hasTitle })

    // [2] Seleciona 4 estrelas
    console.log('\n[2] GM seleciona 4 estrelas')
    const stars = page.locator('button.text-3xl')
    const starCount = await stars.count()
    console.log('  Estrelas encontradas: ' + starCount)
    if (starCount >= 4) {
      await stars.nth(3).tap()  // 4th star (index 3)
      await page.waitForTimeout(500)
      await shot(page, 'rev_02_stars_selected.png')
      const ratingLabel = await page.locator('p.text-sm.text-gray-400').last().textContent().catch(function() { return '' })
      console.log('  Label de rating: ' + ratingLabel.trim())
    }
    results.push({ name: 'Selecionou estrelas', pass: starCount >= 4 })

    // [3] Preenche comentario
    console.log('\n[3] GM digita comentario')
    const textarea = page.locator('textarea').first()
    await textarea.fill('Excelente cliente, pontual e educado!')
    await shot(page, 'rev_03_comment_filled.png')
    console.log('  Comentario preenchido')

    // [4] Submete avaliacao
    console.log('\n[4] GM submete avaliacao')
    const submitBtn = page.locator('button[type="submit"]').first()
    const submitEnabled = !(await submitBtn.isDisabled())
    console.log('  Botao submit habilitado: ' + (submitEnabled ? 'SIM' : 'NAO'))
    await submitBtn.tap()
    await page.waitForTimeout(3000)
    const urlAfterSubmit = page.url()
    console.log('  URL apos submit: ' + urlAfterSubmit)
    const redirectedToOrder = urlAfterSubmit.includes('/orders/' + ORDER_ID) && !urlAfterSubmit.includes('/review')
    console.log('  Redirecionado para detalhe do pedido: ' + (redirectedToOrder ? 'SIM' : 'NAO'))
    await shot(page, 'rev_04_after_submit.png', true)
    results.push({ name: 'GM submete e e redirecionado', pass: submitEnabled && redirectedToOrder })

    await ctx.close()
  }

  // ===== PARTE 2: Cliente avalia grillmaster =====
  console.log('\n=== PARTE 2: Cliente avalia grillmaster ===')
  {
    const ctx = await browser.newContext(Object.assign({}, device, { locale: 'pt-BR' }))
    const page = await ctx.newPage()
    const reviewState = { review: null }  // fresh, no review yet from customer side
    await makeRoute(page, reviewState)
    await injectAuth(page, CU_TOKEN, CU_USER)

    // [5] Cliente navega para /review
    console.log('\n[5] Cliente acessa pagina de avaliar grillmaster')
    await page.goto('https://tech-churras.vercel.app/orders/' + ORDER_ID + '/review')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    await shot(page, 'rev_05_cu_review_page.png', true)
    const pageText2 = (await page.locator('body').innerText()).replace(/\n+/g, ' | ').slice(0, 300)
    console.log('  Pagina: ' + pageText2)

    const hasTitle2 = pageText2.includes('Avaliar Pedido') || pageText2.includes('Churrasqueiro')
    console.log('  Titulo "Avaliar Pedido": ' + (hasTitle2 ? 'SIM' : 'NAO'))
    results.push({ name: 'Pagina review (cliente) renderiza', pass: hasTitle2 })

    // [6] Cliente seleciona 5 estrelas para o GM
    console.log('\n[6] Cliente seleciona 5 estrelas')
    const stars2 = page.locator('button.text-2xl, button[style*="color"]').filter({ hasText: '★' })
    const starCount2 = await stars2.count()
    console.log('  Estrelas encontradas: ' + starCount2)
    if (starCount2 >= 5) {
      await stars2.nth(4).tap()  // 5th star
      await page.waitForTimeout(500)
      await shot(page, 'rev_06_stars_selected.png')
    }
    results.push({ name: 'Cliente seleciona estrelas', pass: starCount2 >= 4 })

    // [7] Submete avaliacao do cliente
    console.log('\n[7] Cliente submete avaliacao')
    const submitBtn2 = page.locator('button[type="submit"]').first()
    const submitEnabled2 = !(await submitBtn2.isDisabled())
    console.log('  Botao submit habilitado: ' + (submitEnabled2 ? 'SIM' : 'NAO'))
    await submitBtn2.tap()
    await page.waitForTimeout(3000)
    const urlAfterSubmit2 = page.url()
    console.log('  URL apos submit: ' + urlAfterSubmit2)
    const redirectedToOrder2 = urlAfterSubmit2.includes('/orders/' + ORDER_ID) && !urlAfterSubmit2.includes('/review')
    console.log('  Redirecionado para detalhe do pedido: ' + (redirectedToOrder2 ? 'SIM' : 'NAO'))
    await shot(page, 'rev_07_after_submit.png', true)
    results.push({ name: 'Cliente submete e e redirecionado', pass: submitEnabled2 && redirectedToOrder2 })

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
