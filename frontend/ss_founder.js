'use strict'
const { chromium } = require('@playwright/test')
const path = require('path')
const fs = require('fs')

const BASE = process.env.BASE_URL || 'http://localhost:3001'
const OUT = path.join(__dirname, 'screenshots')
fs.mkdirSync(OUT, { recursive: true })

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  await page.goto(BASE + '/founder', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500) // aguarda animações framer-motion e video

  // Hero section
  await page.screenshot({ path: path.join(OUT, 'founder_hero.png'), clip: { x: 0, y: 0, width: 1440, height: 900 } })
  console.log('hero capturado')

  // Scroll para a bio
  await page.evaluate(() => window.scrollTo(0, 900))
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(OUT, 'founder_bio.png'), clip: { x: 0, y: 0, width: 1440, height: 900 } })
  console.log('bio capturada')

  // Scroll para o manifesto
  await page.evaluate(() => window.scrollTo(0, 1900))
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(OUT, 'founder_manifesto.png'), clip: { x: 0, y: 0, width: 1440, height: 900 } })
  console.log('manifesto capturado')

  // Full page
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(OUT, 'founder_full.png'), fullPage: true })
  console.log('full page capturada')

  await browser.close()
  console.log('done')
})().catch(e => { console.error(e.message); process.exit(1) })
