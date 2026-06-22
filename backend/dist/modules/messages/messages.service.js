"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessages = getMessages;
exports.sendMessage = sendMessage;
exports.markMessagesRead = markMessagesRead;
const prisma_1 = require("../../config/prisma");
const push_service_1 = require("../push/push.service");
async function getMessages(orderId, userId) {
    const order = await prisma_1.prisma.order.findFirst({
        where: {
            id: orderId,
            OR: [
                { customerId: userId },
                { grillmaster: { userId } },
            ],
        },
    });
    if (!order)
        throw new Error('Pedido nao encontrado ou acesso negado');
    return prisma_1.prisma.message.findMany({
        where: { orderId },
        include: { sender: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'asc' },
    });
}
async function sendMessage(orderId, senderId, content) {
    const order = await prisma_1.prisma.order.findFirst({
        where: {
            id: orderId,
            OR: [
                { customerId: senderId },
                { grillmaster: { userId: senderId } },
            ],
        },
    });
    if (!order)
        throw new Error('Pedido nao encontrado ou acesso negado');
    const msg = await prisma_1.prisma.message.create({
        data: { orderId, senderId, content },
        include: { sender: { select: { id: true, name: true, role: true } } },
    });
    // Notify recipient
    const recipientId = order.customerId === senderId
        ? null // need grillmaster userId
        : order.customerId;
    if (recipientId) {
        (0, push_service_1.sendPushToUser)(recipientId, 'Nova mensagem', msg.sender.name + ': ' + content.slice(0, 60), `/orders/${orderId}`).catch((e) => console.error("[notif]", e?.message));
    }
    else if (order.grillmasterId) {
        prisma_1.prisma.grillmaster.findUnique({ where: { id: order.grillmasterId } }).then(gm => {
            if (gm)
                (0, push_service_1.sendPushToUser)(gm.userId, 'Nova mensagem', msg.sender.name + ': ' + content.slice(0, 60), `/orders/${orderId}`).catch((e) => console.error("[notif]", e?.message));
        }).catch((e) => console.error("[notif]", e?.message));
    }
    return msg;
}
async function markMessagesRead(orderId, userId) {
    await prisma_1.prisma.message.updateMany({
        where: { orderId, senderId: { not: userId }, read: false },
        data: { read: true },
    });
}
//# sourceMappingURL=messages.service.js.map