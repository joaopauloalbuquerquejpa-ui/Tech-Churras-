import { FastifyInstance } from 'fastify'
import {
  createPaymentIntentHandler,
  stripeWebhookHandler,
} from './payments.controller'

export async function paymentsRoutes(app: FastifyInstance) {
  // Webhook do Stripe (sem autenticação JWT)
  app.post('/payments/webhook', stripeWebhookHandler)

  // Autenticado
  app.post('/payments/:orderId', { preHandler: [app.authenticate] }, createPaymentIntentHandler)
}