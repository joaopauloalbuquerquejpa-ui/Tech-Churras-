'use strict'
const { chromium } = require('@playwright/test')
const path = require('path')
const fs = require('fs')

const URL = 'https://techchurras.com.br/para-acougues'
const SS = path.join(__dirname, 'screenshots', 'para-acougues')
fs.mkdirSync(SS, { recursive: true })

;(async () => {
  const browser = await chromium.launch({ headless: true })

  // Desktop
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const pgD = await desktop.newPage()
  await pgD.goto(URL)
  await pgD.waitForLoadState('networkidle')
  await pgD.screenshot({ path: path.join(SS, 'desktop_hero.png'), fullPage: false })
  await pgD.evaluate(() => window.scrollTo(0, 800))
  await pgD.waitForTimeout(300)
  await pgD.screenshot({ path: path.join(SS, 'desktop_como_funciona.png'), fullPage: false })
  await pgD.evaluate(() => window.scrollTo(0, 1800))
  await pgD.waitForTimeout(300)
  await pgD.screenshot({ path: path.join(SS, 'desktop_simulador.png'), fullPage: false })
  await pgD.evaluate(() => window.scrollTo(0, 3200))
  await pgD.waitForTimeout(300)
  await pgD.screenshot({ path: path.join(SS, 'desktop_faq_cta.png'), fullPage: false })

  // Mobile
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148' })
  const pgM = await mobile.newPage()
  await pgM.goto(URL)
  await pgM.waitForLoadState('networkidle')
  await pgM.screenshot({ path: path.join(SS, 'mobile_hero.png'), fullPage: false })
  await pgM.evaluate(() => window.scrollTo(0, 1000))
  await pgM.waitForTimeout(300)
  await pgM.screenshot({ path: path.join(SS, 'mobile_simulador.png'), fullPage: false })

  await browser.close()
  console.log('Screenshots salvas em screenshots/para-acougues/')
})()
