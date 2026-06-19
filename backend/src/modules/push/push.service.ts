import webpush from 'web-push'
import { prisma } from '../../config/prisma'
import { Role } from '@prisma/client'

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:techchurras@gmail.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export async function sendWhatsAppToAdmin(message: string): Promise<void> {
  const phone = process.env.ADMIN_WHATSAPP_PHONE
  const instance = process.env.ZAPI_INSTANCE
  const token = process.env.ZAPI_TOKEN
  if (!phone || !instance || !token) return
  const clean = phone.replace(/\D/g, '')
  try {
    const res = await fetch(
      `https://api.z-api.io/instances/${instance}/token/${token}/send-text`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: clean, message }) }
    )
    if (!res.ok) console.log('[WhatsApp admin] erro:', res.status)
  } catch {}
}

export async function sendPushToRole(role: Role, title: string, body: string, url = '/admin') {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return
  const users = await prisma.user.findMany({ where: { role }, select: { id: true } })
  await Promise.all(users.map(u => sendPushToUser(u.id, title, body, url).catch((e) => console.error("[notif]", e?.message))))
}

export async function sendPushToUser(userId: string, title: string, body: string, url = '/orders') {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return
  const subs = await prisma.pushSubscription.findMany({ where: { userId } })
  if (!subs.length) return
  const stale: string[] = []
  await Promise.all(subs.map(sub =>
    webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify({ title, body, url })
    ).catch((err: any) => {
      if (err.statusCode === 410 || err.statusCode === 404) stale.push(sub.id)
    })
  ))
  if (stale.length) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: stale } } })
  }
}