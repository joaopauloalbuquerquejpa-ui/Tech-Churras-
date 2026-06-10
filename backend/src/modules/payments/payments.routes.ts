import { FastifyInstance } from 'fastify'
import { createPreferenceHandler, mpWebhookHandler } from './payments.controller'

export async function paymentsRoutes(app: FastifyInstance) {
  app.post('/payments/webhook', mpWebhookHandler)
  app.post('/payments/create-preference', { preHandler: [app.authenticate] }, createPreferenceHandler)
}
