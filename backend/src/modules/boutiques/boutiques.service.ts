import { prisma } from '../../config/prisma'
import { sendPushToUser, sendWhatsAppToAdmin } from '../push/push.service'
import { z } from 'zod'
import { geocodeAddress, haversineKm } from '../../utils/geo'
import { randomBytes } from 'crypto'

function generateReferralCode(name: string): string {
  const prefix = name.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4).padEnd(4, 'X')
  const suffix = randomBytes(3).toString('hex').toUpperCase()
  return `${prefix}${suffix}`
}

export const createBoutiqueSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  address: z.string().optional(),
  phone: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  logoUrl: z.string().optional(),
  facadeUrl: z.string().optional(),
  galleryUrls: z.array(z.string()).optional(),
  instagram: z.string().optional(),
  openingHours: z.string().optional(),
  deliveryOrPickup: z.string().optional(),
  pixKey: z.string().optional(),
  cpfCnpj: z.string().optional(),
})

export const updateBoutiqueSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  city: z.string().min(2).optional(),
  state: z.string().min(2).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  open: z.boolean().optional(),
  logoUrl: z.string().optional(),
  facadeUrl: z.string().optional(),
  galleryUrls: z.array(z.string()).optional(),
  instagram: z.string().optional(),
  openingHours: z.string().optional(),
  deliveryOrPickup: z.string().optional(),
  pixKey: z.string().optional(),
  cpfCnpj: z.string().optional(),
})

export const createKitSchema = z.object({
  name: z.string().min(2),
  description: z.string(),
  price: z.number().positive(),
  discountPrice: z.number().positive().nullable().optional(),
  coverImageUrl: z.string().optional(),
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

  let latitude = data.latitude
  let longitude = data.longitude
  if ((!latitude || !longitude) && data.address && data.city) {
    const coords = await geocodeAddress(`${data.address}, ${data.city}, ${data.state}`)
    if (coords) { latitude = coords.lat; longitude = coords.lng }
  }

  const referralCode = generateReferralCode(data.name)
  // Mensalidade, comissão e trial são definidos na aprovação do admin (approveBoutique),
  // não no auto-cadastro — nunca confiar no client para definir o próprio preço.
  const boutique = await prisma.boutique.create({
    data: { userId, ...data, latitude, longitude, referralCode },
    include: { user: { select: { name: true, email: true } } },
  })
  // Notify all admins of new partner registration (push + WhatsApp)
  prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } }).then(admins => {
    for (const admin of admins) {
      sendPushToUser(admin.id, '🥩 Novo açougue!', `${boutique.user?.name} cadastrou ${boutique.name} e aguarda aprovação.`, '/admin').catch((e) => console.error("[notif]", e?.message))
    }
  }).catch((e) => console.error("[notif]", e?.message))
  sendWhatsAppToAdmin(
    `🥩 *Novo açougue cadastrado — Tech Churras!*\n\n` +
    `Açougue: ${boutique.name}\n` +
    `Responsável: ${boutique.user?.name}\n` +
    `Email: ${boutique.user?.email}\n` +
    `Cidade: ${boutique.city}, ${boutique.state}\n\n` +
    `⏳ Aguardando sua aprovação:\nhttps://www.techchurras.com.br/admin`
  ).catch((e) => console.error("[notif]", e?.message))
  return boutique
}

export async function getReferralStats(userId: string) {
  const boutique = await prisma.boutique.findUnique({ where: { userId }, select: { id: true, referralCode: true } })
  if (!boutique) throw new Error('Açougue não encontrado')

  const [referredUsers, bonuses] = await Promise.all([
    prisma.user.count({ where: { referredByBoutiqueId: boutique.id } }),
    prisma.payout.findMany({
      where: { type: 'REFERRAL_BONUS', recipientId: boutique.id },
      select: { amount: true, status: true },
    }),
  ])

  const pendingBonus = bonuses.filter(b => b.status === 'PENDING').reduce((s, b) => s + b.amount, 0)
  const paidBonus   = bonuses.filter(b => b.status === 'PAID').reduce((s, b) => s + b.amount, 0)
  const referralLink = `https://www.techchurras.com.br/register?ref=${boutique.referralCode}`

  return { referralCode: boutique.referralCode, referralLink, totalReferrals: referredUsers, pendingBonus, paidBonus }
}

