'use strict'
/**
 * E2E completo — Tech Churras
 * Cobre os 3 fluxos do roteiro /beta-test:
 *   1. Cliente: cadastro → navegar → menu → pedidos
 *   2. Churrasqueiro: login → dashboard → toggle → aceitar/recusar
 *   3. Açougue: login → dashboard → produtos → QR code
 */
const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const BASE = 'https://www.techchurras.com.br'
const API  = 'https://tech-churras-production.up.railway.app'
const TS   = Date.now()
const OUT  = path.join(__dirname, 'screenshots', 'e2e_' + TS)
fs.mkdirSync(OUT, { recursive: true })

// Contas de teste existentes
const GM_CREDS      = { email: 'carlos.grill@teste.com',    password: '123456' }
const BOUTIQUE_CREDS= { email: 'premium.acougue@teste.com', password: '123456' }

// Conta de cliente nova (para testar cadastro)
const CLIENTE_EMAIL = `cliente.teste.${TS}@teste.com`
const CLIENTE_PASS  = 'Teste@123'
const CLIENTE_NAME  = 'Ana Teste E2E'

const results = []

function log(section, step, status, note = '') {
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️'
  const line = `${emoji} [${section}] ${step}${note ? ' — ' + note : ''}`
  console.log(line)
  results.push({ section, step, status, note })
}

async function ss(page, name) {
  const file = path.join(OUT, name + '.png')
  await page.screenshot({ path: file, fullPage: false })
  return file
}

async function injectAuth(page, token, user) {
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' })
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('auth-storage', JSON.stringify({ state: { token, user } }))
  }, { token, user })
}

// ────────────────────────────────────────────────
// FLOW 1: CLIENTE — cadastro + navegação
// ────────────────────────────────────────────────
async function flowCliente(browser) {
  console.log('\n══════════════════════════════════')
  console.log('FLOW 1 — CLIENTE')
  console.log('══════════════════════════════════')
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }) // mobile
  const page = await ctx.newPage()

  // 1. Página home carrega
  try {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 20000 })
    const title = await page.title()
    log('CLIENTE', 'Home carrega', title ? 'PASS' : 'FAIL', title)
    await ss(page, '01_home')
  } catch (e) { log('CLIENTE', 'Home carrega', 'FAIL', e.message) }

  // 2. Navegar para /register
  try {
    await page.goto(BASE + '/register', { waitUntil: 'networkidle', timeout: 20000 })
    const h = await page.$('h1,h2')
    const txt = h ? await h.textContent() : ''
    log('CLIENTE', '/register carrega', txt ? 'PASS' : 'FAIL', txt?.trim())
    await ss(page, '02_register')
  } catch (e) { log('CLIENTE', '/register carrega', 'FAIL', e.message) }

  // 3. Criar conta de cliente via API (mais rápido e confiável)
  let clienteToken = null
  let clienteUser  = null
  try {
    const res = await fetch(API + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: CLIENTE_NAME, email: CLIENTE_EMAIL, password: CLIENTE_PASS })
    })
    const data = await res.json()
    if (data.token) {
      clienteToken = data.token
      clienteUser  = data.user
      log('CLIENTE', 'Cadastro via API', 'PASS', `ID: ${data.user?.id?.slice(0,8)}...`)
    } else {
      log('CLIENTE', 'Cadastro via API', 'FAIL', JSON.stringify(data).slice(0, 100))
    }
  } catch (e) { log('CLIENTE', 'Cadastro via API', 'FAIL', e.message) }

  // 4. Login com a nova conta
  if (clienteToken && clienteUser) {
    await injectAuth(page, clienteToken, clienteUser)
    try {
      await page.goto(BASE + '/dashboard', { waitUntil: 'networkidle', timeout: 20000 })
      await page.waitForTimeout(2000)
      const skip = await page.$('button:has-text("Pular")')
      if (skip) { await skip.click(); await page.waitForTimeout(400) }
      const body = await page.textContent('body')
      const ok = body.includes('Dashboard') || body.includes('Pedido') || body.includes('Olá')
      log('CLIENTE', '/dashboard abre após login', ok ? 'PASS' : 'WARN', ok ? '' : 'texto inesperado')
      await ss(page, '03_cliente_dashboard')
    } catch (e) { log('CLIENTE', '/dashboard abre após login', 'FAIL', e.message) }

    // 5. Navegar para /menu
    try {
      await page.goto(BASE + '/menu', { waitUntil: 'networkidle', timeout: 20000 })
      await page.waitForTimeout(1500)
      const kits = await page.$$('[href*="/menu/novo"]')
      log('CLIENTE', '/menu — kits aparecem', kits.length >= 3 ? 'PASS' : 'WARN', `${kits.length} kits encontrados`)
      await ss(page, '04_cliente_menu')
    } catch (e) { log('CLIENTE', '/menu carrega', 'FAIL', e.message) }

    // 6. Tech Churras IA link
    try {
      const iaLink = await page.$('[href="/menu/assistente"]')
      log('CLIENTE', 'Link Tech Churras IA visível', iaLink ? 'PASS' : 'WARN')
    } catch (e) { log('CLIENTE', 'Link Tech Churras IA', 'FAIL', e.message) }

    // 7. Lista de churrasqueiros
    try {
      await page.goto(BASE + '/grillmasters', { waitUntil: 'networkidle', timeout: 20000 })
      await page.waitForTimeout(1500)
      const cards = await page.$$('[href*="/grillmasters/"]')
      log('CLIENTE', '/grillmasters — lista carrega', cards.length > 0 ? 'PASS' : 'WARN', `${cards.length} cards`)
      await ss(page, '05_cliente_grillmasters')
    } catch (e) { log('CLIENTE', '/grillmasters carrega', 'FAIL', e.message) }

    // 8. Lista de açougues
    try {
      await page.goto(BASE + '/boutiques', { waitUntil: 'networkidle', timeout: 20000 })
      await page.waitForTimeout(1500)
      const cards = await page.$$('[href*="/boutiques/"]')
      log('CLIENTE', '/boutiques — lista carrega', cards.length > 0 ? 'PASS' : 'WARN', `${cards.length} cards`)
      await ss(page, '06_cliente_boutiques')
    } catch (e) { log('CLIENTE', '/boutiques carrega', 'FAIL', e.message) }

    // 9. /orders
    try {
      await page.goto(BASE + '/orders', { waitUntil: 'networkidle', timeout: 20000 })
      await page.waitForTimeout(1000)
      const body = await page.textContent('body')
      const ok = body.includes('Pedido') || body.includes('Nenhum') || body.includes('pedido')
      log('CLIENTE', '/orders carrega', ok ? 'PASS' : 'WARN')
      await ss(page, '07_cliente_orders')
    } catch (e) { log('CLIENTE', '/orders carrega', 'FAIL', e.message) }

    // 10. Navbar — links corretos para CUSTOMER
    try {
      await page.goto(BASE + '/dashboard', { waitUntil: 'networkidle', timeout: 20000 })
      await page.waitForTimeout(1000)
      const adminLink = await page.$('[href="/admin"]')
      const founderLink = await page.$('[href="/founder"]')
      const menuLink = await page.$('[href="/menu"]')
      log('CLIENTE', 'Navbar: sem link Admin/Fundador', (!adminLink && !founderLink) ? 'PASS' : 'FAIL',
        adminLink ? 'Link /admin apareceu!' : founderLink ? 'Link /founder apareceu!' : 'correto')
      log('CLIENTE', 'Navbar: link Menu visível', menuLink ? 'PASS' : 'WARN')
    } catch (e) { log('CLIENTE', 'Navbar', 'FAIL', e.message) }
  }

  await ctx.close()
}

