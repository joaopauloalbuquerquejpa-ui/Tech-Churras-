import { FastifyInstance } from 'fastify'
import { prisma } from '../../config/prisma'
import { sendPushToUser } from '../push/push.service'

async function sendWhatsAppReminder(phone: string, customerName: string, orderId: string, eventDate: Date, hoursLabel: string) {
  const instance = process.env.ZAPI_INSTANCE
  const token = process.env.ZAPI_TOKEN
  if (!instance || !token) return
  const cleanPhone = phone.replace(/\D/g, '')
  const date = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(eventDate)
  const message = `🔥 Lembrete Tech Churras! Olá ${customerName}, seu churrasco está agendado para daqui a ${hoursLabel} — ${date}. Acompanhe: https://www.techchurras.com.br/orders/${orderId}`
  try {
    const res = await fetch(
      `https://api.z-api.io/instances/${instance}/token/${token}/send-text`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, message }),
      }
    )
    if (!res.ok) console.log('[Reminder WhatsApp] Erro:', res.status, await res.text())
    else console.log('[Reminder WhatsApp] Enviado para', cleanPhone)
  } catch (err) {
    console.log('[Reminder WhatsApp] Falha:', err)
  }
}

export async function cronRoutes(app: FastifyInstance) {
  app.get('/cron/event-reminders', async (req, reply) => {
    if (req.headers['x-cron-secret'] !== process.env.CRON_SECRET) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }

    const now = new Date()

    const window48start = new Date(now.getTime() + 47 * 60 * 60 * 1000)
    const window48end   = new Date(now.getTime() + 49 * 60 * 60 * 1000)
    const window24start = new Date(now.getTime() + 23 * 60 * 60 * 1000)
    const window24end   = new Date(now.getTime() + 25 * 60 * 60 * 1000)

    const [orders48, orders24] = await Promise.all([
      prisma.order.findMany({
        where: {
          status: 'CONFIRMED',
          reminder48hSent: false,
          eventDate: { gte: window48start, lte: window48end },
        },
        include: { customer: true },
      }),
      prisma.order.findMany({
        where: {
          status: 'CONFIRMED',
          reminder24hSent: false,
          eventDate: { gte: window24start, lte: window24end },
        },
        include: { customer: true },
      }),
    ])

    let sent48 = 0
    let sent24 = 0

    for (const order of orders48) {
      if (order.customer.phone) {
        await sendWhatsAppReminder(order.customer.phone, order.customer.name, order.id, order.eventDate, '48 horas')
      }
      await prisma.order.update({ where: { id: order.id }, data: { reminder48hSent: true } })
      sent48++
    }

    for (const order of orders24) {
      if (order.customer.phone) {
        await sendWhatsAppReminder(order.customer.phone, order.customer.name, order.id, order.eventDate, '24 horas')
      }
      await prisma.order.update({ where: { id: order.id }, data: { reminder24hSent: true } })
      sent24++
    }

    // Push para churrasqueiros com evento em 24h
    const gmReminder24 = await prisma.order.findMany({
      where: {
        status: 'CONFIRMED',
        eventDate: { gte: window24start, lte: window24end },
        grillmasterId: { not: null },
      },
      include: { grillmaster: { select: { userId: true } }, customer: { select: { name: true } } },
    })
    let sentGm24 = 0
    for (const order of gmReminder24) {
      if (order.grillmaster?.userId) {
        const date = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(order.eventDate)
        await sendPushToUser(
          order.grillmaster.userId,
          '⏰ Evento amanhã!',
          `Você tem churrasco com ${order.customer.name} amanhã às ${date.split(' ')[1]}. Prepare tudo!`,
          '/grillmasters/dashboard'
        ).catch(() => {})
        sentGm24++
      }
    }

    return { ok: true, sent48, sent24, sentGm24 }
  })
}
