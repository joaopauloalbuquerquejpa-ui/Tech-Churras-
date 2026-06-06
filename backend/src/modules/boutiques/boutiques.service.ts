import { prisma } from '../../config/prisma'
import { z } from 'zod'

export const createBoutiqueSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  address: z.string().optional(),
  phone: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

export type CreateBoutiqueInput = z.infer<typeof createBoutiqueSchema>

export async function createBoutique(userId: string, data: CreateBoutiqueInput) {
  const existing = await prisma.boutique.findUnique({ where: { userId } })
  if (existing) throw new Error('Perfil de açougue já existe')
  return prisma.boutique.create({
    data: { userId, ...data },
    include: { user: { select: { name: true, email: true } } },
  })
}

export async function listBoutiques(city?: string) {
  return prisma.boutique.findMany({
    where: {
      approved: true,
      ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
    },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { rating: 'desc' },
  })
}

export async function getBoutiqueById(id: string) {
  const boutique = await prisma.boutique.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      products: { where: { available: true } },
    },
  })
  if (!boutique) throw new Error('Açougue não encontrado')
  return boutique
}

export async function updateBoutique(userId: string, data: Partial<CreateBoutiqueInput>) {
  return prisma.boutique.update({ where: { userId }, data })
}
