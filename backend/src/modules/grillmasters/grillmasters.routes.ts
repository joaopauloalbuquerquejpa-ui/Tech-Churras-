import { FastifyInstance } from 'fastify'
import {
  createGrillmasterHandler,
  listGrillmastersHandler,
  getGrillmasterHandler,
  updateGrillmasterHandler,
  getMyOrdersHandler,
  getScheduleHandler,
  toggleScheduleHandler,
  completeModuleHandler,
  markUniformSentHandler,
} from './grillmasters.controller'

export async function grillmastersRoutes(app: FastifyInstance) {
  // Público
  app.get('/grillmasters', listGrillmastersHandler)

  // Autenticado — todos antes de /:id para evitar conflito de rota
  app.get('/grillmasters/me/orders', { preHandler: [app.authenticate] }, getMyOrdersHandler)
  app.get('/grillmasters/schedule', { preHandler: [app.authenticate] }, getScheduleHandler)
  app.post('/grillmasters/schedule/toggle', { preHandler: [app.authenticate] }, toggleScheduleHandler)
  app.post('/grillmasters/training/:moduleId/complete', { preHandler: [app.authenticate] }, completeModuleHandler)
  app.post('/grillmasters', { preHandler: [app.authenticate] }, createGrillmasterHandler)
  app.put('/grillmasters', { preHandler: [app.authenticate] }, updateGrillmasterHandler)

  // Admin
  app.patch('/admin/grillmasters/:grillmasterId/uniform', { preHandler: [app.authenticate] }, markUniformSentHandler)

  app.get('/grillmasters/:id', getGrillmasterHandler)
}