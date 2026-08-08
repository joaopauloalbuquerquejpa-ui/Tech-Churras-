import { FastifyInstance } from 'fastify'
import { ebookCheckoutHandler, ebookWebhookHandler, ebookDownloadHandler } from './ebook.controller'

export async function ebookRoutes(app: FastifyInstance) {
  app.post('/ebook/checkout', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, ebookCheckoutHandler)
  app.post('/ebook/webhook', ebookWebhookHandler)
  app.get('/ebook/download/:token', ebookDownloadHandler)
}
