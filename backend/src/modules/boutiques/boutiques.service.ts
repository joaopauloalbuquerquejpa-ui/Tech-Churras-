import { prisma } from '../../config/prisma'
import { z } from 'zod'

export const createBoutiqueSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  phone: z.string().optional(),
})

export const createProductSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().positive(),
  unit: z.string().default('kg'),
})

export type CreateBoutiqueInput = z.infer<typeof createBoutiqueSchema>
export type CreateProductInput = z.infer<typeof createProductSchema>

export async function createBoutique(userId: string, data: CreateBoutiqueInput) {
  const existing = await prisma.boutique.findUnique({ where: { userId } })
  if (existing) throw new Error('Açougue já cadastrado')

  return prisma.boutique.create({
    data: { userId, ...data },
    include: { user: { select: { name: true, email: true } } },
  })
}

export async function listBoutiques(city?: string) {
  return prisma.boutique.findMany({
    where: city ? { city: { contains: city, mode: 'insensitive' } } : {},
    include: {
      user: { select: { name: true, email: true } },
      products: { where: { available: true } },
    },
    orderBy: { rating: 'desc' },
  })
}

export async function getBoutiqueById(id: string) {
  const boutique = await prisma.boutique.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      products: { where: { available: true } },
    },
  })
  if (!boutique) throw new Error('Açougue não encontrado')
  return boutique
}

export async function addProduct(userId: string, data: CreateProductInput) {
  const boutique = await prisma.boutique.findUnique({ where: { userId } })
  if (!boutique) throw new Error('Açougue não encontrado')

  return prisma.product.create({
    data: { boutiqueId: boutique.id, ...data },
  })
}