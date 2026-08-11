import { prisma } from '../../config/prisma'

// Backoff: 1min, 5min, 15min, 30min, 1h — depois disso marca FAILED e para de tentar.
const BACKOFF_MS = [60_000, 5 * 60_000, 15 * 60_000, 30 * 60_000, 60 * 60_000]

export async function enqueueNotificationRetry(type: string, payload: Record<string, unknown>, error?: string) {
  await prisma.notificationRetry.create({
    data: {
      type,
      payload: payload as any,
      lastError: error?.slice(0, 500),
      nextAttemptAt: new Date(Date.now() + BACKOFF_MS[0]),
    },
  }).catch(() => {}) // enfileirar nunca pode derrubar quem chamou
}

async function dispatch(type: string, payload: any): Promise<void> {
  const { sendWhatsAppToAdminRaw, sendPushToUserRaw } = await import('../push/push.service')
  switch (type) {
    case 'whatsapp_admin':
      return sendWhatsAppToAdminRaw(payload.message)
    case 'push_user':
      return sendPushToUserRaw(payload.userId, payload.title, payload.body, payload.url)
    case 'ebook_email': {
      const { emailEbookDelivered } = await import('../email/email.service')
      const ok = await emailEbookDelivered(payload.to, payload.name, payload.downloadUrl)
      if (!ok) throw new Error('Reenvio de email do e-book falhou')
      return
    }
    default:
      throw new Error(`Tipo de retry desconhecido: ${type}`)
  }
}

export async function processNotificationRetries() {
  const due = await prisma.notificationRetry.findMany({
    where: { status: 'PENDING', nextAttemptAt: { lte: new Date() } },
    take: 50,
    orderBy: { nextAttemptAt: 'asc' },
  })

  let sent = 0
  let failed = 0

  for (const item of due) {
    try {
      await dispatch(item.type, item.payload)
      await prisma.notificationRetry.update({ where: { id: item.id }, data: { status: 'SENT' } })
      sent++
    } catch (err: any) {
      const attempts = item.attempts + 1
      const exhausted = attempts >= item.maxAttempts
      await prisma.notificationRetry.update({
        where: { id: item.id },
        data: {
          attempts,
          lastError: (err?.message ?? 'erro desconhecido').slice(0, 500),
          status: exhausted ? 'FAILED' : 'PENDING',
          nextAttemptAt: new Date(Date.now() + BACKOFF_MS[Math.min(attempts, BACKOFF_MS.length - 1)]),
        },
      })
      if (exhausted) failed++
    }
  }

  return { processed: due.length, sent, failed }
}
