import { FastifyRequest, FastifyReply } from 'fastify'
import {
  createPaymentIntent,
  handleStripeWebhook,
} from './payments.service'

export async function createPaymentIntentHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const customerId = (req.user as any).id
    const { orderId } = req.params as { orderId: string }
    const result = await createPaymentIntent(orderId, customerId)
    return reply.status(201).send(result)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function stripeWebhookHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const signature = req.headers['stripe-signature'] as string
    const payload = req.rawBody as Buffer
    const result = await handleStripeWebhook(payload, signature)
    return reply.send(result)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}