const { chromium } = require('@playwright/test')
const fs = require('fs')

const OUT = 'screenshots/boutique_tabs'
fs.mkdirSync(OUT, { recursive: true })

const BASE = 'https://www.techchurras.com.br'

;(async () => {
  const br = await chromium.launch({ headless: true })
  const p = await br.newPage({ viewport: { width: 1280, height: 900 } })

  // Faz login pela UI para descobrir o formato real do auth-storage
  await p.goto(BASE + '/login', { waitUntil: 'networkidle' })
  await p.waitForTimeout(800)
  await p.fill('input[type="email"]', 'premium.acougue@teste.com')
  await p.fill('input[type="password"]', '123456')
  await p.click('button[type="submit"]')

  // Espera o redirect
  await p.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 }).catch(() => {})
  await p.waitForTimeout(2000)

  const url = p.url()
  console.log('URL após login:', url)

  // Lê o auth-storage real
  const stored = await p.evaluate(() => localStorage.getItem('auth-storage'))
  console.log('auth-storage real:', stored?.slice(0, 300))

  if (!stored) {
    console.log('Sem token no localStorage — login falhou')
    await p.screenshot({ path: OUT + '/fail.png' })
    await br.close()
    return
  }

  // Agora vai para o dashboard
  await p.goto(BASE + '/boutiques/dashboard', { waitUntil: 'networkidle' })
  await p.waitForTimeout(3000)

  const btns = await p.evaluate(() =>
    Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim().slice(0, 80)).filter(Boolean)
  )
  console.log('Botões no dashboard:', btns)

  // Fecha modal de onboarding (react-joyride) se existir
  const pularBtn = p.locator('button:has-text("Pular")')
  if (await pularBtn.count() > 0) {
    await pularBtn.first().click()
    await p.waitForTimeout(600)
    console.log('Modal onboarding fechado')
  }
  // Garante que não há overlay bloqueando
  await p.evaluate(() => {
    const portal = document.getElementById('react-joyride-portal')
    if (portal) portal.remove()
  })
  await p.waitForTimeout(300)

  await p.screenshot({ path: OUT + '/01_visao_geral.png' })
  console.log('📸 01 Visão Geral')

  // Clica na aba Indicações
  for (const btn of await p.locator('button').all()) {
    const txt = await btn.textContent()
    if (txt && txt.includes('Indicações')) { await btn.click(); break }
  }
  await p.waitForTimeout(1500)
  await p.screenshot({ path: OUT + '/02_indicacoes_topo.png' })
  console.log('📸 02 Indicações topo')

  await p.evaluate(() => window.scrollBy(0, 700))
  await p.waitForTimeout(400)
  await p.screenshot({ path: OUT + '/03_indicacoes_como.png' })
  console.log('📸 03 Como funciona')

  await p.evaluate(() => window.scrollBy(0, 700))
  await p.waitForTimeout(400)
  await p.screenshot({ path: OUT + '/04_indicacoes_dicas.png' })
  console.log('📸 04 Dicas')

  // Aba Balcão
  await p.evaluate(() => window.scrollTo(0, 0))
  for (const btn of await p.locator('button').all()) {
    const txt = await btn.textContent()
    if (txt && txt.includes('Balcão')) { await btn.click(); break }
  }
  await p.waitForTimeout(1500)
  await p.screenshot({ path: OUT + '/05_balcao.png' })
  console.log('📸 05 Balcão')

  // Aba Produtos
  await p.evaluate(() => window.scrollTo(0, 0))
  for (const btn of await p.locator('button').all()) {
    const txt = await btn.textContent()
    if (txt && txt.includes('Produtos')) { await btn.click(); break }
  }
  await p.waitForTimeout(1500)
  await p.screenshot({ path: OUT + '/06_produtos.png' })
  console.log('📸 06 Produtos')

  await br.close()
  console.log('DONE')
})().catch(e => { console.error(e.message); process.exit(1) })
