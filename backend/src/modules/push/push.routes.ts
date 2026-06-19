import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../config/prisma'

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
})
const unsubscribeSchema = z.object({ endpoint: z.string().url() })

export async function pushRoutes(app: FastifyInstance) {
  app.get('/push/vapid-public-key', async (_req, reply) => {
    return reply.send({ publicKey: process.env.VAPID_PUBLIC_KEY ?? '' })
  })

  app.post('/push/subscribe', { preHandler: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (req.user as any).id
      const { endpoint, keys } = subscribeSchema.parse(req.body)
      await prisma.pushSubscription.upsert({
        where: { endpoint },
        create: { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
        update: { userId, p256dh: keys.p256dh, auth: keys.auth },
      })
      return reply.send({ ok: true })
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.post('/push/unsubscribe', { preHandler: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { endpoint } = unsubscribeSchema.parse(req.body)
      await prisma.pushSubscription.deleteMany({ where: { endpoint } })
      return reply.send({ ok: true })
    } catch {
      return reply.send({ ok: true })
    }
  })
}
