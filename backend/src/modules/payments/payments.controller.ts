import { FastifyRequest, FastifyReply } from 'fastify'
import { createPreference, handleMPWebhook } from './payments.service'

export async function createPreferenceHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const customerId = (req.user as any).id
    const { orderId } = req.body as { orderId: string }
    const result = await createPreference(orderId, customerId)
    return reply.status(201).send(result)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function mpWebhookHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const result = await handleMPWebhook(req.body)
    return reply.send(result)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}
