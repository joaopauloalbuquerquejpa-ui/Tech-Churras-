import { FastifyRequest, FastifyReply } from 'fastify'
import { registerSchema, loginSchema, registerUser, loginUser } from './auth.service'

export async function register(req: FastifyRequest, reply: FastifyReply) {
  try {
    const data = registerSchema.parse(req.body)
    const user = await registerUser(data)
    const token = await reply.jwtSign({ id: user.id, role: user.role }, { expiresIn: '30d' })
    return reply.status(201).send({ user, token })
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function login(req: FastifyRequest, reply: FastifyReply) {
  try {
    const data = loginSchema.parse(req.body)
    const user = await loginUser(data)
    const token = await reply.jwtSign({ id: user.id, role: user.role }, { expiresIn: '30d' })
    return reply.status(200).send({ user, token })
  } catch (err: any) {
    return reply.status(401).send({ error: err.message })
  }
}