"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.blockUser = blockUser;
exports.listGrillmasters = listGrillmasters;
exports.listPendingGrillmasters = listPendingGrillmasters;
exports.approveGrillmaster = approveGrillmaster;
exports.rejectGrillmaster = rejectGrillmaster;
exports.listPendingBoutiques = listPendingBoutiques;
exports.approveBoutique = approveBoutique;
exports.getBoutiqueReferralStats = getBoutiqueReferralStats;
exports.rejectBoutique = rejectBoutique;
exports.listAllOrders = listAllOrders;
exports.markOrderPaid = markOrderPaid;
exports.getDashboardStats = getDashboardStats;
const prisma_1 = require("../../config/prisma");
async function listUsers() {
    return prisma_1.prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
    });
}
async function blockUser(userId) {
    return prisma_1.prisma.user.update({ where: { id: userId }, data: { role: 'CUSTOMER' } });
}
async function listGrillmasters() {
    return prisma_1.prisma.grillmaster.findMany({
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
    });
}
async function listPendingGrillmasters() {
    return prisma_1.prisma.grillmaster.findMany({
        where: { approved: false },
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
    });
}
async function approveGrillmaster(grillmasterId, extras) {
    return prisma_1.prisma.grillmaster.update({
        where: { id: grillmasterId },
        data: {
            approved: true,
            available: true,
            ...(extras?.isChancelado !== undefined ? { isChancelado: extras.isChancelado } : {}),
            ...(extras?.pricePerHour !== undefined ? { pricePerHour: extras.pricePerHour } : {}),
        },
    });
}
async function rejectGrillmaster(grillmasterId) {
    return prisma_1.prisma.grillmaster.update({
        where: { id: grillmasterId },
        data: { approved: false, available: false },
    });
}
async function listPendingBoutiques() {
    return prisma_1.prisma.boutique.findMany({
        where: { approved: false },
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
    });
}
function generateReferralCode(name) {
    const prefix = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'ACOU';
    const suffix = String(Math.floor(1000 + Math.random() * 9000));
    return prefix + suffix;
}
async function approveBoutique(boutiqueId) {
    const boutique = await prisma_1.prisma.boutique.findUnique({ where: { id: boutiqueId } });
    if (!boutique)
        throw new Error('Acougue nao encontrado');
    let referralCode = boutique.referralCode;
    if (!referralCode) {
        let code = generateReferralCode(boutique.name);
        const existing = await prisma_1.prisma.boutique.findUnique({ where: { referralCode: code } });
        if (existing)
            code = generateReferralCode(boutique.name);
        referralCode = code;
    }
    return prisma_1.prisma.boutique.update({ where: { id: boutiqueId }, data: { approved: true, referralCode } });
}
async function getBoutiqueReferralStats(boutiqueId) {
    const [referred, converted] = await Promise.all([
        prisma_1.prisma.user.count({ where: { referredByBoutiqueId: boutiqueId } }),
        prisma_1.prisma.user.count({
            where: {
                referredByBoutiqueId: boutiqueId,
                orders: { some: { paymentStatus: 'PAID' } },
            },
        }),
    ]);
    return { boutiqueId, referred, converted };
}
async function rejectBoutique(boutiqueId) {
    return prisma_1.prisma.boutique.update({ where: { id: boutiqueId }, data: { approved: false } });
}
async function listAllOrders() {
    return prisma_1.prisma.order.findMany({
        include: {
            customer: { select: { name: true, email: true } },
            grillmaster: { include: { user: { select: { name: true } } } },
            boutique: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
}
async function markOrderPaid(orderId) {
    return prisma_1.prisma.order.update({
        where: { id: orderId },
        data: { status: 'COMPLETED', paymentStatus: 'PAID', paidAt: new Date() },
    });
}
async function getDashboardStats() {
    const [totalUsers, totalOrders, totalBoutiques, totalGrillmasters, revenue] = await Promise.all([
        prisma_1.prisma.user.count(),
        prisma_1.prisma.order.count(),
        prisma_1.prisma.boutique.count(),
        prisma_1.prisma.grillmaster.count(),
        prisma_1.prisma.order.aggregate({ _sum: { totalPrice: true } }),
    ]);
    return {
        totalUsers,
        totalOrders,
        totalBoutiques,
        totalGrillmasters,
        totalRevenue: revenue._sum.totalPrice ?? 0,
    };
}
//# sourceMappingURL=admin.service.js.map