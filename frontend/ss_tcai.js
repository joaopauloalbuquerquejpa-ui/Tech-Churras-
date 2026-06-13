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
      { category: 'CARVAO', name: 'Carvão', quantity: 2, unit: 'un', reason: 'Brasa consistente 4h', estimatedPrice: 60, priority: 'essencial' },
      { category: 'SAL_TEMPERO', name: 'Sal Grosso', quantity: 1, unit: 'kg', reason: 'Tempero base churrasco', estimatedPrice: 9, priority: 'essencial' },
    ],
    tips: [
      "Salgue a picanha 15 min antes de grelhar.",
      "Revire os espetinhos a cada 3 minutos.",
      "Deixe a carne descansar antes de fatiar.",
    ],
    schedule: "Acenda brasa 45min antes; picanha vai por último.",
    howItsMade: [
      {
        name: "Picanha",
        origin: "Tradição brasileira",
        description: "Tradicionalmente a picanha é grelhada inteira na brasa, com gordura virada para baixo nos primeiros minutos para dourar. O tempero é minimalista: sal grosso na hora de ir ao fogo. É assim que esse corte, descoberto no Brasil nos anos 1960, conquistou o mundo — pela simplicidade que revela o sabor puro da carne.",
      },
      {
        name: "Linguiça Toscana",
        origin: "Churrasco caipira paulista",
        description: "Na tradição do interior de São Paulo, a linguiça toscana vai inteira na grelha sobre brasa média, sendo virada constantemente para cozinhar por igual sem ressecar. Feita de carne suína temperada com alho, sal e ervas, ela ganha casca crocante por fora e interior suculento — um clássico que nunca sai do cardápio.",
      },
      {
        name: "Pão de Alho",
        origin: "Clássico do churrasco nacional",
        description: "Surgido como acompanhamento nos churrascos do Sul do Brasil, o pão de alho se espalhou por todo o país. Feito com pão francês cortado ao meio, coberto de manteiga com alho e temperado com cheiro-verde, ele vai embrulhado em papel alumínio na borda da churrasqueira para assar lentamente e absorver o calor indireto da brasa.",
      },
    ],
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
      { category: 'CARNE', name: 'Entraña', quantity: 1.2, unit: 'kg', reason: 'Macia, sabor intenso', estimatedPrice: 78, priority: 'essencial' },
      { category: 'CARNE', name: 'Chorizo Artesanal', quantity: 1.0, unit: 'kg', reason: 'Embutido gaúcho premium', estimatedPrice: 45, priority: 'essencial' },
      { category: 'CARNE', name: 'Vacío', quantity: 1.0, unit: 'kg', reason: 'Corte argentino suculento', estimatedPrice: 65, priority: 'recomendado' },
      { category: 'ACOMPANHAMENTO', name: 'Chimichurri Artesanal', quantity: 2, unit: 'un', reason: 'Molho tradicional argentino', estimatedPrice: 30, priority: 'essencial' },
      { category: 'CARVAO', name: 'Carvão', quantity: 3, unit: 'un', reason: 'Brasa lenta costela', estimatedPrice: 90, priority: 'essencial' },
    ],
    tips: [
      "Costela leva 4-5h na brasa baixa.",
      "Entraña fica pronta em 8min por lado.",
      "Sirva chimichurri à temperatura ambiente.",
    ],
    schedule: "Acenda brasa 1h antes; costela entra primeiro no fogo.",
    howItsMade: [
      {
        name: "Asado de Tira",
        origin: "Parrilla argentina",
        description: "Na Argentina, o asado de tira é a costela bovina cortada transversalmente em tiras finas, revelando pequenos ossos paralelos. Tradicionalmente vai à parrilla (grelha uruguaio-argentina) sobre brasa baixa e constante por até 5 horas, sem pressa. O resultado é uma carne que solta do osso, com casca dourada e interior macio — símbolo máximo da cultura do asado.",
      },
      {
        name: "Chimichurri",
        origin: "Tradição rioplatense",
        description: "O chimichurri é o molho sagrado da culinária rioplatense, feito com salsinha, alho, orégano, azeite, vinagre e pimenta vermelha. Diferente de outros molhos, ele não vai ao fogo: é preparado a frio e descansa por pelo menos 24h para que os sabores se fundam. Tradicionalmente servido à temperatura ambiente para não encobrir o sabor da carne.",
      },
      {
        name: "Chorizo Artesanal",
        origin: "Embutido gaúcho-argentino",
        description: "Na tradição gaúcha e argentina, o chorizo é feito com carne suína picada grossa, temperada com alho, sal, páprica e vinho tinto seco. Vai à grelha em fogo médio, sendo virado com pinça (nunca garfo, para não perder o suco). Quando a casca está bem dourada e levemente crocante, está pronto — é a entrada clássica de todo bom asado.",
      },
    ],
  },
  meta: { totalPessoas: 12, style: 'parrillada_tech_churras', hours: 5 }
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
      { category: 'ACOMPANHAMENTO', name: 'Pão de Alho Artesanal', quantity: 6, unit: 'un', reason: 'Feito na hora, manteiga especial', estimatedPrice: 78, priority: 'essencial' },
      { category: 'CARVAO', name: 'Carvão Premium', quantity: 2, unit: 'un', reason: 'Brasa uniforme para cortes nobres', estimatedPrice: 60, priority: 'essencial' },
      { category: 'SAL_TEMPERO', name: 'Flor de Sal', quantity: 1, unit: 'un', reason: 'Finalização premium dos cortes', estimatedPrice: 25, priority: 'essencial' },
    ],
    tips: [
      "Wagyu deve ser grelhado em alta temperatura, 3min por lado.",
      "Tomahawk descansa 10min antes de fatiar.",
      "Use flor de sal apenas na finalização.",
    ],
    schedule: "Acenda brasa 1h antes; wagyu e tomahawk por último.",
    howItsMade: [
      {
        name: "Picanha Wagyu",
        origin: "Especialidade Jota",
        description: "O wagyu é uma raça bovina japonesa conhecida pela marmorização intramuscular de gordura, que derrete durante o cozimento e cria uma textura e sabor únicos. Tradicionalmente é grelhado em alta temperatura por poucos minutos de cada lado — quanto menor o ponto, mais a gordura se dissolve e intensifica o sabor. É uma experiência gastronômica rara no churrasco brasileiro.",
      },
      {
        name: "Tomahawk",
        origin: "Corte premium americano",
        description: "O tomahawk é um corte do contrafilé com o osso da costela inteiro — podendo medir até 40cm — que lembra o machado dos nativos norte-americanos. Por sua espessura de até 6cm, costuma ser selado em fogo alto e depois finalizado em temperatura indireta mais baixa, técnica conhecida como reverse sear. O resultado é uma carne com casca dourada e interior rosado e suculento.",
      },
      {
        name: "Baby-Beef Maturado",
        origin: "Tradição da maturação brasileira",
        description: "A maturação a seco (dry aging) é uma técnica em que a carne descansa em câmara fria controlada por 21 a 45 dias. Nesse processo, enzimas naturais quebram as fibras musculares, concentrando o sabor e tornando a carne excepcionalmente macia. É assim que o baby-beef ganha uma complexidade de sabor impossível de obter em carnes frescas.",
      },
    ],
  },
  meta: { totalPessoas: 10, style: 'especialidade_jota', hours: 4 }
}

