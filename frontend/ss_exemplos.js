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

  // Scroll até a seção de exemplos (após simulador)
  await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h2'))
    const target = headings.find(h => h.textContent?.includes('Exemplos de ganhos'))
    if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' })
  })
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(SS, 'churrasqueiros_exemplos.png') })

  console.log('done')
  await browser.close()
})().catch(e => { console.error(e.message); process.exit(1) })
