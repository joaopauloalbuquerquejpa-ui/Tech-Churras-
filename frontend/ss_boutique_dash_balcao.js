'use strict'
const { chromium } = require('@playwright/test')
const path = require('path')
const fs = require('fs')

const OUT = path.join(__dirname, 'screenshots')
fs.mkdirSync(OUT, { recursive: true })

const BASE_URL = 'https://www.techchurras.com.br'
const API = 'https://tech-churras-production.up.railway.app'

;(async () => {
  const browser = await chromium.launch({ headless: true })

  // Login
  const res = await fetch(API + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'premium.acougue@teste.com', password: '123456' }),
  })
  const { token } = await res.json()
  if (!token) { console.error('login failed'); process.exit(1) }

  async function shot(label, scrollY) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await page.addInitScript(t => {
      localStorage.setItem('auth-storage', JSON.stringify({ state: { token: t, user: { role: 'BOUTIQUE' } } }))
    }, token)
    await page.goto(BASE_URL + '/boutiques/dashboard', { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)
    await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), scrollY)
    await page.waitForTimeout(600)
    await page.screenshot({ path: path.join(OUT, `bdash_${label}.png`) })
    await page.close()
  }

  // Desktop também
  async function shotDesktop(label, scrollY) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await page.addInitScript(t => {
      localStorage.setItem('auth-storage', JSON.stringify({ state: { token: t, user: { role: 'BOUTIQUE' } } }))
    }, token)
    await page.goto(BASE_URL + '/boutiques/dashboard', { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)
    await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), scrollY)
    await page.waitForTimeout(600)
    await page.screenshot({ path: path.join(OUT, `bdash_desk_${label}.png`) })
    await page.close()
  }

  // Mobile — percorre do topo até a seção de balcão
  await shot('top', 0)
  await shot('stats', 700)
  await shot('qr_indicacao', 1600)
  await shot('balcao_top', 2400)
  await shot('balcao_qr', 3100)
  await shot('balcao_script', 3700)

  // Desktop
  await shotDesktop('top', 0)
  await shotDesktop('balcao', 2200)

  await browser.close()
  console.log('done')
})().catch(e => { console.error(e.message); process.exit(1) })
