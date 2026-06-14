'use strict'
const { chromium } = require('@playwright/test')

const BASE = 'https://www.techchurras.com.br'

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  page.on('request', req => {
    if (req.method() === 'POST') console.log('REQ POST', req.url())
  })
  page.on('response', async res => {
    if (res.request().method() === 'POST') {
      console.log('RES', res.status(), res.url())
      try { const t = await res.text(); console.log('BODY:', t.slice(0, 300)) } catch {}
    }
  })
  page.on('requestfailed', req => {
    console.log('FAILED', req.url(), req.failure()?.errorText)
  })

  await page.goto(BASE + '/login')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)
  await page.locator('input[type="email"]').fill('maria.cliente@teste.com', { force: true })
  await page.locator('input[type="password"]').fill('123456', { force: true })
  await page.locator('button[type="submit"]').click({ force: true })
  await page.waitForTimeout(15000)
  console.log('FINAL URL:', page.url())

  await browser.close()
})().catch(e => console.error(e.message))
