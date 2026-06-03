import { prisma } from '../../config/prisma'
import { z } from 'zod'

export const createOrderSchema = z.object({
  grillmasterId: z.string().optional(),
  boutiqueId: z.string().optional(),
  eventDate: z.string().transform(s => new Date(s)),
  eventAddress: z.string().min(5),
  guestCount: z.number().int().positive(),
  totalPrice: z.number().positive(),
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

  return prisma.order.create({
    data: {
      customerId,
      ...orderData,
      items: items ? {
        create: items,
      } : undefined,
    },
    include: {
      grillmaster: { include: { user: { select: { name: true } } } },
      boutique: true,
      items: { include: { product: true } },
    },
  })
}

export async function listOrders(customerId: string) {
  return prisma.order.findMany({
    where: { customerId },
    include: {
      grillmaster: { include: { user: { select: { name: true } } } },
      boutique: true,
      items: { include: { product: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getOrderById(id: string, customerId: string) {
  const order = await prisma.order.findFirst({
    where: { id, customerId },
    include: {
      grillmaster: { include: { user: { select: { name: true, phone: true } } } },
      boutique: true,
      items: { include: { product: true } },
    },
  })
  if (!order) throw new Error('Pedido não encontrado')
  return order
}

export async function updateOrderStatus(id: string, status: string) {
  return prisma.order.update({
    where: { id },
    data: { status: status as any },
  })
}