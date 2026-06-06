import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth.middleware'
import { createBoutiqueHandler, listBoutiquesHandler, getBoutiqueByIdHandler, updateBoutiqueHandler } from './boutiques.controller'

export async function boutiqueRoutes(app: FastifyInstance) {
  app.get('/boutiques', listBoutiquesHandler)
  app.get('/boutiques/:id', getBoutiqueByIdHandler)
  app.post('/boutiques', { preHandler: [authenticate] }, createBoutiqueHandler)
  app.patch('/boutiques', { preHandler: [authenticate] }, updateBoutiqueHandler)
}
