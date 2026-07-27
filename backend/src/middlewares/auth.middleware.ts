import { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../config/prisma'

export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify()
  } catch (err) {
    return reply.status(401).send({ error: 'Token inválido ou expirado' })
  }

  const payload = req.user as { id: string; tokenVersion?: number; scope?: string }

  // Token pré-2FA (emitido no login, antes do código TOTP) só serve em /auth/2fa/verify —
  // nunca deve valer como sessão completa em nenhuma outra rota autenticada.
  if (payload.scope === 'pre2fa') {
    return reply.status(401).send({ error: 'Verificação de dois fatores pendente' })
  }

  const user = await prisma.user.findUnique({ where: { id: payload.id }, select: { tokenVersion: true } })
  if (!user || (payload.tokenVersion ?? 0) !== user.tokenVersion) {
    return reply.status(401).send({ error: 'Sessão expirada, faça login novamente' })
  }
}