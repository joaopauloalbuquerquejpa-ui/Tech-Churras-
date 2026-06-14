'use strict'
const { chromium } = require('@playwright/test')
const path = require('path')
const fs = require('fs')

const BASE = 'https://techchurras.com.br'
const SS = path.join(__dirname, 'screenshots', 'ajuda')
fs.mkdirSync(SS, { recursive: true })

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  await page.goto(BASE + '/login')
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(1500)
  await page.locator('input[type="email"]').fill('maria.cliente@teste.com', { force: true })
  await page.locator('input[type="password"]').fill('123456', { force: true })
  await page.locator('button[type="submit"]').click({ force: true })
  await page.waitForURL('**/dashboard', { timeout: 20000 })

  // Dismiss onboarding tour
  await page.evaluate(() => {
    const raw = localStorage.getItem('auth-storage')
    if (raw) {
      try {
        const uid = JSON.parse(raw)?.state?.user?.id
        if (uid) localStorage.setItem('tc-onb-' + uid, 'done')
      } catch {}
    }
  })

  await page.goto(BASE + '/ajuda')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(SS, 'ajuda_clean.png') })

  await browser.close()
  console.log('done')
})().catch(e => { console.error(e.message); process.exit(1) })
