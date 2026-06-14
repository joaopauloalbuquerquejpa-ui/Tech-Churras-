"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createKitSchema = exports.updateBoutiqueSchema = exports.createBoutiqueSchema = void 0;
exports.createBoutique = createBoutique;
exports.listBoutiques = listBoutiques;
exports.getBoutiqueById = getBoutiqueById;
exports.getMyBoutique = getMyBoutique;
exports.updateBoutique = updateBoutique;
exports.getKitsByBoutique = getKitsByBoutique;
exports.createKit = createKit;
exports.updateKit = updateKit;
exports.getBoutiqueDashboardStats = getBoutiqueDashboardStats;
exports.getBoutiqueDemandForecast = getBoutiqueDemandForecast;
exports.deleteKit = deleteKit;
const prisma_1 = require("../../config/prisma");
const zod_1 = require("zod");
exports.createBoutiqueSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    description: zod_1.z.string().optional(),
    city: zod_1.z.string().min(2),
    state: zod_1.z.string().min(2),
    address: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional(),
    monthlyFee: zod_1.z.number().optional(),
    commissionRate: zod_1.z.number().optional(),
    logoUrl: zod_1.z.string().optional(),
    facadeUrl: zod_1.z.string().optional(),
    galleryUrls: zod_1.z.array(zod_1.z.string()).optional(),
    instagram: zod_1.z.string().optional(),
    openingHours: zod_1.z.string().optional(),
    deliveryOrPickup: zod_1.z.string().optional(),
});
exports.updateBoutiqueSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    description: zod_1.z.string().optional(),
    city: zod_1.z.string().min(2).optional(),
    state: zod_1.z.string().min(2).optional(),
    address: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    open: zod_1.z.boolean().optional(),
    monthlyFee: zod_1.z.number().optional(),
    commissionRate: zod_1.z.number().optional(),
    logoUrl: zod_1.z.string().optional(),
    facadeUrl: zod_1.z.string().optional(),
    galleryUrls: zod_1.z.array(zod_1.z.string()).optional(),
    instagram: zod_1.z.string().optional(),
    openingHours: zod_1.z.string().optional(),
    deliveryOrPickup: zod_1.z.string().optional(),
});
exports.createKitSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    description: zod_1.z.string(),
    price: zod_1.z.number().positive(),
    discountPrice: zod_1.z.number().positive().nullable().optional(),
    coverImageUrl: zod_1.z.string().optional(),
    minGuests: zod_1.z.number().int().positive(),
    maxGuests: zod_1.z.number().int().positive(),
    items: zod_1.z.string(),
});
async function createBoutique(userId, data) {
    const existing = await prisma_1.prisma.boutique.findUnique({ where: { userId } });
    if (existing)
        throw new Error('Perfil de acougue ja existe');
    return prisma_1.prisma.boutique.create({
        data: { userId, ...data },
        include: { user: { select: { name: true, email: true } } },
    });
}
async function listBoutiques(params = {}) {
    const { city, minRating, sortBy } = params;
    const where = { approved: true };
    if (city)
        where.city = { contains: city, mode: 'insensitive' };
    if (minRating != null)
        where.rating = { gte: minRating };
    const orderBy = sortBy === 'rating_desc' ? { rating: 'desc' } : { rating: 'desc' };
    return prisma_1.prisma.boutique.findMany({
        where,
        include: { user: { select: { name: true, email: true } } },
        orderBy,
    });
}
async function getBoutiqueById(id) {
    const boutique = await prisma_1.prisma.boutique.findUnique({
        where: { id },
        include: {
            user: { select: { name: true, email: true } },
            products: { where: { available: true } },
        },
    });
    if (!boutique)
        throw new Error('Acougue nao encontrado');
    return boutique;
}
async function getMyBoutique(userId) {
    const boutique = await prisma_1.prisma.boutique.findUnique({
        where: { userId },
        include: {
            user: { select: { name: true, email: true } },
            products: { orderBy: { name: 'asc' } },
        },
    });
    if (!boutique)
        throw new Error('Acougue nao encontrado');
    return boutique;
}
async function updateBoutique(userId, data) {
    return prisma_1.prisma.boutique.update({ where: { userId }, data });
}
async function getKitsByBoutique(boutiqueId) {
    return prisma_1.prisma.kitChurrasco.findMany({
        where: { boutiqueId },
        orderBy: { price: 'asc' },
    });
}
async function createKit(userId, data) {
    const boutique = await prisma_1.prisma.boutique.findUnique({ where: { userId } });
    if (!boutique)
        throw new Error('Acougue nao encontrado');
    return prisma_1.prisma.kitChurrasco.create({
        data: { ...data, boutiqueId: boutique.id },
    });
}
async function updateKit(kitId, userId, data) {
    const boutique = await prisma_1.prisma.boutique.findUnique({ where: { userId } });
    if (!boutique)
        throw new Error('Acougue nao encontrado');
    const kit = await prisma_1.prisma.kitChurrasco.findFirst({ where: { id: kitId, boutiqueId: boutique.id } });
    if (!kit)
        throw new Error('Kit nao encontrado');
    return prisma_1.prisma.kitChurrasco.update({ where: { id: kitId }, data });
}
async function getBoutiqueDashboardStats(userId) {
    const boutique = await prisma_1.prisma.boutique.findUnique({ where: { userId } });
    if (!boutique)
        throw new Error('Acougue nao encontrado');
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const [completedOrders, pendingOrdersCount, recentOrders, referralCount] = await Promise.all([
        prisma_1.prisma.order.findMany({
            where: { boutiqueId: boutique.id, status: 'COMPLETED', paymentStatus: 'PAID', createdAt: { gte: thirtyDaysAgo } },
            select: { totalPrice: true, createdAt: true },
        }),
        prisma_1.prisma.order.count({
            where: { boutiqueId: boutique.id, status: { in: ['CONFIRMED', 'IN_PROGRESS'] } },
        }),
        prisma_1.prisma.order.findMany({
            where: { boutiqueId: boutique.id },
            include: { customer: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
            take: 10,
        }),
        prisma_1.prisma.user.count({ where: { referredByBoutiqueId: boutique.id } }),
    ]);
    const totalRevenue30days = completedOrders.reduce((s, o) => s + o.totalPrice, 0);
    const revenueMap = {};
    for (let i = 0; i < 30; i++) {
        const d = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
        revenueMap[d.toISOString().slice(0, 10)] = 0;
    }
    completedOrders.forEach(o => {
        const k = o.createdAt.toISOString().slice(0, 10);
        if (k in revenueMap)
            revenueMap[k] += o.totalPrice;
    });
    return {
        totalRevenue30days,
        totalOrders30days: completedOrders.length,
        revenueByDay: Object.entries(revenueMap).map(([date, revenue]) => ({ date, revenue })),
        pendingOrdersCount,
        recentOrders: recentOrders.map(o => ({
            id: o.id,
            customerName: o.customer.name,
            totalPrice: o.totalPrice,
            status: o.status,
            eventDate: o.eventDate,
        })),
        referralCode: boutique.referralCode,
        referralCount,
    };
}
async function getBoutiqueDemandForecast(userId) {
    const boutique = await prisma_1.prisma.boutique.findUnique({ where: { userId } });
    if (!boutique)
        throw new Error('Acougue nao encontrado');
    const now = new Date();
    const fourteenDaysLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const orders = await prisma_1.prisma.order.findMany({
        where: {
            boutiqueId: boutique.id,
            status: { in: ['CONFIRMED', 'PENDING'] },
            paymentStatus: 'PAID',
            eventDate: { gte: now, lte: fourteenDaysLater },
        },
        include: {
            items: { include: { product: true } },
        },
        orderBy: { eventDate: 'asc' },
    });
    const categoryMap = {};
    for (const order of orders) {
        for (const item of order.items) {
            const cat = item.product.category;
            if (!categoryMap[cat]) {
                categoryMap[cat] = {
                    totalQuantityNeeded: 0,
                    unit: item.product.unit,
                    nextEventDate: order.eventDate,
                    orderIdSet: new Set(),
                };
            }
            categoryMap[cat].totalQuantityNeeded += item.quantity;
            categoryMap[cat].orderIdSet.add(order.id);
        }
    }
    return Object.entries(categoryMap)
        .map(([category, data]) => ({
        category,
        totalQuantityNeeded: +data.totalQuantityNeeded.toFixed(2),
        unit: data.unit,
        eventsCount: data.orderIdSet.size,
        nextEventDate: data.nextEventDate,
    }))
        .sort((a, b) => new Date(a.nextEventDate).getTime() - new Date(b.nextEventDate).getTime());
}
async function deleteKit(kitId, userId) {
    const boutique = await prisma_1.prisma.boutique.findUnique({ where: { userId } });
    if (!boutique)
        throw new Error('Acougue nao encontrado');
    const kit = await prisma_1.prisma.kitChurrasco.findFirst({ where: { id: kitId, boutiqueId: boutique.id } });
    if (!kit)
        throw new Error('Kit nao encontrado');
    await prisma_1.prisma.kitChurrasco.delete({ where: { id: kitId } });
}
//# sourceMappingURL=boutiques.service.js.map