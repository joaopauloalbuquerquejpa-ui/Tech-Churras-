import webpush from 'web-push'
import { prisma } from '../../config/prisma'

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:contato@techchurras.com.br',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
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
