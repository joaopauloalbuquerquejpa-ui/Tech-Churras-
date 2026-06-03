import { FastifyInstance } from 'fastify'
import {
  listUsersHandler,
  blockUserHandler,
  listGrillmastersHandler,
  approveGrillmasterHandler,
  listAllOrdersHandler,
  getDashboardStatsHandler,
} from './admin.controller'

export async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  app.get('/admin/dashboard', getDashboardStatsHandler)
  app.get('/admin/users', listUsersHandler)
  app.patch('/admin/users/:userId/block', blockUserHandler)
  app.get('/admin/grillmasters', listGrillmastersHandler)
  app.patch('/admin/grillmasters/:grillmasterId/approve', approveGrillmasterHandler)
  app.get('/admin/orders', listAllOrdersHandler)
}