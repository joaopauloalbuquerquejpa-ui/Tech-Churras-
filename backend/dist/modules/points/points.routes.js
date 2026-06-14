"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pointsRoutes = pointsRoutes;
const points_service_1 = require("./points.service");
async function pointsRoutes(app) {
    app.get('/points/balance', { preHandler: [app.authenticate] }, async (req, reply) => {
        try {
            const userId = req.user.id;
            const data = await (0, points_service_1.getPointsBalance)(userId);
            return data;
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    app.post('/points/redeem', { preHandler: [app.authenticate] }, async (req, reply) => {
        try {
            const userId = req.user.id;
            const data = await (0, points_service_1.redeemPoints)(userId);
            return data;
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    app.get('/points/redemptions', { preHandler: [app.authenticate] }, async (req, reply) => {
        try {
            const userId = req.user.id;
            const data = await (0, points_service_1.listRedemptions)(userId);
            return data;
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
}
//# sourceMappingURL=points.routes.js.map