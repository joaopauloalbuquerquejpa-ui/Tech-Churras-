"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoutes = adminRoutes;
const prisma_1 = require("../../config/prisma");
const admin_controller_1 = require("./admin.controller");
const admin_service_1 = require("./admin.service");
const payouts_controller_1 = require("./payouts/payouts.controller");
const coupons_service_1 = require("../coupons/coupons.service");
const zod_1 = require("zod");
const createCouponSchema = zod_1.z.object({
    code: zod_1.z.string().min(1).toUpperCase(),
    discountType: zod_1.z.enum(['PERCENT', 'FIXED']),
    discountValue: zod_1.z.number().positive(),
    minOrderValue: zod_1.z.number().min(0).optional(),
    maxUses: zod_1.z.number().int().positive().optional(),
    validUntil: zod_1.z.string().datetime().optional(),
});
const admin_service_2 = require("./admin.service");
async function requireAdmin(req, reply) {
    if (req.user?.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Acesso restrito a administradores' });
    }
}
async function adminRoutes(app) {
    app.addHook('preHandler', app.authenticate);
    app.addHook('preHandler', requireAdmin);
    app.get('/admin/dashboard', admin_controller_1.getDashboardStatsHandler);
    app.get('/admin/stats', admin_controller_1.getDashboardStatsHandler);
    app.get('/admin/users', admin_controller_1.listUsersHandler);
    app.patch('/admin/users/:userId/block', admin_controller_1.blockUserHandler);
    app.get('/admin/grillmasters', admin_controller_1.listGrillmastersHandler);
    app.get('/admin/grillmasters/pending', admin_controller_1.listPendingGrillmastersHandler);
    app.patch('/admin/grillmasters/:grillmasterId/approve', admin_controller_1.approveGrillmasterHandler);
    app.patch('/admin/grillmasters/:grillmasterId/reject', admin_controller_1.rejectGrillmasterHandler);
    app.patch('/admin/grillmasters/:grillmasterId/profile', async (req, reply) => {
        try {
            const { grillmasterId } = req.params;
            const updated = await (0, admin_service_1.updateGrillmasterProfile)(grillmasterId, req.body);
            return reply.send(updated);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    app.get('/admin/grillmasters/:grillmasterId/schedule', async (req, reply) => {
        try {
            const { grillmasterId } = req.params;
            const from = new Date();
            const to = new Date();
            to.setMonth(to.getMonth() + 4);
            const schedule = await prisma_1.prisma.grillmasterSchedule.findMany({
                where: { grillmasterId, date: { gte: from, lte: to } },
                orderBy: { date: 'asc' },
            });
            return reply.send(schedule);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    app.post('/admin/grillmasters/:grillmasterId/schedule/toggle', async (req, reply) => {
        try {
            const { grillmasterId } = req.params;
            const { date } = req.body;
            const d = new Date(date);
            d.setUTCHours(12, 0, 0, 0);
            const existing = await prisma_1.prisma.grillmasterSchedule.findUnique({
                where: { grillmasterId_date: { grillmasterId, date: d } },
            });
            let result;
            if (existing) {
                await prisma_1.prisma.grillmasterSchedule.delete({ where: { id: existing.id } });
                result = { deleted: true, date };
            }
            else {
                result = await prisma_1.prisma.grillmasterSchedule.create({
                    data: { grillmasterId, date: d, available: true },
                });
            }
            return reply.send(result);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    app.get('/admin/boutiques/pending', admin_controller_1.listPendingBoutiquesHandler);
    app.patch('/admin/boutiques/:boutiqueId/approve', admin_controller_1.approveBoutiqueHandler);
    app.patch('/admin/boutiques/:boutiqueId/reject', admin_controller_1.rejectBoutiqueHandler);
    app.get('/admin/boutiques/:boutiqueId/referrals', async (req, reply) => {
        try {
            return reply.send(await (0, admin_service_2.getBoutiqueReferralStats)(req.params.boutiqueId));
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    app.get('/admin/orders', admin_controller_1.listAllOrdersHandler);
    app.patch('/admin/orders/:orderId/mark-paid', admin_controller_1.markOrderPaidHandler);
    app.get('/admin/payouts', payouts_controller_1.listPayoutsHandler);
    app.get('/admin/payouts/summary', payouts_controller_1.getPayoutsSummaryHandler);
    app.post('/admin/payouts/generate', payouts_controller_1.generatePayoutsHandler);
    app.patch('/admin/payouts/:id/mark-paid', payouts_controller_1.markPayoutPaidHandler);
    app.get('/admin/coupons', async () => (0, coupons_service_1.listCoupons)());
    app.post('/admin/coupons', async (req, reply) => {
        const parsed = createCouponSchema.safeParse(req.body);
        if (!parsed.success)
            return reply.code(400).send({ error: parsed.error.issues[0].message });
        return (0, coupons_service_1.createCoupon)(parsed.data);
    });
    app.patch('/admin/coupons/:id', async (req, reply) => {
        const { active } = zod_1.z.object({ active: zod_1.z.boolean() }).parse(req.body);
        return (0, coupons_service_1.toggleCoupon)(req.params.id, active);
    });
    // ── Leads captados via WhatsApp bot
    app.get('/admin/leads', async (_req, reply) => {
        const leads = await prisma_1.prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
        return reply.send(leads);
    });
    app.patch('/admin/leads/:id/status', async (req, reply) => {
        const { id } = req.params;
        const { status } = zod_1.z.object({ status: zod_1.z.string() }).parse(req.body);
        const updated = await prisma_1.prisma.lead.update({ where: { id }, data: { status } });
        return reply.send(updated);
    });
    // ── Migração única: setar trialEndsAt em boutiques aprovadas sem trial
    app.post('/admin/migrate/trial-ends-at', async (_req, reply) => {
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 60);
        const result = await prisma_1.prisma.boutique.updateMany({
            where: { approved: true, trialEndsAt: null },
            data: { trialEndsAt },
        });
        return reply.send({ updated: result.count, trialEndsAt });
    });
}
//# sourceMappingURL=admin.routes.js.map