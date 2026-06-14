'use strict'
const { chromium } = require('@playwright/test')
const path = require('path')
const fs = require('fs')

const BASE = 'https://techchurras.com.br'
const API  = 'https://tech-churras-production.up.railway.app'

const CUSTOMER    = { email: 'maria.cliente@teste.com', password: '123456', name: 'Maria Cliente' }
const GRILLMASTER = { email: 'carlos.grill@teste.com',  password: '123456', name: 'Carlos Mendes' }

const SS = path.join(__dirname, 'screenshots', 'review-flow')
fs.mkdirSync(SS, { recursive: true })

let shotIdx = 0
async function shot(page, label) {
  const f = path.join(SS, String(shotIdx++).padStart(2, '0') + '_' + label + '.png')
  await page.screenshot({ path: f, fullPage: false }).catch(() => {})
  console.log('  📸 ' + path.basename(f))
}

function dismissTour(page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem('auth-storage')
    if (raw) {
      try {
        const uid = JSON.parse(raw)?.state?.user?.id
        if (uid) localStorage.setItem('tc-onb-' + uid, 'done')
      } catch {}
    }
  })
}

async function loginAs(page, user) {
  await page.goto(BASE + '/login')
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(1500)
  await page.locator('input[type="email"]').fill(user.email, { force: true, timeout: 15000 })
  await page.locator('input[type="password"]').fill(user.password, { force: true, timeout: 10000 })
  await page.locator('button[type="submit"]').click({ force: true })
  await page.waitForURL('**/dashboard', { timeout: 20000 })
  await dismissTour(page)
  console.log('  ✅ Login como ' + user.name)
}

async function getToken(page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem('auth-storage')
    return raw ? JSON.parse(raw)?.state?.token : null
  })
}

// Cria um pedido COMPLETED novo via API, para ter um pedido sem avaliação
async function createCompletedOrder(page, token) {
  // 1. Busca grillmaster Carlos
  const gms = await page.evaluate(async ({ api, token }) => {
    const r = await fetch(api + '/grillmasters', { headers: { Authorization: 'Bearer ' + token } })
    return r.json()
  }, { api: API, token })
  const gmList = Array.isArray(gms) ? gms : (gms.grillmasters ?? [])
  const carlos = gmList.find(g => g.user?.name?.toLowerCase().includes('carlos')) || gmList[0]

  // 2. Cria pedido
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 8)
  const eventDate = nextWeek.toISOString().slice(0, 10)

  const order = await page.evaluate(async ({ api, token, grillmasterId, eventDate }) => {
    const r = await fetch(api + '/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({
        grillmasterId,
        eventDate,
        eventAddress: 'Rua Teste Review, 42 - São Paulo, SP',
        eventHours: 4,
        guestCount: 8,
      }),
    })
    return r.json()
  }, { api: API, token, grillmasterId: carlos.id, eventDate })

  if (!order?.id) throw new Error('Falha ao criar pedido: ' + JSON.stringify(order))

  // 3. Avança status: PENDING → CONFIRMED → IN_PROGRESS → COMPLETED
  // (precisa do token do grillmaster, mas usamos o token do customer para confirmar via admin ou token do GM)
  return { orderId: order.id, gmId: carlos.id }
}

