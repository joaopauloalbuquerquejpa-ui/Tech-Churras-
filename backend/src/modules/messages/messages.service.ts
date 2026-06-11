import { prisma } from '../../config/prisma'

export async function getMessages(orderId: string, userId: string) {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      OR: [
        { customerId: userId },
        { grillmaster: { userId } },
      ],
    },
  })
  if (!order) throw new Error('Pedido nao encontrado ou acesso negado')
  return (prisma as any).message.findMany({
    where: { orderId },
    include: { sender: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: 'asc' },
  })
}

export async function sendMessage(orderId: string, senderId: string, content: string) {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      OR: [
        { customerId: senderId },
        { grillmaster: { userId: senderId } },
      ],
    },
  })
  if (!order) throw new Error('Pedido nao encontrado ou acesso negado')
  return (prisma as any).message.create({
    data: { orderId, senderId, content },
    include: { sender: { select: { id: true, name: true, role: true } } },
  })
}

export async function markMessagesRead(orderId: string, userId: string) {
  await (prisma as any).message.updateMany({
    where: { orderId, senderId: { not: userId }, read: false },
    data: { read: true },
  })
}
