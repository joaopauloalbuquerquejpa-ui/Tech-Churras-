"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPreference = createPreference;
exports.handleMPWebhook = handleMPWebhook;
const mercadopago_1 = require("mercadopago");
const prisma_1 = require("../../config/prisma");
const push_service_1 = require("../push/push.service");
const email_service_1 = require("../email/email.service");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'https://www.techchurras.com.br';
const BACKEND_URL = process.env.BACKEND_URL ?? 'https://tech-churras-production.up.railway.app';
function getClients() {
    const token = process.env.MP_ACCESS_TOKEN;
    if (!token)
        throw new Error('MP_ACCESS_TOKEN nao configurado. Adicione no Railway.');
    const client = new mercadopago_1.MercadoPagoConfig({ accessToken: token });
    return { preference: new mercadopago_1.Preference(client), payment: new mercadopago_1.Payment(client), token };
}
async function createPreference(orderId, customerId) {
    const order = await prisma_1.prisma.order.findFirst({
        where: { id: orderId, customerId },
        include: { grillmaster: { include: { user: true } }, boutique: true },
    });
    if (!order)
        throw new Error('Pedido nao encontrado');
    if (!order.totalPrice || order.totalPrice <= 0)
        throw new Error('Pedido sem valor - nada a pagar');
    const gmName = order.grillmaster?.user?.name ?? 'Grillmaster';
    const title = `Churrasco - ${gmName} - Pedido #${order.id.slice(0, 8)}`;
    const { preference: preferenceClient, token } = getClients();
    const result = await preferenceClient.create({
        body: {
            items: [
                {
                    id: order.id,
                    title,
                    quantity: 1,
                    unit_price: order.totalPrice,
                    currency_id: 'BRL',
                },
            ],
            back_urls: {
                success: `${FRONTEND_URL}/orders/${order.id}?payment=success`,
                failure: `${FRONTEND_URL}/orders/${order.id}?payment=failure`,
                pending: `${FRONTEND_URL}/orders/${order.id}?payment=pending`,
            },
            auto_return: 'approved',
            external_reference: order.id,
            notification_url: `${BACKEND_URL}/payments/webhook`,
        },
    });
    await prisma_1.prisma.order.update({
        where: { id: orderId },
        data: { paymentId: result.id },
    });
    const isSandbox = token.startsWith('TEST-');
    return {
        checkout_url: isSandbox ? result.sandbox_init_point : result.init_point,
        preferenceId: result.id,
        amount: order.totalPrice,
    };
}
async function handleMPWebhook(payload) {
    const type = payload?.type;
    const paymentId = payload?.data?.id;
    if (type !== 'payment' || !paymentId)
        return { received: true };
    const { payment: paymentClient } = getClients();
    let payment;
    try {
        payment = await paymentClient.get({ id: paymentId });
    }
    catch (err) {
        console.error(`[webhook] Falha ao buscar pagamento ${paymentId} no MP:`, err?.message);
        throw new Error(`Falha ao buscar pagamento ${paymentId}`);
    }
    if (payment.status === 'approved') {
        const orderId = payment.external_reference;
        if (!orderId)
            return { received: true };
        await prisma_1.prisma.order.updateMany({
            where: { id: orderId },
            data: {
                paymentId: String(paymentId),
                paymentStatus: 'PAID',
                paidAt: new Date(),
                status: 'CONFIRMED',
                statusDetail: 'Pedido confirmado',
            },
        });
        // Notify GM and customer of payment-confirmed order
        const order = await prisma_1.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                grillmaster: { include: { user: { select: { id: true, name: true } } } },
                customer: { select: { id: true, name: true, email: true } },
            },
        });
        if (order?.grillmaster?.user) {
            const date = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(order.eventDate);
            (0, push_service_1.sendPushToUser)(order.grillmaster.user.id, '💳 Pagamento confirmado!', `${order.customer.name} pagou. Evento em ${date}. Confirme sua presença.`, '/grillmasters/dashboard').catch((e) => console.error("[notif]", e?.message));
        }
        if (order?.customer) {
            (0, push_service_1.sendPushToUser)(order.customer.id, '✅ Pagamento confirmado!', 'Seu churrasco está confirmado! Acompanhe os detalhes no app.', `/orders/${orderId}`).catch((e) => console.error("[notif]", e?.message));
            (0, email_service_1.emailOrderConfirmed)(order.customer.email, order.customer.name, orderId, order.grillmaster?.user?.name ?? 'churrasqueiro', order.eventDate, order.eventAddress ?? '').catch((e) => console.error("[notif]", e?.message));
            triggerReferralBonus(order.customer.id, orderId).catch((e) => console.error("[notif]", e?.message));
        }
        if (order) {
            const date = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).format(order.eventDate);
            (0, push_service_1.sendWhatsAppToAdmin)(`💳 *Pagamento confirmado — Tech Churras!*\n\n` +
                `👤 ${order.customer?.name}\n` +
                `💰 R$ ${order.totalPrice.toFixed(2)}\n` +
                `📅 ${date} · ${order.guestCount} pessoas\n` +
                `🔥 GM: ${order.grillmaster?.user?.name ?? '—'}\n\n` +
                `Dinheiro a caminho! 🎉\nhttps://www.techchurras.com.br/admin`).catch((e) => console.error("[notif]", e?.message));
        }
    }
    return { received: true };
}
async function triggerReferralBonus(customerId, orderId) {
    const customer = await prisma_1.prisma.user.findUnique({
        where: { id: customerId },
        select: { referredByBoutiqueId: true },
    });
    if (!customer?.referredByBoutiqueId)
        return;
    // Only on first paid order
    const previousPaid = await prisma_1.prisma.order.count({
        where: { customerId, paymentStatus: 'PAID', id: { not: orderId } },
    });
    if (previousPaid > 0)
        return;
    // Avoid duplicate bonus
    const exists = await prisma_1.prisma.payout.findFirst({
        where: { type: 'REFERRAL_BONUS', recipientId: customer.referredByBoutiqueId, notes: customerId },
    });
    if (exists)
        return;
    const boutique = await prisma_1.prisma.boutique.findUnique({
        where: { id: customer.referredByBoutiqueId },
        select: { pixKey: true, userId: true },
    });
    const now = new Date();
    await prisma_1.prisma.payout.create({
        data: {
            type: 'REFERRAL_BONUS',
            recipientId: customer.referredByBoutiqueId,
            orderId,
            amount: 40,
            commission: 0,
            grossAmount: 40,
            status: 'PENDING',
            weekStart: now,
            weekEnd: now,
            pixKey: boutique?.pixKey ?? null,
            notes: customerId,
        },
    });
    // Notify boutique owner
    if (boutique?.userId) {
        (0, push_service_1.sendPushToUser)(boutique.userId, '🎉 Bônus de indicação!', 'Você ganhou R$ 40 por converter um novo cliente para a Tech Churras.', '/boutiques/dashboard').catch((e) => console.error("[notif]", e?.message));
    }
}
//# sourceMappingURL=payments.service.js.map