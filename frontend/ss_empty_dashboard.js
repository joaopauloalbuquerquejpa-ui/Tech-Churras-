'use strict'
const { chromium } = require('@playwright/test')
const path = require('path')
const fs = require('fs')

const BASE = 'https://www.techchurras.com.br'
const OUT = path.join(__dirname, 'screenshots')
fs.mkdirSync(OUT, { recursive: true })

const TEST_EMAIL = `teste_empty_${Date.now()}@techchurras.com.br`
const TEST_PASS = 'Teste@2026'

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } }) // iPhone 14

  // Cadastro novo usuario
  await page.goto(BASE + '/register', { waitUntil: 'networkidle' })
  await page.fill('input[type="text"]', 'Cliente Teste')
  await page.fill('input[type="email"]', TEST_EMAIL)
  await page.fill('input[type="password"]', TEST_PASS)
  await page.check('input[type="checkbox"]')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard', { timeout: 10000 })
  await page.waitForTimeout(2500) // aguarda fetch de orders completar

  // Mobile screenshot
  await page.screenshot({ path: path.join(OUT, 'empty_dashboard_mobile.png'), fullPage: false })
  console.log('mobile capturado')

  // Scroll para ver os 3 steps
  await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'instant' }))
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(OUT, 'empty_dashboard_steps.png'), fullPage: false })
  console.log('steps capturado')

  // Desktop
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(OUT, 'empty_dashboard_desktop.png'), fullPage: false })
  console.log('desktop capturado')

  await browser.close()
  console.log('done — email usado:', TEST_EMAIL)
})().catch(e => { console.error(e.message); process.exit(1) })
