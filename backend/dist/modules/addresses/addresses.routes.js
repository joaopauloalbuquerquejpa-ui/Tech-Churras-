"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addressesRoutes = addressesRoutes;
const addresses_service_1 = require("./addresses.service");
async function addressesRoutes(app) {
    app.get('/addresses', { preHandler: [app.authenticate] }, async (req, reply) => {
        try {
            const userId = req.user.id;
            return reply.send(await (0, addresses_service_1.listAddresses)(userId));
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    app.post('/addresses', { preHandler: [app.authenticate] }, async (req, reply) => {
        try {
            const userId = req.user.id;
            const data = req.body;
            return reply.status(201).send(await (0, addresses_service_1.createAddress)(userId, data));
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    app.patch('/addresses/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            return reply.send(await (0, addresses_service_1.updateAddress)(id, userId, req.body));
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    app.delete('/addresses/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            await (0, addresses_service_1.deleteAddress)(id, userId);
            return reply.send({ ok: true });
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    app.patch('/addresses/:id/default', { preHandler: [app.authenticate] }, async (req, reply) => {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            return reply.send(await (0, addresses_service_1.setDefaultAddress)(id, userId));
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
}
//# sourceMappingURL=addresses.routes.js.map