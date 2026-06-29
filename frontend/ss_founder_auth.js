'use strict'
const { chromium } = require('@playwright/test')
const path = require('path')
const fs = require('fs')

const BASE = 'https://www.techchurras.com.br'
const OUT = path.join(__dirname, 'screenshots')
fs.mkdirSync(OUT, { recursive: true })

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  // Login
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' })
  await page.fill('input[type="email"]', 'joaopauloalbuquerque.jpa@gmail.com')
  await page.fill('input[type="password"]', process.env.ADMIN_PASS || 'senha123')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/(dashboard|admin|grillmasters|boutiques)**', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(1000)

  // Navega para /founder
  await page.goto(BASE + '/founder', { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000) // aguarda video + animações

  // Hero
  await page.screenshot({ path: path.join(OUT, 'founder_hero.png'), clip: { x: 0, y: 0, width: 1440, height: 900 } })
  console.log('hero')

  // Bio + manifesto
  await page.evaluate(() => window.scrollTo({ top: 950, behavior: 'instant' }))
  await page.waitForTimeout(1200)
  await page.screenshot({ path: path.join(OUT, 'founder_bio.png'), clip: { x: 0, y: 0, width: 1440, height: 900 } })
  console.log('bio')

  // Manifesto quote
  await page.evaluate(() => window.scrollTo({ top: 1900, behavior: 'instant' }))
  await page.waitForTimeout(1200)
  await page.screenshot({ path: path.join(OUT, 'founder_manifesto.png'), clip: { x: 0, y: 0, width: 1440, height: 900 } })
  console.log('manifesto')

  // Timeline
  await page.evaluate(() => window.scrollTo({ top: 2900, behavior: 'instant' }))
  await page.waitForTimeout(1200)
  await page.screenshot({ path: path.join(OUT, 'founder_timeline.png'), clip: { x: 0, y: 0, width: 1440, height: 900 } })
  console.log('timeline')

  await browser.close()
  console.log('done')
})().catch(e => { console.error(e.message); process.exit(1) })
