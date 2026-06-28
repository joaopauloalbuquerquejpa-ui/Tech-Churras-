import { FastifyInstance } from 'fastify'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { authenticate } from '../../middlewares/auth.middleware'
import { geocodeAddress } from '../../utils/geo'
import { findNearbyBoutiques } from '../boutiques/boutiques.service'
import { findNearbyGrillmasters } from '../grillmasters/grillmasters.service'

// Rate limit em memória por usuário para /ai/suggest-product (upload de imagem)
const suggestRateLimits = new Map<string, { count: number; resetAt: number }>()
// Limpa entradas expiradas a cada 10 minutos para evitar crescimento ilimitado
setInterval(() => {
  const now = Date.now()
  for (const [key, val] of suggestRateLimits) {
    if (now >= val.resetAt) suggestRateLimits.delete(key)
  }
}, 10 * 60 * 1000)

const SYSTEM_PROMPT = `Você é a assistente da Tech Churras — parceira do Jota Albuquerque (Jota Grillmaster, fundador da plataforma) e especialista apaixonada por churrasco brasileiro.

PERSONALIDADE E VOZ:
- Fale como uma amiga de confiança que entende muito de churrasco e genuinamente quer que o evento seja incrível
- Use linguagem brasileira natural e calorosa — "olha", "perfeito", "adorei a ideia", nunca robótico
- Chame o cliente pelo primeiro nome quando souber (ex: "João, para o seu evento...")
- Demonstre empolgação real pelo evento: aniversário, confraternização, casamento — cada um é especial
- Emojis com moderação: máximo 2 por resposta; 🔥 e 🥩 funcionam bem
- NUNCA comece com "Claro!" ou "Certamente!"

QUANDO MENCIONAR O JOTA:
- Cortes nobres (picanha, tomahawk, wagyu): "o Jota garante que essa picanha é o destaque de qualquer churrasco"
- Menu Especialidade Jota: "essa é a experiência premium que o Jota criou pessoalmente"
- Eventos especiais (casamento, corporativo grande): "o Jota trataria esse evento com atenção especial"
- Seja natural — não force em todo lugar, apenas onde fizer sentido

REGRAS DE CÁLCULO DE QUANTIDADE (somente proteínas — acompanhamentos são à parte):
- Homens adultos: 350g de proteína por pessoa
- Mulheres adultas: 300g por pessoa
- Crianças: 200g por pessoa

MENUS EXCLUSIVOS TECH CHURRAS:

MENU TECH CHURRAS (menu_tech_churras)
O clássico reinventado. Combina cortes tradicionais do churrasco paulista com variações mineiras (frango caipira, linguiça fina, milho verde), espetinhos (coração de frango, espetinho de alcatra) e misto a gosto. Distribuição: 40% bovino (picanha, fraldinha, costela), 25% suíno/linguiça, 20% frango, 15% acompanhamentos. Estilo acessível, quantidade farta.

PARRILLADA TECH CHURRAS (parrillada_tech_churras)
Tradição gaúcha com influência argentina. Cortes: asado de tira (costela fatiada), vacío (fraldinha argentina), entraña (fraldinha fina), chorizo artesanal, costela de boi no bafo. Método: brasa lenta, sal grosso, tempero mínimo. Distribuição: 60% bovino (costela, fraldinha, entraña), 25% embutido artesanal, 15% acompanhamentos (chimichurri, pão campeiro, mandioca).

ESPECIALIDADE JOTA GRILLMASTER (especialidade_jota)
A experiência premium chancelada pessoalmente por Jota Albuquerque. Cortes nobres: picanha wagyu, tomahawk, T-bone, baby-beef, contra-filé maturado. Acompanhamentos gourmet: arroz carreteiro, vinagrete especial, pão de alho artesanal, queijo coalho gourmet. Distribuição: 70% bovino premium, 15% suíno premium, 15% acompanhamentos gourmet. Preços referenciais: Wagyu R$200/kg, Tomahawk R$150/kg, T-bone R$120/kg.

PREÇOS MÉDIOS SP 2026: Picanha R$90/kg, Costela R$46/kg, Fraldinha R$65/kg, Frango R$19/kg, Linguiça R$33/kg, Pão de alho R$13/un, Queijo coalho R$25/kg, Carvão R$30/5kg, Sal grosso R$9/kg, Wagyu R$200/kg, Tomahawk R$150/kg, T-bone R$120/kg

SEÇÃO "COMO É FEITO" (howItsMade):
Selecione 2-3 itens "estrela" do menu escolhido (os mais característicos e diferenciados) e descreva como são tradicionalmente preparados.
- Itens sugeridos por menu: menu_tech_churras → picanha, linguiça toscana, pão de alho; parrillada_tech_churras → asado de tira, chimichurri, provoleta; especialidade_jota → picanha wagyu, tomahawk, costela maturada
- "origin": origem/tradição em 2-4 palavras (ex: "Tradição gaúcha", "Parrilla argentina", "Churrasco uruguaio", "Especialidade Jota")
- "description": 2-3 frases em tom EDUCATIVO e CONVIDATIVO. Descreva a técnica de cocção, tempero típico e contexto cultural. Use linguagem como "Tradicionalmente...", "Na culinária X, esse corte costuma ser...", "É assim que esse prato ganhou fama...". NUNCA use "No seu evento faremos..." ou promessas de execução específica.
- Máximo 50 palavras por description

REGRAS ESTRITAS DO JSON:
- "category": EXATAMENTE um de: CARNE, ACOMPANHAMENTO, SAL_TEMPERO, CARVAO, BEBIDA, OUTRO
- "priority": EXATAMENTE um de: essencial, recomendado, opcional
- "unit": EXATAMENTE um de: kg, un, g, L
- "items": MÁXIMO 8 itens (apenas os mais importantes)
- "reason": máximo 6 palavras por item
- "tips": exatamente 3 dicas, cada uma com máximo 10 palavras
- "schedule": máximo 20 palavras
- "intro": máximo 30 palavras — comece com o nome do cliente se disponível, tom caloroso (ex: "Lucas, para o seu aniversário de 30 pessoas, montei um kit que vai impressionar! 🔥")
- "howItsMade": exatamente 2-3 objetos
- Responda SOMENTE com JSON válido, SEM markdown, SEM backticks, SEM qualquer texto fora do JSON

Schema exato (copie estrutura):
{"intro":"string","totalKg":0,"estimatedCost":0,"items":[{"category":"CARNE","name":"string","quantity":0,"unit":"kg","reason":"string","estimatedPrice":0,"priority":"essencial"}],"tips":["string"],"schedule":"string","howItsMade":[{"name":"string","origin":"string","description":"string"}]}`

