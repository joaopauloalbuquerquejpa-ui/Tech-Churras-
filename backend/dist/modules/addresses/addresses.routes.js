"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addressesRoutes = addressesRoutes;
const zod_1 = require("zod");
const addresses_service_1 = require("./addresses.service");
const createAddressSchema = zod_1.z.object({
    label: zod_1.z.string().min(1),
    street: zod_1.z.string().min(1),
    number: zod_1.z.string().min(1),
    complement: zod_1.z.string().optional(),
    neighborhood: zod_1.z.string().min(1),
    city: zod_1.z.string().min(1),
    state: zod_1.z.string().min(2).max(2),
    zipCode: zod_1.z.string().min(8).max(9),
    isDefault: zod_1.z.boolean().optional(),
});
const updateAddressSchema = createAddressSchema.partial();
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
            const parsed = createAddressSchema.safeParse(req.body);
            if (!parsed.success)
                return reply.status(400).send({ error: parsed.error.issues[0].message });
            return reply.status(201).send(await (0, addresses_service_1.createAddress)(userId, parsed.data));
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    app.patch('/addresses/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const parsed = updateAddressSchema.safeParse(req.body);
            if (!parsed.success)
                return reply.status(400).send({ error: parsed.error.issues[0].message });
            return reply.send(await (0, addresses_service_1.updateAddress)(id, userId, parsed.data));
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