'use strict'
const { chromium } = require('@playwright/test')
const path = require('path')
const fs = require('fs')

const BASE = 'https://www.techchurras.com.br'
const SS = path.join(__dirname, 'screenshots', 'prod')
fs.mkdirSync(SS, { recursive: true })

const pages = [
  { url: '/para-acougues', name: 'acougues_full' },
  { url: '/para-churrasqueiros', name: 'churrasqueiros_full' },
]

;(async () => {
  const browser = await chromium.launch({ headless: true })

  for (const p of pages) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await page.goto(BASE + p.url)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)
    await page.screenshot({ path: path.join(SS, p.name + '.png'), fullPage: true })
    console.log('captured', p.name)
    await page.close()
  }

  await browser.close()
  console.log('done')
})().catch(e => { console.error(e.message); process.exit(1) })