// Normaliza category e priority para os enums esperados pelo frontend
function normalizeItem(item: Record<string, unknown>): Record<string, unknown> {
  const catMap: Record<string, string> = {
    carnes: 'CARNE', carne: 'CARNE',
    acompanhamentos: 'ACOMPANHAMENTO', acompanhamento: 'ACOMPANHAMENTO',
    'temperos e insumos': 'SAL_TEMPERO', temperos: 'SAL_TEMPERO', sal: 'SAL_TEMPERO',
    carvao: 'CARVAO', carvão: 'CARVAO',
    bebidas: 'BEBIDA', bebida: 'BEBIDA',
  }
  const prioMap: Record<string, string> = {
    alta: 'essencial', alto: 'essencial', high: 'essencial',
    media: 'recomendado', média: 'recomendado', medium: 'recomendado', médio: 'recomendado', medio: 'recomendado',
    baixa: 'opcional', baixo: 'opcional', low: 'opcional',
  }
  const cat = String(item.category ?? '').toLowerCase()
  const prio = String(item.priority ?? '').toLowerCase()
  return {
    ...item,
    category: catMap[cat] ?? item.category ?? 'OUTRO',
    priority: prioMap[prio] ?? item.priority ?? 'recomendado',
  }
}

export async function aiRoutes(app: FastifyInstance) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  app.post('/ai/plan-event', { preHandler: [authenticate], config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, async (request, reply) => {
    const {
      style = 'tradicional', homens = 5, mulheres = 3, criancas = 0,
      restrictions = '', hours = 4, customerName = '', occasion = '',
    } = request.body as {
      style?: string; homens?: number; mulheres?: number
      criancas?: number; restrictions?: string; hours?: number
      customerName?: string; occasion?: string
    }

    const totalPessoas = Number(homens) + Number(mulheres) + Number(criancas)
    if (totalPessoas < 1) return reply.status(400).send({ error: 'Informe pelo menos 1 convidado' })

    const firstName = customerName?.trim().split(' ')[0] || ''
    const clientCtx = firstName ? `Cliente: ${firstName}` : ''
    const occasionCtx = occasion ? `Ocasião: ${occasion}` : ''
    const userPrompt = `${clientCtx}${occasionCtx ? ' | ' + occasionCtx : ''}
Churrasco estilo ${style}: ${homens} homens, ${mulheres} mulheres, ${criancas} crianças — ${hours}h de evento.${restrictions ? ` Restrições: ${restrictions}.` : ''}
No campo "intro", cumprimente pelo nome (se tiver) e comente algo caloroso sobre o evento. Máximo 8 itens. JSON puro.`

    const message = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2500,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userPrompt }],
    })

    const rawContent = message.content[0].type === 'text' ? message.content[0].text : ''

    let plan: Record<string, unknown>
    try {
      const cleaned = rawContent.replace(/^```json\s*/m, '').replace(/\s*```$/m, '').trim()
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      plan = JSON.parse(jsonMatch ? jsonMatch[0] : cleaned) as Record<string, unknown>
    } catch {
      return reply.status(500).send({ error: 'Falha ao processar resposta da IA. Tente novamente.' })
    }

    // Normaliza arrays
    if (Array.isArray(plan.items)) {
      plan.items = (plan.items as Record<string, unknown>[]).map(normalizeItem)
    }

    return reply.send({ plan, meta: { totalPessoas, style, hours } })
  })

  // ── POST /ai/suggest-product ─────────────────────────────────────────
  app.post('/ai/suggest-product', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as any).user?.id as string

    // Rate limiting
    const now = Date.now()
    const rl = suggestRateLimits.get(userId)
    if (rl && now < rl.resetAt) {
      if (rl.count >= 10) return reply.status(429).send({ error: 'Muitas requisições. Aguarde 1 minuto.' })
      rl.count++
    } else {
      suggestRateLimits.set(userId, { count: 1, resetAt: now + 60_000 })
    }

    try {
      const data = await request.file()
      if (!data) return reply.status(400).send({ error: 'Nenhuma imagem enviada' })

      const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
      if (!ALLOWED.includes(data.mimetype)) {
        return reply.status(400).send({ error: 'Formato inválido. Use JPG, PNG ou WebP.' })
      }

      const buffer = await data.toBuffer()
      if (buffer.byteLength > 5 * 1024 * 1024) {
        return reply.status(400).send({ error: 'Imagem muito grande. Máximo 5MB.' })
      }

      // Upload para Supabase (para usar como imageUrl do produto)
      let imageUrl: string | undefined
      const supabaseUrl = process.env.SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey)
        const ext = (data.filename?.split('.').pop() || 'jpg').toLowerCase()
        const fileName = `product-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('partner-images')
          .upload(fileName, buffer, { contentType: data.mimetype, upsert: false })
        if (!uploadErr) {
          const { data: { publicUrl } } = supabase.storage.from('partner-images').getPublicUrl(fileName)
          imageUrl = publicUrl
        }
      }

      // Chama Claude Vision
      const base64 = buffer.toString('base64')
      const mediaType = data.mimetype as 'image/jpeg' | 'image/png' | 'image/webp'

      const PRODUCT_SYSTEM = `Você é especialista em produtos de açougue brasileiro. Analise a imagem enviada e identifique o produto.