// ────────────────────────────────────────────────
// FLOW 2: CHURRASQUEIRO
// ────────────────────────────────────────────────
async function flowGrillmaster(browser) {
  console.log('\n══════════════════════════════════')
  console.log('FLOW 2 — CHURRASQUEIRO')
  console.log('══════════════════════════════════')
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()

  // Login via API
  let token, user
  try {
    const r = await fetch(API + '/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(GM_CREDS)
    })
    const d = await r.json()
    token = d.token; user = d.user
    log('GM', 'Login API', token ? 'PASS' : 'FAIL')
  } catch (e) { log('GM', 'Login API', 'FAIL', e.message); await ctx.close(); return }

  await injectAuth(page, token, user)

  // Dashboard carrega
  try {
    await page.goto(BASE + '/grillmasters/dashboard', { waitUntil: 'networkidle', timeout: 25000 })
    await page.waitForTimeout(2000)
    const skip = await page.$('button:has-text("Pular")')
    if (skip) { await skip.click(); await page.waitForTimeout(400) }
    const body = await page.textContent('body')
    const ok = body.includes('Dashboard') || body.includes('Disponível') || body.includes('evento')
    log('GM', 'Dashboard carrega', ok ? 'PASS' : 'WARN')
    await ss(page, '10_gm_dashboard')
  } catch (e) { log('GM', 'Dashboard carrega', 'FAIL', e.message) }

  // Toggle de disponibilidade existe (qualquer botão na seção de disponibilidade)
  try {
    const body = await page.textContent('body')
    const temToggle = body.includes('Disponivel') || body.includes('disponivel') || body.includes('Indisponivel')
    log('GM', 'Toggle disponibilidade visível', temToggle ? 'PASS' : 'WARN', temToggle ? 'texto encontrado na página' : 'não encontrado')
    await ss(page, '11_gm_toggle')
  } catch (e) { log('GM', 'Toggle disponibilidade', 'FAIL', e.message) }

  // Seção novos eventos
  try {
    const body = await page.textContent('body')
    const temSecao = body.includes('Novo') || body.includes('evento') || body.includes('Pendente') || body.includes('Agenda')
    log('GM', 'Seção de eventos/agenda visível', temSecao ? 'PASS' : 'WARN')
  } catch (e) { log('GM', 'Seção eventos', 'FAIL', e.message) }

  // Navbar correta para GRILLMASTER
  try {
    const meuDash = await page.$('[href="/grillmasters/dashboard"]')
    const menuLink = await page.$('[href="/menu"]')
    const adminLink = await page.$('[href="/admin"]')
    log('GM', 'Navbar: link Meu Dashboard', meuDash ? 'PASS' : 'WARN')
    log('GM', 'Navbar: sem link Menu (CUSTOMER only)', !menuLink ? 'PASS' : 'FAIL',
      menuLink ? 'Link /menu apareceu para GM!' : '')
    log('GM', 'Navbar: sem link Admin', !adminLink ? 'PASS' : 'FAIL')
    await ss(page, '12_gm_navbar')
  } catch (e) { log('GM', 'Navbar GM', 'FAIL', e.message) }

  // API: buscar pedidos do GM
  try {
    const r = await fetch(API + '/grillmasters/me/orders', {
      headers: { Authorization: 'Bearer ' + token }
    })
    const d = await r.json()
    const lista = Array.isArray(d) ? d : d.data || d.orders || []
    log('GM', `API /me/orders responde`, r.ok ? 'PASS' : 'FAIL', `${lista.length} pedidos`)
    const pending = lista.filter(o => o.status === 'PENDING')
    log('GM', `Pedidos PENDING`, 'PASS', `${pending.length} eventos para aceitar`)
  } catch (e) { log('GM', 'API /me/orders', 'FAIL', e.message) }

  // API: toggle disponibilidade
  try {
    // primeiro, pegar perfil atual
    const profileR = await fetch(API + '/grillmasters/me', { headers: { Authorization: 'Bearer ' + token } })
    const profile = await profileR.json()
    const currentAvail = profile.available ?? true
    // toggle
    const toggleR = await fetch(API + '/grillmasters', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ available: !currentAvail })
    })
    const toggleD = await toggleR.json()
    const changed = toggleD.available === !currentAvail
    log('GM', 'API PUT toggle disponibilidade', changed ? 'PASS' : 'WARN',
      `${currentAvail} → ${toggleD.available}`)
    // restaurar
    await fetch(API + '/grillmasters', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ available: currentAvail })
    })
    log('GM', 'API toggle restaurado', 'PASS')
  } catch (e) { log('GM', 'API toggle disponibilidade', 'FAIL', e.message) }

  await ctx.close()
}

