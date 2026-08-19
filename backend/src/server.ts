import * as Sentry from '@sentry/node'

// Redige segredo de URL antes de qualquer breadcrumb/evento sair pro Sentry.
// A API do Z-API (WhatsApp) exige o token da instância no PATH da URL, não
// num header — é o contrato deles, não uma escolha nossa (~9 call sites).
// Sem isso, qualquer erro que aconteça no mesmo request de uma chamada ao
// Z-API (ex: falha do Prisma no webhook de pagamento) anexa a URL completa
// com o token em texto puro ao evento — vazamento de credencial pra quem
// tiver acesso ao projeto Sentry.
function redactSecretUrl(url: string | undefined): string | undefined {
  if (!url) return url
  return url.replace(/\/token\/[^/]+/i, '/token/[REDACTED]')
}

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV ?? 'production',
  tracesSampleRate: 0.2,
  enabled: !!process.env.SENTRY_DSN,
  beforeBreadcrumb(breadcrumb) {
    if (breadcrumb.data?.url) breadcrumb.data.url = redactSecretUrl(breadcrumb.data.url)
    return breadcrumb
  },
  beforeSend(event) {
    if (event.request?.url) event.request.url = redactSecretUrl(event.request.url)
    for (const span of event.spans ?? []) {
      if (span.description) span.description = redactSecretUrl(span.description)
    }
    return event
  },
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
import { ebookRoutes } from './modules/ebook/ebook.routes'

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
// Notificações e IA: não derrubam o boot, mas sem elas os recursos dependentes viram
// no-op silencioso ou erro isolado naquele endpoint específico, sem afetar pedido/pagamento.
// Warn alto no startup para o deploy nunca subir "verde" com um desses ausente.
// RESEND_API_KEY e ANTHROPIC_API_KEY eram FATAL — cada uma já derrubou o site inteiro por
// causa de um recurso secundário (email transacional, chat IA). Rebaixadas para warn: a
// plataforma inteira não pode ficar refém de uma chave de terceiro que pode expirar/ter rate
// limit a qualquer momento.
if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('⚠️  AVISO: ANTHROPIC_API_KEY não configurado — chat IA, bio de GM e bot de WhatsApp com IA desativados.')
}
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
app.register(ebookRoutes)

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
