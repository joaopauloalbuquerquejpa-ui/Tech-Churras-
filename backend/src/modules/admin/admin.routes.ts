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
  markOrderPaidHandler,
} from './admin.controller'
import { updateGrillmasterProfile } from './admin.service'
import {
  listPayoutsHandler,
  getPayoutsSummaryHandler,
  generatePayoutsHandler,
  markPayoutPaidHandler,
} from './payouts/payouts.controller'
import { listCoupons, createCoupon, toggleCoupon } from '../coupons/coupons.service'
import { getBoutiqueReferralStats } from './admin.service'

async function requireAdmin(req: any, reply: any) {
  if (req.user?.role !== 'ADMIN') {
    return reply.status(403).send({ error: 'Acesso restrito a administradores' })
  }
}

export async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)
  app.addHook('preHandler', requireAdmin)

  app.get('/admin/dashboard', getDashboardStatsHandler)
  app.get('/admin/stats', getDashboardStatsHandler)

  app.get('/admin/users', listUsersHandler)
  app.patch('/admin/users/:userId/block', blockUserHandler)

  app.get('/admin/grillmasters', listGrillmastersHandler)
  app.get('/admin/grillmasters/pending', listPendingGrillmastersHandler)
  app.patch('/admin/grillmasters/:grillmasterId/approve', approveGrillmasterHandler)
  app.patch('/admin/grillmasters/:grillmasterId/reject', rejectGrillmasterHandler)
  app.patch('/admin/grillmasters/:grillmasterId/profile', async (req, reply) => {
    try {
      const { grillmasterId } = req.params as { grillmasterId: string }
      const updated = await updateGrillmasterProfile(grillmasterId, req.body as Record<string, unknown>)
      return reply.send(updated)
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.get('/admin/boutiques/pending', listPendingBoutiquesHandler)
  app.patch('/admin/boutiques/:boutiqueId/approve', approveBoutiqueHandler)
  app.patch('/admin/boutiques/:boutiqueId/reject', rejectBoutiqueHandler)
  app.get('/admin/boutiques/:boutiqueId/referrals', async (req, reply) => {
    try {
      return reply.send(await getBoutiqueReferralStats((req.params as any).boutiqueId))
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.get('/admin/orders', listAllOrdersHandler)
  app.patch('/admin/orders/:orderId/mark-paid', markOrderPaidHandler)

  app.get('/admin/payouts', listPayoutsHandler)
  app.get('/admin/payouts/summary', getPayoutsSummaryHandler)
  app.post('/admin/payouts/generate', generatePayoutsHandler)
  app.patch('/admin/payouts/:id/mark-paid', markPayoutPaidHandler)

  app.get('/admin/coupons', async () => listCoupons())
  app.post('/admin/coupons', async (req) => {
    const { code, discountType, discountValue, minOrderValue, maxUses, validUntil } = req.body as any
    return createCoupon({ code, discountType, discountValue, minOrderValue, maxUses, validUntil })
  })
  app.patch('/admin/coupons/:id', async (req) => {
    const { active } = req.body as any
    return toggleCoupon((req.params as any).id, Boolean(active))
  })
}
