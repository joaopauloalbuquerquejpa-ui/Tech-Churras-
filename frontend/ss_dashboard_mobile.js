'use strict'
const { chromium, devices, request } = require('@playwright/test')
const path = require('path')
const fs = require('fs')

const BASE = 'https://www.techchurras.com.br'
const API = 'https://tech-churras-production.up.railway.app'
const SS = path.join(__dirname, 'screenshots', 'prod')
fs.mkdirSync(SS, { recursive: true })

;(async () => {
  const browser = await chromium.launch({ headless: true })

  // 1) Login via Playwright API request context (Node.js http, não browser)
  console.log('Fazendo login via API...')
  const apiCtx = await request.newContext({ baseURL: API, timeout: 120000 })
  const loginRes = await apiCtx.post('/auth/login', {
    data: { email: 'maria.cliente@teste.com', password: '123456' },
  })
  if (!loginRes.ok()) {
    throw new Error('Login falhou: ' + loginRes.status() + ' ' + await loginRes.text())
  }
  const loginData = await loginRes.json()
  const token = loginData.token
  const user = loginData.user
  console.log('Login OK, user:', user?.name)

  const authStorage = JSON.stringify({
    state: { user, token },
    version: 0,
  })

  // 2) Contexto mobile com token injetado
  const iPhone = devices['iPhone 13']
  const mobileCtx = await browser.newContext({ ...iPhone })
  const page = await mobileCtx.newPage()

  await page.goto(BASE + '/login')
  await page.waitForLoadState('domcontentloaded')
  await page.evaluate(({ token, authStorage, userId }) => {
    localStorage.setItem('token', token)
    localStorage.setItem('auth-storage', authStorage)
    if (userId) localStorage.setItem('tc-onb-' + userId, 'done')
  }, { token, authStorage, userId: user?.id })

  await page.goto(BASE + '/dashboard')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(800)

  await page.screenshot({ path: path.join(SS, 'dashboard_mobile.png'), fullPage: true })
  console.log('Screenshot capturado!')
  await browser.close()
  await apiCtx.dispose()
})().catch(e => { console.error(e.message); process.exit(1) })
