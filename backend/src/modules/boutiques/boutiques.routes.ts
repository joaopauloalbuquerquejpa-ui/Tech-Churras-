import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth.middleware'
import {
  createBoutiqueHandler,
  listBoutiquesHandler,
  getBoutiqueByIdHandler,
  getBoutiqueProductsHandler,
  updateBoutiqueHandler,
  getMyBoutiqueHandler,
  getKitsByBoutiqueHandler,
  createKitHandler,
  updateKitHandler,
  deleteKitHandler,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
  toggleProductHandler,
  getBoutiqueDashboardStatsHandler,
  getBoutiqueDemandForecastHandler,
} from './boutiques.controller'

export async function boutiqueRoutes(app: FastifyInstance) {
  app.get('/boutiques/dashboard/stats', { preHandler: [authenticate] }, getBoutiqueDashboardStatsHandler)
  app.get('/boutiques/dashboard/demand-forecast', { preHandler: [authenticate] }, getBoutiqueDemandForecastHandler)
  app.get('/boutiques', listBoutiquesHandler)
  app.get('/boutiques/my', { preHandler: [authenticate] }, getMyBoutiqueHandler)
  app.get('/boutiques/:id', getBoutiqueByIdHandler)
  app.get('/boutiques/:id/products', getBoutiqueProductsHandler)
  app.post('/boutiques', { preHandler: [authenticate] }, createBoutiqueHandler)
  app.patch('/boutiques', { preHandler: [authenticate] }, updateBoutiqueHandler)

  app.get('/boutiques/:id/kits', getKitsByBoutiqueHandler)
  app.post('/boutiques/kits', { preHandler: [authenticate] }, createKitHandler)
  app.patch('/boutiques/kits/:kitId', { preHandler: [authenticate] }, updateKitHandler)
  app.delete('/boutiques/kits/:kitId', { preHandler: [authenticate] }, deleteKitHandler)

  app.post('/boutiques/products', { preHandler: [authenticate] }, createProductHandler)
  app.patch('/boutiques/products/:productId', { preHandler: [authenticate] }, updateProductHandler)
  app.delete('/boutiques/products/:productId', { preHandler: [authenticate] }, deleteProductHandler)
  app.patch('/boutiques/products/:productId/toggle', { preHandler: [authenticate] }, toggleProductHandler)
}
