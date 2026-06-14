"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.favoritesRoutes = favoritesRoutes;
const favorites_service_1 = require("./favorites.service");
async function favoritesRoutes(app) {
    app.addHook('preHandler', app.authenticate);
    app.get('/favorites', async (req) => {
        const userId = req.user.id;
        return (0, favorites_service_1.listFavorites)(userId);
    });
    app.post('/favorites', async (req, reply) => {
        const userId = req.user.id;
        const { targetType, targetId } = req.body;
        if (!targetType || !targetId) {
            return reply.code(400).send({ error: 'targetType e targetId sao obrigatorios' });
        }
        return (0, favorites_service_1.addFavorite)(userId, targetType, targetId);
    });
    app.delete('/favorites/:targetType/:targetId', async (req, reply) => {
        const userId = req.user.id;
        const { targetType, targetId } = req.params;
        await (0, favorites_service_1.removeFavorite)(userId, targetType, targetId);
        return reply.code(204).send();
    });
}
//# sourceMappingURL=favorites.routes.js.map