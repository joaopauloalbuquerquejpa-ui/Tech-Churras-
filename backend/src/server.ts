import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import dotenv from 'dotenv'
import { authRoutes } from './modules/auth/auth.routes'
import { grillmastersRoutes } from './modules/grillmasters/grillmasters.routes'
import { boutiqueRoutes } from './modules/boutiques/boutiques.routes'
import { authenticate } from './middlewares/auth.middleware'
import { ordersRoutes } from './modules/orders/orders.routes'
import { paymentsRoutes } from './modules/payments/payments.routes'
import { adminRoutes } from './modules/admin/admin.routes'

dotenv.config()

const app = Fastify({ logger: true })

// Plugins
app.register(cors, { origin: true, credentials: true })
app.register(jwt, { secret: process.env.JWT_SECRET ?? 'supersecret' })
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

// Health check
app.get('/health', async () => {
  return { status: 'ok', message: 'Tech Churras API rodando! ðŸ”¥' }
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
