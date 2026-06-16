import { FastifyInstance } from 'fastify'
import { prisma } from '../../config/prisma'
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

  app.get('/admin/grillmasters/:grillmasterId/schedule', async (req, reply) => {
    try {
      const { grillmasterId } = req.params as { grillmasterId: string }
      const from = new Date()
      const to = new Date(); to.setMonth(to.getMonth() + 4)
      const schedule = await prisma.grillmasterSchedule.findMany({
        where: { grillmasterId, date: { gte: from, lte: to } },
        orderBy: { date: 'asc' },
      })
      return reply.send(schedule)
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.post('/admin/grillmasters/:grillmasterId/schedule/toggle', async (req, reply) => {
    try {
      const { grillmasterId } = req.params as { grillmasterId: string }
      const { date } = req.body as { date: string }
      const d = new Date(date); d.setUTCHours(12, 0, 0, 0)
      const existing = await prisma.grillmasterSchedule.findUnique({
        where: { grillmasterId_date: { grillmasterId, date: d } },
      })
      let result
      if (existing) {
        await prisma.grillmasterSchedule.delete({ where: { id: existing.id } })
        result = { deleted: true, date }
      } else {
        result = await prisma.grillmasterSchedule.create({
          data: { grillmasterId, date: d, available: true },
        })
      }
      return reply.send(result)
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

  // Rota temporária de limpeza de dados de teste
  app.delete('/admin/cleanup-test-data', async (_req, reply) => {
    const KEEP_USER_IDS = [
      '9ff6abc6-74a2-4ced-b8a8-e0fe9e726d25', // Admin
      'ab60b69d-7134-41e2-9c7b-00082d3f4892', // Team Jota
    ]
    const KEEP_GM_ID = 'de7b51ec-583c-4869-83b0-b2c355c0dfef' // Team Jota GM

    const log: string[] = []

    // 1. Messages
    const msgs = await prisma.message.deleteMany({ where: { sender: { id: { notIn: KEEP_USER_IDS } } } })
    log.push(`Messages deletadas: ${msgs.count}`)

    // 2. OrderItems
    const oi = await prisma.orderItem.deleteMany({
      where: { order: { OR: [{ customerId: { notIn: KEEP_USER_IDS } }, { grillmasterId: { not: KEEP_GM_ID } }] } },
    })
    log.push(`OrderItems deletados: ${oi.count}`)

    // 3. Reviews
    const rev = await prisma.review.deleteMany({ where: { customerId: { notIn: KEEP_USER_IDS } } })
    log.push(`Reviews deletadas: ${rev.count}`)

    // 4. Payouts (exceto Team Jota GM)
    const po = await prisma.payout.deleteMany({ where: { recipientId: { not: KEEP_GM_ID } } })
    log.push(`Payouts deletados: ${po.count}`)

    // 5. Orders
    const ord = await prisma.order.deleteMany({ where: { customerId: { notIn: KEEP_USER_IDS } } })
    log.push(`Orders deletados: ${ord.count}`)

    // 6. Produtos e kits dos açougues fake
    await prisma.kitChurrasco.deleteMany({})
    await prisma.product.deleteMany({})
    log.push('Produtos e kits de açougue deletados')

    // 7. Açougues (todos fake)
    const bt = await prisma.boutique.deleteMany({})
    log.push(`Açougues deletados: ${bt.count}`)

    // 8. GMs fake (manter Team Jota)
    const gm = await prisma.grillmaster.deleteMany({ where: { id: { not: KEEP_GM_ID } } })
    log.push(`GMs deletados: ${gm.count}`)

    // 9. Favoritos, push subscriptions de usuários fake
    await prisma.favorite.deleteMany({ where: { userId: { notIn: KEEP_USER_IDS } } })
    const pt = await prisma.pushSubscription.deleteMany({ where: { userId: { notIn: KEEP_USER_IDS } } })
    log.push(`PushSubscriptions deletadas: ${pt.count}`)

    // 10. Usuários fake
    const us = await prisma.user.deleteMany({ where: { id: { notIn: KEEP_USER_IDS } } })
    log.push(`Usuários deletados: ${us.count}`)

    return reply.send({ ok: true, log })
  })
}
