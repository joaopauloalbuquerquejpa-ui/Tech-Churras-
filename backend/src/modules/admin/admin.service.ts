import { prisma } from '../../config/prisma'
import { sendPushToUser } from '../push/push.service'
import { emailPartnerApproved } from '../email/email.service'

async function sendWhatsApp(phone: string, message: string, label: string) {
  const instance = process.env.ZAPI_INSTANCE
  const token = process.env.ZAPI_TOKEN
  if (!instance || !token) return
  const clean = phone.replace(/\D/g, '')
  try {
    const res = await fetch(
      `https://api.z-api.io/instances/${instance}/token/${token}/send-text`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: clean, message }) }
    )
    if (!res.ok) console.log(`[WhatsApp] ${label} erro:`, res.status)
  } catch {}
}

const GRILLMASTER_EDITABLE_FIELDS = new Set([
  'bio', 'experience', 'pricePerHour', 'city', 'state', 'specialties',
  'available', 'isChancelado', 'photoUrl', 'churrascoStyle',
  'bringsEquipment', 'minGuests', 'maxGuests', 'instagram', 'videoUrl',
])

export async function updateGrillmasterProfile(grillmasterId: string, data: Record<string, unknown>) {
  const safe = Object.fromEntries(
    Object.entries(data).filter(([k]) => GRILLMASTER_EDITABLE_FIELDS.has(k))
  )
  return prisma.grillmaster.update({ where: { id: grillmasterId }, data: safe })
}

