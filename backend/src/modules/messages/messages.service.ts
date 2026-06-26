import { prisma } from '../../config/prisma'
import { sendPushToUser } from '../push/push.service'

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
  return prisma.message.findMany({
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
  const msg = await prisma.message.create({
    data: { orderId, senderId, content },
    include: { sender: { select: { id: true, name: true, role: true } } },
  })
  // Notify recipient
  const recipientId = order.customerId === senderId
    ? null // need grillmaster userId
    : order.customerId
  if (recipientId) {
    sendPushToUser(recipientId, 'Nova mensagem', msg.sender.name + ': ' + content.slice(0, 60), `/orders/${orderId}`).catch((e) => console.error("[notif]", e?.message))
  } else if (order.grillmasterId) {
    prisma.grillmaster.findUnique({ where: { id: order.grillmasterId } }).then(gm => {
      if (gm) sendPushToUser(gm.userId, 'Nova mensagem', msg.sender.name + ': ' + content.slice(0, 60), `/orders/${orderId}`).catch((e) => console.error("[notif]", e?.message))
    }).catch((e) => console.error("[notif]", e?.message))
  }
  return msg
}

export async function markMessagesRead(orderId: string, userId: string) {
  await prisma.message.updateMany({
    where: { orderId, senderId: { not: userId }, read: false },
    data: { read: true },
  })
}