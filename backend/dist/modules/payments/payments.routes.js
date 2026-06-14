"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentsRoutes = paymentsRoutes;
const payments_controller_1 = require("./payments.controller");
async function paymentsRoutes(app) {
    app.post('/payments/webhook', payments_controller_1.mpWebhookHandler);
    app.post('/payments/create-preference', { preHandler: [app.authenticate] }, payments_controller_1.createPreferenceHandler);
}
//# sourceMappingURL=payments.routes.js.map