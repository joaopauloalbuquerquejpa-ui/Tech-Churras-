'use strict'
const { chromium } = require('@playwright/test')
const path = require('path')
const fs = require('fs')

const BASE = 'https://www.techchurras.com.br'
const API  = 'https://tech-churras-production.up.railway.app'
const SS   = path.join(__dirname, 'screenshots', 'prod')
fs.mkdirSync(SS, { recursive: true })

const MOCK_BOUTIQUE = {
  id: 'b1', name: 'Açougue Premium SP', city: 'São Paulo', state: 'SP',
  approved: true, open: true,
  products: [
    { id: 'p1', name: 'Picanha', description: 'Corte nobre, marmorizada', price: 89.90, unit: 'kg', category: 'CARNE', available: true, stockQuantity: null },
    { id: 'p2', name: 'Linguiça Artesanal', description: 'Linguiça toscana', price: 32.00, unit: 'kg', category: 'CARNE', available: true, stockQuantity: 10 },
  ],
}

const MOCK_STATS = {
  totalRevenue30days: 4280, totalOrders30days: 12, pendingOrdersCount: 2,
  revenueByDay: [], recentOrders: [], referralCode: 'ACOUGUE01', referralCount: 3,
}

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()

  // Injeta token falso antes de qualquer request
  await page.addInitScript(() => {
    const fakeUser = { id: 'u1', name: 'Açougue Teste', email: 'acougue@teste.com', role: 'BOUTIQUE' }
    const fakeAuth = JSON.stringify({ state: { user: fakeUser, token: 'fake-token' }, version: 0 })
    localStorage.setItem('token', 'fake-token')
    localStorage.setItem('auth-storage', fakeAuth)
    localStorage.setItem('tc-onb-u1', 'done')
  })

  // Mocka todas as chamadas ao Railway API
  await page.route(`${API}/**`, async (route) => {
    const url = route.request().url()
    if (url.includes('/boutiques/my')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_BOUTIQUE) })
    }
    if (url.includes('/boutiques/dashboard/stats')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_STATS) })
    }
    if (url.includes('/boutiques/dashboard/demand-forecast')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })

  await page.goto(BASE + '/boutiques/dashboard')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)

  // Scroll até a seção de produtos (onde fica o botão de foto)
  await page.evaluate(() => {
    const h2s = Array.from(document.querySelectorAll('h2'))
    const t = h2s.find(h => h.textContent?.includes('Produtos'))
    if (t) t.scrollIntoView({ behavior: 'instant', block: 'center' })
  })
  await page.waitForTimeout(400)

  await page.screenshot({ path: path.join(SS, 'boutique_dash_foto.png') })
  console.log('done')
  await browser.close()
})().catch(e => { console.error(e.message); process.exit(1) })
