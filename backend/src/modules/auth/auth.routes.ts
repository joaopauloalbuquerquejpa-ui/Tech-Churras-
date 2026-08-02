import { FastifyInstance } from 'fastify'
import { register, login } from './auth.controller'
import { markOnboardingCompleted, updateUserProfile, registerGuest, deleteAccount } from './auth.service'
import { authenticate } from '../../middlewares/auth.middleware'
import { prisma } from '../../config/prisma'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { emailPasswordReset } from '../email/email.service'
import { generateTotpSecret, verifyTotpCode, buildTotpQrCode } from './totp.service'
import { sendPhoneVerification, confirmPhoneVerification } from './verification.service'

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, register)
  app.post('/auth/login', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, login)

  app.post('/auth/guest', { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, async (req, reply) => {
    try {
      const { name, phone } = req.body as { name: string; phone: string }
      if (!name || name.trim().length < 2) return reply.status(400).send({ error: 'Nome obrigatório (mínimo 2 caracteres)' })
      if (!phone || phone.trim().length < 10) return reply.status(400).send({ error: 'WhatsApp obrigatório' })
      const user = await registerGuest({ name, phone })
      const token = await reply.jwtSign({ id: user.id, role: user.role, tokenVersion: user.tokenVersion }, { expiresIn: '30d' })
      const { tokenVersion, ...publicUser } = user
      return reply.status(201).send({ user: publicUser, token })
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
        select: { id: true, name: true, email: true, phone: true, role: true, points: true, averageRating: true, createdAt: true, totpEnabled: true, phoneVerified: true },
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

  // ── Verificação de WhatsApp (uma vez, no cadastro — não é 2FA recorrente) ──
  app.post('/auth/phone-verification/send', { preHandler: [authenticate], config: { rateLimit: { max: 3, timeWindow: '5 minutes' } } }, async (req, reply) => {
    try {
      const result = await sendPhoneVerification((req.user as any).id)
      return reply.send(result)
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })
  app.post('/auth/phone-verification/confirm', { preHandler: [authenticate], config: { rateLimit: { max: 10, timeWindow: '5 minutes' } } }, async (req, reply) => {
    try {
      const { code } = req.body as { code: string }
      if (!code) return reply.status(400).send({ error: 'Código obrigatório' })
      const result = await confirmPhoneVerification((req.user as any).id, code)
      return reply.send(result)
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })

  // ── 2FA (admin, TOTP) ─────────────────────────────────────────────────
  app.post('/auth/2fa/verify', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (req, reply) => {
    try {
      await req.jwtVerify()
    } catch {
      return reply.status(401).send({ error: 'Token inválido ou expirado' })
    }
    const payload = req.user as { id: string; scope?: string }
    if (payload.scope !== 'pre2fa') return reply.status(401).send({ error: 'Token inválido' })

    const { code } = req.body as { code: string }
    const user = await prisma.user.findUnique({ where: { id: payload.id } })
    if (!user || !user.totpSecret || !user.totpEnabled) {
      return reply.status(400).send({ error: '2FA não configurado para este usuário' })
    }
    if (!code || !(await verifyTotpCode(user.totpSecret, code))) {
      return reply.status(401).send({ error: 'Código inválido' })
    }

    const token = await reply.jwtSign({ id: user.id, role: user.role, tokenVersion: user.tokenVersion }, { expiresIn: '30d' })
    return reply.send({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, onboardingCompleted: user.onboardingCompleted },
      token,
    })
  })

  app.post('/auth/2fa/setup', { preHandler: [authenticate] }, async (req, reply) => {
    const userId = (req.user as any).id
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'ADMIN') return reply.status(403).send({ error: 'Restrito a administradores' })

    // 2FA já ativo: só troca a chave provando o código atual — impede que uma sessão
    // roubada troque o segredo em silêncio e derrube a proteção sem o admin perceber.
    if (user.totpEnabled) {
      const { code } = req.body as { code?: string }
      if (!user.totpSecret || !code || !(await verifyTotpCode(user.totpSecret, code))) {
        return reply.status(401).send({ error: 'Informe o código TOTP atual para gerar uma nova chave' })
      }
    }

    const secret = generateTotpSecret()
    await prisma.user.update({ where: { id: userId }, data: { totpSecret: secret, totpEnabled: false } })
    const qrCode = await buildTotpQrCode(user.email, secret)
    return reply.send({ secret, qrCode })
  })

  app.post('/auth/2fa/enable', { preHandler: [authenticate] }, async (req, reply) => {
    const userId = (req.user as any).id
    const { code } = req.body as { code: string }
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'ADMIN' || !user.totpSecret) {
      return reply.status(400).send({ error: 'Chame /auth/2fa/setup antes de ativar' })
    }
    if (!code || !(await verifyTotpCode(user.totpSecret, code))) {
      return reply.status(401).send({ error: 'Código inválido' })
    }
    await prisma.user.update({ where: { id: userId }, data: { totpEnabled: true } })
    return reply.send({ ok: true })
  })

  app.post('/auth/2fa/disable', { preHandler: [authenticate] }, async (req, reply) => {
    const userId = (req.user as any).id
    const { code } = req.body as { code: string }
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'ADMIN') return reply.status(403).send({ error: 'Restrito a administradores' })
    if (!user.totpSecret || !code || !(await verifyTotpCode(user.totpSecret, code))) {
      return reply.status(401).send({ error: 'Código inválido' })
    }
    await prisma.user.update({ where: { id: userId }, data: { totpEnabled: false, totpSecret: null } })
    return reply.send({ ok: true })
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

      const hashed = await bcrypt.hash(password, 12)
      await prisma.user.update({ where: { id: record.userId }, data: { password: hashed, tokenVersion: { increment: 1 } } })
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