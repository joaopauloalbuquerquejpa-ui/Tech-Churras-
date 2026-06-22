"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
async function authRoutes(app) {
    app.post('/auth/register', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, auth_controller_1.register);
    app.post('/auth/login', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, auth_controller_1.login);
    app.post('/auth/guest', { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, async (req, reply) => {
        try {
            const { name, phone } = req.body;
            if (!name || name.trim().length < 2)
                return reply.status(400).send({ error: 'Nome obrigatório (mínimo 2 caracteres)' });
            if (!phone || phone.trim().length < 10)
                return reply.status(400).send({ error: 'WhatsApp obrigatório' });
            const user = await (0, auth_service_1.registerGuest)({ name, phone });
            const token = await reply.jwtSign({ id: user.id, role: user.role });
            return reply.status(201).send({ user, token });
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    app.patch('/auth/onboarding-completed', { preHandler: [auth_middleware_1.authenticate] }, async (req, reply) => {
        try {
            await (0, auth_service_1.markOnboardingCompleted)(req.user.id);
            return reply.send({ ok: true });
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    app.get('/auth/me', { preHandler: [auth_middleware_1.authenticate] }, async (req, reply) => {
        try {
            const { prisma } = await Promise.resolve().then(() => __importStar(require('../../config/prisma')));
            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                select: { id: true, name: true, email: true, phone: true, role: true, points: true, averageRating: true, createdAt: true },
            });
            if (!user)
                return reply.status(404).send({ error: 'Usuário não encontrado' });
            return reply.send(user);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    app.patch('/auth/profile', { preHandler: [auth_middleware_1.authenticate] }, async (req, reply) => {
        try {
            const { name, phone } = req.body;
            const updated = await (0, auth_service_1.updateUserProfile)(req.user.id, { name, phone });
            return reply.send(updated);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
}
//# sourceMappingURL=auth.routes.js.map