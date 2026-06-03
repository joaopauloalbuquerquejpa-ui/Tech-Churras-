import { FastifyInstance } from 'fastify'
import {
  createBoutiqueHandler,
  listBoutiquesHandler,
  getBoutiqueHandler,
  addProductHandler,
} from './boutiques.controller'

export async function boutiquesRoutes(app: FastifyInstance) {
  // Público
  app.get('/boutiques', listBoutiquesHandler)
  app.get('/boutiques/:id', getBoutiqueHandler)

  // Autenticado
  app.post('/boutiques', { preHandler: [app.authenticate] }, createBoutiqueHandler)
  app.post('/boutiques/products', { preHandler: [app.authenticate] }, addProductHandler)
}