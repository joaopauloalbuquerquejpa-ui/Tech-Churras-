"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.grillmastersRoutes = grillmastersRoutes;
const grillmasters_controller_1 = require("./grillmasters.controller");
async function grillmastersRoutes(app) {
    // Público
    app.get('/grillmasters', grillmasters_controller_1.listGrillmastersHandler);
    // Autenticado — todos antes de /:id para evitar conflito de rota
    app.get('/grillmasters/me/orders', { preHandler: [app.authenticate] }, grillmasters_controller_1.getMyOrdersHandler);
    app.get('/grillmasters/schedule', { preHandler: [app.authenticate] }, grillmasters_controller_1.getScheduleHandler);
    app.post('/grillmasters/schedule/toggle', { preHandler: [app.authenticate] }, grillmasters_controller_1.toggleScheduleHandler);
    app.post('/grillmasters/training/:moduleId/complete', { preHandler: [app.authenticate] }, grillmasters_controller_1.completeModuleHandler);
    app.post('/grillmasters', { preHandler: [app.authenticate] }, grillmasters_controller_1.createGrillmasterHandler);
    app.put('/grillmasters', { preHandler: [app.authenticate] }, grillmasters_controller_1.updateGrillmasterHandler);
    // Admin
    app.patch('/admin/grillmasters/:grillmasterId/uniform', { preHandler: [app.authenticate] }, grillmasters_controller_1.markUniformSentHandler);
    app.get('/grillmasters/:id', grillmasters_controller_1.getGrillmasterHandler);
}
//# sourceMappingURL=grillmasters.routes.js.map