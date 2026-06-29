'use strict'
const { chromium } = require('@playwright/test')
const path = require('path')
const fs = require('fs')

const OUT = path.join(__dirname, 'screenshots')
fs.mkdirSync(OUT, { recursive: true })

const URL = 'https://www.techchurras.com.br/convite-acougue?nome=Açougue+Nobre+SP'

;(async () => {
  const browser = await chromium.launch({ headless: true })

  // Mobile — scroll completo
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await mobile.goto(URL, { waitUntil: 'networkidle' })
  await mobile.waitForTimeout(2500)

  const scrolls = [0, 900, 1800, 2700, 3600, 4500, 5400, 6300]
  for (let i = 0; i < scrolls.length; i++) {
    await mobile.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), scrolls[i])
    await mobile.waitForTimeout(400)
    await mobile.screenshot({ path: path.join(OUT, `ca_mobile_${i}.png`), fullPage: false })
  }

  await browser.close()
  console.log('done')
})().catch(e => { console.error(e.message); process.exit(1) })
