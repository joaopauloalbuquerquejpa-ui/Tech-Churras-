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

  await page.goto(BASE + '/para-churrasqueiros')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(800)

  // Hero (topo)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.join(SS, 'churrasqueiros_hero.png') })
  console.log('hero captured')

  // Simulador
  await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h2'))
    const target = headings.find(h => h.textContent?.includes('Simule sua renda'))
    if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' })
  })
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(SS, 'churrasqueiros_simulador.png') })
  console.log('simulador captured')

  await browser.close()
  console.log('done')
})().catch(e => { console.error(e.message); process.exit(1) })
