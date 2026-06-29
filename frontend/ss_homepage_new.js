'use strict'
const { chromium } = require('@playwright/test')
const path = require('path')
const fs = require('fs')

const OUT = path.join(__dirname, 'screenshots')
fs.mkdirSync(OUT, { recursive: true })

const URL = 'https://www.techchurras.com.br'

;(async () => {
  const browser = await chromium.launch({ headless: true })

  // Mobile
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await mobile.goto(URL, { waitUntil: 'networkidle' })
  await mobile.waitForTimeout(2500)
  const scrollsMobile = [0, 900, 1800, 2700, 3600]
  for (let i = 0; i < scrollsMobile.length; i++) {
    await mobile.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), scrollsMobile[i])
    await mobile.waitForTimeout(500)
    await mobile.screenshot({ path: path.join(OUT, `hp_mobile_${i}.png`), fullPage: false })
  }
  console.log('mobile ok')

  // Desktop
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await desktop.goto(URL, { waitUntil: 'networkidle' })
  await desktop.waitForTimeout(2500)
  const scrollsDesktop = [0, 1000, 2000, 3200]
  for (let i = 0; i < scrollsDesktop.length; i++) {
    await desktop.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), scrollsDesktop[i])
    await desktop.waitForTimeout(500)
    await desktop.screenshot({ path: path.join(OUT, `hp_desktop_${i}.png`), fullPage: false })
  }
  console.log('desktop ok')

  await browser.close()
  console.log('done')
})().catch(e => { console.error(e.message); process.exit(1) })
