import { FastifyInstance } from 'fastify'
import Anthropic from '@anthropic-ai/sdk'
import { authenticate } from '../../middlewares/auth.middleware'

const SYSTEM_PROMPT = `Você é o Grillmaster Inteligente do Tech Churras — especialista em churrasco brasileiro com 20 anos de experiência.

REGRAS DE CÁLCULO DE QUANTIDADE:
- Homens adultos: 400g de carne por pessoa
- Mulheres adultas: 300g por pessoa
- Crianças: 150g por pessoa

DISTRIBUIÇÃO PADRÃO (adapte ao estilo):
- Carne Bovina Nobre (picanha, costela, fraldinha): 40%
- Suíno e Linguiça (costela suína, linguiça artesanal): 25%
- Frango (coxa, sobrecoxa, asa): 20%
- Acompanhamentos grelhados (pão de alho, queijo coalho): 15%

ESTILOS: tradicional, gaucho, gourmet, mineiro, espetinho, misto

PREÇOS MÉDIOS SP 2026: Picanha R$90/kg, Costela R$46/kg, Fraldinha R$65/kg, Frango R$19/kg, Linguiça R$33/kg, Pão de alho R$13/un, Queijo coalho R$25/kg, Carvão R$30/5kg, Sal grosso R$9/kg

REGRAS ESTRITAS DO JSON:
- "category": EXATAMENTE um de: CARNE, ACOMPANHAMENTO, SAL_TEMPERO, CARVAO, BEBIDA, OUTRO
- "priority": EXATAMENTE um de: essencial, recomendado, opcional
- "unit": EXATAMENTE um de: kg, un, g, L
- "items": MÁXIMO 8 itens (apenas os mais importantes)
- "reason": máximo 6 palavras por item
- "tips": exatamente 3 dicas, cada uma com máximo 10 palavras
- "schedule": máximo 20 palavras
- "intro": máximo 25 palavras
- Responda SOMENTE com JSON válido, SEM markdown, SEM backticks, SEM qualquer texto fora do JSON

Schema exato (copie estrutura):
{"intro":"string","totalKg":0,"estimatedCost":0,"items":[{"category":"CARNE","name":"string","quantity":0,"unit":"kg","reason":"string","estimatedPrice":0,"priority":"essencial"}],"tips":["string"],"pairing":"string","schedule":"string"}`

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
      restrictions = '', hours = 4,
    } = request.body as {
      style?: string; homens?: number; mulheres?: number
      criancas?: number; restrictions?: string; hours?: number
    }

    const totalPessoas = Number(homens) + Number(mulheres) + Number(criancas)
    if (totalPessoas < 1) return reply.status(400).send({ error: 'Informe pelo menos 1 convidado' })

    const userPrompt = `Churrasco ${style}: ${homens}h ${mulheres}m ${criancas}c, ${hours}h.${restrictions ? ` Restrições: ${restrictions}.` : ''} Máximo 8 itens, respostas curtas. JSON puro.`

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
}
