"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
async function authRoutes(app) {
    app.post('/auth/register', auth_controller_1.register);
    app.post('/auth/login', auth_controller_1.login);
    app.patch('/auth/onboarding-completed', { preHandler: [auth_middleware_1.authenticate] }, async (req, reply) => {
        try {
            await (0, auth_service_1.markOnboardingCompleted)(req.user.id);
            return reply.send({ ok: true });
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
}
//# sourceMappingURL=auth.routes.js.map