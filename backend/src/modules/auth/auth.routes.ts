import { FastifyInstance } from 'fastify'
import { register, login } from './auth.controller'
import { markOnboardingCompleted, updateUserProfile, registerGuest, deleteAccount } from './auth.service'
import { authenticate } from '../../middlewares/auth.middleware'
import { prisma } from '../../config/prisma'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { emailPasswordReset } from '../email/email.service'

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, register)
  app.post('/auth/login', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, login)

  app.post('/auth/guest', { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, async (req, reply) => {
    try {
      const { name, phone } = req.body as { name: string; phone: string }
      if (!name || name.trim().length < 2) return reply.status(400).send({ error: 'Nome obrigatório (mínimo 2 caracteres)' })
      if (!phone || phone.trim().length < 10) return reply.status(400).send({ error: 'WhatsApp obrigatório' })
      const user = await registerGuest({ name, phone })
      const token = await reply.jwtSign({ id: user.id, role: user.role })
      return reply.status(201).send({ user, token })
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })
  app.patch('/auth/onboarding-completed', { preHandler: [authenticate] }, async (req, reply) => {
    try {
      await markOnboardingCompleted((req.user as any).id)
      return reply.send({ ok: true })
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.get('/auth/me', { preHandler: [authenticate] }, async (req, reply) => {
    try {
      const { prisma } = await import('../../config/prisma')
      const user = await prisma.user.findUnique({
        where: { id: (req.user as any).id },
        select: { id: true, name: true, email: true, phone: true, role: true, points: true, averageRating: true, createdAt: true },
      })
      if (!user) return reply.status(404).send({ error: 'Usuário não encontrado' })
      return reply.send(user)
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.patch('/auth/profile', { preHandler: [authenticate] }, async (req, reply) => {
    try {
      const { name, phone } = req.body as { name?: string; phone?: string }
      const updated = await updateUserProfile((req.user as any).id, { name, phone })
      return reply.send(updated)
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })

  // ── Esqueci minha senha ──────────────────────────────────────────────
  app.post('/auth/forgot-password', { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, async (req, reply) => {
    try {
      const { email } = req.body as { email: string }
      if (!email) return reply.status(400).send({ error: 'Email obrigatório' })

      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
      // Responde sempre com sucesso para não vazar se email existe
      if (!user) return reply.send({ ok: true })

      // Invalida tokens anteriores
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })

      const token = randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 min

      await prisma.passwordResetToken.create({ data: { userId: user.id, token, expiresAt } })

      const FRONTEND_URL = process.env.FRONTEND_URL ?? 'https://www.techchurras.com.br'
      const resetUrl = `${FRONTEND_URL}/redefinir-senha?token=${token}`
      await emailPasswordReset(user.email, user.name, resetUrl)

      return reply.send({ ok: true })
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro interno' })
    }
  })

  app.post('/auth/reset-password', { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, async (req, reply) => {
    try {
      const { token, password } = req.body as { token: string; password: string }
      if (!token || !password) return reply.status(400).send({ error: 'Token e senha obrigatórios' })
      if (password.length < 6) return reply.status(400).send({ error: 'Senha deve ter pelo menos 6 caracteres' })

      const record = await prisma.passwordResetToken.findUnique({ where: { token } })
      if (!record || record.expiresAt < new Date()) {
        return reply.status(400).send({ error: 'Link inválido ou expirado. Solicite um novo.' })
      }

      const hashed = await bcrypt.hash(password, 10)
      await prisma.user.update({ where: { id: record.userId }, data: { password: hashed } })
      await prisma.passwordResetToken.delete({ where: { token } })

      return reply.send({ ok: true })
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro interno' })
    }
  })

  app.delete('/auth/account', { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, async (req, reply) => {
    try {
      const { email, password } = req.body as { email: string; password: string }
      if (!email || !password) return reply.status(400).send({ error: 'Email e senha são obrigatórios' })
      await deleteAccount(email, password)
      return reply.send({ success: true, message: 'Conta excluída com sucesso' })
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })
}