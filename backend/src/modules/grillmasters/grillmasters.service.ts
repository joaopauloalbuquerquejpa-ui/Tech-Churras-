import { prisma } from '../../config/prisma'
import { z } from 'zod'

export const createGrillmasterSchema = z.object({
  bio: z.string().optional(),
  experience: z.number().int().min(0).default(0),
  pricePerHour: z.number().positive(),
  city: z.string().min(2),
  state: z.string().min(2),
  specialties: z.string().optional(),
  phone: z.string().optional(),
  photoUrl: z.string().optional(),
  galleryUrls: z.array(z.string()).optional(),
  instagram: z.string().optional(),
  churrascoStyle: z.string().optional(),
  bringsEquipment: z.boolean().optional(),
  minGuests: z.number().int().optional(),
  maxGuests: z.number().int().optional(),
})

export type CreateGrillmasterInput = z.infer<typeof createGrillmasterSchema>

export async function createGrillmaster(userId: string, data: CreateGrillmasterInput) {
  const existing = await prisma.grillmaster.findUnique({ where: { userId } })
  if (existing) throw new Error('Perfil de churrasqueiro j� existe')

  return prisma.grillmaster.create({
    data: { userId, ...data },
    include: { user: { select: { name: true, email: true } } },
  })
}

export async function listGrillmasters(params: {
  city?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  specialty?: string
  sortBy?: string
  available?: boolean
  page?: number
  limit?: number
} = {}) {
  const { city, minPrice, maxPrice, minRating, specialty, sortBy, available = true, page = 1, limit = 9 } = params
  const where: any = {}
  if (available) where.available = true
  if (city) where.city = { contains: city, mode: 'insensitive' }
  if (minPrice != null) where.pricePerHour = { ...where.pricePerHour, gte: minPrice }
  if (maxPrice != null) where.pricePerHour = { ...where.pricePerHour, lte: maxPrice }
  if (minRating != null) where.rating = { gte: minRating }
  if (specialty) where.specialties = { contains: specialty, mode: 'insensitive' }
  let orderBy: any = [{ rating: 'desc' }]
  if (sortBy === 'price_asc') orderBy = [{ pricePerHour: 'asc' }]
  else if (sortBy === 'price_desc') orderBy = [{ pricePerHour: 'desc' }]
  const skip = (page - 1) * limit
  const [grillmasters, total] = await Promise.all([
    prisma.grillmaster.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.grillmaster.count({ where }),
  ])
  return { grillmasters, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function getGrillmasterById(id: string) {
  const grillmaster = await prisma.grillmaster.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true } } },
  })
  if (!grillmaster) throw new Error('Churrasqueiro n�o encontrado')
  return grillmaster
}

export async function updateGrillmaster(userId: string, data: Partial<CreateGrillmasterInput>) {
  return prisma.grillmaster.update({
    where: { userId },
    data,
  })
}

export async function getMyGrillmasterOrders(userId: string) {
  const gm = await prisma.grillmaster.findUnique({ where: { userId } })
  if (!gm) throw new Error('Perfil de churrasqueiro nao encontrado')
  return {
    grillmaster: gm,
    orders: await prisma.order.findMany({
      where: { grillmasterId: gm.id },
      include: {
        customer: { select: { name: true, email: true } },
        boutique: { select: { name: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  }
}
