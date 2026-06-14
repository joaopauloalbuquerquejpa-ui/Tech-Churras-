"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFavorite = addFavorite;
exports.removeFavorite = removeFavorite;
exports.listFavorites = listFavorites;
const prisma_1 = require("../../config/prisma");
async function addFavorite(userId, targetType, targetId) {
    return prisma_1.prisma.favorite.upsert({
        where: { userId_targetType_targetId: { userId, targetType, targetId } },
        create: { userId, targetType, targetId },
        update: {},
    });
}
async function removeFavorite(userId, targetType, targetId) {
    await prisma_1.prisma.favorite.deleteMany({ where: { userId, targetType, targetId } });
}
async function listFavorites(userId) {
    const favs = await prisma_1.prisma.favorite.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
    const gmIds = favs.filter(f => f.targetType === 'GRILLMASTER').map(f => f.targetId);
    const btIds = favs.filter(f => f.targetType === 'BOUTIQUE').map(f => f.targetId);
    const [grillmasters, boutiques] = await Promise.all([
        gmIds.length > 0
            ? prisma_1.prisma.grillmaster.findMany({
                where: { id: { in: gmIds } },
                include: { user: { select: { name: true } } },
            })
            : Promise.resolve([]),
        btIds.length > 0
            ? prisma_1.prisma.boutique.findMany({ where: { id: { in: btIds } } })
            : Promise.resolve([]),
    ]);
    return {
        grillmasters: grillmasters.map(gm => ({
            ...gm,
            favoritedAt: favs.find(f => f.targetId === gm.id)?.createdAt,
        })),
        boutiques: boutiques.map(b => ({
            ...b,
            favoritedAt: favs.find(f => f.targetId === b.id)?.createdAt,
        })),
        raw: favs,
    };
}
//# sourceMappingURL=favorites.service.js.map