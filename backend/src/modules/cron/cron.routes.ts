import { FastifyInstance } from 'fastify'
import { prisma } from '../../config/prisma'
import { sendPushToUser } from '../push/push.service'
import { sendFollowUps } from '../webhooks/whatsapp.routes'
import { sendDailySummary } from '../admin/admin.service'
import { fetchWithTimeout } from '../../utils/http'
import { processNotificationRetries } from '../notifications/retry-queue.service'
import { processDispatchEscalations } from '../grillmasters/dispatch.service'
import { safeCompare } from '../../utils/safeCompare'
import { maskPhone } from '../../utils/maskPii'

// Dead-man's-switch: avisa se o cron-job.org parar de chamar essa rota (já aconteceu antes, sem alerta).
// HEALTHCHECKS_PING_URL vem de https://healthchecks.io — sem a env var configurada, é só um no-op.
function pingHeartbeat(suffix: '' | '/fail' = '') {
  const url = process.env.HEALTHCHECKS_PING_URL
  if (!url) return
  fetchWithTimeout(`${url}${suffix}`, { method: 'GET' }).catch(() => {})
}

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
    const res = await fetchWithTimeout(
      `https://api.z-api.io/instances/${instance}/token/${token}/send-text`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, message }),
      }
    )
    if (!res.ok) console.log('[Reminder WhatsApp] Erro:', res.status, await res.text())
    else console.log('[Reminder WhatsApp] Enviado para', maskPhone(cleanPhone))
  } catch (err) {
    console.log('[Reminder WhatsApp] Falha:', err)
  }
}

export async function cronRoutes(app: FastifyInstance) {
  app.get('/cron/event-reminders', async (req, reply) => {
    if (!safeCompare(req.headers['x-cron-secret'] as string | undefined, process.env.CRON_SECRET)) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }

    const now = new Date()

    const window48start = new Date(now.getTime() + 47 * 60 * 60 * 1000)
    const window48end   = new Date(now.getTime() + 49 * 60 * 60 * 1000)
    const window24start = new Date(now.getTime() + 23 * 60 * 60 * 1000)
    const window24end   = new Date(now.getTime() + 25 * 60 * 60 * 1000)

    try {
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
        reminderGm24hSent: false,
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
        ).catch((e) => console.error("[notif]", e?.message))
        await prisma.order.update({ where: { id: order.id }, data: { reminderGm24hSent: true } })
        sentGm24++
      }
    }

    // Follow-ups automáticos para leads captados via WhatsApp
    await sendFollowUps().catch((e) => console.error('[FollowUp]', e?.message))

    // Pedidos PENDING sem pagamento há 7+ dias são checkout abandonado — cancela
    // para não inflar métricas nem ficar elegível a lembrete/repasse para sempre.
    // Se o pagamento chegar depois, o webhook do MP já alerta o admin para estorno
    // manual (não reativa pedido cancelado).
    const expirationCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const expired = await prisma.order.updateMany({
      where: {
        status: 'PENDING',
        OR: [{ paymentStatus: null }, { paymentStatus: { not: 'PAID' } }],
        createdAt: { lt: expirationCutoff },
      },
      data: { status: 'CANCELLED', statusDetail: 'Expirado: pagamento não concluído em 7 dias' },
    })
    if (expired.count > 0) console.log(`[cron] ${expired.count} pedido(s) PENDING expirados e cancelados`)

    pingHeartbeat()
    return { ok: true, sent48, sent24, sentGm24, expired: expired.count }
    } catch (err: any) {
      req.log.error('[cron/event-reminders] erro:', err?.message)
      pingHeartbeat('/fail')
      return reply.status(500).send({ error: 'Erro interno no cron de reminders' })
    }
  })

  // ── Resumo diário às 9h para o fundador (Feature 1)
  app.get('/cron/daily-summary', async (req, reply) => {
    if (!safeCompare(req.headers['x-cron-secret'] as string | undefined, process.env.CRON_SECRET)) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }
    await sendDailySummary()
    return { ok: true }
  })

  // ── Reprocessa WhatsApp/push que falharam na primeira tentativa (backoff 1min-1h)
  app.get('/cron/notification-retries', async (req, reply) => {
    if (!safeCompare(req.headers['x-cron-secret'] as string | undefined, process.env.CRON_SECRET)) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }
    try {
      const result = await processNotificationRetries()
      return { ok: true, ...result }
    } catch (err: any) {
      req.log.error('[cron/notification-retries] erro:', err?.message)
      return reply.status(500).send({ error: 'Erro interno no cron de retries' })
    }
  })

  // ── Escala pedidos sem churrasqueiro pra próxima onda de despacho (timeout)
  // Rodar a cada 5-15min no cron-job.org — é orientado a evento (dispatchDeadline),
  // não precisa granularidade de minuto, mas precisa ser bem mais frequente que
  // os cron de hora em hora já existentes.
  app.get('/cron/dispatch-escalation', async (req, reply) => {
    if (!safeCompare(req.headers['x-cron-secret'] as string | undefined, process.env.CRON_SECRET)) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }
    try {
      const result = await processDispatchEscalations()
      return { ok: true, ...result }
    } catch (err: any) {
      req.log.error('[cron/dispatch-escalation] erro:', err?.message)
      return reply.status(500).send({ error: 'Erro interno no cron de escalação de despacho' })
    }
  })
}