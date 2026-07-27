import { prisma } from '../../config/prisma'
import { z } from 'zod'
import { geocodeAddress, haversineKm } from '../../utils/geo'
import { sendPushToUser, sendWhatsAppToAdmin } from '../push/push.service'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const accompanimentItemSchema = z.object({
  name: z.string().min(2),
  laborPrice: z.number().nonnegative(),
  description: z.string().optional(),
})

export const createGrillmasterSchema = z.object({
  bio: z.string().optional(),
  experience: z.number().int().min(0).default(0),
  pricePerHour: z.number().positive(),
  city: z.string().min(2),
  state: z.string().min(2),
  specialties: z.string().optional(),
  available: z.boolean().optional(),
  photoUrl: z.string().optional(),
  galleryUrls: z.array(z.string()).optional(),
  instagram: z.string().optional(),
  videoUrl: z.string().optional(),
  churrascoStyle: z.string().optional(),
  bringsEquipment: z.boolean().optional(),
  minGuests: z.number().int().optional(),
  maxGuests: z.number().int().optional(),
  defaultBoutiqueId: z.string().uuid().optional().nullable(),
  accompaniments: z.array(accompanimentItemSchema).optional(),
})

export type CreateGrillmasterInput = z.infer<typeof createGrillmasterSchema>

export async function createGrillmaster(userId: string, data: CreateGrillmasterInput) {
  const existing = await prisma.grillmaster.findUnique({ where: { userId } })
  if (existing) throw new Error('Perfil de churrasqueiro ja existe')

  let latitude: number | undefined
  let longitude: number | undefined
  if (data.city && data.state) {
    const coords = await geocodeAddress(`${data.city}, ${data.state}`)
    if (coords) { latitude = coords.lat; longitude = coords.lng }
  }

  const gm = await prisma.grillmaster.create({
    data: { userId, ...data, latitude, longitude },
    include: { user: { select: { name: true, email: true } } },
  })
  // Notify all admins of new partner registration (push + WhatsApp)
  prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } }).then(admins => {
    for (const admin of admins) {
      sendPushToUser(admin.id, '👨‍🍳 Novo churrasqueiro!', `${gm.user?.name} cadastrou perfil e aguarda aprovação.`, '/admin').catch((e) => console.error("[notif]", e?.message))
    }
  }).catch((e) => console.error("[notif]", e?.message))
  sendWhatsAppToAdmin(
    `👨‍🍳 *Novo churrasqueiro cadastrado — Tech Churras!*\n\n` +
    `Nome: ${gm.user?.name}\n` +
    `Email: ${gm.user?.email}\n` +
    `Cidade: ${gm.city}, ${gm.state}\n\n` +
    `⏳ Aguardando sua aprovação:\nhttps://www.techchurras.com.br/admin`
  ).catch((e) => console.error("[notif]", e?.message))
  return gm
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
  lat?: number
  lng?: number
  radiusKm?: number
} = {}) {
  const { city, minPrice, maxPrice, minRating, specialty, sortBy, available = true, page = 1, limit = 9, lat, lng, radiusKm = 20 } = params
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

  // Se coordenadas fornecidas, calcula distância e filtra por raio
  if (lat != null && lng != null) {
    const withDist = grillmasters
      .map(g => ({
        ...g,
        distanceKm: g.latitude && g.longitude
          ? haversineKm(lat, lng, g.latitude, g.longitude)
          : null,
      }))
      .filter(g => g.distanceKm == null || g.distanceKm <= radiusKm)
      .sort((a, b) => {
        if (a.distanceKm == null) return 1
        if (b.distanceKm == null) return -1
        return a.distanceKm - b.distanceKm
      })
    return { grillmasters: withDist, total: withDist.length, page, limit, totalPages: Math.ceil(withDist.length / limit) }
  }

  return { grillmasters, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function findNearbyGrillmasters(lat: number, lng: number, radiusKm = 20) {
  const all = await prisma.grillmaster.findMany({
    where: { available: true, approved: true },
    include: { user: { select: { name: true } } },
  })
  return all
    .filter(g => g.latitude != null && g.longitude != null)
    .map(g => ({ ...g, distanceKm: haversineKm(lat, lng, g.latitude!, g.longitude!) }))
    .filter(g => g.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
}

// ── Feature 4: Matching inteligente de GM
export async function recommendGrillmasters(params: {
  lat?: number
  lng?: number
  eventDate?: string
  guests?: number
  city?: string
}) {
  const { lat, lng, eventDate, guests, city } = params

  const all = await prisma.grillmaster.findMany({
    where: { available: true, approved: true },
    include: {
      user: { select: { name: true } },
      _count: { select: { orders: true, reviews: true } },
    },
  })

  // Filtra por cidade se não tiver coordenadas
  let candidates = city
    ? all.filter(g => g.city?.toLowerCase().includes(city.toLowerCase()))
    : all

  // Se tiver data, remove GMs com evento já agendado naquele dia
  if (eventDate) {
    const targetDate = new Date(eventDate)
    const dayStart = new Date(targetDate); dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(targetDate); dayEnd.setHours(23, 59, 59, 999)
    const busyGmIds = await prisma.order.findMany({
      where: {
        status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
        eventDate: { gte: dayStart, lte: dayEnd },
        grillmasterId: { not: null },
      },
      select: { grillmasterId: true },
    }).then(orders => new Set(orders.map(o => o.grillmasterId)))
    candidates = candidates.filter(g => !busyGmIds.has(g.id))
  }

  // Score: rating(40%) + reviews(25%) + experience(20%) + proximity(15%)
  const scored = candidates.map(g => {
    const distanceKm = lat != null && lng != null && g.latitude != null && g.longitude != null
      ? haversineKm(lat, lng, g.latitude, g.longitude)
      : null

    const ratingScore = (g.rating ?? 0) / 5 * 40
    const reviewScore = Math.min(g._count.reviews / 20, 1) * 25
    const expScore = Math.min((g.experience ?? 0) / 10, 1) * 20
    const proxScore = distanceKm != null ? Math.max(0, 1 - distanceKm / 30) * 15 : 0

    return { ...g, distanceKm, score: ratingScore + reviewScore + expScore + proxScore }
  })

  const top3 = scored
    .filter(g => !lat || !lng || !g.distanceKm || g.distanceKm <= 30)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  if (top3.length === 0) return []

  // Gerar razão personalizada para cada GM com IA
  const guestLabel = guests ? `${guests} convidados` : 'seu evento'
  const reasons = await Promise.allSettled(top3.map(async (g) => {
    try {
      const resp = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 60,
        messages: [{
          role: 'user',
          content: `Uma frase curta (máx 10 palavras) em português explicando por que ${g.user.name} é ideal para ${guestLabel}. Dados: nota ${g.rating ?? 0}/5, ${g._count.reviews} avaliações, ${g.experience ?? 0} anos experiência${g.distanceKm ? `, a ${g.distanceKm.toFixed(1)}km` : ''}, especialidades: ${g.specialties ?? 'churrasco tradicional'}. Responda apenas a frase.`,
        }],
      })
      return resp.content[0].type === 'text' ? resp.content[0].text.trim() : ''
    } catch { return '' }
  }))

  return top3.map((g, i) => ({
    id: g.id,
    name: g.user.name,
    rating: g.rating,
    pricePerHour: g.pricePerHour,
    photoUrl: g.photoUrl,
    city: g.city,
    specialties: g.specialties,
    experience: g.experience,
    reviewCount: g._count.reviews,
    distanceKm: g.distanceKm ? Math.round(g.distanceKm * 10) / 10 : null,
    reason: reasons[i].status === 'fulfilled' ? reasons[i].value : '',
  }))
}

export async function getGrillmasterById(id: string) {
  const grillmaster = await prisma.grillmaster.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true } } },
  })
  if (!grillmaster) throw new Error('Churrasqueiro nao encontrado')
  return grillmaster
}

