'use strict'
const { chromium } = require('@playwright/test')
const path = require('path')
const fs = require('fs')

const BASE = 'https://www.techchurras.com.br'
const SS = path.join(__dirname, 'screenshots', 'prod')
fs.mkdirSync(SS, { recursive: true })

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  await page.goto(BASE + '/login')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)

  await page.locator('input[type="email"]').fill('maria.cliente@teste.com', { force: true })
  await page.locator('input[type="password"]').fill('123456', { force: true })
  await page.screenshot({ path: path.join(SS, 'debug_before_submit.png') })

  await page.locator('button[type="submit"]').click({ force: true })
  await page.waitForTimeout(5000)
  await page.screenshot({ path: path.join(SS, 'debug_after_submit.png') })
  console.log('URL after submit:', page.url())

  await browser.close()
})().catch(e => { console.error(e.message); process.exit(1) })
