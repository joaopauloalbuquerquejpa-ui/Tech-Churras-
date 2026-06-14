"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messagesRoutes = messagesRoutes;
const messages_service_1 = require("./messages.service");
async function messagesRoutes(app) {
    app.get('/orders/:id/messages', { preHandler: [app.authenticate] }, async (req, reply) => {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const messages = await (0, messages_service_1.getMessages)(id, userId);
            return reply.send(messages);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    app.post('/orders/:id/messages', { preHandler: [app.authenticate] }, async (req, reply) => {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const { content } = req.body;
            if (!content?.trim())
                return reply.status(400).send({ error: 'Mensagem nao pode ser vazia' });
            const msg = await (0, messages_service_1.sendMessage)(id, userId, content.trim());
            return reply.status(201).send(msg);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    app.patch('/orders/:id/messages/read', { preHandler: [app.authenticate] }, async (req, reply) => {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            await (0, messages_service_1.markMessagesRead)(id, userId);
            return reply.send({ ok: true });
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
}
//# sourceMappingURL=messages.routes.js.map