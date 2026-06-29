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
import { recommendGrillmasters } from './grillmasters.service'

async function requireAdmin(req: any, reply: any) {
  if (req.user?.role !== 'ADMIN') {
    return reply.status(403).send({ error: 'Acesso restrito a administradores' })
  }
}

export async function grillmastersRoutes(app: FastifyInstance) {
  // Público
  app.get('/grillmasters', listGrillmastersHandler)

  // ── Feature 4: Matching inteligente de GM
  app.get('/grillmasters/recommended', async (req, reply) => {
    try {
      const { lat, lng, eventDate, guests, city } = req.query as Record<string, string>
      const result = await recommendGrillmasters({
        lat: lat ? parseFloat(lat) : undefined,
        lng: lng ? parseFloat(lng) : undefined,
        eventDate: eventDate || undefined,
        guests: guests ? parseInt(guests, 10) : undefined,
        city: city || undefined,
      })
      return reply.send(result)
    } catch (err: any) {
      return reply.status(500).send({ error: err.message })
    }
  })

  // Autenticado — todos antes de /:id para evitar conflito de rota
  app.get('/grillmasters/me/orders', { preHandler: [app.authenticate] }, getMyOrdersHandler)
  app.get('/grillmasters/schedule', { preHandler: [app.authenticate] }, getScheduleHandler)
  app.post('/grillmasters/schedule/toggle', { preHandler: [app.authenticate] }, toggleScheduleHandler)
  app.post('/grillmasters/training/:moduleId/complete', { preHandler: [app.authenticate] }, completeModuleHandler)
  app.post('/grillmasters', { preHandler: [app.authenticate] }, createGrillmasterHandler)
  app.put('/grillmasters', { preHandler: [app.authenticate] }, updateGrillmasterHandler)

  // Admin
  app.patch('/admin/grillmasters/:grillmasterId/uniform', { preHandler: [app.authenticate, requireAdmin] }, markUniformSentHandler)

  app.get('/grillmasters/:id', getGrillmasterHandler)
}