export async function updateGrillmaster(userId: string, data: Partial<CreateGrillmasterInput>) {
  return prisma.grillmaster.update({ where: { userId }, data })
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

export async function getGrillmasterSchedule(userId: string) {
  const gm = await prisma.grillmaster.findUnique({ where: { userId } })
  if (!gm) throw new Error('Perfil de churrasqueiro nao encontrado')
  const from = new Date()
  from.setHours(0, 0, 0, 0)
  const to = new Date()
  to.setDate(to.getDate() + 60)
  return prisma.grillmasterSchedule.findMany({
    where: { grillmasterId: gm.id, date: { gte: from, lte: to } },
    orderBy: { date: 'asc' },
  })
}

export async function toggleScheduleDay(userId: string, dateStr: string) {
  const gm = await prisma.grillmaster.findUnique({ where: { userId } })
  if (!gm) throw new Error('Perfil de churrasqueiro nao encontrado')
  const date = new Date(dateStr)
  date.setUTCHours(12, 0, 0, 0)
  const existing = await prisma.grillmasterSchedule.findUnique({
    where: { grillmasterId_date: { grillmasterId: gm.id, date } },
  })
  if (existing) {
    return prisma.grillmasterSchedule.update({
      where: { id: existing.id },
      data: { available: !existing.available },
    })
  }
  return prisma.grillmasterSchedule.create({
    data: { grillmasterId: gm.id, date, available: false },
  })
}

// Completar os 4 módulos é onboarding (entender o padrão Tech Churras), não gera
// certificação sozinho — a Chancela só é concedida manualmente pelo admin
// (certifyGrillmaster em admin.service.ts) depois da entrevista pessoal com o Jota.
export async function completeTrainingModule(userId: string, moduleId: number) {
  if (moduleId < 1 || moduleId > 4) throw new Error('Modulo invalido')
  const gm = await prisma.grillmaster.findUnique({ where: { userId } })
  if (!gm) throw new Error('Perfil de churrasqueiro nao encontrado')
  const modules = Array.from(new Set([...gm.trainingModules, moduleId])).sort()
  return prisma.grillmaster.update({ where: { userId }, data: { trainingModules: modules } })
}

export async function markUniformSent(grillmasterId: string) {
  return prisma.grillmaster.update({
    where: { id: grillmasterId },
    data: { uniformSent: true, uniformSentAt: new Date() },
  })
}