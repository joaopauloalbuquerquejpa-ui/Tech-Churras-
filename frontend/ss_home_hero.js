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
  await page.waitForTimeout(1200)

  // Captura só o lado esquerdo (hero) — metade da viewport
  await page.screenshot({
    path: path.join(SS, 'home_hero.png'),
    clip: { x: 0, y: 0, width: 720, height: 900 },
  })
  console.log('done')
  await browser.close()
})().catch(e => { console.error(e.message); process.exit(1) })