export async function listUsers() {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function blockUser(userId: string) {
  return prisma.user.update({ where: { id: userId }, data: { role: 'CUSTOMER' } })
}

export async function listGrillmasters() {
  return prisma.grillmaster.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function listPendingGrillmasters() {
  return prisma.grillmaster.findMany({
    where: { approved: false },
    include: { user: { select: { name: true, email: true, phone: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function approveGrillmaster(
  grillmasterId: string,
  extras?: { isChancelado?: boolean; pricePerHour?: number }
) {
  const gm = await prisma.grillmaster.findUnique({
    where: { id: grillmasterId },
    include: { user: { select: { id: true, name: true, email: true, phone: true } } },
  })
  const updated = await prisma.grillmaster.update({
    where: { id: grillmasterId },
    data: {
      approved: true,
      available: true,
      ...(extras?.isChancelado !== undefined ? { isChancelado: extras.isChancelado } : {}),
      ...(extras?.pricePerHour !== undefined ? { pricePerHour: extras.pricePerHour } : {}),
    },
  })
  if (gm?.user) {
    const name = gm.user.name.split(' ')[0]
    sendPushToUser(
      gm.user.id,
      '🎉 Perfil aprovado!',
      `Parabéns ${name}! Você já está ativo na Tech Churras e pode receber pedidos.`,
      '/grillmasters/dashboard'
    ).catch((e) => console.error("[notif]", e?.message))
    emailPartnerApproved(gm.user.email, gm.user.name, 'GRILLMASTER', 'https://www.techchurras.com.br/grillmasters/dashboard').catch((e) => console.error("[notif]", e?.message))
    if (gm.user.phone) {
      sendWhatsApp(
        gm.user.phone,
        `🔥 Parabéns ${name}! Seu perfil de churrasqueiro foi *aprovado* na Tech Churras!\n\nVocê já pode receber pedidos. Acesse seu painel:\nhttps://www.techchurras.com.br/grillmasters/dashboard`,
        'gm-aprovado'
      ).catch((e) => console.error("[notif]", e?.message))
    }
  }
  return updated
}

export async function rejectGrillmaster(grillmasterId: string) {
  const gm = await prisma.grillmaster.findUnique({
    where: { id: grillmasterId },
    include: { user: { select: { id: true, name: true } } },
  })
  const updated = await prisma.grillmaster.update({
    where: { id: grillmasterId },
    data: { approved: false, available: false },
  })
  if (gm?.user) {
    sendPushToUser(
      gm.user.id,
      'Perfil em revisão',
      'Precisamos de mais informações sobre seu perfil. Entre em contato com o suporte.',
      '/grillmasters/dashboard'
    ).catch((e) => console.error("[notif]", e?.message))
  }
  return updated
}

export async function listPendingBoutiques() {
  return prisma.boutique.findMany({
    where: { approved: false },
    include: { user: { select: { name: true, email: true, phone: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

function generateReferralCode(name: string): string {
  const prefix = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'ACOU'
  const suffix = String(Math.floor(1000 + Math.random() * 9000))
  return prefix + suffix
}

export async function approveBoutique(boutiqueId: string) {
  const boutique = await prisma.boutique.findUnique({
    where: { id: boutiqueId },
    include: { user: { select: { id: true, name: true, email: true, phone: true } } },
  })
  if (!boutique) throw new Error('Acougue nao encontrado')
  let referralCode = boutique.referralCode
  if (!referralCode) {
    let code = generateReferralCode(boutique.name)
    const existing = await prisma.boutique.findUnique({ where: { referralCode: code } })
    if (existing) code = generateReferralCode(boutique.name)
    referralCode = code
  }
  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + 60)
  const updated = await prisma.boutique.update({ where: { id: boutiqueId }, data: { approved: true, referralCode, trialEndsAt } })
  if (boutique.user) {
    const name = boutique.user.name.split(' ')[0]
    sendPushToUser(
      boutique.user.id,
      '🎉 Açougue aprovado! 60 dias grátis iniciados.',
      `Parabéns ${name}! O açougue ${boutique.name} está ativo. Aproveite seus 60 dias de uso gratuito!`,
      '/boutiques/dashboard'
    ).catch((e) => console.error("[notif]", e?.message))
    emailPartnerApproved(boutique.user.email, boutique.user.name, 'BOUTIQUE', 'https://www.techchurras.com.br/boutiques/dashboard').catch((e) => console.error("[notif]", e?.message))
    if (boutique.user.phone) {
      sendWhatsApp(
        boutique.user.phone,
        `🥩 Parabéns ${name}! O açougue *${boutique.name}* foi *aprovado* na Tech Churras!\n\n🎁 Você tem *60 dias GRÁTIS* para testar tudo.\n\n*QR code do seu balcão:*\nhttps://www.techchurras.com.br/pedido?boutique=${boutique.id}\n\nAcesse seu painel completo:\nhttps://www.techchurras.com.br/boutiques/dashboard`,
        'boutique-aprovado'
      ).catch((e) => console.error("[notif]", e?.message))
    }
  }
  return updated
}

export async function rejectBoutique(boutiqueId: string) {
  const boutique = await prisma.boutique.findUnique({
    where: { id: boutiqueId },
    include: { user: { select: { id: true, name: true } } },
  })
  const updated = await prisma.boutique.update({ where: { id: boutiqueId }, data: { approved: false } })
  if (boutique?.user) {
    sendPushToUser(
      boutique.user.id,
      'Cadastro em revisão',
      'Precisamos de mais informações sobre seu açougue. Entre em contato com o suporte.',
      '/boutiques/dashboard'
    ).catch((e) => console.error("[notif]", e?.message))
  }
  return updated
}

export async function getBoutiqueReferralStats(boutiqueId: string) {
  const [referred, converted] = await Promise.all([
    prisma.user.count({ where: { referredByBoutiqueId: boutiqueId } }),
    prisma.user.count({
      where: {
        referredByBoutiqueId: boutiqueId,
        orders: { some: { paymentStatus: 'PAID' } },
      },
    }),
  ])
  return { boutiqueId, referred, converted }
}

export async function listAllOrders() {
  return prisma.order.findMany({
    include: {
      customer: { select: { name: true, email: true, phone: true } },
      grillmaster: { include: { user: { select: { name: true, phone: true } } } },
      boutique: { select: { name: true } },
      items: { include: { product: { select: { name: true, price: true, unit: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function markOrderPaid(orderId: string) {
  return prisma.order.update({
    where: { id: orderId },
    data: { status: 'COMPLETED', paymentStatus: 'PAID', paidAt: new Date() },
  })
}

export async function getDashboardStats() {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 7)
  weekStart.setHours(0, 0, 0, 0)

  const [
    totalUsers,
    totalOrders,
    totalBoutiques,
    totalGrillmasters,
    revenue,
    ordersToday,
    revenueToday,
    usersToday,
    activeOrders,
    revenueWeek,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.boutique.count(),
    prisma.grillmaster.count(),
    prisma.order.aggregate({ _sum: { totalPrice: true } }),
    prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.order.aggregate({ where: { createdAt: { gte: todayStart } }, _sum: { totalPrice: true } }),
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.order.count({ where: { status: { in: ['CONFIRMED', 'IN_PROGRESS'] } } }),
    prisma.order.aggregate({ where: { createdAt: { gte: weekStart } }, _sum: { totalPrice: true } }),
  ])

  return {
    totalUsers,
    totalOrders,
    totalBoutiques,
    totalGrillmasters,
    totalRevenue: revenue._sum.totalPrice ?? 0,
    ordersToday,
    revenueToday: revenueToday._sum.totalPrice ?? 0,
    usersToday,
    activeOrders,
    revenueWeek: revenueWeek._sum.totalPrice ?? 0,
  }
}

export async function getAdvancedMetrics() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [funnel, recentOrders, gmOrders] = await Promise.all([
    // Funil de conversão
    Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: { in: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] } } }),
      prisma.order.count({ where: { status: 'COMPLETED' } }),
    ]),
    // Pedidos dos últimos 30 dias com hora de criação
    prisma.order.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, totalPrice: true, status: true },
      orderBy: { createdAt: 'asc' },
    }),
    // GMs com contagem de pedidos aceitos vs recebidos
    prisma.grillmaster.findMany({
      select: {
        id: true,
        user: { select: { name: true } },
        photoUrl: true,
        rating: true,
        _count: { select: { orders: true } },
        orders: {
          where: { status: { in: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] } },
          select: { id: true },
        },
      },
      orderBy: { orders: { _count: 'desc' } },
      take: 10,
    }),
  ])

  // Funil
  const [total, confirmed, completed] = funnel
  const funnelData = {
    total,
    confirmed,
    completed,
    confirmRate: total > 0 ? Math.round((confirmed / total) * 100) : 0,
    completeRate: confirmed > 0 ? Math.round((completed / confirmed) * 100) : 0,
  }

  // Receita por dia (últimos 30 dias)
  const revenueByDay: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    revenueByDay[d.toISOString().slice(0, 10)] = 0
  }
  for (const o of recentOrders) {
    if (o.status === 'COMPLETED') {
      const day = o.createdAt.toISOString().slice(0, 10)
      if (day in revenueByDay) revenueByDay[day] = (revenueByDay[day] ?? 0) + (o.totalPrice ?? 0)
    }
  }

  // Pedidos por hora do dia
  const ordersByHour = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }))
  for (const o of recentOrders) {
    const h = o.createdAt.getHours()
    ordersByHour[h].count++
  }

  // Top GMs por aceitação
  const topGms = gmOrders
    .filter(gm => gm._count.orders > 0)
    .map(gm => ({
      id: gm.id,
      name: gm.user.name,
      photoUrl: gm.photoUrl,
      rating: gm.rating,
      totalOrders: gm._count.orders,
      acceptedOrders: gm.orders.length,
      acceptRate: Math.round((gm.orders.length / gm._count.orders) * 100),
    }))
    .sort((a, b) => b.totalOrders - a.totalOrders)
    .slice(0, 5)

  return { funnel: funnelData, revenueByDay, ordersByHour, topGms }
}