;(async () => {
  const browser = await chromium.launch({ headless: true })

  async function takeShot(mockPlan, menuLabel, filename) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const page = await ctx.newPage()

    await page.addInitScript(() => {
      const fakeUser = { id: 'u1', name: 'João Teste', email: 'joao@teste.com', role: 'CUSTOMER' }
      const fakeAuth = JSON.stringify({ state: { user: fakeUser, token: 'fake-token' }, version: 0 })
      localStorage.setItem('token', 'fake-token')
      localStorage.setItem('auth-storage', fakeAuth)
      localStorage.setItem('tc-onb-u1', 'done')
      localStorage.setItem('joyride-done', 'true')
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
    await page.waitForTimeout(800)

    // Dismiss any joyride overlay
    await page.evaluate(() => {
      document.querySelectorAll('[id*="joyride"], [class*="joyride"]').forEach(el => el.remove())
    })
    await page.waitForTimeout(300)

    // Submit
    await page.click('button[type="submit"]', { force: true })
    await page.waitForTimeout(2500)

    // Scroll to howItsMade section for focused screenshot
    await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h3'))
      const h = headings.find(el => el.textContent?.includes('Como é Feito'))
      if (h) h.scrollIntoView({ behavior: 'instant', block: 'center' })
    })
    await page.waitForTimeout(300)
    await page.screenshot({ path: path.join(SS, `${filename}_comoefeito.png`) })

    // Full page
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(200)
    await page.screenshot({ path: path.join(SS, `${filename}_result_full.png`), fullPage: true })

    console.log(`✅ ${menuLabel} — done`)
    await ctx.close()
  }

  await takeShot(MOCK_PLAN_MENU_TC,    'Menu Tech Churras',          'tcai_menu_tc')
  await takeShot(MOCK_PLAN_PARRILLADA, 'Parrillada Tech Churras',    'tcai_parrillada')
  await takeShot(MOCK_PLAN_JOTA,       'Especialidade Jota',         'tcai_jota')

  await browser.close()
  console.log('🔥 All screenshots done')
})().catch(e => { console.error(e.message); process.exit(1) })
