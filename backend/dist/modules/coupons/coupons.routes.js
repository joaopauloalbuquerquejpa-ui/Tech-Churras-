"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.couponsRoutes = couponsRoutes;
const zod_1 = require("zod");
const coupons_service_1 = require("./coupons.service");
const validateCouponSchema = zod_1.z.object({
    code: zod_1.z.string().min(1),
    orderValue: zod_1.z.number().min(0),
});
async function couponsRoutes(app) {
    app.post('/coupons/validate', { config: { rateLimit: { max: 15, timeWindow: '1 minute' } } }, async (req, reply) => {
        const parsed = validateCouponSchema.safeParse(req.body);
        if (!parsed.success)
            return reply.code(400).send({ error: parsed.error.issues[0].message });
        return (0, coupons_service_1.validateCoupon)(parsed.data.code, parsed.data.orderValue);
    });
}
//# sourceMappingURL=coupons.routes.js.map