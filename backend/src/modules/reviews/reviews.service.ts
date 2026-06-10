import { prisma } from '../../config/prisma'

export async function createReview(data: {
  orderId: string
  customerId: string
  grillRating: number
  boutiqueRating?: number
  grillComment?: string
  boutiqueComment?: string
}) {
  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
    include: { review: true },
  })
  if (!order) throw new Error('Pedido nao encontrado')
  if (order.customerId !== data.customerId) throw new Error('Nao autorizado')
  if (order.status !== 'COMPLETED') throw new Error('So e possivel avaliar pedidos concluidos')
  if (order.review) throw new Error('Pedido ja foi avaliado')

  const review = await prisma.review.create({
    data: {
      orderId: data.orderId,
      customerId: data.customerId,
      grillmasterId: order.grillmasterId ?? undefined,
      boutiqueId: order.boutiqueId ?? undefined,
      grillRating: data.grillRating,
      boutiqueRating: data.boutiqueRating ?? undefined,
      grillComment: data.grillComment ?? undefined,
      boutiqueComment: data.boutiqueComment ?? undefined,
    },
  })

  if (order.grillmasterId) {
    const reviews = await prisma.review.findMany({
      where: { grillmasterId: order.grillmasterId },
    })
    const avg = reviews.reduce((acc, r) => acc + r.grillRating, 0) / reviews.length
    await prisma.grillmaster.update({
      where: { id: order.grillmasterId },
      data: { rating: Math.round(avg * 10) / 10 },
    })
  }

  if (order.boutiqueId && data.boutiqueRating) {
    const reviews = await prisma.review.findMany({
      where: { boutiqueId: order.boutiqueId, boutiqueRating: { not: null } },
    })
    const avg = reviews.reduce((acc, r) => acc + (r.boutiqueRating ?? 0), 0) / reviews.length
    await prisma.boutique.update({
      where: { id: order.boutiqueId },
      data: { rating: Math.round(avg * 10) / 10 },
    })
  }

  return review
}

export async function listGrillmasterReviews(grillmasterId: string) {
  return prisma.review.findMany({
    where: { grillmasterId },
    include: { customer: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function listBoutiqueReviews(boutiqueId: string) {
  return prisma.review.findMany({
    where: { boutiqueId },
    include: { customer: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })
}
