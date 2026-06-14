"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushRoutes = pushRoutes;
const prisma_1 = require("../../config/prisma");
async function pushRoutes(app) {
    app.get('/push/vapid-public-key', async (_req, reply) => {
        return reply.send({ publicKey: process.env.VAPID_PUBLIC_KEY ?? '' });
    });
    app.post('/push/subscribe', { preHandler: [app.authenticate] }, async (req, reply) => {
        try {
            const userId = req.user.id;
            const { endpoint, keys } = req.body;
            await prisma_1.prisma.pushSubscription.upsert({
                where: { endpoint },
                create: { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
                update: { userId, p256dh: keys.p256dh, auth: keys.auth },
            });
            return reply.send({ ok: true });
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    app.post('/push/unsubscribe', { preHandler: [app.authenticate] }, async (req, reply) => {
        try {
            const { endpoint } = req.body;
            await prisma_1.prisma.pushSubscription.deleteMany({ where: { endpoint } });
            return reply.send({ ok: true });
        }
        catch {
            return reply.send({ ok: true });
        }
    });
}
//# sourceMappingURL=push.routes.js.map