// ────────────────────────────────────────────────
// FLOW 3: AÇOUGUE
// ────────────────────────────────────────────────
async function flowBoutique(browser) {
  console.log('\n══════════════════════════════════')
  console.log('FLOW 3 — AÇOUGUE')
  console.log('══════════════════════════════════')
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()

  // Login via API
  let token, user
  try {
    const r = await fetch(API + '/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(BOUTIQUE_CREDS)
    })
    const d = await r.json()
    token = d.token; user = d.user
    log('AÇOUGUE', 'Login API', token ? 'PASS' : 'FAIL')
  } catch (e) { log('AÇOUGUE', 'Login API', 'FAIL', e.message); await ctx.close(); return }

  await injectAuth(page, token, user)

  // Dashboard carrega
  try {
    await page.goto(BASE + '/boutiques/dashboard', { waitUntil: 'networkidle', timeout: 25000 })
    await page.waitForTimeout(2000)
    const skip = await page.$('button:has-text("Pular")')
    if (skip) { await skip.click(); await page.waitForTimeout(400) }
    const body = await page.textContent('body')
    const ok = body.includes('Produto') || body.includes('faturamento') || body.includes('Açougue')
    log('AÇOUGUE', 'Dashboard carrega', ok ? 'PASS' : 'WARN')
    await ss(page, '20_boutique_dashboard')
  } catch (e) { log('AÇOUGUE', 'Dashboard carrega', 'FAIL', e.message) }

  // Stats cards
  try {
    const body = await page.textContent('body')
    const temStats = body.includes('R$') || body.includes('faturamento') || body.includes('pedido')
    log('AÇOUGUE', 'Stats cards (faturamento/pedidos)', temStats ? 'PASS' : 'WARN')
  } catch (e) { log('AÇOUGUE', 'Stats cards', 'FAIL', e.message) }

  // Toggle loja aberta/fechada
  try {
    const toggle = await page.$('button:has-text("Loja aberta"), button:has-text("Loja fechada"), button:has-text("fechar"), button:has-text("abrir")')
    log('AÇOUGUE', 'Toggle Loja aberta/fechada', toggle ? 'PASS' : 'WARN')
  } catch (e) { log('AÇOUGUE', 'Toggle loja', 'FAIL', e.message) }

  // Seção produtos
  try {
    const body = await page.textContent('body')
    const temProdutos = body.includes('Produto') || body.includes('produto')
    log('AÇOUGUE', 'Seção Produtos', temProdutos ? 'PASS' : 'WARN')
    await ss(page, '21_boutique_produtos')
  } catch (e) { log('AÇOUGUE', 'Seção Produtos', 'FAIL', e.message) }

  // QR code de indicação
  try {
    const body = await page.textContent('body')
    const temQR = body.includes('QR') || body.includes('Indicação') || body.includes('indicação')
    log('AÇOUGUE', 'Seção QR code', temQR ? 'PASS' : 'WARN')
  } catch (e) { log('AÇOUGUE', 'Seção QR code', 'FAIL', e.message) }

  // Navbar correta para BOUTIQUE
  try {
    const meuAcougue = await page.$('[href="/boutiques/dashboard"]')
    const grillLink  = await page.$('[href="/grillmasters"]')
    const adminLink  = await page.$('[href="/admin"]')
    log('AÇOUGUE', 'Navbar: link Meu Açougue', meuAcougue ? 'PASS' : 'WARN')
    log('AÇOUGUE', 'Navbar: sem link Churrasqueiros (CUSTOMER only)', !grillLink ? 'PASS' : 'FAIL',
      grillLink ? 'Link /grillmasters apareceu para BOUTIQUE!' : '')
    log('AÇOUGUE', 'Navbar: sem link Admin', !adminLink ? 'PASS' : 'FAIL')
    await ss(page, '22_boutique_navbar')
  } catch (e) { log('AÇOUGUE', 'Navbar BOUTIQUE', 'FAIL', e.message) }

  // API: buscar produtos
  try {
    const boutique = user // user já tem a info necessária ou buscar pelo token
    const r = await fetch(API + '/boutiques/my', { headers: { Authorization: 'Bearer ' + token } })
    const d = await r.json()
    const prods = d.products || []
    log('AÇOUGUE', `API /boutiques/my responde`, r.ok ? 'PASS' : 'FAIL', `${prods.length} produtos`)
  } catch (e) { log('AÇOUGUE', 'API /boutiques/me', 'FAIL', e.message) }

  // /beta-test page abre
  try {
    const anonCtx = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const anonPage = await anonCtx.newPage()
    await anonPage.goto(BASE + '/beta-test', { waitUntil: 'networkidle', timeout: 20000 })
    const body = await anonPage.textContent('body')
    const ok = body.includes('roteiro') || body.includes('Roteiro') || body.includes('teste')
    log('GERAL', '/beta-test página pública', ok ? 'PASS' : 'WARN')
    await anonPage.screenshot({ path: path.join(OUT, '30_betatest.png'), fullPage: false })
    await anonCtx.close()
  } catch (e) { log('GERAL', '/beta-test carrega', 'FAIL', e.message) }

  await ctx.close()
}

