import { prisma } from '../../config/prisma'
import { z } from 'zod'

export const createProductSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().positive(),
  unit: z.string().default('kg'),
  category: z.enum(['CARNE', 'SAL_TEMPERO', 'CARVAO', 'ACOMPANHAMENTO', 'BEBIDA', 'OUTRO']).default('CARNE'),
  available: z.boolean().default(true),
  stockQuantity: z.number().int().min(0).nullable().optional(),
  imageUrl: z.string().optional(),
  discountPercent: z.number().min(0).max(100).nullable().optional(),
  discountValidUntil: z.string().datetime({ offset: true }).nullable().optional(),
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
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product || product.boutiqueId !== boutique.id) throw new Error('Produto nao encontrado')
  return prisma.product.update({ where: { id }, data })
}

export async function deleteProduct(id: string, userId: string) {
  const boutique = await prisma.boutique.findUnique({ where: { userId } })
  if (!boutique) throw new Error('Acougue nao encontrado')
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product || product.boutiqueId !== boutique.id) throw new Error('Produto nao encontrado')
  await prisma.product.delete({ where: { id } })
}

export async function toggleProduct(id: string, userId: string) {
  const boutique = await prisma.boutique.findUnique({ where: { userId } })
  if (!boutique) throw new Error('Acougue nao encontrado')
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product || product.boutiqueId !== boutique.id) throw new Error('Produto nao encontrado')
  return prisma.product.update({ where: { id }, data: { available: !product.available } })
}
