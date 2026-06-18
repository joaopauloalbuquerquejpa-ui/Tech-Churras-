import { FastifyInstance } from 'fastify'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { authenticate } from '../../middlewares/auth.middleware'
import { geocodeAddress } from '../../utils/geo'
import { findNearbyBoutiques } from '../boutiques/boutiques.service'
import { findNearbyGrillmasters } from '../grillmasters/grillmasters.service'

// Rate limit: max 10 req/min por usuário
const suggestRateLimits = new Map<string, { count: number; resetAt: number }>()

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

REGRAS DE CÁLCULO DE QUANTIDADE:
- Homens adultos: 400g de carne por pessoa
- Mulheres adultas: 300g por pessoa
- Crianças: 150g por pessoa

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
- "intro": máximo 25 palavras
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

  app.post('/ai/plan-event', { preHandler: [authenticate] }, async (request, reply) => {
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
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const rawContent = message.content[0].type === 'text' ? message.content[0].text : ''

    let plan: Record<string, unknown>
    try {
      const cleaned = rawContent.replace(/^```json\s*/m, '').replace(/\s*```$/m, '').trim()
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      plan = JSON.parse(jsonMatch ? jsonMatch[0] : cleaned) as Record<string, unknown>
    } catch {
      return reply.status(500).send({ error: 'Falha ao processar resposta da IA', raw: rawContent.slice(0, 500) })
    }

    // Normaliza arrays
    if (Array.isArray(plan.items)) {
      plan.items = (plan.items as Record<string, unknown>[]).map(normalizeItem)
    }

    return reply.send({ plan, meta: { totalPessoas, style, hours } })
  })

  // ── POST /ai/suggest-product ─────────────────────────────────────────
  app.post('/ai/suggest-product', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as any).user?.userId as string

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

      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            {
              type: 'text',
              text: `Você é especialista em produtos de açougue brasileiro. Analise esta imagem e identifique o produto.
Responda SOMENTE com JSON válido, sem markdown, sem texto extra:
{"name":"nome comercial do corte ou produto","category":"CARNE|SAL_TEMPERO|CARVAO|ACOMPANHAMENTO|BEBIDA|OUTRO","description":"descrição comercial curta e atrativa em 1-2 frases","suggestedUnit":"kg|un|L","confidence":"alta|media|baixa"}
Regras:
- name: nome popular brasileiro (ex: Picanha, Fraldinha, Linguiça Artesanal)
- category: use EXATAMENTE um dos valores listados
- description: focada em venda, mencionando características do produto
- Se não reconhecer com confiança, retorne campos name/description vazios mas mantenha JSON válido`,
            }
          ],
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
  app.post('/ai/geocode', async (request, reply) => {
    const { address } = request.body as { address: string }
    if (!address) return reply.status(400).send({ error: 'Endereco obrigatorio' })
    const coords = await geocodeAddress(address)
    if (!coords) return reply.status(404).send({ error: 'Endereco nao encontrado' })
    return reply.send(coords)
  })

  // ── POST /ai/kit-perfeito ────────────────────────────────────────────
  app.post('/ai/kit-perfeito', async (request, reply) => {
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
      // Fallback final: retorna qualquer parceiro disponível, ignorando distância
      const [b, g] = await Promise.all([
        findNearbyBoutiques(coords!.lat, coords!.lng, 9999),
        findNearbyGrillmasters(coords!.lat, coords!.lng, 9999),
      ])
      return { boutiques: b.filter((x: any) => x.products.length > 0), grillmasters: g }
    }

    const { boutiques: boutiquesWithProducts, grillmasters: nearbyGrillmasters } = await findWithFallback()

    if (boutiquesWithProducts.length === 0 || nearbyGrillmasters.length === 0) {
      return reply.status(404).send({
        error: 'Ainda nao temos parceiros nessa regiao. Estamos expandindo!',
        hasPartners: false,
      })
    }

    const boutique = boutiquesWithProducts[0]
    const grillmaster = nearbyGrillmasters[0]

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

    const gmSpecialties = grillmaster.specialties || 'churrasco tradicional'
    const gmStyle = grillmaster.churrascoStyle || 'tradicional brasileiro'
    const gmExperience = grillmaster.experience ? `${grillmaster.experience} anos` : 'experiente'
    const gmBio = grillmaster.bio ? `Bio: ${grillmaster.bio}` : ''

    const firstName = customerName?.trim().split(' ')[0] || ''
    const kitPrompt = `Você é a assistente da Tech Churras, parceira do Jota Grillmaster. Monte o kit perfeito com personalidade — fale de forma calorosa e natural, como uma especialista amiga.
${firstName ? `O cliente se chama ${firstName} — chame pelo nome no campo summary.` : ''}

DADOS DO EVENTO:
- Convidados: ${guests} pessoas
- Ocasião: ${occasion}
- Orçamento: ${budget ? `R$ ${budget}` : 'sem limite definido'}
- Data: ${eventDate || 'a confirmar'}

CHURRASQUEIRO SELECIONADO: ${grillmaster.user.name}
- Especialidades: ${gmSpecialties}
- Estilo: ${gmStyle}
- Experiencia: ${gmExperience}
${gmBio}
- Preco: R$${grillmaster.pricePerHour}/hora | Avaliacao: ${grillmaster.rating.toFixed(1)}/5
INSTRUCAO CRITICA: Escolha os cortes do catalogo que COMBINAM com as especialidades deste churrasqueiro. Ex: especialista em parrilla argentina -> prefira fraldinha/asado; especialista em cortes nobres -> prefira picanha/tomahawk; estilo gaucho -> prefira costela/linguica; tradicional paulista -> picanha e carvao abundante.

ACOUGUE PARCEIRO: "${boutique.name}" (${boutique.distanceKm.toFixed(1)} km do evento)

CARNES DISPONIVEIS:
${catalogCarnes}

ACOMPANHAMENTOS (preparados pelo acougue, churrasqueiro retira tudo em UMA visita):
${catalogAcomp}

OUTROS PRODUTOS:
${catalogOther}

REGRAS:
- Use SOMENTE os IDs exatos da lista acima — nunca invente produtos
- ~400g de carne por pessoa
- Inclua carne principal + carvao + acompanhamento se disponivel
- Mencione no summary que os acompanhamentos ja vem prontos do acougue (zero trabalho extra pro churrasqueiro)
- Recomende 3-4h de churrasqueiro para ate 15 pessoas, 5-6h para mais
- Responda SOMENTE JSON valido, sem markdown

{"items":[{"productId":"id","productName":"nome","quantity":2.5,"unit":"kg","unitPrice":89.90,"totalPrice":224.75}],"grillmasterHours":4,"summary":"Kit ideal em 1 frase","totalProducts":650.00,"totalGrillmaster":350.00,"totalKit":1000.00}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
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

    // Enrich items with product category from boutique catalog
    const productCategoryMap = new Map(boutique.products.map((p: any) => [p.id, p.category]))
    if (Array.isArray(kit.items)) {
      kit.items = kit.items.map((item: any) => ({
        ...item,
        category: productCategoryMap.get(item.productId) ?? 'OUTRO',
      }))
    }

    return reply.send({
      kit,
      boutique: { id: boutique.id, name: boutique.name, distanceKm: boutique.distanceKm, logoUrl: boutique.logoUrl },
      grillmaster: { id: grillmaster.id, name: grillmaster.user.name, rating: grillmaster.rating, distanceKm: grillmaster.distanceKm, photoUrl: grillmaster.photoUrl, pricePerHour: grillmaster.pricePerHour },
      eventCoords: coords,
    })
  })

  // ── POST /ai/suggest-from-catalog ────────────────────────────────────
  // Recebe os produtos reais do açougue já selecionado e retorna sugestões
  // com productId exato para preencher o carrinho diretamente.
  app.post('/ai/suggest-from-catalog', { preHandler: [authenticate] }, async (request, reply) => {
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

    const totalKg = ((Number(homens)*400 + Number(mulheres)*300 + Number(criancas)*150)/1000).toFixed(1)
    const prompt = `Você é a assistente da Tech Churras, parceira do Jota Grillmaster. Monte o kit ideal de forma calorosa e personalizada.
${firstName ? `Cliente: ${firstName}${occasion ? ` | Ocasião: ${occasion}` : ''}` : occasion ? `Ocasião: ${occasion}` : ''}

EVENTO: ${homens} homens, ${mulheres} mulheres, ${criancas} crianças — ${hours}h — estilo: ${style}
${grillmasterSpecialties ? `ESPECIALIDADES DO CHURRASQUEIRO: ${grillmasterSpecialties}` : ''}

PRODUTOS DO AÇOUGUE — use SOMENTE estes IDs exatos:
${catalogLines}

REGRAS:
- Meta: ~${totalKg}kg de carne (400g/h, 300g/m, 150g/c)
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
