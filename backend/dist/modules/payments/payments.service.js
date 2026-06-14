"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPreference = createPreference;
exports.handleMPWebhook = handleMPWebhook;
const mercadopago_1 = require("mercadopago");
const prisma_1 = require("../../config/prisma");
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
    catch {
        return { received: true };
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
            },
        });
    }
    return { received: true };
}
//# sourceMappingURL=payments.service.js.map