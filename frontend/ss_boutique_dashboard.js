'use strict'
const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const BASE = 'https://www.techchurras.com.br'

const STORE = JSON.stringify({
  state: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZlNzgwYTMzLTRhOGItNDM5Yy1hOTkxLTE4OGVhNGYzNGFkZiIsInJvbGUiOiJCT1VUSVFVRSIsImlhdCI6MTc4MTM1ODk0Nn0.RAsk8NewmwtH0TFUXfP8iiOWydIS3oRfdefPslP7594',
    user: { id: 'fe780a33-4a8b-439c-a991-188ea4f34adf', role: 'BOUTIQUE', name: 'Açougue Premium SP', email: 'premium.acougue@teste.com' }
  }
})

const OUT = path.join(__dirname, 'screenshots')
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true })

;(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()

  // Inject auth
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' })
  await page.evaluate((store) => { localStorage.setItem('auth-storage', store) }, STORE)

  // ── 1. Boutique dashboard — top viewport ──
  console.log('Capturando boutique dashboard (topo)...')
  await page.goto(BASE + '/boutiques/dashboard', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(2500)
  // dismiss onboarding tour if present
  const skipBtn = await page.$('button:has-text("Pular")')
  if (skipBtn) { await skipBtn.click(); await page.waitForTimeout(500) }

  await page.screenshot({ path: path.join(OUT, 'boutique_dashboard_top.png') })
  console.log('  ✅ boutique_dashboard_top.png')

  // ── 2. Full page ──
  console.log('Capturando boutique dashboard (full page)...')
  await page.screenshot({ path: path.join(OUT, 'boutique_dashboard_full.png'), fullPage: true })
  console.log('  ✅ boutique_dashboard_full.png')

  // ── 3. Seção de produtos ──
  console.log('Capturando seção de produtos...')
  // scroll to products area
  await page.evaluate(() => {
    const els = document.querySelectorAll('h2')
    for (const el of els) {
      if (el.textContent.includes('Produto')) {
        el.scrollIntoView({ behavior: 'instant', block: 'center' })
        break
      }
    }
  })
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(OUT, 'boutique_produtos.png') })
  console.log('  ✅ boutique_produtos.png')

  // ── 4. QR code / indicação ──
  console.log('Capturando seção QR code...')
  await page.evaluate(() => {
    const els = document.querySelectorAll('p')
    for (const el of els) {
      if (el.textContent.includes('QR Code') || el.textContent.includes('Indicação')) {
        el.scrollIntoView({ behavior: 'instant', block: 'center' })
        break
      }
    }
  })
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(OUT, 'boutique_qrcode.png') })
  console.log('  ✅ boutique_qrcode.png')

  // ── 5. Boutique /new form ──
  console.log('Capturando formulário de cadastro de açougue...')
  await page.goto(BASE + '/boutiques/new', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(1500)
  const skip2 = await page.$('button:has-text("Pular")')
  if (skip2) { await skip2.click(); await page.waitForTimeout(400) }
  await page.screenshot({ path: path.join(OUT, 'boutique_new_form.png') })
  console.log('  ✅ boutique_new_form.png')

  await browser.close()
  console.log('\nDone! Screenshots em', OUT)
})().catch(e => { console.error(e); process.exit(1) })
