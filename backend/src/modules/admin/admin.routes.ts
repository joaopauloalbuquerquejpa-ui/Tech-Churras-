import { FastifyInstance } from 'fastify'
import {
  listUsersHandler,
  blockUserHandler,
  listGrillmastersHandler,
  listPendingGrillmastersHandler,
  approveGrillmasterHandler,
  rejectGrillmasterHandler,
  listPendingBoutiquesHandler,
  approveBoutiqueHandler,
  rejectBoutiqueHandler,
  listAllOrdersHandler,
  getDashboardStatsHandler,
} from './admin.controller'
import {
  listPayoutsHandler,
  getPayoutsSummaryHandler,
  generatePayoutsHandler,
  markPayoutPaidHandler,
} from './payouts/payouts.controller'

export async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  app.get('/admin/dashboard', getDashboardStatsHandler)
  app.get('/admin/stats', getDashboardStatsHandler)

  app.get('/admin/users', listUsersHandler)
  app.patch('/admin/users/:userId/block', blockUserHandler)

  app.get('/admin/grillmasters', listGrillmastersHandler)
  app.get('/admin/grillmasters/pending', listPendingGrillmastersHandler)
  app.patch('/admin/grillmasters/:grillmasterId/approve', approveGrillmasterHandler)
  app.patch('/admin/grillmasters/:grillmasterId/reject', rejectGrillmasterHandler)

  app.get('/admin/boutiques/pending', listPendingBoutiquesHandler)
  app.patch('/admin/boutiques/:boutiqueId/approve', approveBoutiqueHandler)
  app.patch('/admin/boutiques/:boutiqueId/reject', rejectBoutiqueHandler)

  app.get('/admin/orders', listAllOrdersHandler)

  app.get('/admin/payouts', listPayoutsHandler)
  app.get('/admin/payouts/summary', getPayoutsSummaryHandler)
  app.post('/admin/payouts/generate', generatePayoutsHandler)
  app.patch('/admin/payouts/:id/mark-paid', markPayoutPaidHandler)
}
