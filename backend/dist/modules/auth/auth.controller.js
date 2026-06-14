"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
const auth_service_1 = require("./auth.service");
async function register(req, reply) {
    try {
        const data = auth_service_1.registerSchema.parse(req.body);
        const user = await (0, auth_service_1.registerUser)(data);
        const token = await reply.jwtSign({ id: user.id, role: user.role });
        return reply.status(201).send({ user, token });
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function login(req, reply) {
    try {
        const data = auth_service_1.loginSchema.parse(req.body);
        const user = await (0, auth_service_1.loginUser)(data);
        const token = await reply.jwtSign({ id: user.id, role: user.role });
        return reply.status(200).send({ user, token });
    }
    catch (err) {
        return reply.status(401).send({ error: err.message });
    }
}
//# sourceMappingURL=auth.controller.js.map