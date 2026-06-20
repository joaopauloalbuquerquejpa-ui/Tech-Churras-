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
    // MP pode enviar type/data.id no body OU nos query params dependendo da versão
    const query = req.query as Record<string, string>
    const body = (req.body as any) ?? {}
    const payload = {
      type: body.type ?? query['type'],
      data: {
        id: body.data?.id ?? query['data.id'] ?? query['id'],
      },
    }
    const result = await handleMPWebhook(payload)
    return reply.send(result)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}
