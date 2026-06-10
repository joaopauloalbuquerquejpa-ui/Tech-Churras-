import { prisma } from '../../config/prisma'
import { z } from 'zod'

export const createOrderSchema = z.object({
  grillmasterId: z.string().optional(),
  boutiqueId: z.string().optional(),
  eventDate: z.string().transform(s => new Date(s)),
  eventAddress: z.string().min(5),
  eventHours: z.number().int().min(1).default(4),
  guestCount: z.number().int().min(1),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().positive(),
  })).optional(),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>

export async function createOrder(customerId: string, data: CreateOrderInput) {
  const { items, ...orderData } = data

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
  const totalPrice = itemsTotal + grillmasterCost

  return prisma.order.create({
    data: {
      customerId,
      ...orderData,
      totalPrice,
      items: itemsWithPrice.length > 0 ? { create: itemsWithPrice } : undefined,
    },
    include: { items: true, grillmaster: { include: { user: true } }, boutique: true },
  })
}

export async function listOrders(customerId: string) {
  return prisma.order.findMany({
    where: { customerId },
    include: {
      items: { include: { product: true } },
      grillmaster: { include: { user: true } },
      boutique: true,
      review: { select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
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

export async function updateOrderStatus(id: string, status: string) {
  const updated = await prisma.order.update({
    where: { id },
    data: { status: status as any },
    include: {
      customer: true,
      grillmaster: { include: { user: { select: { name: true } } } },
    },
  })
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

export async function getOrderById(id: string, customerId: string) {
  const order = await prisma.order.findFirst({
    where: { id, customerId },
    include: {
      items: { include: { product: true } },
      grillmaster: { include: { user: true } },
      boutique: true,
      review: { select: { id: true } },
    },
  })
  if (!order) throw new Error('Pedido nao encontrado')
  return order
}
