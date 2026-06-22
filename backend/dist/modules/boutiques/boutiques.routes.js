"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.boutiqueRoutes = boutiqueRoutes;
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const boutiques_controller_1 = require("./boutiques.controller");
async function boutiqueRoutes(app) {
    app.get('/boutiques/dashboard/stats', { preHandler: [auth_middleware_1.authenticate] }, boutiques_controller_1.getBoutiqueDashboardStatsHandler);
    app.get('/boutiques/dashboard/demand-forecast', { preHandler: [auth_middleware_1.authenticate] }, boutiques_controller_1.getBoutiqueDemandForecastHandler);
    app.get('/boutiques/dashboard/referrals', { preHandler: [auth_middleware_1.authenticate] }, boutiques_controller_1.getBoutiqueReferralStatsHandler);
    app.get('/boutiques', boutiques_controller_1.listBoutiquesHandler);
    app.get('/boutiques/my', { preHandler: [auth_middleware_1.authenticate] }, boutiques_controller_1.getMyBoutiqueHandler);
    app.get('/boutiques/:id', boutiques_controller_1.getBoutiqueByIdHandler);
    app.get('/boutiques/:id/products', boutiques_controller_1.getBoutiqueProductsHandler);
    app.post('/boutiques', { preHandler: [auth_middleware_1.authenticate] }, boutiques_controller_1.createBoutiqueHandler);
    app.patch('/boutiques', { preHandler: [auth_middleware_1.authenticate] }, boutiques_controller_1.updateBoutiqueHandler);
    app.get('/boutiques/:id/kits', boutiques_controller_1.getKitsByBoutiqueHandler);
    app.post('/boutiques/kits', { preHandler: [auth_middleware_1.authenticate] }, boutiques_controller_1.createKitHandler);
    app.patch('/boutiques/kits/:kitId', { preHandler: [auth_middleware_1.authenticate] }, boutiques_controller_1.updateKitHandler);
    app.delete('/boutiques/kits/:kitId', { preHandler: [auth_middleware_1.authenticate] }, boutiques_controller_1.deleteKitHandler);
    app.post('/boutiques/products', { preHandler: [auth_middleware_1.authenticate] }, boutiques_controller_1.createProductHandler);
    app.patch('/boutiques/products/:productId', { preHandler: [auth_middleware_1.authenticate] }, boutiques_controller_1.updateProductHandler);
    app.delete('/boutiques/products/:productId', { preHandler: [auth_middleware_1.authenticate] }, boutiques_controller_1.deleteProductHandler);
    app.patch('/boutiques/products/:productId/toggle', { preHandler: [auth_middleware_1.authenticate] }, boutiques_controller_1.toggleProductHandler);
    app.patch('/boutiques/orders/:orderId/ready', { preHandler: [auth_middleware_1.authenticate] }, boutiques_controller_1.confirmBoutiqueOrderReadyHandler);
    app.patch('/boutiques/orders/:orderId/accept', { preHandler: [auth_middleware_1.authenticate] }, boutiques_controller_1.acceptBoutiqueOrderHandler);
    app.patch('/boutiques/orders/:orderId/reject', { preHandler: [auth_middleware_1.authenticate] }, boutiques_controller_1.rejectBoutiqueOrderHandler);
}
//# sourceMappingURL=boutiques.routes.js.map