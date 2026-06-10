import { FastifyInstance } from 'fastify'
import {
  createGrillmasterHandler,
  listGrillmastersHandler,
  getGrillmasterHandler,
  updateGrillmasterHandler,
  getMyOrdersHandler,
} from './grillmasters.controller'

export async function grillmastersRoutes(app: FastifyInstance) {
  // Público
  app.get('/grillmasters', listGrillmastersHandler)

  // Autenticado — antes de /:id para evitar conflito de rota
  app.get('/grillmasters/me/orders', { preHandler: [app.authenticate] }, getMyOrdersHandler)
  app.post('/grillmasters', { preHandler: [app.authenticate] }, createGrillmasterHandler)
  app.put('/grillmasters', { preHandler: [app.authenticate] }, updateGrillmasterHandler)

  app.get('/grillmasters/:id', getGrillmasterHandler)
}