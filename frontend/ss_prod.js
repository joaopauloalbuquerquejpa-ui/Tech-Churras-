'use strict'
const { chromium } = require('@playwright/test')
const path = require('path')
const fs = require('fs')

const BASE = 'https://www.techchurras.com.br'
const SS = path.join(__dirname, 'screenshots', 'prod')
fs.mkdirSync(SS, { recursive: true })

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()

  const snap = async (name) => {
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(600)
    await page.screenshot({ path: path.join(SS, name + '.png'), fullPage: false })
    console.log('captured', name)
  }

  // Home
  await page.goto(BASE)
  await snap('home')

  // Para Açougues
  await page.goto(BASE + '/para-acougues')
  await snap('para_acougues_hero')
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2))
  await page.waitForTimeout(400)
  await snap('para_acougues_simulador')

  // Para Churrasqueiros
  await page.goto(BASE + '/para-churrasqueiros')
  await snap('para_churrasqueiros_hero')
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2))
  await page.waitForTimeout(400)
  await snap('para_churrasqueiros_simulador')

  await browser.close()
  console.log('done')
})().catch(e => { console.error(e.message); process.exit(1) })
