"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPayouts = listPayouts;
exports.getPayoutsSummary = getPayoutsSummary;
exports.generatePayouts = generatePayouts;
exports.markPayoutPaid = markPayoutPaid;
const prisma_1 = require("../../../config/prisma");
function getWeekBounds(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { monday, sunday };
}
async function listPayouts(status, weekStart, type) {
    const where = {};
    if (status)
        where.status = status;
    if (type)
        where.type = type;
    if (weekStart) {
        const d = new Date(weekStart);
        where.weekStart = { gte: d, lt: new Date(d.getTime() + 7 * 24 * 60 * 60 * 1000) };
    }
    const payouts = await prisma_1.prisma.payout.findMany({ where, orderBy: { createdAt: 'desc' } });
    const gmIds = payouts.filter(p => p.type === 'GRILLMASTER').map(p => p.recipientId);
    const btIds = payouts.filter(p => p.type === 'BOUTIQUE').map(p => p.recipientId);
    const [gms, bts] = await Promise.all([
        gmIds.length > 0
            ? prisma_1.prisma.grillmaster.findMany({
                where: { id: { in: gmIds } },
                include: { user: { select: { name: true } } },
            })
            : [],
        btIds.length > 0
            ? prisma_1.prisma.boutique.findMany({ where: { id: { in: btIds } }, select: { id: true, name: true } })
            : [],
    ]);
    const gmMap = new Map(gms.map(g => [g.id, g.user.name]));
    const btMap = new Map(bts.map(b => [b.id, b.name]));
    return payouts.map(p => ({
        ...p,
        recipientName: p.type === 'GRILLMASTER'
            ? (gmMap.get(p.recipientId) ?? 'Churrasqueiro')
            : (btMap.get(p.recipientId) ?? 'Acougue'),
    }));
}
async function getPayoutsSummary() {
    const { monday, sunday } = getWeekBounds();
    const payouts = await prisma_1.prisma.payout.findMany({
        where: { weekStart: { gte: monday, lte: sunday } },
    });
    const pending = payouts.filter(p => p.status === 'PENDING');
    const paid = payouts.filter(p => p.status === 'PAID');
    return {
        weekStart: monday,
        weekEnd: sunday,
        totalPending: +pending.reduce((s, p) => s + p.amount, 0).toFixed(2),
        totalPaid: +paid.reduce((s, p) => s + p.amount, 0).toFixed(2),
        totalCommission: +payouts.reduce((s, p) => s + (p.grossAmount - p.amount), 0).toFixed(2),
        count: { pending: pending.length, paid: paid.length, total: payouts.length },
    };
}
async function generatePayouts() {
    const { monday, sunday } = getWeekBounds();
    const COMMISSION = 7;
    const orders = await prisma_1.prisma.order.findMany({
        where: { status: 'COMPLETED', paymentStatus: 'PAID' },
        include: {
            grillmaster: { select: { id: true, pixKey: true, pricePerHour: true } },
            boutique: { select: { id: true, pixKey: true } },
            items: { select: { unitPrice: true, quantity: true } },
        },
    });
    if (orders.length === 0) {
        return { created: 0, skipped: 0, message: 'Nenhum pedido elegivel encontrado.' };
    }
    const existing = await prisma_1.prisma.payout.findMany({
        where: { orderId: { in: orders.map(o => o.id) } },
        select: { orderId: true, type: true },
    });
    const existingSet = new Set(existing.map(p => `${p.orderId}:${p.type}`));
    const toCreate = [];
    for (const order of orders) {
        // Mão de obra do churrasqueiro = pricePerHour × eventHours
        if (order.grillmasterId && !existingSet.has(`${order.id}:GRILLMASTER`)) {
            const laborGross = order.grillmaster
                ? +(order.grillmaster.pricePerHour * order.eventHours).toFixed(2)
                : 0;
            if (laborGross > 0) {
                toCreate.push({
                    type: 'GRILLMASTER',
                    recipientId: order.grillmasterId,
                    orderId: order.id,
                    grossAmount: laborGross,
                    commission: COMMISSION,
                    amount: +(laborGross * 0.93).toFixed(2),
                    weekStart: monday,
                    weekEnd: sunday,
                    pixKey: order.grillmaster?.pixKey ?? null,
                });
            }
        }
        // Produtos do açougue = soma dos OrderItems
        if (order.boutiqueId && !existingSet.has(`${order.id}:BOUTIQUE`)) {
            const productsGross = +order.items
                .reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
                .toFixed(2);
            if (productsGross > 0) {
                toCreate.push({
                    type: 'BOUTIQUE',
                    recipientId: order.boutiqueId,
                    orderId: order.id,
                    grossAmount: productsGross,
                    commission: COMMISSION,
                    amount: +(productsGross * 0.93).toFixed(2),
                    weekStart: monday,
                    weekEnd: sunday,
                    pixKey: order.boutique?.pixKey ?? null,
                });
            }
        }
    }
    if (toCreate.length > 0) {
        await prisma_1.prisma.payout.createMany({ data: toCreate });
    }
    return {
        created: toCreate.length,
        skipped: existing.length,
        message: `${toCreate.length} repasse(s) gerado(s). ${existing.length} ja existiam.`,
    };
}
async function markPayoutPaid(payoutId) {
    return prisma_1.prisma.payout.update({
        where: { id: payoutId },
        data: { status: 'PAID', paidAt: new Date() },
    });
}
//# sourceMappingURL=payouts.service.js.map