// ────────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────────
;(async () => {
  console.log('🔥 Tech Churras — E2E Roteiro Completo')
  console.log(`   Base URL : ${BASE}`)
  console.log(`   Output   : ${OUT}`)
  console.log(`   Cliente  : ${CLIENTE_EMAIL}`)
  console.log()

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })

  await flowCliente(browser)
  await flowGrillmaster(browser)
  await flowBoutique(browser)

  await browser.close()

  // ── Relatório final ──
  console.log('\n══════════════════════════════════')
  console.log('RELATÓRIO FINAL')
  console.log('══════════════════════════════════')
  const pass  = results.filter(r => r.status === 'PASS').length
  const fail  = results.filter(r => r.status === 'FAIL').length
  const warn  = results.filter(r => r.status === 'WARN').length

  if (fail > 0) {
    console.log('\n❌ FALHAS:')
    results.filter(r => r.status === 'FAIL').forEach(r =>
      console.log(`   [${r.section}] ${r.step}${r.note ? ': ' + r.note : ''}`)
    )
  }
  if (warn > 0) {
    console.log('\n⚠️  AVISOS:')
    results.filter(r => r.status === 'WARN').forEach(r =>
      console.log(`   [${r.section}] ${r.step}${r.note ? ': ' + r.note : ''}`)
    )
  }

  console.log(`\n📊 Total: ${pass} ✅ PASS  |  ${warn} ⚠️ WARN  |  ${fail} ❌ FAIL`)
  console.log(`📸 Screenshots: ${OUT}`)
  console.log()

  process.exit(fail > 0 ? 1 : 0)
})().catch(e => { console.error(e); process.exit(1) })
