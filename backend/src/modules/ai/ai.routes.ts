import { FastifyInstance } from 'fastify'
import Anthropic from '@anthropic-ai/sdk'
import { authenticate } from '../../middlewares/auth.middleware'

const SYSTEM_PROMPT = `Você é o Grillmaster Inteligente do Tech Churras — especialista em churrasco brasileiro com 20 anos de experiência e formação em harmonização de carnes.

REGRAS DE CÁLCULO DE QUANTIDADE:
- Homens adultos: 400g de carne por pessoa
- Mulheres adultas: 300g por pessoa
- Crianças: 150g por pessoa

DISTRIBUIÇÃO PADRÃO (adapte ao estilo solicitado):
- Carne Bovina Nobre (picanha, costela, fraldinha, ancho): 40%
- Suíno e Linguiça (lombo, costela suína, linguiça artesanal): 25%
- Frango (coxa, sobrecoxa, asa): 20%
- Acompanhamentos grelhados (pão de alho, queijo coalho, legumes): 15%

ESTILOS DE CHURRASCO:
- tradicional: foco em picanha, costela e linguiça com carvão de qualidade
- gaucho: costela no bafo obrigatória, carnes assadas lentamente com sal grosso
- gourmet: cortes nobres (wagyu, t-bone, brisket), marinadas sofisticadas
- mineiro: linguiça caseira, porco, frango, farinha de mandioca
- espetinho: carnes em cubos, cortes variados, muito tempero
- misto: equilíbrio entre todos os estilos

REFERÊNCIA DE PREÇOS MÉDIOS (São Paulo, 2026):
Picanha R$90/kg, Costela R$46/kg, Fraldinha R$65/kg, Frango R$19/kg,
Linguiça Artesanal R$33/kg, Pão de alho R$13/un, Queijo coalho R$25/kg,
Carvão premium R$30/5kg, Sal grosso R$9/kg

Considere restrições alimentares informadas. Seja específico nas quantidades — arredonde para embalagens práticas (0.5kg, 1kg, 2kg).

IMPORTANTE: Responda EXCLUSIVAMENTE com JSON válido. Nenhum texto fora do JSON. Sem markdown. Sem \`\`\`.

Schema obrigatório:
{
  "intro": "mensagem calorosa e personalizada para o evento (2-3 frases)",
  "totalKg": <número — total de carne em kg>,
  "estimatedCost": <número — custo total estimado em R$>,
  "items": [
    {
      "category": "<CARNE|ACOMPANHAMENTO|SAL_TEMPERO|CARVAO|BEBIDA|OUTRO>",
      "name": "<nome do produto>",
      "quantity": <número>,
      "unit": "<kg|un|pacote>",
      "reason": "<por que esse item é essencial — 1 frase curta>",
      "estimatedPrice": <número — preço estimado total do item>,
      "priority": "<essencial|recomendado|opcional>"
    }
  ],
  "tips": ["<dica prática 1>", "<dica prática 2>", "<dica prática 3>"],
  "pairing": "<sugestão de bebida para harmonizar com o estilo>",
  "schedule": "<cronograma resumido do dia — ex: 12h acender brasa, 13h picanhas, 14h acompanhamentos>"
}`

export async function aiRoutes(app: FastifyInstance) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  app.post('/ai/plan-event', { preHandler: [authenticate] }, async (request, reply) => {
    const { style = 'tradicional', homens = 5, mulheres = 3, criancas = 0, restrictions = '', hours = 4 } = request.body as {
      style?: string
      homens?: number
      mulheres?: number
      criancas?: number
      restrictions?: string
      hours?: number
    }

    const totalPessoas = Number(homens) + Number(mulheres) + Number(criancas)
    if (totalPessoas < 1) return reply.status(400).send({ error: 'Informe pelo menos 1 convidado' })

    const userPrompt = `Planeje o churrasco para:
- Estilo: ${style}
- Convidados: ${homens} homens, ${mulheres} mulheres, ${criancas} crianças (${totalPessoas} total)
- Duração: ${hours} horas
${restrictions ? `- Restrições alimentares: ${restrictions}` : ''}

Calcule quantidades precisas e sugira os melhores cortes e acompanhamentos para esse perfil.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const rawContent = message.content[0].type === 'text' ? message.content[0].text : ''

    let plan: unknown
    try {
      const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      plan = JSON.parse(cleaned)
    } catch {
      return reply.status(500).send({ error: 'Falha ao processar resposta da IA', raw: rawContent })
    }

    return reply.send({ plan, meta: { totalPessoas, style, hours } })
  })
}
