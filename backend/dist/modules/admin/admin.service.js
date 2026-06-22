"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateGrillmasterProfile = updateGrillmasterProfile;
exports.listUsers = listUsers;
exports.blockUser = blockUser;
exports.listGrillmasters = listGrillmasters;
exports.listPendingGrillmasters = listPendingGrillmasters;
exports.approveGrillmaster = approveGrillmaster;
exports.rejectGrillmaster = rejectGrillmaster;
exports.listPendingBoutiques = listPendingBoutiques;
exports.approveBoutique = approveBoutique;
exports.rejectBoutique = rejectBoutique;
exports.getBoutiqueReferralStats = getBoutiqueReferralStats;
exports.listAllOrders = listAllOrders;
exports.markOrderPaid = markOrderPaid;
exports.getDashboardStats = getDashboardStats;
const prisma_1 = require("../../config/prisma");
const push_service_1 = require("../push/push.service");
const email_service_1 = require("../email/email.service");
async function sendWhatsApp(phone, message, label) {
    const instance = process.env.ZAPI_INSTANCE;
    const token = process.env.ZAPI_TOKEN;
    if (!instance || !token)
        return;
    const clean = phone.replace(/\D/g, '');
    try {
        const res = await fetch(`https://api.z-api.io/instances/${instance}/token/${token}/send-text`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: clean, message }) });
        if (!res.ok)
            console.log(`[WhatsApp] ${label} erro:`, res.status);
    }
    catch { }
}
const GRILLMASTER_EDITABLE_FIELDS = new Set([
    'bio', 'experience', 'pricePerHour', 'city', 'state', 'specialties',
    'available', 'isChancelado', 'photoUrl', 'churrascoStyle',
    'bringsEquipment', 'minGuests', 'maxGuests', 'instagram', 'videoUrl',
]);
async function updateGrillmasterProfile(grillmasterId, data) {
    const safe = Object.fromEntries(Object.entries(data).filter(([k]) => GRILLMASTER_EDITABLE_FIELDS.has(k)));
    return prisma_1.prisma.grillmaster.update({ where: { id: grillmasterId }, data: safe });
}
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
        include: { user: { select: { name: true, email: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
    });
}
async function approveGrillmaster(grillmasterId, extras) {
    const gm = await prisma_1.prisma.grillmaster.findUnique({
        where: { id: grillmasterId },
        include: { user: { select: { id: true, name: true, email: true, phone: true } } },
    });
    const updated = await prisma_1.prisma.grillmaster.update({
        where: { id: grillmasterId },
        data: {
            approved: true,
            available: true,
            ...(extras?.isChancelado !== undefined ? { isChancelado: extras.isChancelado } : {}),
            ...(extras?.pricePerHour !== undefined ? { pricePerHour: extras.pricePerHour } : {}),
        },
    });
    if (gm?.user) {
        const name = gm.user.name.split(' ')[0];
        (0, push_service_1.sendPushToUser)(gm.user.id, '🎉 Perfil aprovado!', `Parabéns ${name}! Você já está ativo na Tech Churras e pode receber pedidos.`, '/grillmasters/dashboard').catch((e) => console.error("[notif]", e?.message));
        (0, email_service_1.emailPartnerApproved)(gm.user.email, gm.user.name, 'GRILLMASTER', 'https://www.techchurras.com.br/grillmasters/dashboard').catch((e) => console.error("[notif]", e?.message));
        if (gm.user.phone) {
            sendWhatsApp(gm.user.phone, `🔥 Parabéns ${name}! Seu perfil de churrasqueiro foi *aprovado* na Tech Churras!\n\nVocê já pode receber pedidos. Acesse seu painel:\nhttps://www.techchurras.com.br/grillmasters/dashboard`, 'gm-aprovado').catch((e) => console.error("[notif]", e?.message));
        }
    }
    return updated;
}
async function rejectGrillmaster(grillmasterId) {
    const gm = await prisma_1.prisma.grillmaster.findUnique({
        where: { id: grillmasterId },
        include: { user: { select: { id: true, name: true } } },
    });
    const updated = await prisma_1.prisma.grillmaster.update({
        where: { id: grillmasterId },
        data: { approved: false, available: false },
    });
    if (gm?.user) {
        (0, push_service_1.sendPushToUser)(gm.user.id, 'Perfil em revisão', 'Precisamos de mais informações sobre seu perfil. Entre em contato com o suporte.', '/grillmasters/dashboard').catch((e) => console.error("[notif]", e?.message));
    }
    return updated;
}
async function listPendingBoutiques() {
    return prisma_1.prisma.boutique.findMany({
        where: { approved: false },
        include: { user: { select: { name: true, email: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
    });
}
function generateReferralCode(name) {
    const prefix = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'ACOU';
    const suffix = String(Math.floor(1000 + Math.random() * 9000));
    return prefix + suffix;
}
async function approveBoutique(boutiqueId) {
    const boutique = await prisma_1.prisma.boutique.findUnique({
        where: { id: boutiqueId },
        include: { user: { select: { id: true, name: true, email: true, phone: true } } },
    });
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
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 60);
    const updated = await prisma_1.prisma.boutique.update({ where: { id: boutiqueId }, data: { approved: true, referralCode, trialEndsAt } });
    if (boutique.user) {
        const name = boutique.user.name.split(' ')[0];
        (0, push_service_1.sendPushToUser)(boutique.user.id, '🎉 Açougue aprovado! 60 dias grátis iniciados.', `Parabéns ${name}! O açougue ${boutique.name} está ativo. Aproveite seus 60 dias de uso gratuito!`, '/boutiques/dashboard').catch((e) => console.error("[notif]", e?.message));
        (0, email_service_1.emailPartnerApproved)(boutique.user.email, boutique.user.name, 'BOUTIQUE', 'https://www.techchurras.com.br/boutiques/dashboard').catch((e) => console.error("[notif]", e?.message));
        if (boutique.user.phone) {
            sendWhatsApp(boutique.user.phone, `🥩 Parabéns ${name}! O açougue *${boutique.name}* foi *aprovado* na Tech Churras!\n\n🎁 Você tem *60 dias GRÁTIS* para testar tudo.\n\n*QR code do seu balcão:*\nhttps://www.techchurras.com.br/pedido?boutique=${boutique.id}\n\nAcesse seu painel completo:\nhttps://www.techchurras.com.br/boutiques/dashboard`, 'boutique-aprovado').catch((e) => console.error("[notif]", e?.message));
        }
    }
    return updated;
}
async function rejectBoutique(boutiqueId) {
    const boutique = await prisma_1.prisma.boutique.findUnique({
        where: { id: boutiqueId },
        include: { user: { select: { id: true, name: true } } },
    });
    const updated = await prisma_1.prisma.boutique.update({ where: { id: boutiqueId }, data: { approved: false } });
    if (boutique?.user) {
        (0, push_service_1.sendPushToUser)(boutique.user.id, 'Cadastro em revisão', 'Precisamos de mais informações sobre seu açougue. Entre em contato com o suporte.', '/boutiques/dashboard').catch((e) => console.error("[notif]", e?.message));
    }
    return updated;
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
async function listAllOrders() {
    return prisma_1.prisma.order.findMany({
        include: {
            customer: { select: { name: true, email: true, phone: true } },
            grillmaster: { include: { user: { select: { name: true, phone: true } } } },
            boutique: { select: { name: true } },
            items: { include: { product: { select: { name: true, price: true, unit: true } } } },
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
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);
    const [totalUsers, totalOrders, totalBoutiques, totalGrillmasters, revenue, ordersToday, revenueToday, usersToday, activeOrders, revenueWeek,] = await Promise.all([
        prisma_1.prisma.user.count(),
        prisma_1.prisma.order.count(),
        prisma_1.prisma.boutique.count(),
        prisma_1.prisma.grillmaster.count(),
        prisma_1.prisma.order.aggregate({ _sum: { totalPrice: true } }),
        prisma_1.prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
        prisma_1.prisma.order.aggregate({ where: { createdAt: { gte: todayStart } }, _sum: { totalPrice: true } }),
        prisma_1.prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
        prisma_1.prisma.order.count({ where: { status: { in: ['CONFIRMED', 'IN_PROGRESS'] } } }),
        prisma_1.prisma.order.aggregate({ where: { createdAt: { gte: weekStart } }, _sum: { totalPrice: true } }),
    ]);
    return {
        totalUsers,
        totalOrders,
        totalBoutiques,
        totalGrillmasters,
        totalRevenue: revenue._sum.totalPrice ?? 0,
        ordersToday,
        revenueToday: revenueToday._sum.totalPrice ?? 0,
        usersToday,
        activeOrders,
        revenueWeek: revenueWeek._sum.totalPrice ?? 0,
    };
}
//# sourceMappingURL=admin.service.js.map