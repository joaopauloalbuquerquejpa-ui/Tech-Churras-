'use strict'
const { chromium } = require('@playwright/test')
const path = require('path')
const fs = require('fs')

const OUT = path.join(__dirname, 'screenshots')
fs.mkdirSync(OUT, { recursive: true })

const URL = 'https://www.techchurras.com.br/convite-acougue?nome=Acougue+Premium+SP'

;(async () => {
  const browser = await chromium.launch({ headless: true })

  // Mobile
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await mobile.goto(URL, { waitUntil: 'networkidle' })
  await mobile.waitForTimeout(1500)
  await mobile.screenshot({ path: path.join(OUT, 'convite_acougue_mobile_top.png'), fullPage: false })
  await mobile.evaluate(() => window.scrollTo({ top: 700, behavior: 'instant' }))
  await mobile.waitForTimeout(400)
  await mobile.screenshot({ path: path.join(OUT, 'convite_acougue_mobile_beneficios.png'), fullPage: false })
  await mobile.evaluate(() => window.scrollTo({ top: 99999, behavior: 'instant' }))
  await mobile.waitForTimeout(400)
  await mobile.screenshot({ path: path.join(OUT, 'convite_acougue_mobile_cta.png'), fullPage: false })
  console.log('mobile ok')

  // Desktop
  const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await desktop.goto(URL, { waitUntil: 'networkidle' })
  await desktop.waitForTimeout(1500)
  await desktop.screenshot({ path: path.join(OUT, 'convite_acougue_desktop.png'), fullPage: true })
  console.log('desktop ok')

  await browser.close()
  console.log('done')
})().catch(e => { console.error(e.message); process.exit(1) })
