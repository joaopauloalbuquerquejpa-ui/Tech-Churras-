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

export async function updateGrillmasterProfile(grillmasterId: string, data: Record<string, unknown>) {
  return prisma.grillmaster.update({ where: { id: grillmasterId }, data })
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
    ).catch(() => {})
    emailPartnerApproved(gm.user.email, gm.user.name, 'GRILLMASTER', 'https://www.techchurras.com.br/grillmasters/dashboard').catch(() => {})
    if (gm.user.phone) {
      sendWhatsApp(
        gm.user.phone,
        `🔥 Parabéns ${name}! Seu perfil de churrasqueiro foi *aprovado* na Tech Churras!\n\nVocê já pode receber pedidos. Acesse seu painel:\nhttps://www.techchurras.com.br/grillmasters/dashboard`,
        'gm-aprovado'
      ).catch(() => {})
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
    ).catch(() => {})
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
  const updated = await prisma.boutique.update({ where: { id: boutiqueId }, data: { approved: true, referralCode } })
  if (boutique.user) {
    const name = boutique.user.name.split(' ')[0]
    sendPushToUser(
      boutique.user.id,
      '🎉 Açougue aprovado!',
      `Parabéns ${name}! O açougue ${boutique.name} já está ativo na Tech Churras.`,
      '/boutiques/dashboard'
    ).catch(() => {})
    emailPartnerApproved(boutique.user.email, boutique.user.name, 'BOUTIQUE', 'https://www.techchurras.com.br/boutiques/dashboard').catch(() => {})
    if (boutique.user.phone) {
      sendWhatsApp(
        boutique.user.phone,
        `🥩 Parabéns ${name}! O açougue *${boutique.name}* foi *aprovado* na Tech Churras!\n\nVocê já pode receber pedidos. Acesse seu painel:\nhttps://www.techchurras.com.br/boutiques/dashboard`,
        'boutique-aprovado'
      ).catch(() => {})
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
    ).catch(() => {})
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
