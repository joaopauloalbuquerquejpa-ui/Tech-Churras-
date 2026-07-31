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
import helmet from '@fastify/helmet'
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
import { alphaRoutes } from './modules/alpha/alpha.routes'

dotenv.config()

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET não configurado. Defina a variável de ambiente antes de iniciar.')
  process.exit(1)
}
if (!process.env.MP_WEBHOOK_SECRET || !process.env.MP_ACCESS_TOKEN) {
  console.error('FATAL: MP_WEBHOOK_SECRET ou MP_ACCESS_TOKEN não configurados — pagamentos inoperantes.')
  process.exit(1)
}
if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL não configurado.')
  process.exit(1)
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('FATAL: ANTHROPIC_API_KEY não configurado — chat IA inoperante.')
  process.exit(1)
}
// Notificações: não derrubam o boot, mas sem elas WhatsApp/push/email viram no-op silencioso
// (email.service.ts já trata RESEND_API_KEY ausente com warn + return, sem crashar).
// Warn alto no startup para o deploy nunca subir "verde" com canal de notificação morto.
// RESEND_API_KEY era FATAL até 11/07/2026 — derrubou o site inteiro por 4 dias por causa
// só do email transacional. Rebaixado para warn: a plataforma inteira não pode ficar refém
// de um único canal de notificação secundário.
if (!process.env.RESEND_API_KEY) {
  console.warn('⚠️  AVISO: RESEND_API_KEY não configurado — emails transacionais desativados.')
}
if (!process.env.ZAPI_INSTANCE || !process.env.ZAPI_TOKEN) {
  console.warn('⚠️  AVISO: ZAPI_INSTANCE/ZAPI_TOKEN não configurados — TODAS as mensagens de WhatsApp estão desativadas.')
}
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.warn('⚠️  AVISO: VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY não configurados — Web Push desativado.')
}
if (!process.env.ADMIN_WHATSAPP_PHONE) {
  console.warn('⚠️  AVISO: ADMIN_WHATSAPP_PHONE não configurado — alertas de admin via WhatsApp desativados.')
}
if (!process.env.CRON_SECRET) {
  console.warn('⚠️  AVISO: CRON_SECRET não configurado — endpoints de cron rejeitarão todas as chamadas.')
}

const app = Fastify({ logger: true })

// Plugins
// API pura em JSON — desliga CSP do helmet (é pra paginas HTML, o frontend na Vercel
// ja tem o proprio CSP) e mantem so os headers que fazem sentido pra uma API:
// nosniff, HSTS, X-Frame-Options, sem referrer pra fora.
app.register(helmet, {
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
})
app.register(rateLimit, {
  global: true,
  max: 120,
  timeWindow: '1 minute',
  // F5: usa o ÚLTIMO IP do x-forwarded-for (adicionado pelo Railway, não spoofável)
  keyGenerator: (req) => {
    const forwarded = req.headers['x-forwarded-for'] as string | undefined
    if (forwarded) {
      const ips = forwarded.split(',').map(s => s.trim())
      return ips[ips.length - 1] || req.ip
    }
    return req.ip
  },
  errorResponseBuilder: () => ({ error: 'Muitas requisições. Tente novamente em alguns instantes.' }),
})
app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } })
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [
      'https://www.techchurras.com.br',
      'https://tech-churras.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001',
    ]

app.register(cors, {
  origin: (origin, cb) => {
    // Requisições sem origin (mobile apps, Postman, server-to-server) são permitidas
    if (!origin) return cb(null, true)
    if (ALLOWED_ORIGINS.includes(origin)) {
      return cb(null, true)
    }
    const err = new Error(`Origin não permitida: ${origin}`) as Error & { statusCode: number }
    err.statusCode = 403
    cb(err, false)
  },
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
app.register(alphaRoutes)

// Health check
app.get('/health', async () => {
  return { status: 'ok', message: 'Tech Churras API rodando! 🔥' }
})

// Sentry test — só funciona se SENTRY_DSN estiver configurado
app.get('/sentry-test', async () => {
  Sentry.captureException(new Error('Sentry test — Tech Churras backend OK'))
  return { ok: true, message: 'Evento enviado ao Sentry. Verifique o dashboard.' }
})

// Erros 4xx (CORS negado, validação, rate limit) voltam com o próprio status e
// não vão ao Sentry — só 5xx inesperado é incidente
app.setErrorHandler((error: Error & { statusCode?: number }, _request, reply) => {
  const statusCode = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500
  if (statusCode >= 500) {
    Sentry.captureException(error)
    return reply.status(statusCode).send({ error: 'Erro interno do servidor' })
  }
  reply.status(statusCode).send({ error: error.message })
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
