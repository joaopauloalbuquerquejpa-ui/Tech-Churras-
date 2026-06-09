import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth.middleware'
import {
  createBoutiqueHandler,
  listBoutiquesHandler,
  getBoutiqueByIdHandler,
  updateBoutiqueHandler,
  getMyBoutiqueHandler,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
  toggleProductHandler,
} from './boutiques.controller'

export async function boutiqueRoutes(app: FastifyInstance) {
  app.get('/boutiques', listBoutiquesHandler)
  app.get('/boutiques/my', { preHandler: [authenticate] }, getMyBoutiqueHandler)
  app.get('/boutiques/:id', getBoutiqueByIdHandler)
  app.post('/boutiques', { preHandler: [authenticate] }, createBoutiqueHandler)
  app.patch('/boutiques', { preHandler: [authenticate] }, updateBoutiqueHandler)

  app.post('/boutiques/products', { preHandler: [authenticate] }, createProductHandler)
  app.patch('/boutiques/products/:productId', { preHandler: [authenticate] }, updateProductHandler)
  app.delete('/boutiques/products/:productId', { preHandler: [authenticate] }, deleteProductHandler)
  app.patch('/boutiques/products/:productId/toggle', { preHandler: [authenticate] }, toggleProductHandler)
}
