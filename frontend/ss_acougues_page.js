const { chromium } = require('@playwright/test')
const fs = require('fs')
const OUT = 'screenshots/acougues'
fs.mkdirSync(OUT, { recursive: true })

const URL_PAGE = 'https://www.techchurras.com.br/para-acougues';

(async () => {
  const br = await chromium.launch({ headless: true })

  // Desktop full page
  const p1 = await br.newPage({ viewport: { width: 1280, height: 900 } })
  await p1.setExtraHTTPHeaders({ 'Cache-Control': 'no-cache' })
  await p1.goto(URL_PAGE, { waitUntil: 'networkidle' })
  await p1.waitForTimeout(2500)
  await p1.screenshot({ path: OUT + '/01_fullpage_desktop.png', fullPage: true })
  console.log('done desktop fullpage')

  // Hero section
  const p2 = await br.newPage({ viewport: { width: 1280, height: 900 } })
  await p2.setExtraHTTPHeaders({ 'Cache-Control': 'no-cache' })
  await p2.goto(URL_PAGE, { waitUntil: 'networkidle' })
  await p2.waitForTimeout(1500)
  await p2.screenshot({ path: OUT + '/02_hero.png' })
  console.log('done hero')

  // Programa de Indicação section
  await p2.evaluate(() => window.scrollBy(0, 1000))
  await p2.waitForTimeout(600)
  await p2.screenshot({ path: OUT + '/03_indicacao.png' })
  console.log('done indicacao')

  await p2.evaluate(() => window.scrollBy(0, 1000))
  await p2.waitForTimeout(600)
  await p2.screenshot({ path: OUT + '/04_tabela.png' })
  console.log('done tabela')

  // Mobile
  const p3 = await br.newPage({ viewport: { width: 390, height: 844 } })
  await p3.setExtraHTTPHeaders({ 'Cache-Control': 'no-cache' })
  await p3.goto(URL_PAGE, { waitUntil: 'networkidle' })
  await p3.waitForTimeout(2000)
  await p3.screenshot({ path: OUT + '/05_fullpage_mobile.png', fullPage: true })
  console.log('done mobile')

  await br.close()
  console.log('ALL DONE')
})().catch(e => { console.error(e.message); process.exit(1) })
