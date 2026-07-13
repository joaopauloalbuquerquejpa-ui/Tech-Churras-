import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '../../config/prisma'
import { fetchWithTimeout } from '../../utils/http'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Google Maps Scraper (compass/crawler-google-places) — um dos actors mais usados/estáveis do Apify Store.
// Formato de nome de actor na API síncrona: "owner~actor-name".
const APIFY_ACTOR = process.env.APIFY_ACTOR_ID || 'compass~crawler-google-places'

interface RawPlace {
  title?: string
  name?: string
  address?: string
  phone?: string
  phoneUnformatted?: string
  neighborhood?: string
  totalScore?: number
  reviewsCount?: number
  categoryName?: string
  website?: string
}

interface DiscoveredAcougue {
  name: string
  phone: string
  address: string
  neighborhood: string
  rating: number
  reviewsCount: number
  category: string
}

// Chama o Apify de forma síncrona: a requisição fica pendurada até o actor terminar
// e devolve o dataset direto na resposta — sem precisar de polling/webhook.
async function runApifyGoogleMapsSearch(searchQuery: string, maxResults: number): Promise<RawPlace[]> {
  const token = process.env.APIFY_TOKEN
  if (!token) throw new Error('APIFY_TOKEN não configurado')

  const url = `https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items?token=${token}`
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      searchStringsArray: [searchQuery],
      maxCrawledPlacesPerSearch: maxResults,
      language: 'pt-BR',
    }),
  }, 120000) // scraping real demora — timeout generoso só aqui, não usa o padrão de 8s

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Apify retornou ${res.status}: ${text.slice(0, 300)}`)
  }
  return res.json() as Promise<RawPlace[]>
}

function normalizePhone(raw?: string): string | null {
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 10) return null
  // Garante DDI 55 (Brasil) na frente, do mesmo jeito que o resto do código já faz para Z-API
  return digits.startsWith('55') ? digits : `55${digits}`
}

// Filtra ruído do Maps (farmácia, mercado genérico etc. que aparecem em buscas por "açougue")
// antes de gastar chamada de IA com lead que não serve.
function preFilter(place: RawPlace): DiscoveredAcougue | null {
  const name = place.title || place.name
  const phone = normalizePhone(place.phoneUnformatted || place.phone)
  if (!name || !phone) return null
  return {
    name,
    phone,
    address: place.address || '',
    neighborhood: place.neighborhood || '',
    rating: place.totalScore ?? 0,
    reviewsCount: place.reviewsCount ?? 0,
    category: place.categoryName || '',
  }
}

interface QualifiedLead extends DiscoveredAcougue {
  priorityScore: number
  draftMessage: string
}

// Um único request de IA qualifica e escreve a mensagem de abertura para todo o lote —
// mais barato e mais rápido que uma chamada por açougue.
async function qualifyBatch(candidates: DiscoveredAcougue[]): Promise<QualifiedLead[]> {
  if (candidates.length === 0) return []

  const prompt = `Você é a equipe de expansão da Tech Churras, marketplace que conecta açougues parceiros a clientes de churrasco em São Paulo. Fundador: Jota Albuquerque, churrasqueiro profissional e BBQ Master do Bahari of Brazil (hub culinário em parceria com o Governo de Zanzibar). Oferta: açougue vira ponto de venda de churrasco completo — 5 vagas de "Açougue Fundador" com R$369/mês + 3 meses grátis, 10% de comissão sobre as carnes, 1 por região em São Paulo, válido até 06/08/2026.

Abaixo está uma lista de açougues encontrados no Google Maps. Para CADA um, retorne:
1. "priorityScore" (0-100): quanto maior avaliação + mais reviews + nome/categoria bate com açougue de verdade (não mercado, não frigorífico industrial), maior a nota.
2. "draftMessage": mensagem de abertura de WhatsApp, curta (3-4 frases), tom direto e brasileiro sem frescura, mencionando o nome do açougue e o bairro, terminando com uma pergunta simples que convide resposta (não um discurso de vendas longo).

Açougues:
${candidates.map((c, i) => `${i + 1}. ${c.name} | ${c.neighborhood || c.address} | nota ${c.rating} (${c.reviewsCount} avaliações) | categoria: ${c.category}`).join('\n')}

Responda SOMENTE com um array JSON, na mesma ordem da lista, formato:
[{"priorityScore": number, "draftMessage": "string"}]`

  const resp = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = resp.content[0]?.type === 'text' ? resp.content[0].text : '[]'
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  const parsed: { priorityScore: number; draftMessage: string }[] = jsonMatch ? JSON.parse(jsonMatch[0]) : []

  return candidates.map((c, i) => ({
    ...c,
    priorityScore: parsed[i]?.priorityScore ?? 0,
    draftMessage: parsed[i]?.draftMessage ?? `Oi! Vi o ${c.name} aqui no Google e queria apresentar a Tech Churras — plataforma que leva pedido de churrasco completo direto pro seu balcão. Faz sentido eu te explicar como funciona?`,
  }))
}

export async function discoverAcougues(region: string, maxResults = 40) {
  const searchQuery = `açougue em ${region}`
  const rawPlaces = await runApifyGoogleMapsSearch(searchQuery, maxResults)

  const candidates = rawPlaces
    .map(preFilter)
    .filter((p): p is DiscoveredAcougue => p !== null)

  // Não cadastra de novo quem já é lead (mesmo telefone) — evita duplicar fila de aprovação
  const existingPhones = new Set(
    (await prisma.lead.findMany({ where: { phone: { in: candidates.map(c => c.phone) } }, select: { phone: true } }))
      .map(l => l.phone)
  )
  // Dedupe dentro do próprio lote — o Maps às vezes retorna a mesma rede/filial mais de uma vez
  // com o mesmo telefone, e um phone duplicado dentro da mesma transação derrubaria o lote inteiro.
  const seen = new Set<string>()
  const newCandidates = candidates.filter(c => {
    if (existingPhones.has(c.phone) || seen.has(c.phone)) return false
    seen.add(c.phone)
    return true
  })

  const qualified = await qualifyBatch(newCandidates)

  const created = await prisma.$transaction(
    qualified.map(lead => prisma.lead.create({
      data: {
        phone: lead.phone,
        name: lead.name,
        boutique: lead.name,
        neighborhood: lead.neighborhood || region,
        status: 'new',
        source: 'apify_maps',
        notes: `[Score ${lead.priorityScore}/100] ${lead.draftMessage}`,
      },
    }))
  )

  return {
    region,
    encontrados: rawPlaces.length,
    novosQualificados: created.length,
    jaExistiam: candidates.length - newCandidates.length,
    leads: created,
  }
}
