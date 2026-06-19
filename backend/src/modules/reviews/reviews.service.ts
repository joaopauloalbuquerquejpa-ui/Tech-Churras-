import { prisma } from '../../config/prisma'
import { sendPushToUser, sendWhatsAppToAdmin } from '../push/push.service'

export async function createReview(data: {
  orderId: string
  customerId: string
  grillRating: number
  boutiqueRating?: number
  grillComment?: string
  boutiqueComment?: string
  photos?: string[]
}) {
  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
    include: { review: true },
  })
  if (!order) throw new Error('Pedido nao encontrado')
  if (order.customerId !== data.customerId) throw new Error('Nao autorizado')
  if (order.status !== 'COMPLETED') throw new Error('So e possivel avaliar pedidos concluidos')
  if (order.review && order.review.grillRating != null) throw new Error('Pedido ja foi avaliado')

  let review
  if (order.review) {
    review = await prisma.review.update({
      where: { id: order.review.id },
      data: {
        grillRating: data.grillRating,
        boutiqueRating: data.boutiqueRating ?? undefined,
        grillComment: data.grillComment ?? undefined,
        boutiqueComment: data.boutiqueComment ?? undefined,
        photos: data.photos ?? [],
      },
    })
  } else {
    review = await prisma.review.create({
      data: {
        orderId: data.orderId,
        customerId: data.customerId,
        grillmasterId: order.grillmasterId ?? undefined,
        boutiqueId: order.boutiqueId ?? undefined,
        grillRating: data.grillRating,
        boutiqueRating: data.boutiqueRating ?? undefined,
        grillComment: data.grillComment ?? undefined,
        boutiqueComment: data.boutiqueComment ?? undefined,
        photos: data.photos ?? [],
      },
    })
  }

  if (order.grillmasterId) {
    const reviews = await prisma.review.findMany({
      where: { grillmasterId: order.grillmasterId, grillRating: { not: null } },
    })
    const avg = reviews.reduce((acc, r) => acc + (r.grillRating ?? 0), 0) / reviews.length
    const updatedGm = await prisma.grillmaster.update({
      where: { id: order.grillmasterId },
      data: { rating: Math.round(avg * 10) / 10 },
      select: { userId: true },
    })
    const stars = '⭐'.repeat(data.grillRating)
    const customerName = await prisma.user.findUnique({ where: { id: data.customerId }, select: { name: true } })
    const firstName = customerName?.name?.split(' ')[0] ?? 'Um cliente'
    sendPushToUser(
      updatedGm.userId,
      `${stars} Nova avaliação!`,
      `${firstName} te deu ${data.grillRating} estrela${data.grillRating !== 1 ? 's' : ''}${data.grillComment ? ': "' + data.grillComment.slice(0, 60) + '"' : ''}`,
      '/grillmasters/dashboard'
    ).catch((e) => console.error("[notif]", e?.message))
  }

  if (order.boutiqueId && data.boutiqueRating) {
    const reviews = await prisma.review.findMany({
      where: { boutiqueId: order.boutiqueId, boutiqueRating: { not: null } },
    })
    const avg = reviews.reduce((acc, r) => acc + (r.boutiqueRating ?? 0), 0) / reviews.length
    const updatedBoutique = await prisma.boutique.update({
      where: { id: order.boutiqueId },
      data: { rating: Math.round(avg * 10) / 10 },
      select: { userId: true },
    })
    const stars = '⭐'.repeat(data.boutiqueRating)
    sendPushToUser(
      updatedBoutique.userId,
      `${stars} Nova avaliação no açougue!`,
      `Você recebeu ${data.boutiqueRating} estrela${data.boutiqueRating !== 1 ? 's' : ''} por este evento.`,
      '/boutiques/dashboard'
    ).catch((e) => console.error("[notif]", e?.message))
  }

  // Alert admin on low rating (≤ 3 stars)
  const minRating = Math.min(data.grillRating, data.boutiqueRating ?? 5)
  if (minRating <= 3) {
    const customerName = await prisma.user.findUnique({ where: { id: data.customerId }, select: { name: true } }).catch(() => null)
    const stars = '⭐'.repeat(minRating)
    sendWhatsAppToAdmin(
      `⚠️ *Review negativo — Tech Churras!*\n\n` +
      `${stars} ${minRating}/5 estrelas\n` +
      `👤 Cliente: ${customerName?.name ?? 'Desconhecido'}\n` +
      `${data.grillComment ? `💬 "${data.grillComment}"` : ''}\n` +
      `${data.boutiqueComment ? `💬 Açougue: "${data.boutiqueComment}"` : ''}\n\n` +
      `Verifique e entre em contato:\nhttps://www.techchurras.com.br/admin`
    ).catch((e) => console.error("[notif]", e?.message))
  }

  return review
}

export async function createCustomerReview(data: {
  orderId: string
  grillmasterUserId: string
  customerRating: number
  customerComment?: string
}) {
  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
    include: { review: true, grillmaster: true },
  })
  if (!order) throw new Error('Pedido nao encontrado')
  if (order.grillmaster?.userId !== data.grillmasterUserId) throw new Error('Nao autorizado')
  if (order.status !== 'COMPLETED') throw new Error('So e possivel avaliar pedidos concluidos')
  if (order.review?.customerRating != null) throw new Error('Cliente ja foi avaliado')

  let review
  if (order.review) {
    review = await prisma.review.update({
      where: { id: order.review.id },
      data: { customerRating: data.customerRating, customerComment: data.customerComment },
    })
  } else {
    review = await prisma.review.create({
      data: {
        orderId: data.orderId,
        customerId: order.customerId,
        grillmasterId: order.grillmasterId ?? undefined,
        boutiqueId: order.boutiqueId ?? undefined,
        customerRating: data.customerRating,
        customerComment: data.customerComment,
      },
    })
  }

  const customerReviews = await prisma.review.findMany({
    where: { customerRating: { not: null }, order: { customerId: order.customerId } },
  })
  if (customerReviews.length > 0) {
    const avg = customerReviews.reduce((acc, r) => acc + (r.customerRating ?? 0), 0) / customerReviews.length
    await prisma.user.update({
      where: { id: order.customerId },
      data: { averageRating: Math.round(avg * 10) / 10 },
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