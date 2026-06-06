import { prisma } from '../../config/prisma'
import { z } from 'zod'

export const createProductSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().positive(),
  unit: z.string().default('kg'),
  category: z.enum(['CARNE', 'SAL_TEMPERO', 'CARVAO', 'ACOMPANHAMENTO', 'BEBIDA', 'OUTRO']).default('CARNE'),
  available: z.boolean().default(true),
  imageUrl: z.string().optional(),
})

export type CreateProductInput = z.infer<typeof createProductSchema>

export async function createProduct(userId: string, data: CreateProductInput) {
  const boutique = await prisma.boutique.findUnique({ where: { userId } })
  if (!boutique) throw new Error('Voce precisa ter um acougue cadastrado')
  return prisma.product.create({ data: { ...data, boutiqueId: boutique.id } })
}

export async function listProducts(boutiqueId: string) {
  return prisma.product.findMany({
    where: { boutiqueId, available: true },
    orderBy: { name: 'asc' },
  })
}

export async function updateProduct(id: string, userId: string, data: Partial<CreateProductInput>) {
  const boutique = await prisma.boutique.findUnique({ where: { userId } })
  if (!boutique) throw new Error('Acougue nao encontrado')
  return prisma.product.update({ where: { id }, data })
}

export async function deleteProduct(id: string, userId: string) {
  const boutique = await prisma.boutique.findUnique({ where: { userId } })
  if (!boutique) throw new Error('Acougue nao encontrado')
  return prisma.product.update({ where: { id }, data: { available: false } })
}
