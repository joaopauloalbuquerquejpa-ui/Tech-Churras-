import { prisma } from '../../config/prisma'

export async function listUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function blockUser(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { role: 'BLOCKED' },
  })
}

export async function listGrillmasters() {
  return prisma.grillmaster.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function approveGrillmaster(grillmasterId: string) {
  return prisma.grillmaster.update({
    where: { id: grillmasterId },
    data: { approved: true },
  })
}

export async function listAllOrders() {
  return prisma.order.findMany({
    include: {
      customer: { select: { name: true, email: true } },
      boutique: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getDashboardStats() {
  const [totalUsers, totalOrders, totalBoutiques, totalGrillmasters] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.boutique.count(),
    prisma.grillmaster.count(),
  ])

  return { totalUsers, totalOrders, totalBoutiques, totalGrillmasters }
}