Responda SOMENTE com JSON válido, sem markdown, sem texto extra:
{"name":"nome comercial do corte ou produto","category":"CARNE|SAL_TEMPERO|CARVAO|ACOMPANHAMENTO|BEBIDA|OUTRO","description":"descrição comercial curta e atrativa em 1-2 frases","suggestedUnit":"kg|un|L","confidence":"alta|media|baixa"}
Regras:
- name: nome popular brasileiro (ex: Picanha, Fraldinha, Linguiça Artesanal)
- category: use EXATAMENTE um dos valores listados
- description: focada em venda, mencionando características do produto
- Se não reconhecer com confiança, retorne campos name/description vazios mas mantenha JSON válido`

      const message = await client.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 400,
        system: [{ type: 'text', text: PRODUCT_SYSTEM, cache_control: { type: 'ephemeral' } }],
        messages: [{
          role: 'user',
          content: [{ type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } }],
        }],
      })

      const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
      const defaults = { name: '', category: 'CARNE', description: '', suggestedUnit: 'kg', confidence: 'baixa' }

      try {
        const cleaned = rawText.replace(/```json\s*/g, '').replace(/```/g, '').trim()
        const match = cleaned.match(/\{[\s\S]*\}/)
        const parsed = match ? JSON.parse(match[0]) : {}
        return reply.send({ ...defaults, ...parsed, imageUrl })
      } catch {
        return reply.send({ ...defaults, imageUrl })
      }
    } catch (err: any) {
      return reply.status(500).send({ error: 'Falha ao analisar imagem', details: err.message })
    }
  })

  // ── POST /ai/geocode ─────────────────────────────────────────────────
  app.post('/ai/geocode', {
    preHandler: [authenticate],
    config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const { address } = request.body as { address: string }
    if (!address) return reply.status(400).send({ error: 'Endereco obrigatorio' })
    const coords = await geocodeAddress(address)
    if (!coords) return reply.status(404).send({ error: 'Endereco nao encontrado' })
    return reply.send(coords)
  })

  // ── POST /ai/kit-perfeito ────────────────────────────────────────────
  app.post('/ai/kit-perfeito', { preHandler: [authenticate], config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, async (request, reply) => {
    const { eventAddress, guests, occasion = 'churrasco', budget, eventDate, customerName = '' } = request.body as {
      eventAddress: string; guests: number; occasion?: string; budget?: number; eventDate?: string; customerName?: string
    }

    if (!eventAddress || !guests || guests < 1) {
      return reply.status(400).send({ error: 'Informe endereco e numero de convidados' })
    }

    const coords = await geocodeAddress(eventAddress)
    if (!coords) return reply.status(400).send({ error: 'Nao conseguimos localizar esse endereco. Tente ser mais especifico.' })

    // Busca progressiva: 15km → 40km → 100km → qualquer disponível
    async function findWithFallback() {
      for (const r of [15, 40, 100]) {
        const [b, g] = await Promise.all([
          findNearbyBoutiques(coords!.lat, coords!.lng, r),
          findNearbyGrillmasters(coords!.lat, coords!.lng, r),
        ])
        const bWithProd = b.filter((x: any) => x.products.length > 0)
        if (bWithProd.length > 0 && g.length > 0) return { boutiques: bWithProd, grillmasters: g }
      }
      // Fallback final: retorna qualquer parceiro disponível, ignorando distância (máx 10 cada)
      const [b, g] = await Promise.all([
        findNearbyBoutiques(coords!.lat, coords!.lng, 9999),
        findNearbyGrillmasters(coords!.lat, coords!.lng, 9999),
      ])
      return {
        boutiques: b.filter((x: any) => x.products.length > 0).slice(0, 10),
        grillmasters: g.slice(0, 10),
      }
    }

    const { boutiques: boutiquesWithProducts, grillmasters: nearbyGrillmasters } = await findWithFallback()

    if (boutiquesWithProducts.length === 0 || nearbyGrillmasters.length === 0) {
      return reply.status(404).send({
        error: 'Ainda nao temos parceiros nessa regiao. Estamos expandindo!',
        hasPartners: false,
      })
    }

    // Açougue: sempre o mais próximo com produtos
    const boutique = boutiquesWithProducts[0]
    const firstName = customerName?.trim().split(' ')[0] || ''

    function formatCatalogItem(p: any) {
      const discountActive = p.discountPercent && (!p.discountValidUntil || new Date(p.discountValidUntil) > new Date())
      const finalPrice = discountActive ? p.price * (1 - p.discountPercent / 100) : p.price
      return `[${p.id}] ${p.name} — R$${finalPrice.toFixed(2)}/${p.unit}`
    }

    const carneProducts = boutique.products.filter((p: any) => p.category === 'CARNE')
    const acompProducts = boutique.products.filter((p: any) => p.category === 'ACOMPANHAMENTO')
    const otherProducts = boutique.products.filter((p: any) => p.category !== 'CARNE' && p.category !== 'ACOMPANHAMENTO')
    const catalogCarnes = carneProducts.map(formatCatalogItem).join('\n') || '(nenhuma carne cadastrada)'
    const catalogAcomp = acompProducts.map(formatCatalogItem).join('\n') || '(nenhum acompanhamento — pule essa secao)'
    const catalogOther = otherProducts.map(formatCatalogItem).join('\n') || '(nenhum)'

    // Lista de GMs disponíveis para o Agente 2 escolher
    const gmListText = nearbyGrillmasters.slice(0, 5).map((g: any) =>
      `[${g.id}] ${g.user.name} | ${g.specialties || 'churrasco geral'} | estilo: ${g.churrascoStyle || 'tradicional'} | R$${g.pricePerHour}/h | ⭐${g.rating.toFixed(1)} | ${g.distanceKm.toFixed(1)}km`
    ).join('\n')

    // ── AGENTES 1 e 2 em paralelo (Haiku — rápido e barato) ────────────
    const [profileMsg, gmMsg] = await Promise.all([

      // Agente 1 — Análise de perfil do evento
      client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 250,
        messages: [{
          role: 'user',
          content: `Analise o perfil do evento e retorne SOMENTE JSON válido:
Convidados: ${guests} | Ocasião: ${occasion || 'churrasco'} | Orçamento: ${budget ? 'R$' + budget : 'livre'} | Data: ${eventDate || 'a definir'}${firstName ? ` | Cliente: ${firstName}` : ''}
{"eventTone":"festivo|corporativo|intimo|casual","meatFocus":"nobre|tradicional|variado","budgetTight":${budget && guests ? (budget / guests < 80 ? 'true' : 'false') : 'false'},"tip":"dica personalizada curta para o summary"}`,
        }],
      }),

      // Agente 2 — Seleção inteligente do melhor GM
      client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Escolha o churrasqueiro mais adequado para o evento. Retorne SOMENTE JSON válido.
EVENTO: ${guests} pessoas | ${occasion || 'churrasco'} | ${budget ? 'Orçamento R$' + budget : 'sem limite'}
CHURRASQUEIROS DISPONÍVEIS:
${gmListText}
{"selectedGmId":"id_exato_da_lista","reason":"motivo em 1 frase"}`,
        }],
      }),
    ])

    // Parseia saídas dos agentes (com fallback seguro)
    function tryParseJson(text: string): Record<string, any> | null {
      try {
        const m = text.replace(/```json\s*/g, '').replace(/```/g, '').trim().match(/\{[\s\S]*\}/)
        return m ? JSON.parse(m[0]) : null
      } catch { return null }
    }

    const profileInsights = tryParseJson(profileMsg.content[0].type === 'text' ? profileMsg.content[0].text : '')
    const gmSelection   = tryParseJson(gmMsg.content[0].type === 'text' ? gmMsg.content[0].text : '')

    // Usa o GM escolhido pelo Agente 2; cai para o primeiro se falhar
    const grillmaster = (gmSelection?.selectedGmId
      ? nearbyGrillmasters.find((g: any) => g.id === gmSelection.selectedGmId)
      : null) ?? nearbyGrillmasters[0]

    // ── AGENTE 3 — Montagem final do kit (Opus) ─────────────────────────
    const KIT_SYSTEM = `Você é a assistente da Tech Churras, parceira do Jota Grillmaster. Monte kits de churrasco ideais com personalidade — fale de forma calorosa e natural, como uma especialista amiga. Use SOMENTE os IDs exatos fornecidos no catálogo. Responda SOMENTE com JSON válido, sem markdown.`

    const gmSpecialties = grillmaster.specialties || 'churrasco tradicional'
    const gmStyle       = grillmaster.churrascoStyle || 'tradicional brasileiro'
    const gmExperience  = grillmaster.experience ? `${grillmaster.experience} anos` : 'experiente'
    const gmBio         = grillmaster.bio ? `Bio: ${grillmaster.bio}` : ''

    const kitPrompt = `${firstName ? `Cliente: ${firstName} — ` : ''}${guests} convidados | ${occasion || 'churrasco'} | ${budget ? 'R$' + budget : 'sem limite'} | ${eventDate || 'data a definir'}

ANÁLISE DO EVENTO (pré-processada):
- Tom: ${profileInsights?.eventTone ?? 'casual'} | Foco em carnes: ${profileInsights?.meatFocus ?? 'tradicional'} | Orçamento apertado: ${profileInsights?.budgetTight ? 'sim' : 'não'}
- Dica do contexto: ${profileInsights?.tip ?? ''}

CHURRASQUEIRO SELECIONADO: ${grillmaster.user.name}
- Especialidades: ${gmSpecialties} | Estilo: ${gmStyle} | Experiência: ${gmExperience}${gmBio ? '\n- ' + gmBio : ''}
- R$${grillmaster.pricePerHour}/h | ⭐${grillmaster.rating.toFixed(1)} | ${gmSelection?.reason ?? 'melhor disponível'}

AÇOUGUE: "${boutique.name}" (${boutique.distanceKm.toFixed(1)} km)

CARNES:
${catalogCarnes}

ACOMPANHAMENTOS (prontos para retirada):
${catalogAcomp}

OUTROS:
${catalogOther}

REGRAS: Use SOMENTE IDs exatos acima | proteína: 350g/homem, 300g/mulher, 200g/criança (acompanhamentos fora da conta) | inclua carvão se disponível | 3-4h GM até 15 pessoas, 5-6h acima | summary caloroso${firstName ? ' para ' + firstName : ''} mencionando o evento e o churrasqueiro escolhido
{"items":[{"productId":"id","productName":"nome","quantity":2.5,"unit":"kg","unitPrice":89.90,"totalPrice":224.75}],"grillmasterHours":4,"summary":"frase calorosa personalizada","totalProducts":650.00,"totalGrillmaster":350.00,"totalKit":1000.00}`

    const message = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1200,
      system: [{ type: 'text', text: KIT_SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: kitPrompt }],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    let kit: any
    try {
      const cleaned = rawText.replace(/```json\s*/g, '').replace(/```/g, '').trim()
      const match = cleaned.match(/\{[\s\S]*\}/)
      kit = JSON.parse(match ? match[0] : cleaned)
    } catch {
      return reply.status(500).send({ error: 'Falha ao montar kit', raw: rawText.slice(0, 300) })
    }

    const productMetaMap = new Map(boutique.products.map((p: any) => [p.id, { category: p.category, imageUrl: p.imageUrl ?? null }]))
    if (Array.isArray(kit.items)) {
      kit.items = kit.items.map((item: any) => {
        const meta = productMetaMap.get(item.productId)
        return {
          ...item,
          category: meta?.category ?? 'OUTRO',
          imageUrl: meta?.imageUrl ?? null,
        }
      })
    }

    return reply.send({
      kit,
      boutique: { id: boutique.id, name: boutique.name, distanceKm: boutique.distanceKm, logoUrl: boutique.logoUrl },
      grillmaster: { id: grillmaster.id, name: grillmaster.user.name, rating: grillmaster.rating, distanceKm: grillmaster.distanceKm, photoUrl: grillmaster.photoUrl, pricePerHour: grillmaster.pricePerHour },
      eventCoords: coords,
      _agents: { gmReason: gmSelection?.reason ?? null, eventTone: profileInsights?.eventTone ?? null },
    })
  })

  // ── POST /ai/generate-bio ────────────────────────────────────────────
  app.post('/ai/generate-bio', { preHandler: [authenticate], config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (request, reply) => {
    const { role, name, city, specialties, churrascoStyle, experience, products } = request.body as {
      role: 'grillmaster' | 'boutique'
      name?: string
      city?: string
      specialties?: string
      churrascoStyle?: string
      experience?: number
      products?: string[]
    }

    if (!role) return reply.status(400).send({ error: 'role é obrigatório' })
    if (role === 'boutique' && !name) return reply.status(400).send({ error: 'name é obrigatório para açougue' })

    let prompt: string
    if (role === 'grillmaster') {
      prompt = `Você é especialista em marketing pessoal para churrasqueiros profissionais.
Crie uma bio curta e vendedora para o app Tech Churras.

${name ? `CHURRASQUEIRO: ${name}` : 'CHURRASQUEIRO: (nome não informado)'}
${city ? `Cidade: ${city}` : ''}
${experience ? `Experiência: ${experience} anos` : ''}
${specialties ? `Especialidades: ${specialties}` : ''}
${churrascoStyle ? `Estilo: ${churrascoStyle}` : ''}

REGRAS:
- 2-3 frases máximo (40-60 palavras)
- Tom profissional mas humano — não robótico
- Destaque o diferencial do churrasqueiro
- Fale na primeira pessoa
- NÃO use emojis
- NÃO mencione preço
Retorne SOMENTE o texto da bio, nada mais.`
    } else {
      const productList = products?.length ? products.join(', ') : ''
      prompt = `Você é especialista em marketing para açougues artesanais.
Crie uma descrição curta e atrativa para o app Tech Churras.

AÇOUGUE: ${name}
${city ? `Cidade: ${city}` : ''}
${productList ? `Produtos em destaque: ${productList}` : ''}
${specialties ? `Especialidades: ${specialties}` : ''}

REGRAS:
- 2-3 frases máximo (40-60 palavras)
- Tom artesanal, de qualidade — não genérico
- Destaque os cortes ou diferenciais do açougue
- NÃO use emojis
- NÃO mencione preço
Retorne SOMENTE o texto da descrição, nada mais.`
    }

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    })

    const bio = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    if (!bio) return reply.status(500).send({ error: 'Falha ao gerar bio' })

    return reply.send({ bio })
  })

  // ── POST /ai/chat ────────────────────────────────────────────────────
  app.post('/ai/chat', {
    preHandler: [authenticate],
    config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const { messages, customerName = '' } = request.body as {
      messages: Anthropic.MessageParam[]
      customerName?: string
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return reply.status(400).send({ error: 'messages obrigatório' })
    }

    const firstName = customerName?.trim().split(' ')[0] || ''

    const CHAT_SYSTEM = `Você é a assistente da Tech Churras — especialista em churrasco brasileiro e parceira do Jota Albuquerque (Jota Grillmaster, fundador da plataforma).${firstName ? ` Você está conversando com ${firstName}.` : ''}

PERSONALIDADE:
- Amiga de confiança, entende muito de churrasco, quer que o evento seja incrível
- Linguagem brasileira natural e calorosa — "olha", "perfeito", "adorei a ideia"
- Chame pelo primeiro nome quando souber
- Emojis com moderação: máximo 2 por mensagem (🔥 🥩 funcionam bem)
- NUNCA comece com "Claro!" ou "Certamente!" ou "Olá!"
- Respostas CURTAS — máximo 3 parágrafos pequenos

QUANDO MENCIONAR O JOTA:
- Cortes nobres (picanha, tomahawk, wagyu): mencione que o Jota aprova
- Eventos especiais: "o Jota trataria esse evento com atenção especial"
- Seja natural — não force em todo lugar

GRAMATURAS (somente proteínas — acompanhamentos são à parte):
- Homens: 350g por pessoa
- Mulheres: 300g por pessoa
- Crianças: 200g por pessoa

ESTILOS DISPONÍVEIS NA PLATAFORMA:
- menu_tech_churras: clássico paulista com frango, linguiça, espetinhos — o mais popular
- parrillada_tech_churras: estilo gaúcho/argentino, costela no bafo, asado de tira
- especialidade_jota: premium — wagyu, tomahawk, T-bone — experiência criada pelo Jota

GERAR PLANO COMPLETO:
Quando o usuário tiver fornecido o número de convidados (pode ser aproximado) e você tiver contexto suficiente do evento, coloque ao final da sua mensagem, na última linha, sem nenhum texto depois:
GERAR_PLANO:{"style":"menu_tech_churras","homens":5,"mulheres":3,"criancas":0,"hours":4,"occasion":""}

Regras do GERAR_PLANO:
- Sempre inclua todos os campos (use 0 para crianças se não mencionadas)
- style: escolha o mais adequado para o evento
- hours: estime 4 se não mencionado
- occasion: tipo do evento em 1-2 palavras (aniversário, confraternização, casual, etc.)
- Gere apenas quando tiver pelo menos o total de convidados
- Antes do marcador, avise o usuário que vai montar o plano agora`

    const resp = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: CHAT_SYSTEM,
      messages: messages.slice(-20),
    })

    const reply_text = resp.content[0].type === 'text' ? resp.content[0].text.trim() : ''
    return reply.send({ reply: reply_text })
  })

  // ── POST /ai/suggest-from-catalog ────────────────────────────────────
  // Recebe os produtos reais do açougue já selecionado e retorna sugestões
  // com productId exato para preencher o carrinho diretamente.
  app.post('/ai/suggest-from-catalog', { preHandler: [authenticate], config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, async (request, reply) => {
    const { homens = 5, mulheres = 3, criancas = 2, hours = 4, style = 'tradicional', grillmasterSpecialties = '', customerName = '', occasion = '', products } = request.body as {
      homens?: number; mulheres?: number; criancas?: number
      hours?: number; style?: string; grillmasterSpecialties?: string
      customerName?: string; occasion?: string
      products: { id: string; name: string; category: string; price: number; unit: string }[]
    }

    if (!Array.isArray(products) || products.length === 0) {
      return reply.status(400).send({ error: 'Lista de produtos obrigatória' })
    }

    const totalPessoas = Number(homens) + Number(mulheres) + Number(criancas)
    const firstName = customerName?.trim().split(' ')[0] || ''
    const catalogLines = products
      .filter(p => p.id && p.name)
      .map(p => `[${p.id}] ${p.name} — ${p.category} — R$${Number(p.price).toFixed(2)}/${p.unit}`)
      .join('\n')

    const totalKg = ((Number(homens)*350 + Number(mulheres)*300 + Number(criancas)*200)/1000).toFixed(1)
    const prompt = `Você é a assistente da Tech Churras, parceira do Jota Grillmaster. Monte o kit ideal de forma calorosa e personalizada.
${firstName ? `Cliente: ${firstName}${occasion ? ` | Ocasião: ${occasion}` : ''}` : occasion ? `Ocasião: ${occasion}` : ''}

EVENTO: ${homens} homens, ${mulheres} mulheres, ${criancas} crianças — ${hours}h — estilo: ${style}
${grillmasterSpecialties ? `ESPECIALIDADES DO CHURRASQUEIRO: ${grillmasterSpecialties}` : ''}

PRODUTOS DO AÇOUGUE — use SOMENTE estes IDs exatos:
${catalogLines}

REGRAS:
- Meta: ~${totalKg}kg de proteína (350g/h, 300g/m, 200g/c — acompanhamentos à parte)
- Carvão: 1 saco por 5 pessoas se disponível
- Priorize cortes que combinam com as especialidades do churrasqueiro
- Máximo 8 itens; reason em até 5 palavras
- summary: frase calorosa${firstName ? ` dirigida ao ${firstName}` : ''}, comente algo específico do evento (ocasião, nº de pessoas). Se escolheu corte nobre, mencione que o Jota aprova. 1-2 frases, tom amigo.
- Responda SOMENTE JSON válido sem markdown:
{"items":[{"productId":"id_exato","quantity":2.5,"unit":"kg","reason":"curta razao"}],"summary":"frase calorosa personalizada","totalKg":${totalKg}}`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    try {
      const cleaned = raw.replace(/```json\s*/g, '').replace(/```/g, '').trim()
      const match = cleaned.match(/\{[\s\S]*\}/)
      const parsed = JSON.parse(match ? match[0] : cleaned)
      // Validate that returned productIds exist in the catalog
      const validIds = new Set(products.map(p => p.id))
      if (Array.isArray(parsed.items)) {
        parsed.items = parsed.items.filter((item: any) => validIds.has(item.productId))
      }
      return reply.send(parsed)
    } catch {
      return reply.status(500).send({ error: 'Falha ao processar sugestão', raw: raw.slice(0, 300) })
    }
  })
}
