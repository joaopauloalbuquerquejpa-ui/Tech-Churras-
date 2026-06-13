'use strict'
const { chromium } = require('@playwright/test')
const path = require('path')
const fs = require('fs')

const BASE = 'https://www.techchurras.com.br'
const API  = 'https://tech-churras-production.up.railway.app'
const SS   = path.join(__dirname, 'screenshots', 'prod')
fs.mkdirSync(SS, { recursive: true })

const MOCK_PLAN_MENU_TC = {
  plan: {
    intro: "Menu Tech Churras perfeito para 16 pessoas, misturando cortes tradicionais com espetinhos.",
    totalKg: 5.8,
    estimatedCost: 498.00,
    items: [
      { category: 'CARNE', name: 'Picanha', quantity: 2.2, unit: 'kg', reason: 'Corte nobre, base do menu', estimatedPrice: 198, priority: 'essencial' },
      { category: 'CARNE', name: 'Fraldinha', quantity: 1.2, unit: 'kg', reason: 'Macia e suculenta', estimatedPrice: 78, priority: 'essencial' },
      { category: 'CARNE', name: 'Linguiça Artesanal', quantity: 1.0, unit: 'kg', reason: 'Linguiça caipira tradicional', estimatedPrice: 33, priority: 'essencial' },
      { category: 'CARNE', name: 'Coração de Frango', quantity: 0.8, unit: 'kg', reason: 'Espetinho clássico', estimatedPrice: 22, priority: 'recomendado' },
      { category: 'ACOMPANHAMENTO', name: 'Pão de Alho', quantity: 8, unit: 'un', reason: 'Acompanhamento obrigatório', estimatedPrice: 104, priority: 'essencial' },
      { category: 'ACOMPANHAMENTO', name: 'Queijo Coalho', quantity: 0.6, unit: 'kg', reason: 'Grelhado na brasa', estimatedPrice: 15, priority: 'recomendado' },
      { category: 'CARVAO', name: 'Carvão', quantity: 2, unit: 'un', reason: 'Brasa consistente 4h', estimatedPrice: 60, priority: 'essencial' },
      { category: 'SAL_TEMPERO', name: 'Sal Grosso', quantity: 1, unit: 'kg', reason: 'Tempero base churrasco', estimatedPrice: 9, priority: 'essencial' },
    ],
    tips: [
      "Salgue a picanha 15 min antes de grelhar.",
      "Revire os espetinhos a cada 3 minutos.",
      "Deixe a carne descansar antes de fatiar.",
    ],
    schedule: "Acenda brasa 45min antes; picanha vai por último."
  },
  meta: { totalPessoas: 16, style: 'menu_tech_churras', hours: 4 }
}

const MOCK_PLAN_PARRILLADA = {
  plan: {
    intro: "Parrillada Tech Churras autêntica para 12 pessoas, no estilo gaúcho-argentino.",
    totalKg: 5.2,
    estimatedCost: 412.00,
    items: [
      { category: 'CARNE', name: 'Costela Asado de Tira', quantity: 2.0, unit: 'kg', reason: 'Carro-chefe da parrillada', estimatedPrice: 92, priority: 'essencial' },
      { category: 'CARNE', name: 'Entraña (Fraldinha Fina)', quantity: 1.2, unit: 'kg', reason: 'Macia, sabor intenso', estimatedPrice: 78, priority: 'essencial' },
      { category: 'CARNE', name: 'Chorizo Artesanal', quantity: 1.0, unit: 'kg', reason: 'Embutido gaúcho premium', estimatedPrice: 45, priority: 'essencial' },
      { category: 'CARNE', name: 'Vacío (Fraldinha Argentina)', quantity: 1.0, unit: 'kg', reason: 'Corte argentino suculento', estimatedPrice: 65, priority: 'recomendado' },
      { category: 'ACOMPANHAMENTO', name: 'Chimichurri Artesanal', quantity: 2, unit: 'un', reason: 'Molho tradicional argentino', estimatedPrice: 30, priority: 'essencial' },
      { category: 'ACOMPANHAMENTO', name: 'Mandioca Cozida', quantity: 1.0, unit: 'kg', reason: 'Acompanhamento gaúcho', estimatedPrice: 12, priority: 'recomendado' },
      { category: 'CARVAO', name: 'Carvão', quantity: 3, unit: 'un', reason: 'Brasa lenta costela', estimatedPrice: 90, priority: 'essencial' },
    ],
    tips: [
      "Costela leva 4-5h na brasa baixa.",
      "Entraña fica pronta em 8min por lado.",
      "Sirva chimichurri à temperatura ambiente.",
    ],
    schedule: "Acenda brasa 1h antes; costela entra primeiro no fogo."
  },
  meta: { totalPessoas: 12, style: 'parrillada_tech_churras', hours: 5 }
}

