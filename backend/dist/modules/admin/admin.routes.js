"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoutes = adminRoutes;
const admin_controller_1 = require("./admin.controller");
const payouts_controller_1 = require("./payouts/payouts.controller");
const coupons_service_1 = require("../coupons/coupons.service");
const admin_service_1 = require("./admin.service");
async function adminRoutes(app) {
    app.addHook('preHandler', app.authenticate);
    app.get('/admin/dashboard', admin_controller_1.getDashboardStatsHandler);
    app.get('/admin/stats', admin_controller_1.getDashboardStatsHandler);
    app.get('/admin/users', admin_controller_1.listUsersHandler);
    app.patch('/admin/users/:userId/block', admin_controller_1.blockUserHandler);
    app.get('/admin/grillmasters', admin_controller_1.listGrillmastersHandler);
    app.get('/admin/grillmasters/pending', admin_controller_1.listPendingGrillmastersHandler);
    app.patch('/admin/grillmasters/:grillmasterId/approve', admin_controller_1.approveGrillmasterHandler);
    app.patch('/admin/grillmasters/:grillmasterId/reject', admin_controller_1.rejectGrillmasterHandler);
    app.get('/admin/boutiques/pending', admin_controller_1.listPendingBoutiquesHandler);
    app.patch('/admin/boutiques/:boutiqueId/approve', admin_controller_1.approveBoutiqueHandler);
    app.patch('/admin/boutiques/:boutiqueId/reject', admin_controller_1.rejectBoutiqueHandler);
    app.get('/admin/boutiques/:boutiqueId/referrals', async (req, reply) => {
        try {
            return reply.send(await (0, admin_service_1.getBoutiqueReferralStats)(req.params.boutiqueId));
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
    app.post('/admin/coupons', async (req) => {
        const { code, discountType, discountValue, minOrderValue, maxUses, validUntil } = req.body;
        return (0, coupons_service_1.createCoupon)({ code, discountType, discountValue, minOrderValue, maxUses, validUntil });
    });
    app.patch('/admin/coupons/:id', async (req) => {
        const { active } = req.body;
        return (0, coupons_service_1.toggleCoupon)(req.params.id, Boolean(active));
    });
}
//# sourceMappingURL=admin.routes.js.map