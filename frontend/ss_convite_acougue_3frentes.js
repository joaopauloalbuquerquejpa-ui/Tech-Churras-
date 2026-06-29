'use strict'
const { chromium } = require('@playwright/test')
const path = require('path')
const fs = require('fs')

const OUT = path.join(__dirname, 'screenshots')
fs.mkdirSync(OUT, { recursive: true })

const URL = 'https://www.techchurras.com.br/convite-acougue?nome=Açougue+Nobre+SP'

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)

  const scrolls = [0, 900, 1800, 2700, 3600, 4500, 5400, 6300, 7200, 8100]
  for (let i = 0; i < scrolls.length; i++) {
    await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), scrolls[i])
    await page.waitForTimeout(400)
    await page.screenshot({ path: path.join(OUT, `ca3_${String(i).padStart(2,'0')}.png`) })
  }

  await browser.close()
  console.log('done')
})().catch(e => { console.error(e.message); process.exit(1) })
