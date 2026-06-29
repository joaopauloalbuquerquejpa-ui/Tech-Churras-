'use strict'
const { chromium } = require('@playwright/test')
const path = require('path')
const fs = require('fs')

const OUT = path.join(__dirname, 'screenshots', 'deploy')
fs.mkdirSync(OUT, { recursive: true })

const BASE = 'https://www.techchurras.com.br'
const API  = 'https://tech-churras-production.up.railway.app'
const ORDER_ID = 'e0b55946-1e17-44b8-b16d-26160afe0df5'

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: false })
  console.log('  📸', name)
}

async function loginViaAPI(email, password) {
  const res = await fetch(API + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!data.token) throw new Error('Login falhou: ' + JSON.stringify(data))
  return data.token
}

async function injectToken(page, token, role) {
  await page.addInitScript((t, r) => {
    localStorage.setItem('auth-storage', JSON.stringify({
      state: { token: t, user: { role: r } }
    }))
  }, token, role)
}

;(async () => {
  // Aguarda deploy ficar pronto (testa 404 vs 200 no redirect)
  console.log('\n⏳ Verificando deploy da Vercel...')
  let deployed = false
  for (let i = 0; i < 12; i++) {
    try {
      const r = await fetch(BASE + '/grillmasters/orders/' + ORDER_ID, { redirect: 'manual' })
      // Se retornar 307/308 = redirect = deploy funcionou
      if (r.status === 307 || r.status === 308 || r.status === 200) {
        console.log('  ✅ Deploy no ar! Status:', r.status)
        deployed = true
        break
      }
      console.log('  ⏳ Status:', r.status, '— aguardando...')
    } catch (e) {
      console.log('  ⏳ Aguardando...')
    }
    await new Promise(r => setTimeout(r, 10000))
  }
  if (!deployed) console.log('  ⚠️  Deploy pode ainda estar em andamento')

  const browser = await chromium.launch({ headless: true })
  const vp = { width: 390, height: 844 }

  // Token do cliente
  const clienteToken = await loginViaAPI('maria.cliente@teste.com', '123456')
  const gmToken = await loginViaAPI('techchurras@gmail.com', 'TechChurras@2025!')

  // 1. Página de pagamento
  console.log('\n[1] Página de pagamento...')
  const p1 = await browser.newPage({ viewport: vp })
  await injectToken(p1, clienteToken, 'CUSTOMER')
  await p1.goto(BASE + '/orders/' + ORDER_ID + '/payment', { waitUntil: 'networkidle' })
  await p1.waitForTimeout(2500)
  await shot(p1, '01_pagamento')
  await p1.close()

  // 2. Detalhe do pedido (cliente)
  console.log('\n[2] Detalhe do pedido (cliente)...')
  const p2 = await browser.newPage({ viewport: vp })
  await injectToken(p2, clienteToken, 'CUSTOMER')
  await p2.goto(BASE + '/orders/' + ORDER_ID, { waitUntil: 'networkidle' })
  await p2.waitForTimeout(2500)
  await shot(p2, '02_pedido_cliente')
  await p2.close()

  // 3. /grillmasters/orders/:id → deve redirecionar para /orders/:id
  console.log('\n[3] Redirect /grillmasters/orders/:id (GM)...')
  const p3 = await browser.newPage({ viewport: vp })
  await injectToken(p3, gmToken, 'GRILLMASTER')
  await p3.goto(BASE + '/grillmasters/orders/' + ORDER_ID, { waitUntil: 'networkidle' })
  await p3.waitForTimeout(2500)
  const finalUrl = p3.url()
  console.log('  URL final:', finalUrl)
  await shot(p3, '03_gm_pedido_via_redirect')
  await p3.close()

  // 4. Dashboard do GM
  console.log('\n[4] Dashboard do GM...')
  const p4 = await browser.newPage({ viewport: vp })
  await injectToken(p4, gmToken, 'GRILLMASTER')
  await p4.goto(BASE + '/grillmasters/dashboard', { waitUntil: 'networkidle' })
  await p4.waitForTimeout(2500)
  await shot(p4, '04_gm_dashboard')
  await p4.close()

  // 5. Desktop — página de pagamento
  console.log('\n[5] Pagamento desktop...')
  const p5 = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  await injectToken(p5, clienteToken, 'CUSTOMER')
  await p5.goto(BASE + '/orders/' + ORDER_ID + '/payment', { waitUntil: 'networkidle' })
  await p5.waitForTimeout(2500)
  await shot(p5, '05_pagamento_desktop')
  await p5.close()

  // 6. Desktop — detalhe do pedido
  console.log('\n[6] Detalhe do pedido desktop...')
  const p6 = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await injectToken(p6, clienteToken, 'CUSTOMER')
  await p6.goto(BASE + '/orders/' + ORDER_ID, { waitUntil: 'networkidle' })
  await p6.waitForTimeout(2500)
  await shot(p6, '06_pedido_desktop')
  await p6.close()

  await browser.close()

  console.log('\n✅ Screenshots salvas em screenshots/deploy/')
  console.log('Redirect funcionou:', finalUrl.includes('/orders/') && !finalUrl.includes('/grillmasters/') ? '✅ SIM' : '⚠️  verificar')
})().catch(e => { console.error('❌', e.message); process.exit(1) })
