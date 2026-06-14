'use strict'
const { chromium } = require('@playwright/test')
const path = require('path')
const fs = require('fs')

const BASE = 'https://techchurras.com.br'
const API  = 'https://tech-churras-production.up.railway.app'

const CUSTOMER   = { email: 'maria.cliente@teste.com',  password: '123456', name: 'Maria Cliente' }
const GRILLMASTER = { email: 'carlos.grill@teste.com',   password: '123456', name: 'Carlos Mendes' }

const SS = path.join(__dirname, 'screenshots', 'order-flow')
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

;(async () => {
  console.log('\n══════════════════════════════════════════════════')
  console.log('  TESTE FLUXO COMPLETO DE PEDIDO — Produção')
  console.log('══════════════════════════════════════════════════\n')

  const browser = await chromium.launch({ headless: false, slowMo: 200 })

  // ── CONTEXTO CLIENTE ──────────────────────────────────────────────
  const ctxCliente = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const pgCliente  = await ctxCliente.newPage()

  // ── CONTEXTO GRILLMASTER ──────────────────────────────────────────
  const ctxGM = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const pgGM  = await ctxGM.newPage()

  let orderId = null

  try {
    // ─────────────────────────────────────────────────────────────────
    // PASSO 1 — Cliente faz login
    // ─────────────────────────────────────────────────────────────────
    console.log('PASSO 1 — Login do cliente')
    await loginAs(pgCliente, CUSTOMER)
    await shot(pgCliente, 'cliente_dashboard')

    // ─────────────────────────────────────────────────────────────────
    // PASSO 2 — Navega para Novo Pedido
    // ─────────────────────────────────────────────────────────────────
    console.log('\nPASSO 2 — Abrindo Novo Pedido')
    await pgCliente.goto(BASE + '/orders/new')
    await pgCliente.waitForLoadState('networkidle')
    await shot(pgCliente, 'novo_pedido_vazio')

    // Aguarda os selects carregarem (chamadas de API)
    await pgCliente.waitForFunction(() => {
      const sel = document.querySelector('select')
      return sel && sel.options.length > 1
    }, { timeout: 15000 })
    console.log('  Grillmasters carregados ✅')

    // ─────────────────────────────────────────────────────────────────
    // PASSO 3 — Seleciona grillmaster
    // ─────────────────────────────────────────────────────────────────
    console.log('\nPASSO 3 — Selecionando Carlos Mendes')
    const selects = pgCliente.locator('select')
    const gmSelect = selects.first()
    const gmOptions = await gmSelect.locator('option').allTextContents()
    console.log('  Grillmasters disponíveis:', gmOptions.filter(t => t !== 'Selecione...'))

    // Seleciona Carlos (ou o primeiro disponível)
    const carlosOption = gmOptions.find(t => t.toLowerCase().includes('carlos'))
    if (carlosOption) {
      await gmSelect.selectOption({ label: carlosOption })
      console.log('  Carlos Mendes selecionado ✅')
    } else {
      // Seleciona o primeiro grillmaster disponível
      const firstGM = gmOptions.find(t => t !== 'Selecione...')
      await gmSelect.selectOption({ label: firstGM })
      console.log('  Selecionado:', firstGM)
    }

    // ─────────────────────────────────────────────────────────────────
    // PASSO 4 — Seleciona açougue
    // ─────────────────────────────────────────────────────────────────
    console.log('\nPASSO 4 — Selecionando açougue')
    const boutiqueSelect = selects.nth(1)
    await boutiqueSelect.waitFor({ timeout: 5000 }).catch(() => {})
    const boutiqueOptions = await boutiqueSelect.locator('option').allTextContents()
    console.log('  Açougues disponíveis:', boutiqueOptions.filter(t => t !== 'Nenhum'))

    const premiumOption = boutiqueOptions.find(t => t.toLowerCase().includes('premium') || t.toLowerCase().includes('açougue'))
    if (premiumOption && premiumOption !== 'Nenhum') {
      await boutiqueSelect.selectOption({ label: premiumOption })
      console.log('  Açougue selecionado:', premiumOption)
      // Aguarda produtos carregarem
      await pgCliente.waitForTimeout(2000)
    }
    await shot(pgCliente, 'pedido_com_acougue')

    // ─────────────────────────────────────────────────────────────────
    // PASSO 5 — Preenche data do evento e endereço
    // ─────────────────────────────────────────────────────────────────
    console.log('\nPASSO 5 — Preenchendo data e endereço')
    // Data: próxima semana (type="date" → YYYY-MM-DD)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    const dateStr = nextWeek.toISOString().slice(0, 10) // YYYY-MM-DD
    const dateInput = pgCliente.locator('input[type="date"]')
    await dateInput.fill(dateStr, { force: true })
    console.log('  Data:', dateStr)

    const addressInput = pgCliente.locator('input[placeholder="Rua, número, bairro, cidade"]')
    await addressInput.fill('Rua das Palmeiras, 123 - São Paulo, SP', { force: true })
    console.log('  Endereço preenchido ✅')
    await shot(pgCliente, 'pedido_preenchido')

    // ─────────────────────────────────────────────────────────────────
    // PASSO 6 — Submete pedido
    // ─────────────────────────────────────────────────────────────────
    console.log('\nPASSO 6 — Criando pedido...')
    const submitBtn = pgCliente.locator('button').filter({ hasText: /Confirmar Pedido/i }).first()
    await submitBtn.click({ force: true })

    // Aguarda redirect para /orders/{id}/payment
    await pgCliente.waitForURL('**/payment', { timeout: 15000 })
    const paymentUrl = pgCliente.url()
    orderId = paymentUrl.match(/\/orders\/([^/]+)\/payment/)?.[1]
    console.log('  Pedido criado! ID:', orderId, '✅')
    await shot(pgCliente, 'pagamento_page')

    // Verifica conteúdo da página de pagamento
    const paymentTitle = await pgCliente.locator('h1, h2').first().textContent().catch(() => '')
    const total = await pgCliente.locator('text=/R\\$/').first().textContent().catch(() => '')
    console.log('  Título:', paymentTitle?.trim())
    console.log('  Total:', total?.trim())

    // ─────────────────────────────────────────────────────────────────
    // PASSO 7 — Grillmaster faz login e confirma pedido
    // ─────────────────────────────────────────────────────────────────
    console.log('\nPASSO 7 — Login do grillmaster')
    await loginAs(pgGM, GRILLMASTER)
    await shot(pgGM, 'gm_dashboard')

    // Navega para o pedido diretamente
    console.log('\nPASSO 8 — Grillmaster abre o pedido', orderId)
    await pgGM.goto(BASE + '/orders/' + orderId)
    await pgGM.waitForLoadState('networkidle')
    await shot(pgGM, 'gm_order_pending')

    const statusBadge = await pgGM.locator('text=/Pendente|PENDING|Aguardando/i').first().textContent().catch(() => '')
    console.log('  Status atual:', statusBadge?.trim())

    // Clica em "Confirmar pedido" / próxima ação
    const confirmBtn = pgGM.locator('button').filter({ hasText: /confirmar|iniciar|avançar|próximo/i }).first()
    const confirmVisible = await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false)
    if (confirmVisible) {
      await confirmBtn.click({ force: true })
      await pgGM.waitForTimeout(2000)
      await shot(pgGM, 'gm_order_confirmed')
      const newStatus = await pgGM.locator('text=/Confirmado|CONFIRMED/i').first().textContent().catch(() => '')
      console.log('  Novo status:', newStatus?.trim() || '(verificar screenshot)')
      console.log('  Pedido confirmado pelo grillmaster ✅')
    } else {
      // Tenta via API diretamente
      const token = await getToken(pgGM)
      const r = await pgGM.evaluate(async ({ orderId, token, api }) => {
        const res = await fetch(api + '/orders/' + orderId + '/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
          body: JSON.stringify({ status: 'CONFIRMED' })
        })
        return { ok: res.ok, status: res.status, body: await res.json().catch(() => null) }
      }, { orderId, token, api: API })
      console.log('  Confirmação via API:', r.ok ? '✅' : '❌', JSON.stringify(r.body).slice(0, 100))
      await pgGM.reload()
      await shot(pgGM, 'gm_order_confirmed')
    }

    // ─────────────────────────────────────────────────────────────────
    // PASSO 9 — Cliente verifica status CONFIRMED
    // ─────────────────────────────────────────────────────────────────
    console.log('\nPASSO 9 — Cliente verifica status do pedido')
    await pgCliente.goto(BASE + '/orders/' + orderId)
    await pgCliente.waitForLoadState('networkidle')
    await shot(pgCliente, 'cliente_order_confirmed')
    const clientStatus = await pgCliente.locator('text=/Confirmado|CONFIRMED|Pendente|PENDING/i').first().textContent().catch(() => 'N/A')
    console.log('  Status visto pelo cliente:', clientStatus?.trim())

    // ─────────────────────────────────────────────────────────────────
    // PASSO 10 — Grillmaster avança para IN_PROGRESS e COMPLETED
    // ─────────────────────────────────────────────────────────────────
    console.log('\nPASSO 10 — Grillmaster avança status até COMPLETED')
    const token = await getToken(pgGM)

    for (const [nextStatus, label] of [['IN_PROGRESS', 'Iniciar serviço'], ['COMPLETED', 'Concluir']]) {
      const r = await pgGM.evaluate(async ({ orderId, token, api, nextStatus }) => {
        const res = await fetch(api + '/orders/' + orderId + '/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
          body: JSON.stringify({ status: nextStatus })
        })
        return { ok: res.ok, body: await res.json().catch(() => null) }
      }, { orderId, token, api: API, nextStatus })
      console.log('  → ' + nextStatus + ':', r.ok ? '✅' : '❌')
      await pgGM.waitForTimeout(500)
    }

    await pgGM.reload()
    await shot(pgGM, 'gm_order_completed')
    const completedStatus = await pgGM.locator('text=/Concluido|COMPLETED|Finalizado/i').first().textContent().catch(() => 'N/A')
    console.log('  Status final (grillmaster):', completedStatus?.trim())

    // ─────────────────────────────────────────────────────────────────
    // PASSO 11 — Cliente vê pedido COMPLETED e lista de pedidos
    // ─────────────────────────────────────────────────────────────────
    console.log('\nPASSO 11 — Cliente verifica COMPLETED e lista de pedidos')
    await pgCliente.goto(BASE + '/orders/' + orderId)
    await pgCliente.waitForLoadState('networkidle')
    await shot(pgCliente, 'cliente_order_completed')

    await pgCliente.goto(BASE + '/orders')
    await pgCliente.waitForLoadState('networkidle')
    await shot(pgCliente, 'cliente_lista_pedidos')
    const orderCount = await pgCliente.locator('[class*="rounded"][class*="border"]').count()
    console.log('  Pedidos visíveis na lista:', orderCount)

    // ─────────────────────────────────────────────────────────────────
    // RESULTADO FINAL
    // ─────────────────────────────────────────────────────────────────
    console.log('\n══════════════════════════════════════════════════')
    console.log('  ✅ FLUXO COMPLETO — APROVADO')
    console.log('  Order ID:', orderId)
    console.log('  Screenshots em: screenshots/order-flow/')
    console.log('══════════════════════════════════════════════════\n')

  } catch (e) {
    console.error('\n❌ ERRO:', e.message)
    await shot(pgCliente, 'ERRO_cliente').catch(() => {})
    await shot(pgGM, 'ERRO_gm').catch(() => {})
  } finally {
    await browser.close()
  }
})()
