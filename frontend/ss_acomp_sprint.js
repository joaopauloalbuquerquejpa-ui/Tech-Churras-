'use strict'
const { chromium } = require('@playwright/test')
const path = require('path')
const fs = require('fs')

const OUT = path.join(__dirname, 'screenshots')
fs.mkdirSync(OUT, { recursive: true })

const BASE = 'https://www.techchurras.com.br'

;(async () => {
  const browser = await chromium.launch({ headless: true })

  // /convite-acougue
  const page1 = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await page1.goto(BASE + '/convite-acougue?nome=Açougue+Exemplo', { waitUntil: 'networkidle' })
  await page1.waitForTimeout(2000)
  // Scroll to acompanhamentos section
  await page1.evaluate(() => window.scrollTo({ top: 2200, behavior: 'instant' }))
  await page1.waitForTimeout(500)
  await page1.screenshot({ path: path.join(OUT, 'acomp_convite_acougue.png'), fullPage: false })

  // /para-acougues
  const page2 = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await page2.goto(BASE + '/para-acougues', { waitUntil: 'networkidle' })
  await page2.waitForTimeout(2000)
  // Scroll to acompanhamentos section
  await page2.evaluate(() => window.scrollTo({ top: 3000, behavior: 'instant' }))
  await page2.waitForTimeout(500)
  await page2.screenshot({ path: path.join(OUT, 'acomp_para_acougues.png'), fullPage: false })

  // /convite-churrasqueiro
  const page3 = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await page3.goto(BASE + '/convite-churrasqueiro?nome=Carlos+Mendes', { waitUntil: 'networkidle' })
  await page3.waitForTimeout(2000)
  await page3.evaluate(() => window.scrollTo({ top: 1800, behavior: 'instant' }))
  await page3.waitForTimeout(500)
  await page3.screenshot({ path: path.join(OUT, 'acomp_convite_gm.png'), fullPage: false })

  await browser.close()
  console.log('done')
})().catch(e => { console.error(e.message); process.exit(1) })
