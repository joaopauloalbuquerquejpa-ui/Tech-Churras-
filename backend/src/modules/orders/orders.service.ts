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
    unitPrice: z.number().positive(),
  })).optional(),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>

export async function createOrder(customerId: string, data: CreateOrderInput) {
  const { items, ...orderData } = data
  const itemsTotal = items?.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0) ?? 0
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
      items: items ? { create: items } : undefined,
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
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function updateOrderStatus(id: string, status: string) {
  return prisma.order.update({
    where: { id },
    data: { status: status as any },
  })
}

export async function getOrderById(id: string, customerId: string) {
  const order = await prisma.order.findFirst({
    where: { id, customerId },
    include: {
      items: { include: { product: true } },
      grillmaster: { include: { user: true } },
      boutique: true,
    },
  })
  if (!order) throw new Error('Pedido nao encontrado')
  return order
}
