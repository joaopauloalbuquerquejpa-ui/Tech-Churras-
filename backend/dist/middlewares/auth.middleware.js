"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
async function authenticate(req, reply) {
    try {
        await req.jwtVerify();
    }
    catch (err) {
        return reply.status(401).send({ error: 'Token inválido ou expirado' });
    }
}
//# sourceMappingURL=auth.middleware.js.map