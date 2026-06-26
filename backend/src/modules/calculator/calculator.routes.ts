import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../config/prisma'

const meatSuggestionSchema = z.object({
  men: z.number().int().min(0).default(0),
  women: z.number().int().min(0).default(0),
  children: z.number().int().min(0).default(0),
  boutiqueId: z.string().optional(),
})

const BREAKDOWN_DEF = [
  { category: 'Carne Bovina Nobre', productCategory: 'CARNE', pct: 0.45, unit: 'kg' },
  { category: 'Porco e Linguiça',   productCategory: 'CARNE', pct: 0.30, unit: 'kg' },
  { category: 'Frango',             productCategory: 'CARNE', pct: 0.25, unit: 'kg' },
]

export async function calculatorRoutes(app: FastifyInstance) {
  app.post('/calculator/meat-suggestion', async (req, reply) => {
    const parsed = meatSuggestionSchema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0].message })
    const { men, women, children, boutiqueId } = parsed.data

    const totalGrams = men * 350 + women * 300 + children * 200
    const totalKg = +(totalGrams / 1000).toFixed(2)
    const totalPessoas = men + women + children

    let productsByCategory: Record<string, any[]> = {}
    if (boutiqueId) {
      const products = await prisma.product.findMany({
        where: { boutiqueId, available: true },
      })
      for (const p of products) {
        if (!productsByCategory[p.category]) productsByCategory[p.category] = []
        productsByCategory[p.category].push(p)
      }
    }

    const breakdown = BREAKDOWN_DEF.map(b => ({
      category: b.category,
      productCategory: b.productCategory,
      percentage: b.pct,
      kg: +(totalKg * b.pct).toFixed(2),
      unit: b.unit,
      suggestedProducts: (productsByCategory[b.productCategory] || []).slice(0, 4),
    }))

    return { totalKg, totalPessoas, breakdown }
  })
}
