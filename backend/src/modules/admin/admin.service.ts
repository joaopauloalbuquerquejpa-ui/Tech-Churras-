import { prisma } from '../../config/prisma'

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
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function approveGrillmaster(
  grillmasterId: string,
  extras?: { isChancelado?: boolean; pricePerHour?: number }
) {
  return prisma.grillmaster.update({
    where: { id: grillmasterId },
    data: {
      approved: true,
      available: true,
      ...(extras?.isChancelado !== undefined ? { isChancelado: extras.isChancelado } : {}),
      ...(extras?.pricePerHour !== undefined ? { pricePerHour: extras.pricePerHour } : {}),
    },
  })
}

export async function rejectGrillmaster(grillmasterId: string) {
  return prisma.grillmaster.update({
    where: { id: grillmasterId },
    data: { approved: false, available: false },
  })
}

export async function listPendingBoutiques() {
  return prisma.boutique.findMany({
    where: { approved: false },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

function generateReferralCode(name: string): string {
  const prefix = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'ACOU'
  const suffix = String(Math.floor(1000 + Math.random() * 9000))
  return prefix + suffix
}

export async function approveBoutique(boutiqueId: string) {
  const boutique = await prisma.boutique.findUnique({ where: { id: boutiqueId } })
  if (!boutique) throw new Error('Acougue nao encontrado')
  let referralCode = boutique.referralCode
  if (!referralCode) {
    let code = generateReferralCode(boutique.name)
    const existing = await prisma.boutique.findUnique({ where: { referralCode: code } })
    if (existing) code = generateReferralCode(boutique.name)
    referralCode = code
  }
  return prisma.boutique.update({ where: { id: boutiqueId }, data: { approved: true, referralCode } })
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

export async function rejectBoutique(boutiqueId: string) {
  return prisma.boutique.update({ where: { id: boutiqueId }, data: { approved: false } })
}

export async function listAllOrders() {
  return prisma.order.findMany({
    include: {
      customer: { select: { name: true, email: true } },
      grillmaster: { include: { user: { select: { name: true } } } },
      boutique: { select: { name: true } },
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
