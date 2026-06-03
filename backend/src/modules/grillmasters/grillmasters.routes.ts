import { FastifyInstance } from 'fastify'
import {
  createGrillmasterHandler,
  listGrillmastersHandler,
  getGrillmasterHandler,
  updateGrillmasterHandler,
} from './grillmasters.controller'

export async function grillmastersRoutes(app: FastifyInstance) {
  // Público
  app.get('/grillmasters', listGrillmastersHandler)
  app.get('/grillmasters/:id', getGrillmasterHandler)

  // Autenticado
  app.post('/grillmasters', { preHandler: [app.authenticate] }, createGrillmasterHandler)
  app.put('/grillmasters', { preHandler: [app.authenticate] }, updateGrillmasterHandler)
}