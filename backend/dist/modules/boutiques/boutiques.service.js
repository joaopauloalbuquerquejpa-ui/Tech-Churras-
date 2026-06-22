"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createKitSchema = exports.updateBoutiqueSchema = exports.createBoutiqueSchema = void 0;
exports.createBoutique = createBoutique;
exports.getReferralStats = getReferralStats;
exports.listBoutiques = listBoutiques;
exports.findNearbyBoutiques = findNearbyBoutiques;
exports.getBoutiqueById = getBoutiqueById;
exports.getMyBoutique = getMyBoutique;
exports.updateBoutique = updateBoutique;
exports.getKitsByBoutique = getKitsByBoutique;
exports.createKit = createKit;
exports.updateKit = updateKit;
exports.getBoutiqueDashboardStats = getBoutiqueDashboardStats;
exports.getBoutiqueDemandForecast = getBoutiqueDemandForecast;
exports.deleteKit = deleteKit;
exports.confirmBoutiqueOrderReady = confirmBoutiqueOrderReady;
exports.acceptBoutiqueOrder = acceptBoutiqueOrder;
exports.rejectBoutiqueOrder = rejectBoutiqueOrder;
const prisma_1 = require("../../config/prisma");
const push_service_1 = require("../push/push.service");
const zod_1 = require("zod");
const geo_1 = require("../../utils/geo");
const crypto_1 = require("crypto");
function generateReferralCode(name) {
    const prefix = name.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4).padEnd(4, 'X');
    const suffix = (0, crypto_1.randomBytes)(3).toString('hex').toUpperCase();
    return `${prefix}${suffix}`;
}
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
    let latitude = data.latitude;
    let longitude = data.longitude;
    if ((!latitude || !longitude) && data.address && data.city) {
        const coords = await (0, geo_1.geocodeAddress)(`${data.address}, ${data.city}, ${data.state}`);
        if (coords) {
            latitude = coords.lat;
            longitude = coords.lng;
        }
    }
    const referralCode = generateReferralCode(data.name);
    const boutique = await prisma_1.prisma.boutique.create({
        data: { userId, ...data, latitude, longitude, referralCode },
        include: { user: { select: { name: true, email: true } } },
    });
    // Notify all admins of new partner registration (push + WhatsApp)
    prisma_1.prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } }).then(admins => {
        for (const admin of admins) {
            (0, push_service_1.sendPushToUser)(admin.id, '🥩 Novo açougue!', `${boutique.user?.name} cadastrou ${boutique.name} e aguarda aprovação.`, '/admin').catch((e) => console.error("[notif]", e?.message));
        }
    }).catch((e) => console.error("[notif]", e?.message));
    (0, push_service_1.sendWhatsAppToAdmin)(`🥩 *Novo açougue cadastrado — Tech Churras!*\n\n` +
        `Açougue: ${boutique.name}\n` +
        `Responsável: ${boutique.user?.name}\n` +
        `Email: ${boutique.user?.email}\n` +
        `Cidade: ${boutique.city}, ${boutique.state}\n\n` +
        `⏳ Aguardando sua aprovação:\nhttps://www.techchurras.com.br/admin`).catch((e) => console.error("[notif]", e?.message));
    return boutique;
}
async function getReferralStats(userId) {
    const boutique = await prisma_1.prisma.boutique.findUnique({ where: { userId }, select: { id: true, referralCode: true } });
    if (!boutique)
        throw new Error('Açougue não encontrado');
    const [referredUsers, bonuses] = await Promise.all([
        prisma_1.prisma.user.count({ where: { referredByBoutiqueId: boutique.id } }),
        prisma_1.prisma.payout.findMany({
            where: { type: 'REFERRAL_BONUS', recipientId: boutique.id },
            select: { amount: true, status: true },
        }),
    ]);
    const pendingBonus = bonuses.filter(b => b.status === 'PENDING').reduce((s, b) => s + b.amount, 0);
    const paidBonus = bonuses.filter(b => b.status === 'PAID').reduce((s, b) => s + b.amount, 0);
    const referralLink = `https://www.techchurras.com.br/register?ref=${boutique.referralCode}`;
    return { referralCode: boutique.referralCode, referralLink, totalReferrals: referredUsers, pendingBonus, paidBonus };
}
async function listBoutiques(params = {}) {
    const { city, minRating, sortBy, lat, lng, radiusKm = 15 } = params;
    const where = { approved: true };
    if (city)
        where.city = { contains: city, mode: 'insensitive' };
    if (minRating != null)
        where.rating = { gte: minRating };
    const orderBy = sortBy === 'name_asc' ? { name: 'asc' } : { rating: 'desc' };
    const boutiques = await prisma_1.prisma.boutique.findMany({
        where,
        include: { user: { select: { name: true, email: true } } },
        orderBy,
    });
    if (lat != null && lng != null) {
        return boutiques
            .map(b => ({
            ...b,
            distanceKm: b.latitude && b.longitude
                ? (0, geo_1.haversineKm)(lat, lng, b.latitude, b.longitude)
                : null,
        }))
            .filter(b => b.distanceKm == null || b.distanceKm <= radiusKm)
            .sort((a, b) => {
            if (a.distanceKm == null)
                return 1;
            if (b.distanceKm == null)
                return -1;
            return a.distanceKm - b.distanceKm;
        });
    }
    return boutiques;
}
async function findNearbyBoutiques(lat, lng, radiusKm = 15) {
    const all = await prisma_1.prisma.boutique.findMany({
        where: { approved: true, open: true },
        include: { products: { where: { available: true } } },
    });
    return all
        .filter(b => b.latitude != null && b.longitude != null)
        .map(b => ({ ...b, distanceKm: (0, geo_1.haversineKm)(lat, lng, b.latitude, b.longitude) }))
        .filter(b => b.distanceKm <= radiusKm)
        .sort((a, b) => a.distanceKm - b.distanceKm);
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
            where: { boutiqueId: boutique.id, status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] } },
        }),
        prisma_1.prisma.order.findMany({
            where: { boutiqueId: boutique.id },
            include: {
                customer: { select: { name: true, phone: true } },
                items: { include: { product: { select: { name: true, unit: true } } } },
                grillmaster: { include: { user: { select: { name: true } } } },
            },
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
            customerPhone: o.customer.phone,
            grillmasterName: o.grillmaster?.user?.name ?? null,
            totalPrice: o.totalPrice,
            status: o.status,
            eventDate: o.eventDate,
            guestCount: o.guestCount,
            items: (o.items ?? []).map((i) => ({
                name: i.product?.name ?? '',
                quantity: i.quantity,
                unit: i.product?.unit ?? 'kg',
            })),
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
async function confirmBoutiqueOrderReady(orderId, userId) {
    const boutique = await prisma_1.prisma.boutique.findUnique({ where: { userId } });
    if (!boutique)
        throw new Error('Acougue nao encontrado');
    const order = await prisma_1.prisma.order.findFirst({
        where: { id: orderId, boutiqueId: boutique.id },
        include: {
            grillmaster: { include: { user: { select: { id: true, name: true } } } },
            customer: { select: { id: true } },
        },
    });
    if (!order)
        throw new Error('Pedido nao encontrado');
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
        throw new Error('Pedido nao pode ser confirmado neste status');
    }
    await prisma_1.prisma.order.update({
        where: { id: orderId },
        data: { statusDetail: 'Cortes prontos — retire no balcão' },
    });
    // Push para o churrasqueiro
    if (order.grillmaster?.user?.id) {
        (0, push_service_1.sendPushToUser)(order.grillmaster.user.id, '🥩 Cortes prontos!', `${boutique.name} confirmou que os cortes estão prontos. Pode passar no balcão!`, `/orders/${orderId}`).catch((e) => console.error('[notif]', e?.message));
    }
    // Push para o cliente (transparência)
    (0, push_service_1.sendPushToUser)(order.customer.id, '🔥 Churrasco se formando!', `O açougue confirmou os cortes. Seu churrasqueiro está a caminho do balcão.`, `/orders/${orderId}`).catch((e) => console.error('[notif]', e?.message));
    return { ok: true };
}
async function acceptBoutiqueOrder(orderId, userId) {
    const boutique = await prisma_1.prisma.boutique.findUnique({ where: { userId } });
    if (!boutique)
        throw new Error('Acougue nao encontrado');
    const order = await prisma_1.prisma.order.findFirst({
        where: { id: orderId, boutiqueId: boutique.id, status: 'PENDING' },
        include: {
            customer: { select: { id: true, name: true } },
            grillmaster: { include: { user: { select: { id: true } } } },
        },
    });
    if (!order)
        throw new Error('Pedido nao encontrado ou ja processado');
    await prisma_1.prisma.order.update({ where: { id: orderId }, data: { status: 'CONFIRMED' } });
    (0, push_service_1.sendPushToUser)(order.customer.id, '✅ Pedido aceito!', `${boutique.name} aceitou seu pedido. Estão separando suas carnes!`, `/orders/${orderId}`).catch(() => { });
    if (order.grillmaster?.user?.id) {
        (0, push_service_1.sendPushToUser)(order.grillmaster.user.id, '🥩 Açougue confirmou!', `${boutique.name} confirmou os itens do evento. Prepare-se!`, `/orders/${orderId}`).catch(() => { });
    }
    return { ok: true };
}
async function rejectBoutiqueOrder(orderId, userId, reason) {
    const boutique = await prisma_1.prisma.boutique.findUnique({ where: { userId } });
    if (!boutique)
        throw new Error('Acougue nao encontrado');
    const order = await prisma_1.prisma.order.findFirst({
        where: { id: orderId, boutiqueId: boutique.id, status: { in: ['PENDING', 'CONFIRMED'] } },
        include: { customer: { select: { id: true } } },
    });
    if (!order)
        throw new Error('Pedido nao encontrado ou ja processado');
    await prisma_1.prisma.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED', cancelledBy: 'BOUTIQUE', cancellationReason: reason ?? 'Açougue não pode atender este pedido' },
    });
    (0, push_service_1.sendPushToUser)(order.customer.id, '❌ Pedido cancelado', `${boutique.name} não pode atender este pedido. Estamos buscando alternativas.`, `/orders/${orderId}`).catch(() => { });
    return { ok: true };
}
//# sourceMappingURL=boutiques.service.js.map