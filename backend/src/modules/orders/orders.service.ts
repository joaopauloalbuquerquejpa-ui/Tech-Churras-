import { prisma } from '../../config/prisma'
import { z } from 'zod'
import crypto from 'crypto'
import { validateCoupon } from '../coupons/coupons.service'
import { sendPushToUser } from '../push/push.service'

export const createOrderSchema = z.object({
  grillmasterId: z.string().optional(),
  boutiqueId: z.string().optional(),
  eventDate: z.string().transform(s => new Date(s)),
  eventAddress: z.string().min(5),
  eventHours: z.number().int().min(1).default(4),
  guestCount: z.number().int().min(1),
  notes: z.string().optional(),
  couponCode: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().positive(),
  })).optional(),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>

export async function createOrder(customerId: string, data: CreateOrderInput) {
  const { items, couponCode, ...orderData } = data

  // Fetch real prices from DB — never trust client-supplied prices
  let itemsWithPrice: { productId: string; quantity: number; unitPrice: number }[] = []
  if (items && items.length > 0) {
    const products = await prisma.product.findMany({
      where: { id: { in: items.map(i => i.productId) } },
      select: { id: true, price: true },
    })
    const priceMap = Object.fromEntries(products.map(p => [p.id, p.price]))
    itemsWithPrice = items
      .filter(i => priceMap[i.productId] !== undefined)
      .map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: priceMap[i.productId] }))
  }

  const itemsTotal = itemsWithPrice.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)

  const grillmaster = data.grillmasterId
    ? await prisma.grillmaster.findUnique({ where: { id: data.grillmasterId } })
    : null
  const grillmasterCost = grillmaster ? grillmaster.pricePerHour * (data.eventHours ?? 4) : 0
  const subtotal = itemsTotal + grillmasterCost

  let discountAmount = 0
  let appliedCouponCode: string | undefined

  if (couponCode) {
    const result = await validateCoupon(couponCode, subtotal)
    if (result.valid && result.coupon) {
      discountAmount = result.discountAmount!
      appliedCouponCode = result.coupon.code
    }
  }

  const totalPrice = Math.max(0, subtotal - discountAmount)

  const order = await prisma.order.create({
    data: {
      customerId,
      ...orderData,
      totalPrice,
      couponCode: appliedCouponCode,
      discountAmount,
      items: itemsWithPrice.length > 0 ? { create: itemsWithPrice } : undefined,
    },
    include: { items: true, grillmaster: { include: { user: true } }, boutique: true },
  })

  if (appliedCouponCode) {
    await prisma.coupon.update({
      where: { code: appliedCouponCode },
      data: { usedCount: { increment: 1 } },
    })
  }

  return order
}

