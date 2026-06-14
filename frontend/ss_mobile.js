'use strict'
const { chromium, devices } = require('@playwright/test')
const path = require('path')
const fs = require('fs')

const BASE = 'https://www.techchurras.com.br'
const SS = path.join(__dirname, 'screenshots', 'prod')
fs.mkdirSync(SS, { recursive: true })

const PAGES = [
  { url: '/para-acougues', name: 'acougues_mobile' },
  { url: '/para-churrasqueiros', name: 'churrasqueiros_mobile' },
]

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const iPhone = devices['iPhone 13']

  for (const p of PAGES) {
    const ctx = await browser.newContext({ ...iPhone })
    const page = await ctx.newPage()
    await page.goto(BASE + p.url)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)
    await page.screenshot({ path: path.join(SS, p.name + '.png'), fullPage: true })
    console.log('captured', p.name)
    await ctx.close()
  }

  await browser.close()
  console.log('done')
})().catch(e => { console.error(e.message); process.exit(1) })
