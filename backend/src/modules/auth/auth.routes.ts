import { FastifyInstance } from 'fastify'
import { register, login } from './auth.controller'
import { markOnboardingCompleted } from './auth.service'
import { authenticate } from '../../middlewares/auth.middleware'

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', register)
  app.post('/auth/login', login)
  app.patch('/auth/onboarding-completed', { preHandler: [authenticate] }, async (req, reply) => {
    try {
      await markOnboardingCompleted((req.user as any).id)
      return reply.send({ ok: true })
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })
}