export async function listOrders(customerId: string) {
  const orders = await prisma.order.findMany({
    where: { customerId },
    include: {
      items: { include: { product: true } },
      grillmaster: { include: { user: true } },
      boutique: true,
      review: { select: { id: true, grillRating: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  const orderIds = orders.map(o => o.id)
  if (orderIds.length === 0) return orders.map(o => ({ ...o, _unreadMessages: 0 }))
  const unreadGroups = await (prisma as any).message.groupBy({
    by: ['orderId'],
    where: { orderId: { in: orderIds }, senderId: { not: customerId }, read: false },
    _count: { id: true },
  })
  const unreadMap: Record<string, number> = {}
  ;(unreadGroups as any[]).forEach(g => { unreadMap[g.orderId] = g._count.id })
  return orders.map(o => ({ ...o, _unreadMessages: unreadMap[o.id] ?? 0 }))
}

async function sendWhatsAppConfirmation(
  phone: string,
  customerName: string,
  orderId: string,
  grillmasterName: string,
  eventDate: Date
) {
  const instance = process.env.ZAPI_INSTANCE
  const token = process.env.ZAPI_TOKEN
  if (!instance || !token) {
    console.log('[WhatsApp] ZAPI_INSTANCE/ZAPI_TOKEN nao configurados — pulando envio')
    return
  }
  const cleanPhone = phone.replace(/\D/g, '')
  const date = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(eventDate)
  const message =
    `🔥 Seu churrasco está confirmado! Olá ${customerName}, seu pedido #${orderId.slice(0, 8)} com ${grillmasterName} foi confirmado para ${date}. Acompanhe em: https://www.techchurras.com.br/orders/${orderId}`
  try {
    const res = await fetch(
      `https://api.z-api.io/instances/${instance}/token/${token}/send-text`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, message }),
      }
    )
    if (!res.ok) console.log('[WhatsApp] Erro:', res.status, await res.text())
    else console.log('[WhatsApp] Mensagem enviada para', cleanPhone)
  } catch (err) {
    console.log('[WhatsApp] Falha na requisicao:', err)
  }
}

export async function updateOrderStatusDetail(id: string, statusDetail: string, userId: string, role: string) {
  let authorized = false
  if (role === 'ADMIN') {
    authorized = true
  } else if (role === 'GRILLMASTER') {
    const gm = await prisma.grillmaster.findUnique({ where: { userId } })
    if (gm) {
      const order = await prisma.order.findFirst({ where: { id, grillmasterId: gm.id } })
      authorized = !!order
    }
  }
  if (!authorized) throw new Error('Nao autorizado')
  const updated = await prisma.order.update({ where: { id }, data: { statusDetail } })
  if (statusDetail === 'Churrasqueiro a caminho') {
    sendPushToUser(
      updated.customerId,
      'Churrasqueiro a caminho!',
      'Seu churrasqueiro esta se deslocando ao local do evento.',
      `/orders/${id}`
    ).catch(() => {})
  }
  return updated
}

export async function updateOrderStatus(id: string, status: string, userId?: string, role?: string) {
  if (userId && role !== 'ADMIN') {
    const existing = await prisma.order.findUnique({
      where: { id },
      include: { grillmaster: { select: { userId: true } } },
    })
    if (!existing) throw new Error('Pedido nao encontrado')
    const isAssignedGM = existing.grillmaster?.userId === userId
    if (!isAssignedGM) throw new Error('Sem permissao para alterar este pedido')
  }
  const statusDetailMap: Partial<Record<string, string>> = {
    CONFIRMED: 'Pedido confirmado',
    IN_PROGRESS: 'Churrasqueiro chegou',
    COMPLETED: 'Finalizado',
  }
  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: status as any,
      ...(statusDetailMap[status] ? { statusDetail: statusDetailMap[status] } : {}),
    },
    include: {
      customer: true,
      grillmaster: { include: { user: { select: { name: true } } } },
    },
  })
  if (status === 'CONFIRMED') {
    sendPushToUser(
      updated.customerId,
      'Pedido confirmado!',
      `Seu churrasco foi confirmado para ${new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(updated.eventDate)}.`,
      `/orders/${updated.id}`
    ).catch(() => {})
  }
  if (status === 'COMPLETED' && updated.grillmasterId) {
    prisma.grillmaster.findUnique({ where: { id: updated.grillmasterId } }).then(gm => {
      if (gm) sendPushToUser(gm.userId, 'Pedido concluido!', 'Avalie o cliente para finalizar o pedido.', `/orders/${updated.id}/review-customer`).catch(() => {})
    }).catch(() => {})

    if (updated.paymentStatus === 'PAID') {
      const pts = Math.floor(updated.totalPrice / 10)
      if (pts > 0) {
        prisma.user.update({
          where: { id: updated.customerId },
          data: { points: { increment: pts } },
        }).catch(() => {})
      }
    }
  }
  if (status === 'CONFIRMED' && updated.customer.phone) {
    const gmName = updated.grillmaster?.user?.name ?? 'churrasqueiro'
    sendWhatsAppConfirmation(
      updated.customer.phone,
      updated.customer.name,
      updated.id,
      gmName,
      updated.eventDate
    ).catch(err => console.log('[WhatsApp] Erro:', err))
  }
  return updated
}

