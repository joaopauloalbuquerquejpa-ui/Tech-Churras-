'use strict'
const { chromium } = require('@playwright/test')
const path = require('path')
const fs = require('fs')

const OUT = path.join(__dirname, 'screenshots')
fs.mkdirSync(OUT, { recursive: true })

const API = 'https://tech-churras-production.up.railway.app'
const BASE = 'https://www.techchurras.com.br'

;(async () => {
  const browser = await chromium.launch({ headless: true })

  const res = await fetch(API + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'joaopauloalbuquerque.jpa@gmail.com', password: 'JotaAdmin@TechChurras2025!' }),
  })
  const { token } = await res.json()
  if (!token) { console.error('login falhou'); process.exit(1) }

  async function shot(label, tab, scrollY = 0, viewport = { width: 390, height: 844 }) {
    const page = await browser.newPage({ viewport })
    await page.addInitScript(t => {
      localStorage.setItem('auth-storage', JSON.stringify({ state: { token: t, user: { role: 'ADMIN' } } }))
    }, token)
    await page.goto(BASE + '/admin', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2500)
    if (tab) {
      const btn = page.locator('button', { hasText: tab })
      if (await btn.count() > 0) { await btn.first().click(); await page.waitForTimeout(1200) }
    }
    if (scrollY) { await page.evaluate(y => window.scrollTo({ top: y }), scrollY); await page.waitForTimeout(400) }
    await page.screenshot({ path: path.join(OUT, `admin_${label}.png`) })
    await page.close()
  }

  // Mobile
  await shot('resumo', null)
  await shot('pedidos', 'Pedidos')
  await shot('pendentes', 'Pendentes')
  await shot('equipe_top', '🔥 Minha Equipe')
  await shot('equipe_agenda', '🔥 Minha Equipe', 600)
  await shot('equipe_perfil', '🔥 Minha Equipe', 1300)

  // Desktop
  await shot('desk_resumo', null, 0, { width: 1280, height: 900 })
  await shot('desk_equipe', '🔥 Minha Equipe', 0, { width: 1280, height: 900 })

  await browser.close()
  console.log('done')
})().catch(e => { console.error(e.message); process.exit(1) })
