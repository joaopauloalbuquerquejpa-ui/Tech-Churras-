"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cronRoutes = cronRoutes;
const prisma_1 = require("../../config/prisma");
async function sendWhatsAppReminder(phone, customerName, orderId, eventDate, hoursLabel) {
    const instance = process.env.ZAPI_INSTANCE;
    const token = process.env.ZAPI_TOKEN;
    if (!instance || !token)
        return;
    const cleanPhone = phone.replace(/\D/g, '');
    const date = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    }).format(eventDate);
    const message = `🔥 Lembrete Tech Churras! Olá ${customerName}, seu churrasco está agendado para daqui a ${hoursLabel} — ${date}. Acompanhe: https://www.techchurras.com.br/orders/${orderId}`;
    try {
        const res = await fetch(`https://api.z-api.io/instances/${instance}/token/${token}/send-text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: cleanPhone, message }),
        });
        if (!res.ok)
            console.log('[Reminder WhatsApp] Erro:', res.status, await res.text());
        else
            console.log('[Reminder WhatsApp] Enviado para', cleanPhone);
    }
    catch (err) {
        console.log('[Reminder WhatsApp] Falha:', err);
    }
}
async function cronRoutes(app) {
    app.get('/cron/event-reminders', async (req, reply) => {
        if (req.headers['x-cron-secret'] !== process.env.CRON_SECRET) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }
        const now = new Date();
        const window48start = new Date(now.getTime() + 47 * 60 * 60 * 1000);
        const window48end = new Date(now.getTime() + 49 * 60 * 60 * 1000);
        const window24start = new Date(now.getTime() + 23 * 60 * 60 * 1000);
        const window24end = new Date(now.getTime() + 25 * 60 * 60 * 1000);
        const [orders48, orders24] = await Promise.all([
            prisma_1.prisma.order.findMany({
                where: {
                    status: 'CONFIRMED',
                    reminder48hSent: false,
                    eventDate: { gte: window48start, lte: window48end },
                },
                include: { customer: true },
            }),
            prisma_1.prisma.order.findMany({
                where: {
                    status: 'CONFIRMED',
                    reminder24hSent: false,
                    eventDate: { gte: window24start, lte: window24end },
                },
                include: { customer: true },
            }),
        ]);
        let sent48 = 0;
        let sent24 = 0;
        for (const order of orders48) {
            if (order.customer.phone) {
                await sendWhatsAppReminder(order.customer.phone, order.customer.name, order.id, order.eventDate, '48 horas');
            }
            await prisma_1.prisma.order.update({ where: { id: order.id }, data: { reminder48hSent: true } });
            sent48++;
        }
        for (const order of orders24) {
            if (order.customer.phone) {
                await sendWhatsAppReminder(order.customer.phone, order.customer.name, order.id, order.eventDate, '24 horas');
            }
            await prisma_1.prisma.order.update({ where: { id: order.id }, data: { reminder24hSent: true } });
            sent24++;
        }
        return { ok: true, sent48, sent24 };
    });
}
//# sourceMappingURL=cron.routes.js.map