export async function cancelOrder(id: string, userId: string, role: string, reason: string) {
  let whereClause: Record<string, any>
  if (role === 'ADMIN') {
    whereClause = { id }
  } else if (role === 'GRILLMASTER') {
    const gm = await prisma.grillmaster.findUnique({ where: { userId } })
    if (!gm) throw new Error('Churrasqueiro nao encontrado')
    whereClause = { id, grillmasterId: gm.id }
  } else {
    whereClause = { id, customerId: userId }
  }

  const order = await prisma.order.findFirst({ where: whereClause })
  if (!order) throw new Error('Pedido nao encontrado')
  if (['IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(order.status)) {
    throw new Error('Nao e possivel cancelar um pedido em andamento, concluido ou ja cancelado')
  }

  let cancellationFee = 0
  if (order.status === 'CONFIRMED') {
    const hoursUntil = (order.eventDate.getTime() - Date.now()) / (1000 * 60 * 60)
    if (hoursUntil < 24) {
      cancellationFee = order.totalPrice * 0.5
    } else if (hoursUntil < 48) {
      cancellationFee = order.totalPrice * 0.3
    }
  }

  const refundAmount = order.paymentStatus === 'PAID' ? order.totalPrice - cancellationFee : null
  const cancelledBy = role === 'ADMIN' ? 'ADMIN' : role === 'GRILLMASTER' ? 'GRILLMASTER' : 'CUSTOMER'

  return prisma.order.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      cancelledBy,
      cancellationReason: reason || null,
      cancellationFee: cancellationFee > 0 ? cancellationFee : null,
      refundAmount: refundAmount !== null ? refundAmount : undefined,
    },
  })
}

export async function updateOrderLocation(id: string, lat: number, lng: number, userId: string) {
  const gm = await prisma.grillmaster.findUnique({ where: { userId } })
  if (!gm) throw new Error('Nao autorizado')
  const order = await prisma.order.findFirst({ where: { id, grillmasterId: gm.id } })
  if (!order) throw new Error('Pedido nao encontrado')
  return prisma.order.update({
    where: { id },
    data: { grillmasterLat: lat, grillmasterLng: lng, grillmasterLastUpdate: new Date() },
    select: { id: true, grillmasterLat: true, grillmasterLng: true, grillmasterLastUpdate: true },
  })
}

export async function generateShareToken(id: string, userId: string, role: string) {
  let whereClause: Record<string, any> = { id, customerId: userId }
  if (role === 'ADMIN') whereClause = { id }
  const order = await prisma.order.findFirst({ where: whereClause })
  if (!order) throw new Error('Pedido nao encontrado')
  if (order.publicShareToken) return { token: order.publicShareToken }
  const token = crypto.randomBytes(12).toString('hex')
  await prisma.order.update({ where: { id }, data: { publicShareToken: token } })
  return { token }
}

export async function getRepeatData(id: string, userId: string, role: string) {
  const whereClause = role === 'ADMIN' ? { id } : { id, customerId: userId }
  const order = await prisma.order.findFirst({
    where: whereClause,
    include: { items: { include: { product: { select: { id: true, available: true } } } } },
  })
  if (!order) throw new Error('Pedido nao encontrado')
  if (order.status !== 'COMPLETED') throw new Error('So e possivel repetir pedidos concluidos')
  const unavailableProductIds: string[] = []
  const items: { productId: string; quantity: number }[] = []
  for (const item of order.items) {
    if (!item.product || !item.product.available) {
      unavailableProductIds.push(item.productId)
    } else {
      items.push({ productId: item.productId, quantity: Number(item.quantity) })
    }
  }
  return {
    grillmasterId: order.grillmasterId,
    boutiqueId: order.boutiqueId,
    guestCount: order.guestCount,
    eventHours: order.eventHours,
    items,
    unavailableProductIds,
  }
}

export async function getOrderById(id: string, userId: string, role: string = 'CUSTOMER') {
  let whereClause: Record<string, any> = { id, customerId: userId }
  if (role === 'ADMIN') {
    whereClause = { id }
  } else if (role === 'GRILLMASTER') {
    const gm = await prisma.grillmaster.findUnique({ where: { userId } })
    if (!gm) throw new Error('Churrasqueiro nao encontrado')
    whereClause = { id, grillmasterId: gm.id }
  }
  const order = await prisma.order.findFirst({
    where: whereClause,
    include: {
      items: { include: { product: true } },
      grillmaster: { include: { user: true } },
      boutique: true,
      review: { select: { id: true, customerRating: true } },
      customer: { select: { id: true, name: true, averageRating: true } },
    },
  })
  if (!order) throw new Error('Pedido nao encontrado')
  return order
}