export async function listBoutiques(params: {
  city?: string; minRating?: number; sortBy?: string
  lat?: number; lng?: number; radiusKm?: number
} = {}) {
  const { city, minRating, sortBy, lat, lng, radiusKm = 15 } = params
  const where: any = { approved: true }
  if (city) where.city = { contains: city, mode: 'insensitive' }
  if (minRating != null) where.rating = { gte: minRating }
  const orderBy: any = sortBy === 'name_asc' ? { name: 'asc' } : { rating: 'desc' }
  const boutiques = await prisma.boutique.findMany({
    where,
    include: { user: { select: { name: true, email: true } } },
    orderBy,
  })

  if (lat != null && lng != null) {
    return boutiques
      .map(b => ({
        ...b,
        distanceKm: b.latitude && b.longitude
          ? haversineKm(lat, lng, b.latitude, b.longitude)
          : null,
      }))
      .filter(b => b.distanceKm == null || b.distanceKm <= radiusKm)
      .sort((a, b) => {
        if (a.distanceKm == null) return 1
        if (b.distanceKm == null) return -1
        return a.distanceKm - b.distanceKm
      })
  }

  return boutiques
}

export async function findNearbyBoutiques(lat: number, lng: number, radiusKm = 15) {
  const all = await prisma.boutique.findMany({
    where: { approved: true, open: true },
    include: { products: { where: { available: true } } },
  })
  return all
    .filter(b => b.latitude != null && b.longitude != null)
    .map(b => ({ ...b, distanceKm: haversineKm(lat, lng, b.latitude!, b.longitude!) }))
    .filter(b => b.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
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

export async function getBoutiqueDashboardStats(userId: string) {
  const boutique = await prisma.boutique.findUnique({ where: { userId } })
  if (!boutique) throw new Error('Acougue nao encontrado')

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [completedOrders, pendingOrdersCount, recentOrders, referralCount] = await Promise.all([
    prisma.order.findMany({
      where: { boutiqueId: boutique.id, status: 'COMPLETED', paymentStatus: 'PAID', createdAt: { gte: thirtyDaysAgo } },
      select: { totalPrice: true, createdAt: true },
    }),
    prisma.order.count({
      where: { boutiqueId: boutique.id, status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] } },
    }),
    prisma.order.findMany({
      where: { boutiqueId: boutique.id },
      include: {
        customer: { select: { name: true, phone: true } },
        items: { include: { product: { select: { name: true, unit: true } } } },
        grillmaster: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.user.count({ where: { referredByBoutiqueId: boutique.id } }),
  ])

  const totalRevenue30days = completedOrders.reduce((s, o) => s + o.totalPrice, 0)

  const revenueMap: Record<string, number> = {}
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000)
    revenueMap[d.toISOString().slice(0, 10)] = 0
  }
  completedOrders.forEach(o => {
    const k = o.createdAt.toISOString().slice(0, 10)
    if (k in revenueMap) revenueMap[k] += o.totalPrice
  })

  return {
    totalRevenue30days,
    totalOrders30days: completedOrders.length,
    revenueByDay: Object.entries(revenueMap).map(([date, revenue]) => ({ date, revenue })),
    pendingOrdersCount,
    recentOrders: recentOrders.map(o => ({
      id: o.id,
      customerName: (o.customer as any).name,
      customerPhone: (o.customer as any).phone,
      grillmasterName: (o as any).grillmaster?.user?.name ?? null,
      totalPrice: o.totalPrice,
      status: o.status,
      eventDate: o.eventDate,
      guestCount: o.guestCount,
      items: ((o as any).items ?? []).map((i: any) => ({
        name: i.product?.name ?? '',
        quantity: i.quantity,
        unit: i.product?.unit ?? 'kg',
      })),
    })),
    referralCode: boutique.referralCode,
    referralCount,
  }
}

export async function getBoutiqueDemandForecast(userId: string) {
  const boutique = await prisma.boutique.findUnique({ where: { userId } })
  if (!boutique) throw new Error('Acougue nao encontrado')

  const now = new Date()
  const fourteenDaysLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

  const orders = await prisma.order.findMany({
    where: {
      boutiqueId: boutique.id,
      status: { in: ['CONFIRMED', 'PENDING'] },
      paymentStatus: 'PAID',
      eventDate: { gte: now, lte: fourteenDaysLater },
    },
    include: {
      items: { include: { product: true } },
    },
    orderBy: { eventDate: 'asc' },
  })

  const categoryMap: Record<string, {
    totalQuantityNeeded: number
    unit: string
    nextEventDate: Date
    orderIdSet: Set<string>
  }> = {}

  for (const order of orders) {
    for (const item of order.items) {
      const cat = item.product.category as string
      if (!categoryMap[cat]) {
        categoryMap[cat] = {
          totalQuantityNeeded: 0,
          unit: item.product.unit,
          nextEventDate: order.eventDate,
          orderIdSet: new Set(),
        }
      }
      categoryMap[cat].totalQuantityNeeded += item.quantity
      categoryMap[cat].orderIdSet.add(order.id)
    }
  }

  return Object.entries(categoryMap)
    .map(([category, data]) => ({
      category,
      totalQuantityNeeded: +data.totalQuantityNeeded.toFixed(2),
      unit: data.unit,
      eventsCount: data.orderIdSet.size,
      nextEventDate: data.nextEventDate,
    }))
    .sort((a, b) => new Date(a.nextEventDate).getTime() - new Date(b.nextEventDate).getTime())
}

export async function deleteKit(kitId: string, userId: string) {
  const boutique = await prisma.boutique.findUnique({ where: { userId } })
  if (!boutique) throw new Error('Acougue nao encontrado')
  const kit = await prisma.kitChurrasco.findFirst({ where: { id: kitId, boutiqueId: boutique.id } })
  if (!kit) throw new Error('Kit nao encontrado')
  await prisma.kitChurrasco.delete({ where: { id: kitId } })
}

export async function confirmBoutiqueOrderReady(orderId: string, userId: string) {
  const boutique = await prisma.boutique.findUnique({ where: { userId } })
  if (!boutique) throw new Error('Acougue nao encontrado')

  const order = await prisma.order.findFirst({
    where: { id: orderId, boutiqueId: boutique.id },
    include: {
      grillmaster: { include: { user: { select: { id: true, name: true } } } },
      customer: { select: { id: true } },
    },
  })
  if (!order) throw new Error('Pedido nao encontrado')
  if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
    throw new Error('Pedido nao pode ser confirmado neste status')
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { statusDetail: 'Cortes prontos — retire no balcão' },
  })

  // Push para o churrasqueiro
  if (order.grillmaster?.user?.id) {
    sendPushToUser(
      order.grillmaster.user.id,
      '🥩 Cortes prontos!',
      `${boutique.name} confirmou que os cortes estão prontos. Pode passar no balcão!`,
      `/orders/${orderId}`
    ).catch((e) => console.error('[notif]', e?.message))
  }

  // Push para o cliente (transparência)
  sendPushToUser(
    order.customer.id,
    '🔥 Churrasco se formando!',
    `O açougue confirmou os cortes. Seu churrasqueiro está a caminho do balcão.`,
    `/orders/${orderId}`
  ).catch((e) => console.error('[notif]', e?.message))

  return { ok: true }
}

