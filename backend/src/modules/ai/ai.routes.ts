import { FastifyInstance } from 'fastify'
import Anthropic from '@anthropic-ai/sdk'
import { authenticate } from '../../middlewares/auth.middleware'
import { prisma } from '../../config/prisma'

const SYSTEM_PROMPT = `Você é um assistente especializado em churrasco brasileiro.
Receberá uma descrição de evento do usuário, uma lista de churrasqueiros disponíveis e uma lista de açougues com seus produtos.
Analise as necessidades e retorne APENAS um JSON válido, sem markdown, sem texto extra, sem explicações fora do JSON.
Formato exato:
{
  "guestBreakdown": { "men": number, "women": number, "children": number },
  "suggestedGrillmasterId": "id ou null",
  "suggestedBoutiqueId": "id ou null",
  "suggestedProducts": [{ "productId": "id", "quantity": number }],
  "reasoning": "Explicação breve de até 2 frases sobre as escolhas"
}
Critérios de escolha:
- Escolha o churrasqueiro com melhor avaliação e preço compatível com o orçamento informado
- Escolha o açougue mais bem avaliado com produtos disponíveis
- Para quantidades de produtos, use 400g/homem, 300g/mulher, 150g/criança de carne total
- Se a descrição mencionar vegetarianos, ajuste a seleção de produtos
- Se não houver dado suficiente para estimar homens/mulheres/crianças, distribua igualmente`

export async function aiRoutes(app: FastifyInstance) {
  app.post('/ai/plan-event', { preHandler: [authenticate] }, async (req, reply) => {
    if (!process.env.ANTHROPIC_API_KEY) {
      return reply.status(503).send({ error: 'Assistente de IA temporariamente indisponível' })
    }

    const { description } = req.body as any
    if (!description?.trim()) {
      return reply.status(400).send({ error: 'Descrição do evento é obrigatória' })
    }

    const [grillmasters, boutiques] = await Promise.all([
      prisma.grillmaster.findMany({
        where: { approved: true, available: true },
        include: { user: { select: { name: true } } },
        take: 20,
        orderBy: { rating: 'desc' },
      }),
      prisma.boutique.findMany({
        where: { approved: true },
        include: {
          products: {
            where: { available: true },
            select: { id: true, name: true, price: true, unit: true, category: true },
          },
        },
        take: 15,
        orderBy: { rating: 'desc' },
      }),
    ])

    const gmList = grillmasters.map(g => ({
      id: g.id,
      name: g.user.name,
      pricePerHour: g.pricePerHour,
      specialties: g.specialties || '',
      rating: g.rating,
      city: g.city,
      state: g.state,
    }))

    const boutiqueList = boutiques.map(b => ({
      id: b.id,
      name: b.name,
      city: b.city,
      rating: b.rating,
      products: b.products,
    }))

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    try {
      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Descrição do evento: ${description.trim()}

Churrasqueiros disponíveis: ${JSON.stringify(gmList)}

Açougues com produtos: ${JSON.stringify(boutiqueList)}`,
          },
        ],
      })

      const text = ((msg.content[0] as any).text || '').trim()
      const jsonStr = text.replace(/^```json?\s*/i, '').replace(/\s*```$/, '').trim()
      const parsed = JSON.parse(jsonStr)
      return reply.send(parsed)
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao processar solicitação: ' + err.message })
    }
  })
}
