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

export async function approveGrillmaster(grillmasterId: string) {
  return prisma.grillmaster.update({
    where: { id: grillmasterId },
    data: { approved: true, available: true },
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

export async function approveBoutique(boutiqueId: string) {
  return prisma.boutique.update({ where: { id: boutiqueId }, data: { approved: true } })
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

export async function getDashboardStats() {
  const [totalUsers, totalOrders, totalBoutiques, totalGrillmasters, revenue] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.boutique.count(),
    prisma.grillmaster.count(),
    prisma.order.aggregate({ _sum: { totalPrice: true } }),
  ])

  return {
    totalUsers,
    totalOrders,
    totalBoutiques,
    totalGrillmasters,
    totalRevenue: revenue._sum.totalPrice ?? 0,
  }
}
