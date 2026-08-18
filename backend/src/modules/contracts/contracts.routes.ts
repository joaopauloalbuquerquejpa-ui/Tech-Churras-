import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { authenticate } from '../../middlewares/auth.middleware'
import {
  generateContractHandler,
  acceptContractHandler,
  getMyContractsHandler,
  getAllContractsHandler,
  getContractByIdHandler,
  archiveContractHandler,
  deleteContractHandler,
} from './contracts.controller'

// Checagem de role já existia dentro de cada handler admin (funcional, mas
// silenciosa — um handler novo copiado sem o check falha aberto). Isso deixa
// explícito na rota, mesmo padrão do admin.routes.ts.
async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  if ((req as any).user?.role !== 'ADMIN') {
    return reply.status(403).send({ error: 'Acesso restrito a administradores' })
  }
}

export async function contractsRoutes(app: FastifyInstance) {
  app.post('/contracts/generate', { preHandler: [authenticate] }, generateContractHandler)
  app.post('/contracts/:id/accept', { preHandler: [authenticate] }, acceptContractHandler)
  app.get('/contracts/my', { preHandler: [authenticate] }, getMyContractsHandler)
  app.get('/contracts/all', { preHandler: [authenticate, requireAdmin] }, getAllContractsHandler)
  app.patch('/contracts/:id/archive', { preHandler: [authenticate, requireAdmin] }, archiveContractHandler)
  app.delete('/contracts/:id', { preHandler: [authenticate, requireAdmin] }, deleteContractHandler)
  app.get('/contracts/:id', { preHandler: [authenticate] }, getContractByIdHandler)
}
