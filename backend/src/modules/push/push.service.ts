import webpush from 'web-push'
import { prisma } from '../../config/prisma'
import { Role } from '@prisma/client'
import { fetchWithTimeout } from '../../utils/http'
import { enqueueNotificationRetry } from '../notifications/retry-queue.service'

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:techchurras@gmail.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

// Variante "raw": lanca excecao em falha, sem engolir erro. Usada tanto pela
// chamada original quanto pelo processador da fila de retry — mesma logica,
// uma unica fonte de verdade. Fonte única de envio de WhatsApp do projeto —
// antes existiam 5 cópias quase idênticas espalhadas por outros módulos,
// cada uma com resiliência diferente (a maioria sem retry nenhum).
export async function sendWhatsAppRaw(phone: string, message: string): Promise<void> {
  const instance = process.env.ZAPI_INSTANCE
  const token = process.env.ZAPI_TOKEN
  if (!instance || !token) return
  const clean = phone.replace(/\D/g, '')
  const res = await fetchWithTimeout(
    `https://api.z-api.io/instances/${instance}/token/${token}/send-text`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: clean, message }) }
  )
  if (!res.ok) throw new Error(`Z-API respondeu ${res.status}`)
}

// Variante "segura": nunca lanca — se falhar na hora, enfileira retry com backoff
// em vez de so logar e esquecer (era o comportamento antigo).
export async function sendWhatsApp(phone: string, message: string, label = 'whatsapp'): Promise<void> {
  try {
    await sendWhatsAppRaw(phone, message)
  } catch (err: any) {
    console.log(`[WhatsApp] ${label} erro, enfileirando retry:`, err?.message)
    await enqueueNotificationRetry('whatsapp_generic', { phone, message }, err?.message)
  }
}

export async function sendWhatsAppToAdminRaw(message: string): Promise<void> {
  const phone = process.env.ADMIN_WHATSAPP_PHONE
  if (!phone) return
  return sendWhatsAppRaw(phone, message)
}

// Variante "segura": nunca lanca — se falhar na hora, enfileira retry com backoff
// em vez de so logar e esquecer (era o comportamento antigo).
export async function sendWhatsAppToAdmin(message: string): Promise<void> {
  try {
    await sendWhatsAppToAdminRaw(message)
  } catch (err: any) {
    console.log('[WhatsApp admin] erro, enfileirando retry:', err?.message)
    await enqueueNotificationRetry('whatsapp_admin', { message }, err?.message)
  }
}

export async function sendPushToRole(role: Role, title: string, body: string, url = '/admin') {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return
  const users = await prisma.user.findMany({ where: { role }, select: { id: true } })
  await Promise.all(users.map(u => sendPushToUser(u.id, title, body, url).catch((e) => console.error("[notif]", e?.message))))
}

export async function sendPushToUserRaw(userId: string, title: string, body: string, url = '/orders'): Promise<void> {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return
  const subs = await prisma.pushSubscription.findMany({ where: { userId } })
  if (!subs.length) return
  const stale: string[] = []
  const failures: unknown[] = []
  await Promise.all(subs.map(sub =>
    webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify({ title, body, url })
    ).catch((err: any) => {
      if (err.statusCode === 410 || err.statusCode === 404) stale.push(sub.id)
      else failures.push(err)
    })
  ))
  if (stale.length) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: stale } } })
  }
  // Falha real (rede, servidor push fora do ar) — diferente de subscription morta —
  // deve propagar pra quem chamou decidir se enfileira retry.
  if (failures.length > 0 && failures.length === subs.length - stale.length) {
    throw new Error(`Falha ao enviar push pra ${failures.length} subscription(s)`)
  }
}

export async function sendPushToUser(userId: string, title: string, body: string, url = '/orders'): Promise<void> {
  try {
    await sendPushToUserRaw(userId, title, body, url)
  } catch (err: any) {
    console.log('[Push] erro, enfileirando retry:', err?.message)
    await enqueueNotificationRetry('push_user', { userId, title, body, url }, err?.message)
  }
}