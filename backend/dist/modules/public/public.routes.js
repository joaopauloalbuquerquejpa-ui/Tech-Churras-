"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicRoutes = publicRoutes;
const prisma_1 = require("../../config/prisma");
async function publicRoutes(app) {
    app.get('/public/orders/:token', async (req, reply) => {
        const { token } = req.params;
        const order = await prisma_1.prisma.order.findUnique({
            where: { publicShareToken: token },
            select: {
                id: true,
                status: true,
                statusDetail: true,
                eventDate: true,
                eventAddress: true,
                guestCount: true,
                eventHours: true,
                grillmasterLat: true,
                grillmasterLng: true,
                grillmaster: {
                    select: {
                        city: true,
                        state: true,
                        rating: true,
                        photoUrl: true,
                        user: { select: { name: true } },
                    },
                },
                boutique: { select: { name: true } },
                review: { select: { grillRating: true, grillComment: true } },
            },
        });
        if (!order)
            return reply.status(404).send({ error: 'Pedido nao encontrado' });
        return order;
    });
    // Gallery: reviews with photos, rated >= 4
    app.get('/public/gallery', async (req, reply) => {
        const { page = '1' } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const pageSize = 20;
        const reviews = await prisma_1.prisma.review.findMany({
            where: {
                OR: [{ grillRating: { gte: 4 } }, { customerRating: { gte: 4 } }],
            },
            include: {
                grillmaster: { include: { user: { select: { name: true } } } },
                order: { select: { eventAddress: true, eventDate: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip: (pageNum - 1) * pageSize,
            take: pageSize * 3, // over-fetch since we filter by photos
        });
        const withPhotos = reviews.filter(r => r.photos.length > 0).slice(0, pageSize);
        const total = await prisma_1.prisma.review.count({
            where: { OR: [{ grillRating: { gte: 4 } }, { customerRating: { gte: 4 } }] },
        });
        return {
            items: withPhotos.map(r => ({
                id: r.id,
                photos: r.photos,
                grillComment: r.grillComment,
                grillRating: r.grillRating,
                grillmasterName: r.grillmaster?.user?.name ?? null,
                city: r.order?.eventAddress?.split(',').slice(-1)[0]?.trim() ?? null,
                eventDate: r.order?.eventDate ?? null,
            })),
            page: pageNum,
            total,
        };
    });
    // Top testimonials for homepage (text reviews >= 4 stars)
    app.get('/public/testimonials', async (_req, reply) => {
        const reviews = await prisma_1.prisma.review.findMany({
            where: {
                grillRating: { gte: 4 },
                grillComment: { not: null },
            },
            include: {
                grillmaster: { include: { user: { select: { name: true } } } },
                order: {
                    select: {
                        eventAddress: true,
                        customer: { select: { name: true } },
                    },
                },
            },
            orderBy: [{ grillRating: 'desc' }, { createdAt: 'desc' }],
            take: 20,
        });
        const unique = reviews.filter(r => r.grillComment && r.grillComment.trim().length > 20);
        return unique.slice(0, 8).map(r => ({
            id: r.id,
            rating: r.grillRating,
            comment: r.grillComment,
            grillmasterName: r.grillmaster?.user?.name ?? null,
            customerFirstName: r.order?.customer?.name?.split(' ')[0] ?? 'Cliente',
            city: r.order?.eventAddress?.split(',').slice(-2, -1)[0]?.trim() ?? null,
        }));
    });
    // Referral code lookup (boutique)
    app.get('/ref/:code', { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, async (req, reply) => {
        const { code } = req.params;
        const boutique = await prisma_1.prisma.boutique.findUnique({
            where: { referralCode: code.toUpperCase() },
            select: { id: true, name: true, logoUrl: true, city: true, state: true },
        });
        if (!boutique)
            return reply.status(404).send({ error: 'Codigo de indicacao nao encontrado' });
        return boutique;
    });
    // Customer referral lookup: GET /ref/user/:userId
    app.get('/ref/user/:userId', { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, async (req, reply) => {
        const { userId } = req.params;
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, role: true },
        });
        if (!user || user.role !== 'CUSTOMER')
            return reply.status(404).send({ error: 'Indicacao nao encontrada' });
        return { id: user.id, name: user.name };
    });
}
//# sourceMappingURL=public.routes.js.map