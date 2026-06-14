"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.couponsRoutes = couponsRoutes;
const coupons_service_1 = require("./coupons.service");
async function couponsRoutes(app) {
    app.post('/coupons/validate', async (req, reply) => {
        const { code, orderValue } = req.body;
        if (!code || orderValue === undefined) {
            return reply.code(400).send({ error: 'code e orderValue sao obrigatorios' });
        }
        return (0, coupons_service_1.validateCoupon)(code, Number(orderValue));
    });
}
//# sourceMappingURL=coupons.routes.js.map