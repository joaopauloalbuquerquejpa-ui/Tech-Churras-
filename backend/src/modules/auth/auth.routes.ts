import { FastifyInstance } from 'fastify'
import { register, login } from './auth.controller'

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', register)
  app.post('/auth/login', login)
}