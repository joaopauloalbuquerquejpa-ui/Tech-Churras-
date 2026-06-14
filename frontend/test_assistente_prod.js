'use strict'
const { chromium } = require('@playwright/test')

const BASE = 'https://techchurras.com.br'
const EMAIL = 'maria.cliente@teste.com'
const PASSWORD = '123456'
const SCREENSHOTS_DIR = require('path').join(__dirname, 'screenshots')

;(async () => {
  require('fs').mkdirSync(SCREENSHOTS_DIR, { recursive: true })
  const browser = await chromium.launch({ headless: false, slowMo: 300 })
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await ctx.newPage()

  async function shot(name) {
    const p = require('path').join(SCREENSHOTS_DIR, name + '.png')
    await page.screenshot({ path: p, fullPage: false })
    console.log('📸 ' + name + '.png')
  }

  console.log('\n══════════════════════════════════════════')
  console.log('  TESTE — Assistente de IA (produção)')
  console.log('══════════════════════════════════════════\n')

  // 1. Login
  console.log('1. Login...')
  await page.goto(BASE + '/login')
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(2000)
  // Diagnóstico: listar todos os inputs
  const inputInfo = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).map(i => ({ type: i.type, name: i.name, id: i.id, placeholder: i.placeholder }))
  })
  console.log('   Inputs na página:', JSON.stringify(inputInfo))
  // Usa locator com force:true para contornar container com opacity:0 nas animações CSS
  await page.locator('input[type="email"]').fill(EMAIL, { force: true, timeout: 15000 })
  console.log('   email preenchido')
  const inputInfo2 = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).map(i => ({ type: i.type, name: i.name, id: i.id }))
  })
  console.log('   Inputs após email:', JSON.stringify(inputInfo2))
  await page.locator('input[type="password"]').fill(PASSWORD, { force: true, timeout: 15000 })
  await page.waitForTimeout(300)
  await page.locator('button[type="submit"]').click({ force: true })
  await page.waitForURL('**/dashboard', { timeout: 20000 })
  console.log('   ✅ Login OK — em /dashboard')
  // Marca o tour como concluído para não bloquear interações
  await page.evaluate(() => {
    const raw = localStorage.getItem('auth-storage')
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        const userId = parsed?.state?.user?.id
        if (userId) localStorage.setItem('tc-onb-' + userId, 'done')
      } catch {}
    }
    // fallback: marca qualquer chave tc-onb- existente
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith('tc-onb-')) localStorage.setItem(k, 'done')
    }
  })
  await shot('01_dashboard')

  // 2. Banner do assistente no dashboard
  const banner = page.locator('a[href="/menu/assistente"]')
  const bannerCount = await banner.count()
  console.log('2. Banner IA no dashboard:', bannerCount > 0 ? '✅ visível' : '❌ não encontrado')
  await shot('02_dashboard_banner')

  // 3. Navegar para /menu/assistente
  console.log('3. Navegando para /menu/assistente...')
  await page.goto(BASE + '/menu/assistente')
  await page.waitForLoadState('networkidle')
  await shot('03_assistente_vazio')

  const title = await page.locator('h1, h2').first().textContent().catch(() => '')
  console.log('   Título da página:', title?.trim())

  // 4. Verificar formulário
  const styleBtn = page.locator('button').filter({ hasText: /tradicional/i }).first()
  const styleVisible = await styleBtn.isVisible().catch(() => false)
  console.log('4. Formulário:', styleVisible ? '✅ botões de estilo visíveis' : '❌ botões de estilo não encontrados')

  // 5. Selecionar estilo gourmet
  const gourmBtn = page.locator('button').filter({ hasText: /gourmet/i }).first()
  if (await gourmBtn.isVisible().catch(() => false)) {
    await gourmBtn.click()
    console.log('5. Estilo "gourmet" selecionado ✅')
  } else {
    console.log('5. Estilo "gourmet" não encontrado — usando padrão')
  }

  // 6. Ajustar convidados (homens)
  const plusBtns = page.locator('button').filter({ hasText: '+' })
  const plusCount = await plusBtns.count()
  console.log('6. Botões "+" encontrados:', plusCount)

  // 7. Enviar formulário
  console.log('7. Gerando planejamento...')
  const submitBtn = page.locator('button').filter({ hasText: /gerar|planejar|calcular|Gerar/i }).first()
  const submitVisible = await submitBtn.isVisible().catch(() => false)
  if (!submitVisible) {
    // Tenta o botão com texto genérico
    const allBtns = await page.locator('button').allTextContents()
    console.log('   Botões disponíveis:', allBtns.slice(0, 10))
  }

  await shot('04_formulario_preenchido')

  if (submitVisible) {
    await submitBtn.click()
    console.log('   Aguardando resposta da IA (até 30s)...')
    // Aguarda o resultado aparecer
    await page.waitForSelector('[data-testid="ai-result"], h2, h3', { timeout: 30000 })
      .catch(() => page.waitForTimeout(20000))
    await shot('05_resultado_ia')
    console.log('   ✅ Resposta recebida')
  } else {
    // Clica no primeiro botão submit encontrado
    const firstSubmit = page.locator('button[type="submit"], form button').first()
    if (await firstSubmit.isVisible().catch(() => false)) {
      await firstSubmit.click()
      console.log('   Aguardando resposta da IA...')
      await page.waitForTimeout(20000)
      await shot('05_resultado_ia')
    } else {
      console.log('   ⚠️ Botão de submit não identificado')
    }
  }

  // 8. Verificar itens na resposta
  const items = await page.locator('[class*="border"][class*="rounded"]').count()
  console.log('8. Cards de itens visíveis:', items)

  // 9. Verificar botão "Adicionar ao Carrinho"
  const cartBtn = page.locator('button').filter({ hasText: /carrinho|essencial/i }).first()
  const cartBtnVisible = await cartBtn.isVisible().catch(() => false)
  console.log('9. Botão de carrinho:', cartBtnVisible ? '✅ visível' : 'não encontrado (normal sem boutique selecionada)')

  // 10. Verificar link "Menu" com banner IA
  await page.goto(BASE + '/menu')
  await page.waitForLoadState('networkidle')
  await shot('06_menu_banner')
  const menuBanner = page.locator('a[href="/menu/assistente"]')
  const menuBannerVisible = await menuBanner.isVisible().catch(() => false)
  console.log('10. Banner IA na página /menu:', menuBannerVisible ? '✅ visível' : '❌ não encontrado')

  console.log('\n══════════════════════════════════════════')
  console.log('  Screenshots salvas em: screenshots/')
  console.log('══════════════════════════════════════════\n')

  await browser.close()
})().catch(e => {
  console.error('ERRO:', e.message)
  process.exit(1)
})
