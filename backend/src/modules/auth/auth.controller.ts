import { FastifyRequest, FastifyReply } from 'fastify'
import { registerSchema, loginSchema, registerUser, loginUser } from './auth.service'
import { reportIfUnexpected } from '../../utils/report'

export async function register(req: FastifyRequest, reply: FastifyReply) {
  try {
    const data = registerSchema.parse(req.body)
    const user = await registerUser(data)
    const token = await reply.jwtSign({ id: user.id, role: user.role, tokenVersion: user.tokenVersion }, { expiresIn: '30d' })
    const { tokenVersion, ...publicUser } = user
    return reply.status(201).send({ user: publicUser, token })
  } catch (err: any) {
    reportIfUnexpected(err)
    return reply.status(400).send({ error: err.message })
  }
}

export async function login(req: FastifyRequest, reply: FastifyReply) {
  try {
    const data = loginSchema.parse(req.body)
    const user = await loginUser(data)

    // Admin com 2FA ativo: não emite o token final ainda — exige código TOTP em /auth/2fa/verify
    if (user.role === 'ADMIN' && user.totpEnabled) {
      const preToken = await reply.jwtSign({ id: user.id, scope: 'pre2fa' }, { expiresIn: '5m' })
      return reply.status(200).send({ needsTotp: true, preToken })
    }

    const token = await reply.jwtSign({ id: user.id, role: user.role, tokenVersion: user.tokenVersion }, { expiresIn: '30d' })
    const { tokenVersion, totpEnabled, ...publicUser } = user
    return reply.status(200).send({ user: publicUser, token })
  } catch (err: any) {
    reportIfUnexpected(err)
    return reply.status(401).send({ error: err.message })
  }
}