;(async () => {
  const browser = await chromium.launch({ headless: true })

  async function takeShot(mockPlan, menuLabel, filename, formValues) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const page = await ctx.newPage()

    await page.addInitScript(() => {
      const fakeUser = { id: 'u1', name: 'João Teste', email: 'joao@teste.com', role: 'CUSTOMER' }
      const fakeAuth = JSON.stringify({ state: { user: fakeUser, token: 'fake-token' }, version: 0 })
      localStorage.setItem('token', 'fake-token')
      localStorage.setItem('auth-storage', fakeAuth)
      // Dismiss all joyride onboarding tours
      localStorage.setItem('tc-onb-u1', 'done')
      localStorage.setItem('joyride-done', 'true')
      localStorage.setItem('tour-done', 'true')
      localStorage.setItem('onboarding-done', 'true')
    })

    await page.route(`${API}/**`, async (route) => {
      const url = route.request().url()
      if (url.includes('/ai/plan-event')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockPlan) })
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    })

    await page.goto(BASE + '/menu/assistente')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Dismiss any overlay/modal/joyride
    await page.evaluate(() => {
      document.querySelectorAll('[id*="joyride"], [class*="joyride"], [id*="overlay"], [class*="overlay"]')
        .forEach(el => el.remove())
    })
    await page.waitForTimeout(400)

    // Screenshot 1: form state showing selected menu
    await page.screenshot({ path: path.join(SS, `${filename}_form.png`) })

    // Submit form to get result
    await page.click('button[type="submit"]', { force: true })
    await page.waitForTimeout(2500)

    await page.screenshot({ path: path.join(SS, `${filename}_result.png`), fullPage: true })
    console.log(`✅ ${menuLabel} — done`)
    await ctx.close()
  }

const MOCK_PLAN_JOTA = {
  plan: {
    intro: "Especialidade Jota Grillmaster premium para 10 pessoas, cortes nobres chancelados por Jota.",
    totalKg: 4.5,
    estimatedCost: 890.00,
    items: [
      { category: 'CARNE', name: 'Picanha Wagyu', quantity: 1.5, unit: 'kg', reason: 'Corte premium, marmorização excepcional', estimatedPrice: 300, priority: 'essencial' },
      { category: 'CARNE', name: 'Tomahawk', quantity: 1.2, unit: 'kg', reason: 'Corte espetacular, visual impressionante', estimatedPrice: 180, priority: 'essencial' },
      { category: 'CARNE', name: 'Baby-Beef Maturado', quantity: 0.8, unit: 'kg', reason: 'Contra-filé nobre, 28 dias maturação', estimatedPrice: 110, priority: 'recomendado' },
      { category: 'CARNE', name: 'Linguiça Premium Artesanal', quantity: 0.5, unit: 'kg', reason: 'Embutido artesanal premium', estimatedPrice: 45, priority: 'recomendado' },
      { category: 'ACOMPANHAMENTO', name: 'Pão de Alho Artesanal', quantity: 6, unit: 'un', reason: 'Feito na hora, manteiga especial', estimatedPrice: 78, priority: 'essencial' },
      { category: 'ACOMPANHAMENTO', name: 'Queijo Coalho Gourmet', quantity: 0.5, unit: 'kg', reason: 'Queijo premium grelhado na pedra', estimatedPrice: 35, priority: 'recomendado' },
      { category: 'CARVAO', name: 'Carvão Premium', quantity: 2, unit: 'un', reason: 'Brasa uniforme para cortes nobres', estimatedPrice: 60, priority: 'essencial' },
      { category: 'SAL_TEMPERO', name: 'Flor de Sal', quantity: 1, unit: 'un', reason: 'Finalização premium dos cortes', estimatedPrice: 25, priority: 'essencial' },
    ],
    tips: [
      "Wagyu deve ser grelhado em alta temperatura, 3min por lado.",
      "Tomahawk descansa 10min antes de fatiar.",
      "Use flor de sal apenas na finalização.",
    ],
    schedule: "Acenda brasa 1h antes; wagyu e tomahawk por último."
  },
  meta: { totalPessoas: 10, style: 'especialidade_jota', hours: 4 }
}

  await takeShot(MOCK_PLAN_JOTA, 'Especialidade Jota Grillmaster', 'tcai_jota', {})

  await browser.close()
  console.log('🔥 All screenshots done')
})().catch(e => { console.error(e.message); process.exit(1) })