export async function acceptBoutiqueOrder(orderId: string, userId: string) {
  const boutique = await prisma.boutique.findUnique({ where: { userId } })
  if (!boutique) throw new Error('Acougue nao encontrado')
  const order = await prisma.order.findFirst({
    where: { id: orderId, boutiqueId: boutique.id, status: 'PENDING' },
    include: {
      customer: { select: { id: true, name: true } },
      grillmaster: { include: { user: { select: { id: true } } } },
    },
  })
  if (!order) throw new Error('Pedido nao encontrado ou ja processado')
  await prisma.order.update({ where: { id: orderId }, data: { status: 'CONFIRMED' } })
  sendPushToUser(order.customer.id, '✅ Pedido aceito!', `${boutique.name} aceitou seu pedido. Estão separando suas carnes!`, `/orders/${orderId}`).catch(() => {})
  if (order.grillmaster?.user?.id) {
    sendPushToUser(order.grillmaster.user.id, '🥩 Açougue confirmou!', `${boutique.name} confirmou os itens do evento. Prepare-se!`, `/orders/${orderId}`).catch(() => {})
  }
  return { ok: true }
}

export async function rejectBoutiqueOrder(orderId: string, userId: string, reason?: string) {
  const boutique = await prisma.boutique.findUnique({ where: { userId } })
  if (!boutique) throw new Error('Acougue nao encontrado')
  const order = await prisma.order.findFirst({
    where: { id: orderId, boutiqueId: boutique.id, status: { in: ['PENDING', 'CONFIRMED'] } },
    include: { customer: { select: { id: true } } },
  })
  if (!order) throw new Error('Pedido nao encontrado ou ja processado')
  await prisma.order.update({
    where: { id: orderId },
    data: { status: 'CANCELLED', cancelledBy: 'BOUTIQUE', cancellationReason: reason ?? 'Açougue não pode atender este pedido' },
  })
  sendPushToUser(order.customer.id, '❌ Pedido cancelado', `${boutique.name} não pode atender este pedido. Estamos buscando alternativas.`, `/orders/${orderId}`).catch(() => {})
  return { ok: true }
}