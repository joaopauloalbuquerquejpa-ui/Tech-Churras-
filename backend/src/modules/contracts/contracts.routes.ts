import { FastifyInstance } from 'fastify'
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

export async function contractsRoutes(app: FastifyInstance) {
  app.post('/contracts/generate', { preHandler: [authenticate] }, generateContractHandler)
  app.post('/contracts/:id/accept', { preHandler: [authenticate] }, acceptContractHandler)
  app.get('/contracts/my', { preHandler: [authenticate] }, getMyContractsHandler)
  app.get('/contracts/all', { preHandler: [authenticate] }, getAllContractsHandler)
  app.patch('/contracts/:id/archive', { preHandler: [authenticate] }, archiveContractHandler)
  app.delete('/contracts/:id', { preHandler: [authenticate] }, deleteContractHandler)
  app.get('/contracts/:id', { preHandler: [authenticate] }, getContractByIdHandler)
}
