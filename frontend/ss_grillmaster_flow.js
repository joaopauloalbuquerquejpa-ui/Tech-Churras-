'use strict'
const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const BASE = 'https://www.techchurras.com.br'
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjNjYjk4MGI3LWM0YmYtNDgxOS1iYWYwLWI2ZGM4MzViODk5YyIsInJvbGUiOiJHUklMTE1BU1RFUiIsImlhdCI6MTc4MTM1ODMwMH0.6d3dceK_kgfWpevDjq2UOvsfLhQWZFyBBfChMluVI70'

const STORE = JSON.stringify({
  state: {
    token: TOKEN,
    user: { id: '3cb980b7-c4bf-4819-baf0-b6dc835b899c', role: 'GRILLMASTER', name: 'Carlos Mendes', email: 'carlos.grill@teste.com' }
  }
})

const OUT = path.join(__dirname, 'screenshots')
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true })

;(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage'] })
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()

  // Inject auth into localStorage before navigating
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' })
  await page.evaluate((store) => {
    localStorage.setItem('auth-storage', store)
  }, STORE)

  // ── 1. Dashboard do churrasqueiro — full page ──
  console.log('Capturando dashboard do churrasqueiro...')
  await page.goto(BASE + '/grillmasters/dashboard', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(2000)
  // full page screenshot
  await page.screenshot({ path: path.join(OUT, 'gm_dashboard_full.png'), fullPage: true })
  console.log('  ✅ gm_dashboard_full.png')

  // screenshot viewport (hero section + toggle)
  await page.screenshot({ path: path.join(OUT, 'gm_dashboard_top.png') })
  console.log('  ✅ gm_dashboard_top.png')

  // ── 2. Registration flow — /grillmasters/new ──
  console.log('Capturando formulário de cadastro de churrasqueiro...')
  await page.goto(BASE + '/grillmasters/new', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(OUT, 'gm_new_form_top.png') })
  console.log('  ✅ gm_new_form_top.png')

  // Scroll down to see more of the form
  await page.evaluate(() => window.scrollBy(0, 600))
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(OUT, 'gm_new_form_bottom.png') })
  console.log('  ✅ gm_new_form_bottom.png')

  // ── 3. Navbar role-based check ──
  console.log('Verificando navbar do churrasqueiro...')
  await page.goto(BASE + '/grillmasters/dashboard', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(1500)
  // screenshot just the nav area
  const nav = await page.$('nav')
  if (nav) {
    await nav.screenshot({ path: path.join(OUT, 'gm_navbar.png') })
    console.log('  ✅ gm_navbar.png')
  }

  // ── 4. Boutique login for comparison ──
  console.log('Capturando navbar do açougue para comparação...')
  // Use carlos as boutique is separate – just log in as boutique user
  const boutiqueCreds = JSON.stringify({
    state: {
      token: 'PLACEHOLDER',
      user: { id: 'fe780a33-4a8b-439c-a991-188ea4f34adf', role: 'BOUTIQUE', name: 'Açougue Premium SP', email: 'premium.acougue@teste.com' }
    }
  })

  // Get boutique token
  const boutiqueRes = await page.evaluate(async () => {
    const r = await fetch('https://tech-churras-production.up.railway.app/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'premium.acougue@teste.com', password: '123456' })
    })
    return r.json()
  })

  if (boutiqueRes.token) {
    const boutiqueStore = JSON.stringify({
      state: {
        token: boutiqueRes.token,
        user: boutiqueRes.user
      }
    })
    await page.evaluate((store) => { localStorage.setItem('auth-storage', store) }, boutiqueStore)
    await page.goto(BASE + '/boutiques/dashboard', { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(1500)
    const bNav = await page.$('nav')
    if (bNav) {
      await bNav.screenshot({ path: path.join(OUT, 'boutique_navbar.png') })
      console.log('  ✅ boutique_navbar.png')
    }
  }

  // ── Back to GM: check toggle disponibilidade ──
  console.log('Capturando toggle de disponibilidade...')
  await page.evaluate((store) => { localStorage.setItem('auth-storage', store) }, STORE)
  await page.goto(BASE + '/grillmasters/dashboard', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(2000)

  // Find and screenshot the availability toggle section
  const toggleEl = await page.$('[class*="rounded-xl"][class*="border"]')
  if (toggleEl) {
    await toggleEl.screenshot({ path: path.join(OUT, 'gm_availability_toggle.png') })
    console.log('  ✅ gm_availability_toggle.png')
  }

  await browser.close()
  console.log('\nDone! Screenshots saved to', OUT)
})().catch(e => { console.error(e); process.exit(1) })
