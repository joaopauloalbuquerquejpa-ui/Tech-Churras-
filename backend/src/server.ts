import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV ?? 'production',
  tracesSampleRate: 0.2,
  enabled: !!process.env.SENTRY_DSN,
})

import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import dotenv from 'dotenv'
import { authRoutes } from './modules/auth/auth.routes'
import { grillmastersRoutes } from './modules/grillmasters/grillmasters.routes'
import { boutiqueRoutes } from './modules/boutiques/boutiques.routes'
import { authenticate } from './middlewares/auth.middleware'
import { ordersRoutes } from './modules/orders/orders.routes'
import { paymentsRoutes } from './modules/payments/payments.routes'
import { adminRoutes } from './modules/admin/admin.routes'
import { reviewsRoutes } from './modules/reviews/reviews.routes'
import { favoritesRoutes } from './modules/favorites/favorites.routes'
import { couponsRoutes } from './modules/coupons/coupons.routes'
import { messagesRoutes } from './modules/messages/messages.routes'
import { pushRoutes } from './modules/push/push.routes'
import { addressesRoutes } from './modules/addresses/addresses.routes'
import { cronRoutes } from './modules/cron/cron.routes'
import { pointsRoutes } from './modules/points/points.routes'
import { publicRoutes } from './modules/public/public.routes'
import { uploadRoutes } from './modules/upload/upload.routes'
import { calculatorRoutes } from './modules/calculator/calculator.routes'
import { aiRoutes } from './modules/ai/ai.routes'
import { contractsRoutes } from './modules/contracts/contracts.routes'
import { whatsappWebhookRoutes } from './modules/webhooks/whatsapp.routes'

dotenv.config()

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET não configurado. Defina a variável de ambiente antes de iniciar.')
  process.exit(1)
}

const app = Fastify({ logger: true })

// Plugins
app.register(rateLimit, {
  global: true,
  max: 120,
  timeWindow: '1 minute',
  errorResponseBuilder: () => ({ error: 'Muitas requisições. Tente novamente em alguns instantes.' }),
})
app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } })
app.register(cors, {
  origin: true,
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})
app.register(jwt, { secret: process.env.JWT_SECRET! })
app.register(cookie)

// Decorator de autenticaÃ§Ã£o
app.decorate('authenticate', authenticate)

// Rotas
app.register(authRoutes)
app.register(boutiqueRoutes)
app.register(ordersRoutes)
app.register(paymentsRoutes)
app.register(adminRoutes)
app.register(grillmastersRoutes)
app.register(reviewsRoutes)
app.register(favoritesRoutes)
app.register(couponsRoutes)
app.register(messagesRoutes)
app.register(pushRoutes)
app.register(addressesRoutes)
app.register(cronRoutes)
app.register(pointsRoutes)
app.register(publicRoutes)
app.register(uploadRoutes)
app.register(calculatorRoutes)
app.register(aiRoutes)
app.register(contractsRoutes)
app.register(whatsappWebhookRoutes)

// Health check
app.get('/health', async () => {
  return { status: 'ok', message: 'Tech Churras API rodando! 🔥' }
})

// Sentry test — só funciona se SENTRY_DSN estiver configurado
app.get('/sentry-test', async () => {
  Sentry.captureException(new Error('Sentry test — Tech Churras backend OK'))
  return { ok: true, message: 'Evento enviado ao Sentry. Verifique o dashboard.' }
})

// Captura erros não tratados no Fastify e envia para o Sentry
app.setErrorHandler((error, _request, reply) => {
  Sentry.captureException(error)
  reply.status(500).send({ error: 'Erro interno do servidor' })
})

const start = async () => {
  try {
    await app.listen({ port: 3333, host: '0.0.0.0' })
    console.log('ðŸš€ Servidor rodando em http://localhost:3333')
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
