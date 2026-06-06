import { prisma } from '../../config/prisma'
import { z } from 'zod'

export const createGrillmasterSchema = z.object({
  bio: z.string().optional(),
  experience: z.number().int().min(0).default(0),
  pricePerHour: z.number().positive(),
  city: z.string().min(2),
  state: z.string().min(2),
})

export type CreateGrillmasterInput = z.infer<typeof createGrillmasterSchema>

export async function createGrillmaster(userId: string, data: CreateGrillmasterInput) {
  const existing = await prisma.grillmaster.findUnique({ where: { userId } })
  if (existing) throw new Error('Perfil de churrasqueiro já existe')

  return prisma.grillmaster.create({
    data: { userId, ...data },
    include: { user: { select: { name: true, email: true } } },
  })
}

export async function listGrillmasters(city?: string) {
  return prisma.grillmaster.findMany({
    where: {
      available: true,
      ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
    },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { rating: 'desc' },
  })
}

export async function getGrillmasterById(id: string) {
  const grillmaster = await prisma.grillmaster.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true } } },
  })
  if (!grillmaster) throw new Error('Churrasqueiro não encontrado')
  return grillmaster
}

export async function updateGrillmaster(userId: string, data: Partial<CreateGrillmasterInput>) {
  return prisma.grillmaster.update({
    where: { userId },
    data,
  })
}
