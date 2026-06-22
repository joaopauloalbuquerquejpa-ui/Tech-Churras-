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
        // MP pode enviar type/data.id no body OU nos query params dependendo da versão
        const query = req.query;
        const body = req.body ?? {};
        const payload = {
            type: body.type ?? query['type'],
            data: {
                id: body.data?.id ?? query['data.id'] ?? query['id'],
            },
        };
        const result = await (0, payments_service_1.handleMPWebhook)(payload);
        return reply.send(result);
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
//# sourceMappingURL=payments.controller.js.map