import { FastifyInstance } from 'fastify'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { authenticate } from '../../middlewares/auth.middleware'
import { geocodeAddress } from '../../utils/geo'
import { findNearbyBoutiques } from '../boutiques/boutiques.service'
import { findNearbyGrillmasters } from '../grillmasters/grillmasters.service'
import { prisma } from '../../config/prisma'

// Rate limit em memória por usuário para /ai/suggest-product (upload de imagem)
const suggestRateLimits = new Map<string, { count: number; resetAt: number }>()
// Reusa a mesma estrutura de rate limit para /ai/social-post (também é upload de imagem)
const socialPostRateLimits = new Map<string, { count: number; resetAt: number }>()
// Idem para /ai/transcribe (upload de áudio)
const transcribeRateLimits = new Map<string, { count: number; resetAt: number }>()
// Limpa entradas expiradas a cada 10 minutos para evitar crescimento ilimitado
setInterval(() => {
  const now = Date.now()
  for (const [key, val] of suggestRateLimits) {
    if (now >= val.resetAt) suggestRateLimits.delete(key)
  }
  for (const [key, val] of socialPostRateLimits) {
    if (now >= val.resetAt) socialPostRateLimits.delete(key)
  }
  for (const [key, val] of transcribeRateLimits) {
    if (now >= val.resetAt) transcribeRateLimits.delete(key)
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

// Detecta o tipo real pelos magic bytes — nunca confia só no Content-Type
// declarado pelo cliente no multipart, que é fácil de forjar.
function detectMagicMime(buf: Buffer): string | null {
  if (buf.length < 12) return null
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'image/jpeg'
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return 'image/png'
  if (buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') return 'image/webp'
  return null
}
const MAGIC_MIME_EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

// Formatos de áudio aceitos pra transcrição — o que o MediaRecorder do navegador
// e apps de gravação de voz do celular tipicamente produzem.
const ALLOWED_AUDIO_MIME = ['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-m4a', 'audio/m4a', 'audio/3gpp']

// Preço de referência da carne vermelha (R$/kg) usado como "termômetro" nos
// prompts de kit — não amarrado a nenhum evento sazonal específico (Copa,
// feriado etc.), porque o preço da carne sobe por vários motivos ao longo do
// ano (exportação, clima, câmbio) e a regra precisa valer o tempo todo.
const RED_MEAT_REFERENCE_PRICE_PER_KG = 65

function isFrango(name: string): boolean {
  return /frango|galinha|\bcoxa\b|sobrecoxa|asa de frango/i.test(name)
}

// Se a carne vermelha do catálogo desse açougue está bem acima da referência
// E ele também vende frango, devolve uma instrução extra pro prompt puxar
// mais frango no kit (proteína mais barata, mantém o orçamento saudável sem
// abandonar o estilo escolhido). Vazio se não houver sinal — não força nada.
function buildMeatPriceSignal(products: { name: string; price: number; unit: string }[]): string {
  const redMeat = products.filter(p => p.unit === 'kg' && !isFrango(p.name))
  const hasFrango = products.some(p => isFrango(p.name))
  if (redMeat.length === 0 || !hasFrango) return ''
  const avg = redMeat.reduce((s, p) => s + p.price, 0) / redMeat.length
  if (avg <= RED_MEAT_REFERENCE_PRICE_PER_KG * 1.15) return ''
  const pctAbove = Math.round((avg / RED_MEAT_REFERENCE_PRICE_PER_KG - 1) * 100)
  return `\n\nSINAL DE PREÇO: a carne vermelha desse açougue está ~${pctAbove}% acima da média de referência (R$${RED_MEAT_REFERENCE_PRICE_PER_KG}/kg). Sem abandonar o estilo escolhido, aumente a proporção de frango no kit (proteína mais barata e igualmente saborosa) pra manter o orçamento saudável — só se o açougue tiver opção de frango no catálogo.`
}

// Tool estrita (JSON schema validado pela própria API, não por regex) que o
// /ai/chat usa pra sinalizar "hora de montar o plano completo" — substitui o
// hack antigo de marcador de texto (rawReply + "GERAR_PLANO:{...}" na última
// linha, extraído via lastIndexOf + JSON.parse no frontend, sem nenhuma
// garantia de formato). Com strict:true a API já valida o schema antes de
// devolver o tool_use — não tem "falha silenciosa de parse" possível.
const GENERATE_PLAN_TOOL: Anthropic.Tool = {
  name: 'generate_plan',
  description: 'Gera o plano completo do churrasco (kit de itens, custo estimado, cronograma) — chame quando já tiver pelo menos o total de convidados e contexto suficiente do evento.',
  strict: true,
  input_schema: {
    type: 'object',
    properties: {
      style: { type: 'string', enum: ['menu_tech_churras', 'parrillada_tech_churras', 'especialidade_jota'] },
      homens: { type: 'integer', minimum: 0 },
      mulheres: { type: 'integer', minimum: 0 },
      criancas: { type: 'integer', minimum: 0 },
      hours: { type: 'integer', minimum: 1, maximum: 24 },
      occasion: { type: 'string' },
    },
    required: ['style', 'homens', 'mulheres', 'criancas', 'hours', 'occasion'],
    additionalProperties: false,
  },
}

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
      model: 'claude-haiku-4-5-20251001',
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
        model: 'claude-haiku-4-5-20251001',
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

REGRAS: Use SOMENTE IDs exatos acima | proteína: 350g/homem, 300g/mulher, 200g/criança (acompanhamentos fora da conta) | inclua carvão se disponível | 3-4h GM até 15 pessoas, 5-6h acima | summary caloroso${firstName ? ' para ' + firstName : ''} mencionando o evento e o churrasqueiro escolhido${buildMeatPriceSignal(carneProducts)}
{"items":[{"productId":"id","productName":"nome","quantity":2.5,"unit":"kg","unitPrice":89.90,"totalPrice":224.75}],"grillmasterHours":4,"summary":"frase calorosa personalizada","totalProducts":650.00,"totalGrillmaster":350.00,"totalKit":1000.00}`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
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

  // ── POST /ai/transcribe ──────────────────────────────────────────────
  // Recebe uma nota de voz (ex: churrasqueiro/açougue contando sua experiência
  // em áudio em vez de digitar) e devolve o texto transcrito em português.
  // Usa Gemini em vez de Claude porque o Claude não processa áudio nativamente
  // e o Gemini tem tier gratuito — não consome o crédito da Anthropic.
  app.post('/ai/transcribe', { preHandler: [authenticate], config: { rateLimit: { max: 15, timeWindow: '1 minute' } } }, async (request, reply) => {
    const userId = (request as any).user?.id as string
    const geminiKey = process.env.GEMINI_API_KEY
    if (!geminiKey) return reply.status(503).send({ error: 'Transcrição de áudio ainda não disponível' })

    const now = Date.now()
    const rl = transcribeRateLimits.get(userId)
    if (rl && now < rl.resetAt) {
      if (rl.count >= 15) return reply.status(429).send({ error: 'Muitas requisições. Aguarde 1 minuto.' })
      rl.count++
    } else {
      transcribeRateLimits.set(userId, { count: 1, resetAt: now + 60_000 })
    }

    try {
      const data = await request.file()
      if (!data) return reply.status(400).send({ error: 'Nenhum áudio enviado' })
      if (!ALLOWED_AUDIO_MIME.includes(data.mimetype)) {
        return reply.status(400).send({ error: 'Formato de áudio não suportado' })
      }

      const buffer = await data.toBuffer()
      if (buffer.byteLength > 15 * 1024 * 1024) {
        return reply.status(400).send({ error: 'Áudio muito grande. Máximo 15MB (~2 minutos de fala).' })
      }

      const base64 = buffer.toString('base64')
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: 'Transcreva o áudio a seguir em português do Brasil. Responda SOMENTE com o texto transcrito, sem comentários, sem markdown, sem aspas.' },
              { inline_data: { mime_type: data.mimetype, data: base64 } },
            ],
          }],
        }),
      })

      if (!res.ok) {
        return reply.status(502).send({ error: 'Falha ao transcrever áudio. Tente novamente ou digite manualmente.' })
      }

      const json: any = await res.json()
      const text = (json.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim()
      if (!text) return reply.status(500).send({ error: 'Não conseguimos entender o áudio. Tente falar mais perto do microfone.' })

      return reply.send({ text })
    } catch (err: any) {
      return reply.status(500).send({ error: 'Falha ao processar áudio', details: err.message })
    }
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
Quando o usuário tiver fornecido o número de convidados (pode ser aproximado) e você tiver contexto suficiente do evento, chame a tool generate_plan com os dados do evento.

Regras:
- Sempre inclua todos os campos (use 0 para crianças se não mencionadas)
- style: escolha o mais adequado para o evento
- hours: estime 4 se não mencionado
- occasion: tipo do evento em 1-2 palavras (aniversário, confraternização, casual, etc.)
- Chame a tool apenas quando tiver pelo menos o total de convidados
- Antes de chamar a tool, avise o usuário em texto que vai montar o plano agora`

    const resp = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: CHAT_SYSTEM,
      tools: [GENERATE_PLAN_TOOL],
      messages: messages.slice(-20),
    })

    const reply_text = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('\n')
      .trim()

    // strict:true já validou o schema — o input aqui é sempre {style,homens,
    // mulheres,criancas,hours,occasion} bem formado, sem precisar de try/catch
    // de JSON.parse como no marcador de texto antigo.
    const planTool = resp.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'generate_plan')

    return reply.send({ reply: reply_text, planParams: planTool?.input ?? null })
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
    const carneProducts = products.filter(p => p.category === 'CARNE')
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
- summary: frase calorosa${firstName ? ` dirigida ao ${firstName}` : ''}, comente algo específico do evento (ocasião, nº de pessoas). Se escolheu corte nobre, mencione que o Jota aprova. 1-2 frases, tom amigo.${buildMeatPriceSignal(carneProducts)}
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

  // ── POST /ai/social-post ─────────────────────────────────────────────
  // Açougue envia uma foto REAL (fachada, corte, vitrine) e recebe uma
  // legenda pronta pra postar. Nenhuma imagem é gerada por IA — só a
  // legenda, a partir do que a IA vê na própria foto do parceiro.
  app.post('/ai/social-post', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as any).user?.id as string

    const now = Date.now()
    const rl = socialPostRateLimits.get(userId)
    if (rl && now < rl.resetAt) {
      if (rl.count >= 15) return reply.status(429).send({ error: 'Muitas requisições. Aguarde 1 minuto.' })
      rl.count++
    } else {
      socialPostRateLimits.set(userId, { count: 1, resetAt: now + 60_000 })
    }

    const boutique = await prisma.boutique.findUnique({ where: { userId } })
    if (!boutique) return reply.status(403).send({ error: 'Você precisa ter um açougue cadastrado' })
    if (!boutique.approved) return reply.status(403).send({ error: 'Seu açougue ainda não foi aprovado' })

    try {
      const data = await request.file()
      if (!data) return reply.status(400).send({ error: 'Nenhuma imagem enviada' })

      const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
      if (!ALLOWED.includes(data.mimetype)) {
        return reply.status(400).send({ error: 'Formato inválido. Use JPG, PNG ou WebP.' })
      }

      const fields = data.fields as Record<string, { value?: string }>
      const context = typeof fields?.context?.value === 'string' ? fields.context.value.slice(0, 200) : ''

      const buffer = await data.toBuffer()
      if (buffer.byteLength > 8 * 1024 * 1024) {
        return reply.status(400).send({ error: 'Imagem muito grande. Máximo 8MB.' })
      }

      const realMime = detectMagicMime(buffer)
      if (!realMime) {
        return reply.status(400).send({ error: 'Arquivo não reconhecido como imagem válida.' })
      }

      const supabaseUrl = process.env.SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY
      if (!supabaseUrl || !supabaseKey) return reply.status(500).send({ error: 'Supabase não configurado' })

      const supabase = createClient(supabaseUrl, supabaseKey)
      const ext = MAGIC_MIME_EXT[realMime]
      const fileName = `social-${boutique.id}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('partner-images')
        .upload(fileName, buffer, { contentType: realMime, upsert: false })
      if (uploadErr) return reply.status(500).send({ error: uploadErr.message })
      const { data: { publicUrl: imageUrl } } = supabase.storage.from('partner-images').getPublicUrl(fileName)

      const base64 = buffer.toString('base64')
      const mediaType = realMime as 'image/jpeg' | 'image/png' | 'image/webp'

      const SOCIAL_SYSTEM = `Você é especialista em redes sociais para açougues e boutiques de carne no Brasil. Olhe a foto REAL enviada pelo parceiro (fachada, corte, vitrine, bastidor) e escreva uma legenda pronta para postar no Instagram.

ANTES DE ESCREVER A LEGENDA, avalie se a foto é adequada para postar no Instagram do negócio:
- Rejeite se estiver borrada/escura demais para reconhecer o que é
- Rejeite se for claramente uma foto de banco de imagens genérica sem relação com o açougue (ex: still de stock photo, não uma foto real do negócio)
- Aprove fachada, vitrine, corte de carne, bastidor, produto em cima da mesa/balança — mesmo que a foto não seja profissional

REGRAS DA LEGENDA (somente se aprovada):
- Baseie-se SOMENTE no que você vê na foto — não invente produtos ou promoções que não aparecem
- Tom: caloroso, artesanal, orgulhoso do produto — nunca genérico ou robótico
- 2-4 frases curtas + 3-5 hashtags relevantes ao final (ex: #açougue #churrasco #carnenobre + algo específico da cidade se souber)
- Pode usar 1-2 emojis, sem exagero
- Não mencione preços (o parceiro edita isso separadamente)
- Se o contexto informado pelo parceiro ajudar, incorpore-o naturalmente

Responda SOMENTE com JSON válido, sem markdown, sem texto extra:
{"approved":true,"rejectionReason":"","caption":"texto da legenda"}
Se rejeitar: {"approved":false,"rejectionReason":"motivo curto e claro para o parceiro entender o que trocar","caption":""}`

      const userText = `Açougue: ${boutique.name}${boutique.city ? ` (${boutique.city}/${boutique.state})` : ''}${context ? `\nContexto informado pelo parceiro: ${context}` : ''}`

      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: SOCIAL_SYSTEM,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: userText },
          ],
        }],
      })

      const rawText = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
      let parsed: { approved?: boolean; rejectionReason?: string; caption?: string } = {}
      try {
        const cleaned = rawText.replace(/```json\s*/g, '').replace(/```/g, '').trim()
        const match = cleaned.match(/\{[\s\S]*\}/)
        parsed = match ? JSON.parse(match[0]) : {}
      } catch { /* trata como falha abaixo */ }

      if (!parsed.approved) {
        // Remove a imagem já enviada ao storage — foto rejeitada não deve ficar órfã no bucket
        await supabase.storage.from('partner-images').remove([fileName]).catch(() => {})
        return reply.status(422).send({ error: parsed.rejectionReason || 'Essa foto não é adequada para postar. Tente outra.' })
      }

      const caption = parsed.caption?.trim() || ''
      if (!caption) return reply.status(500).send({ error: 'Falha ao gerar legenda. Tente novamente.' })

      const post = await prisma.socialPost.create({
        data: { boutiqueId: boutique.id, imageUrl, caption, context: context || null },
      })

      return reply.send(post)
    } catch (err: any) {
      return reply.status(500).send({ error: 'Falha ao gerar post', details: err.message })
    }
  })

  // ── GET /ai/social-posts ─────────────────────────────────────────────
  app.get('/ai/social-posts', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as any).user?.id as string
    const boutique = await prisma.boutique.findUnique({ where: { userId } })
    if (!boutique) return reply.status(403).send({ error: 'Você precisa ter um açougue cadastrado' })

    const posts = await prisma.socialPost.findMany({
      where: { boutiqueId: boutique.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    })
    return reply.send(posts)
  })

  // ── DELETE /ai/social-posts/:id ──────────────────────────────────────
  app.delete('/ai/social-posts/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as any).user?.id as string
    const { id } = request.params as { id: string }
    const boutique = await prisma.boutique.findUnique({ where: { userId } })
    if (!boutique) return reply.status(403).send({ error: 'Você precisa ter um açougue cadastrado' })

    const post = await prisma.socialPost.findUnique({ where: { id } })
    if (!post || post.boutiqueId !== boutique.id) return reply.status(404).send({ error: 'Post não encontrado' })

    // Remove o arquivo real do storage também — sem isso a foto continua
    // pública pra sempre mesmo depois do parceiro "remover" no histórico.
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY
    if (supabaseUrl && supabaseKey) {
      const fileName = post.imageUrl.split('/partner-images/')[1]
      if (fileName) {
        const supabase = createClient(supabaseUrl, supabaseKey)
        await supabase.storage.from('partner-images').remove([fileName]).catch(() => {})
      }
    }

    await prisma.socialPost.delete({ where: { id } })
    return reply.send({ ok: true })
  })
}
