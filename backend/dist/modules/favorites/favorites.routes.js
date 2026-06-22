"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.favoritesRoutes = favoritesRoutes;
const zod_1 = require("zod");
const favorites_service_1 = require("./favorites.service");
const favoriteSchema = zod_1.z.object({
    targetType: zod_1.z.enum(['GRILLMASTER', 'BOUTIQUE']),
    targetId: zod_1.z.string().min(1),
});
async function favoritesRoutes(app) {
    app.addHook('preHandler', app.authenticate);
    app.get('/favorites', async (req) => {
        const userId = req.user.id;
        return (0, favorites_service_1.listFavorites)(userId);
    });
    app.post('/favorites', async (req, reply) => {
        const userId = req.user.id;
        const parsed = favoriteSchema.safeParse(req.body);
        if (!parsed.success)
            return reply.code(400).send({ error: parsed.error.issues[0].message });
        return (0, favorites_service_1.addFavorite)(userId, parsed.data.targetType, parsed.data.targetId);
    });
    app.delete('/favorites/:targetType/:targetId', async (req, reply) => {
        const userId = req.user.id;
        const { targetType, targetId } = req.params;
        await (0, favorites_service_1.removeFavorite)(userId, targetType, targetId);
        return reply.code(204).send();
    });
}
//# sourceMappingURL=favorites.routes.js.map