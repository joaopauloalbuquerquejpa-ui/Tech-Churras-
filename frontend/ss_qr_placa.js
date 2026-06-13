'use strict'
const { chromium } = require('@playwright/test')
const path = require('path')
const fs = require('fs')

const BASE = 'http://localhost:3002'
const API  = 'https://tech-churras-production.up.railway.app'
const SS   = path.join(__dirname, 'screenshots', 'prod')
fs.mkdirSync(SS, { recursive: true })

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()

  await page.addInitScript(() => {
    const fakeUser = { id: 'u1', name: 'Açougue Teste', email: 'acougue@teste.com', role: 'BOUTIQUE' }
    const fakeAuth = JSON.stringify({ state: { user: fakeUser, token: 'fake-token' }, version: 0 })
    localStorage.setItem('token', 'fake-token')
    localStorage.setItem('auth-storage', fakeAuth)
    localStorage.setItem('tc-onb-u1', 'done')
  })

  await page.route(`${API}/**`, async (route) => {
    const url = route.request().url()
    if (url.includes('/boutiques/my')) {
      return route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ id: 'b1', name: 'Açougue Premium SP', city: 'São Paulo', state: 'SP', approved: true, open: true, products: [] }),
      })
    }
    if (url.includes('/boutiques/dashboard/stats')) {
      return route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ totalRevenue30days: 4280, totalOrders30days: 12, pendingOrdersCount: 2, revenueByDay: [], recentOrders: [], referralCode: 'ACOUGUE01', referralCount: 7 }),
      })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })

  await page.goto(BASE + '/boutiques/dashboard/qrcode-impressao')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)

  await page.screenshot({ path: path.join(SS, 'qrcode_placa.png') })
  console.log('✅ QR code placa — done')
  await browser.close()
})().catch(e => { console.error(e.message); process.exit(1) })
