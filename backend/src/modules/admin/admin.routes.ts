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
import { z } from 'zod'

const createCouponSchema = z.object({
  code: z.string().min(1).toUpperCase(),
  discountType: z.enum(['PERCENT', 'FIXED']),
  discountValue: z.number().positive(),
  minOrderValue: z.number().min(0).optional(),
  maxUses: z.number().int().positive().optional(),
  validUntil: z.string().datetime().optional(),
})
import { getBoutiqueReferralStats, getAdvancedMetrics, getDemandForecast } from './admin.service'

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
  app.get('/admin/metrics/advanced', async (_req, reply) => {
    try {
      return reply.send(await getAdvancedMetrics())
    } catch (err: any) {
      return reply.status(500).send({ error: err.message })
    }
  })

  // ── Feature 5: Previsão de demanda com IA
  app.get('/admin/demand-forecast', async (_req, reply) => {
    try {
      return reply.send(await getDemandForecast())
    } catch (err: any) {
      return reply.status(500).send({ error: err.message })
    }
  })

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
  app.post('/admin/coupons', async (req, reply) => {
    const parsed = createCouponSchema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0].message })
    return createCoupon(parsed.data)
  })
  app.patch('/admin/coupons/:id', async (req, reply) => {
    const { active } = z.object({ active: z.boolean() }).parse(req.body)
    return toggleCoupon((req.params as any).id, active)
  })

  // ── Leads captados via WhatsApp bot
  app.get('/admin/leads', async (_req, reply) => {
    const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, take: 200 })
    return reply.send(leads)
  })

  app.patch('/admin/leads/:id/status', async (req, reply) => {
    const { id } = req.params as { id: string }
    const { status } = z.object({ status: z.string() }).parse(req.body)
    const updated = await prisma.lead.update({ where: { id }, data: { status } })
    return reply.send(updated)
  })

  // ── Z-API health check
  app.get('/admin/zapi-status', async (_req, reply) => {
    const instance = process.env.ZAPI_INSTANCE
    const token = process.env.ZAPI_TOKEN
    if (!instance || !token) return reply.send({ status: 'not_configured' })
    try {
      const res = await fetch(
        `https://api.z-api.io/instances/${instance}/token/${token}/status`,
        { signal: AbortSignal.timeout(5000) }
      )
      if (!res.ok) return reply.send({ status: 'error', code: res.status })
      const data = await res.json() as any
      return reply.send({ status: 'ok', connected: data?.connected ?? false, phone: data?.phone ?? null })
    } catch (err: any) {
      return reply.send({ status: 'error', message: err.message })
    }
  })

  // ── Migração única: setar trialEndsAt em boutiques aprovadas sem trial
  app.post('/admin/migrate/trial-ends-at', async (_req, reply) => {
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 60)
    const result = await prisma.boutique.updateMany({
      where: { approved: true, trialEndsAt: null },
      data: { trialEndsAt },
    })
    return reply.send({ updated: result.count, trialEndsAt })
  })
}