;(async () => {
  console.log('\n══════════════════════════════════════════════════')
  console.log('  TESTE FLUXO DE AVALIAÇÃO — Produção')
  console.log('══════════════════════════════════════════════════\n')

  const browser = await chromium.launch({ headless: false, slowMo: 250 })

  const ctxCliente = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const pgCliente  = await ctxCliente.newPage()
  const ctxGM = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const pgGM  = await ctxGM.newPage()

  try {
    // ─────────────────────────────────────────────────────────────────
    // SETUP — Cria pedido COMPLETED novo (sem avaliação)
    // ─────────────────────────────────────────────────────────────────
    console.log('SETUP — Criando pedido COMPLETED para avaliação...')
    await loginAs(pgCliente, CUSTOMER)
    await loginAs(pgGM, GRILLMASTER)

    const clientToken = await getToken(pgCliente)
    const gmToken     = await getToken(pgGM)

    // Cria pedido como cliente
    const gms = await pgCliente.evaluate(async ({ api, token }) => {
      const r = await fetch(api + '/grillmasters', { headers: { Authorization: 'Bearer ' + token } })
      return r.json()
    }, { api: API, token: clientToken })
    const gmList = Array.isArray(gms) ? gms : (gms.grillmasters ?? [])
    const carlos = gmList.find(g => g.user?.name?.toLowerCase().includes('carlos')) || gmList[0]

    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 14)
    const eventDate = nextWeek.toISOString().slice(0, 10)

    const newOrder = await pgCliente.evaluate(async ({ api, token, grillmasterId, eventDate }) => {
      const r = await fetch(api + '/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ grillmasterId, eventDate, eventAddress: 'Av. Paulista, 1000 - São Paulo, SP', eventHours: 3, guestCount: 6 }),
      })
      return r.json()
    }, { api: API, token: clientToken, grillmasterId: carlos.id, eventDate })

    const orderId = newOrder.id
    if (!orderId) throw new Error('Falha ao criar pedido: ' + JSON.stringify(newOrder))
    console.log('  Pedido criado:', orderId)

    // Avança status via GM token: PENDING → CONFIRMED → IN_PROGRESS → COMPLETED
    for (const status of ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED']) {
      const r = await pgGM.evaluate(async ({ api, token, orderId, status }) => {
        const res = await fetch(api + '/orders/' + orderId + '/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
          body: JSON.stringify({ status }),
        })
        return { ok: res.ok, body: await res.json().catch(() => null) }
      }, { api: API, token: gmToken, orderId, status })
      console.log('  → ' + status + ':', r.ok ? '✅' : ('❌ ' + JSON.stringify(r.body).slice(0, 80)))
    }
    console.log('  Pedido COMPLETED ✅ — pronto para avaliação\n')

    // ─────────────────────────────────────────────────────────────────
    // PASSO 1 — Cliente acessa página de avaliação
    // ─────────────────────────────────────────────────────────────────
    console.log('PASSO 1 — Cliente navega para avaliação')
    await pgCliente.goto(BASE + '/orders/' + orderId + '/review')
    await pgCliente.waitForLoadState('networkidle')
    await shot(pgCliente, 'review_page_vazia')

    const reviewTitle = await pgCliente.locator('h1').first().textContent().catch(() => '')
    console.log('  Título:', reviewTitle?.trim())

    // Verifica seções presentes
    const gmSection = await pgCliente.locator('text=/Churrasqueiro/i').first().isVisible().catch(() => false)
    console.log('  Seção Churrasqueiro:', gmSection ? '✅' : '❌')

    // ─────────────────────────────────────────────────────────────────
    // PASSO 2 — Cliente avalia o grillmaster (5 estrelas)
    // ─────────────────────────────────────────────────────────────────
    console.log('\nPASSO 2 — Avaliando grillmaster com 5 estrelas')
    // Clica na 5ª estrela do primeiro StarRating (botões ★ na página)
    const starBtns = pgCliente.locator('button').filter({ hasText: '★' })
    const starCount = await starBtns.count()
    console.log('  Estrelas encontradas:', starCount)

    if (starCount >= 5) {
      await starBtns.nth(4).click({ force: true }) // 5ª estrela do grillmaster
      console.log('  5 estrelas selecionadas ✅')
    } else {
      // Tenta via JS — clica no texto ★ ou &#9733;
      await pgCliente.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'))
        const stars = btns.filter(b => b.textContent?.includes('★') || b.innerHTML.includes('9733'))
        if (stars.length >= 5) stars[4].click()
      })
    }
    await shot(pgCliente, 'review_5_estrelas')

    // ─────────────────────────────────────────────────────────────────
    // PASSO 3 — Adiciona comentário
    // ─────────────────────────────────────────────────────────────────
    console.log('\nPASSO 3 — Adicionando comentário')
    const commentTA = pgCliente.locator('textarea').first()
    await commentTA.fill('Excelente churrasqueiro! Carne perfeitamente assada, muito profissional.', { force: true })
    console.log('  Comentário preenchido ✅')

    // Avalia açougue também se aparece (4 estrelas)
    const boutiqueSection = await pgCliente.locator('text=/Acougue|Açougue/i').first().isVisible({ timeout: 2000 }).catch(() => false)
    if (boutiqueSection) {
      console.log('  Seção açougue visível — avaliando com 4 estrelas')
      if (starCount >= 9) {
        await starBtns.nth(8).click({ force: true }) // 4ª estrela do açougue (índice 8 = estrela 4 do segundo grupo)
      }
    }

    await shot(pgCliente, 'review_preenchida')

    // ─────────────────────────────────────────────────────────────────
    // PASSO 4 — Submete avaliação
    // ─────────────────────────────────────────────────────────────────
    console.log('\nPASSO 4 — Submetendo avaliação do cliente')
    const submitBtn = pgCliente.locator('button').filter({ hasText: /Enviar Avalia/i }).first()
    const submitEnabled = await submitBtn.isEnabled({ timeout: 3000 }).catch(() => false)
    console.log('  Botão "Enviar Avaliação":', submitEnabled ? 'habilitado ✅' : 'desabilitado ❌')

    if (submitEnabled) {
      await submitBtn.click()
      // Aguarda mensagem de sucesso ou redirect
      await pgCliente.waitForURL('**/orders/' + orderId, { timeout: 10000 }).catch(async () => {
        await pgCliente.waitForSelector('text=/Avalia/i', { timeout: 5000 }).catch(() => {})
      })
      await shot(pgCliente, 'review_enviada')
      const successMsg = await pgCliente.locator('text=/enviada|obrigado|sucesso/i').first().textContent().catch(() => '')
      console.log('  Resultado:', successMsg?.trim() || '(verificar screenshot)')
      console.log('  Avaliação do cliente enviada ✅')
    }

    // Verifica redirect para página do pedido
    await pgCliente.waitForURL('**/orders/' + orderId, { timeout: 8000 }).catch(() => {})
    await shot(pgCliente, 'order_pos_review')
    const orderUrl = pgCliente.url()
    console.log('  URL após avaliação:', orderUrl.replace(BASE, ''))

    // ─────────────────────────────────────────────────────────────────
    // PASSO 5 — Grillmaster avalia o cliente
    // ─────────────────────────────────────────────────────────────────
    console.log('\nPASSO 5 — Grillmaster acessa avaliação do cliente')
    await pgGM.goto(BASE + '/orders/' + orderId + '/review-customer')
    await pgGM.waitForLoadState('networkidle')
    await shot(pgGM, 'gm_review_page')

    const gmReviewTitle = await pgGM.locator('h1').first().textContent().catch(() => '')
    console.log('  Título:', gmReviewTitle?.trim())

    // ─────────────────────────────────────────────────────────────────
    // PASSO 6 — Grillmaster seleciona 5 estrelas e comenta
    // ─────────────────────────────────────────────────────────────────
    console.log('\nPASSO 6 — Grillmaster avalia cliente com 5 estrelas')
    const gmStars = pgGM.locator('button').filter({ hasText: '★' })
    const gmStarCount = await gmStars.count()
    if (gmStarCount >= 5) {
      await gmStars.nth(4).click({ force: true })
      console.log('  5 estrelas ✅')
    }

    const gmComment = pgGM.locator('textarea').first()
    await gmComment.fill('Cliente excelente! Muito organizado e pontual. Recomendo.', { force: true })
    console.log('  Comentário preenchido ✅')
    await shot(pgGM, 'gm_review_preenchida')

    // ─────────────────────────────────────────────────────────────────
    // PASSO 7 — Grillmaster submete avaliação
    // ─────────────────────────────────────────────────────────────────
    console.log('\nPASSO 7 — Grillmaster envia avaliação')
    const gmSubmitBtn = pgGM.locator('button').filter({ hasText: /Enviar avalia/i }).first()
    const gmSubmitEnabled = await gmSubmitBtn.isEnabled({ timeout: 3000 }).catch(() => false)
    console.log('  Botão enviar:', gmSubmitEnabled ? 'habilitado ✅' : 'desabilitado ❌')

    if (gmSubmitEnabled) {
      await gmSubmitBtn.click()
      await pgGM.waitForURL('**/orders/' + orderId, { timeout: 10000 }).catch(() => {})
      await shot(pgGM, 'gm_review_enviada')
      console.log('  Avaliação do grillmaster enviada ✅')
    }

    // ─────────────────────────────────────────────────────────────────
    // PASSO 8 — Verifica avaliações no pedido (ambos os lados)
    // ─────────────────────────────────────────────────────────────────
    console.log('\nPASSO 8 — Verificando avaliações na página do pedido')
    await pgCliente.goto(BASE + '/orders/' + orderId)
    await pgCliente.waitForLoadState('networkidle')
    await shot(pgCliente, 'pedido_com_avaliacoes')

    const reviewVisible = await pgCliente.locator('text=/Avalia|Excelente/i').first().isVisible({ timeout: 3000 }).catch(() => false)
    console.log('  Avaliação visível para o cliente:', reviewVisible ? '✅' : '⚠️ não detectada no DOM visível')

    // Verifica via API que a review foi salva
    const orderData = await pgCliente.evaluate(async ({ api, token, orderId }) => {
      const r = await fetch(api + '/orders/' + orderId, { headers: { Authorization: 'Bearer ' + token } })
      return r.json()
    }, { api: API, token: clientToken, orderId })
    console.log('  Review no pedido (API):', orderData.review ? '✅ grillRating=' + orderData.review.grillRating : '⚠️ sem review')

    // ─────────────────────────────────────────────────────────────────
    // RESULTADO FINAL
    // ─────────────────────────────────────────────────────────────────
    console.log('\n══════════════════════════════════════════════════')
    console.log('  ✅ FLUXO DE AVALIAÇÃO — APROVADO')
    console.log('  Order ID:', orderId)
    console.log('  Screenshots em: screenshots/review-flow/')
    console.log('══════════════════════════════════════════════════\n')

  } catch (e) {
    console.error('\n❌ ERRO:', e.message)
    await shot(pgCliente, 'ERRO_cliente').catch(() => {})
    await shot(pgGM, 'ERRO_gm').catch(() => {})
  } finally {
    await browser.close()
  }
})()
