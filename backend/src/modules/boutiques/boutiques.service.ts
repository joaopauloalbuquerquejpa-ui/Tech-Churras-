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
  monthlyFee: z.number().optional(),
  commissionRate: z.number().optional(),
})

export const updateBoutiqueSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  city: z.string().min(2).optional(),
  state: z.string().min(2).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  open: z.boolean().optional(),
  monthlyFee: z.number().optional(),
  commissionRate: z.number().optional(),
})

export const createKitSchema = z.object({
  name: z.string().min(2),
  description: z.string(),
  price: z.number().positive(),
  minGuests: z.number().int().positive(),
  maxGuests: z.number().int().positive(),
  items: z.string(),
})

export type CreateBoutiqueInput = z.infer<typeof createBoutiqueSchema>
export type UpdateBoutiqueInput = z.infer<typeof updateBoutiqueSchema>
export type CreateKitInput = z.infer<typeof createKitSchema>

export async function createBoutique(userId: string, data: CreateBoutiqueInput) {
  const existing = await prisma.boutique.findUnique({ where: { userId } })
  if (existing) throw new Error('Perfil de acougue ja existe')
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
  if (!boutique) throw new Error('Acougue nao encontrado')
  return boutique
}

export async function getMyBoutique(userId: string) {
  const boutique = await prisma.boutique.findUnique({
    where: { userId },
    include: {
      user: { select: { name: true, email: true } },
      products: { orderBy: { name: 'asc' } },
    },
  })
  if (!boutique) throw new Error('Acougue nao encontrado')
  return boutique
}

export async function updateBoutique(userId: string, data: UpdateBoutiqueInput) {
  return prisma.boutique.update({ where: { userId }, data })
}

export async function getKitsByBoutique(boutiqueId: string) {
  return prisma.kitChurrasco.findMany({
    where: { boutiqueId },
    orderBy: { price: 'asc' },
  })
}

export async function createKit(userId: string, data: CreateKitInput) {
  const boutique = await prisma.boutique.findUnique({ where: { userId } })
  if (!boutique) throw new Error('Acougue nao encontrado')
  return prisma.kitChurrasco.create({
    data: { ...data, boutiqueId: boutique.id },
  })
}

export async function updateKit(kitId: string, userId: string, data: Partial<CreateKitInput>) {
  const boutique = await prisma.boutique.findUnique({ where: { userId } })
  if (!boutique) throw new Error('Acougue nao encontrado')
  const kit = await prisma.kitChurrasco.findFirst({ where: { id: kitId, boutiqueId: boutique.id } })
  if (!kit) throw new Error('Kit nao encontrado')
  return prisma.kitChurrasco.update({ where: { id: kitId }, data })
}

export async function deleteKit(kitId: string, userId: string) {
  const boutique = await prisma.boutique.findUnique({ where: { userId } })
  if (!boutique) throw new Error('Acougue nao encontrado')
  const kit = await prisma.kitChurrasco.findFirst({ where: { id: kitId, boutiqueId: boutique.id } })
  if (!kit) throw new Error('Kit nao encontrado')
  await prisma.kitChurrasco.delete({ where: { id: kitId } })
}
