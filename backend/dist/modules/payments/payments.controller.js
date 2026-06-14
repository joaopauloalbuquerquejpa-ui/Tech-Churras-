"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPreferenceHandler = createPreferenceHandler;
exports.mpWebhookHandler = mpWebhookHandler;
const payments_service_1 = require("./payments.service");
async function createPreferenceHandler(req, reply) {
    try {
        const customerId = req.user.id;
        const { orderId } = req.body;
        const result = await (0, payments_service_1.createPreference)(orderId, customerId);
        return reply.status(201).send(result);
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function mpWebhookHandler(req, reply) {
    try {
        const result = await (0, payments_service_1.handleMPWebhook)(req.body);
        return reply.send(result);
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
//# sourceMappingURL=payments.controller.js.map