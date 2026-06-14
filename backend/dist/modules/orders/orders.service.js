"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrderSchema = void 0;
exports.createOrder = createOrder;
exports.listOrders = listOrders;
exports.updateOrderStatusDetail = updateOrderStatusDetail;
exports.updateOrderStatus = updateOrderStatus;
exports.cancelOrder = cancelOrder;
exports.updateOrderLocation = updateOrderLocation;
exports.generateShareToken = generateShareToken;
exports.getOrderByPublicToken = getOrderByPublicToken;
exports.getRepeatData = getRepeatData;
exports.getOrderById = getOrderById;
const prisma_1 = require("../../config/prisma");
const zod_1 = require("zod");
const crypto_1 = __importDefault(require("crypto"));
const coupons_service_1 = require("../coupons/coupons.service");
const push_service_1 = require("../push/push.service");
exports.createOrderSchema = zod_1.z.object({
    grillmasterId: zod_1.z.string().optional(),
    boutiqueId: zod_1.z.string().optional(),
    eventDate: zod_1.z.string().transform(s => new Date(s)),
    eventAddress: zod_1.z.string().min(5),
    eventHours: zod_1.z.number().int().min(1).default(4),
    guestCount: zod_1.z.number().int().min(1),
    notes: zod_1.z.string().optional(),
    couponCode: zod_1.z.string().optional(),
    items: zod_1.z.array(zod_1.z.object({
        productId: zod_1.z.string(),
        quantity: zod_1.z.number().positive(),
    })).optional(),
});
async function createOrder(customerId, data) {
    const { items, couponCode, ...orderData } = data;
    // Fetch real prices from DB — never trust client-supplied prices
    let itemsWithPrice = [];
    if (items && items.length > 0) {
        const products = await prisma_1.prisma.product.findMany({
            where: { id: { in: items.map(i => i.productId) } },
            select: { id: true, price: true },
        });
        const priceMap = Object.fromEntries(products.map(p => [p.id, p.price]));
        itemsWithPrice = items
            .filter(i => priceMap[i.productId] !== undefined)
            .map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: priceMap[i.productId] }));
    }
    const itemsTotal = itemsWithPrice.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const grillmaster = data.grillmasterId
        ? await prisma_1.prisma.grillmaster.findUnique({ where: { id: data.grillmasterId } })
        : null;
    const grillmasterCost = grillmaster ? grillmaster.pricePerHour * (data.eventHours ?? 4) : 0;
    const subtotal = itemsTotal + grillmasterCost;
    let discountAmount = 0;
    let appliedCouponCode;
    if (couponCode) {
        const result = await (0, coupons_service_1.validateCoupon)(couponCode, subtotal);
        if (result.valid && result.coupon) {
            discountAmount = result.discountAmount;
            appliedCouponCode = result.coupon.code;
        }
    }
    const totalPrice = Math.max(0, subtotal - discountAmount);
    const order = await prisma_1.prisma.order.create({
        data: {
            customerId,
            ...orderData,
            totalPrice,
            couponCode: appliedCouponCode,
            discountAmount,
            items: itemsWithPrice.length > 0 ? { create: itemsWithPrice } : undefined,
        },
        include: { items: true, grillmaster: { include: { user: true } }, boutique: true },
    });
    if (appliedCouponCode) {
        await prisma_1.prisma.coupon.update({
            where: { code: appliedCouponCode },
            data: { usedCount: { increment: 1 } },
        });
    }
    // Notify boutique owner when a new order involves their boutique
    if (order.boutiqueId) {
        prisma_1.prisma.boutique.findUnique({ where: { id: order.boutiqueId } }).then(b => {
            if (b)
                (0, push_service_1.sendPushToUser)(b.userId, 'Novo pedido no seu açougue!', 'Um novo pedido foi criado envolvendo seu açougue.', '/boutiques/dashboard').catch(() => { });
        }).catch(() => { });
    }
    return order;
}
async function listOrders(customerId) {
    const orders = await prisma_1.prisma.order.findMany({
        where: { customerId },
        include: {
            items: { include: { product: true } },
            grillmaster: { include: { user: true } },
            boutique: true,
            review: { select: { id: true, grillRating: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
    const orderIds = orders.map(o => o.id);
    if (orderIds.length === 0)
        return orders.map(o => ({ ...o, _unreadMessages: 0 }));
    const unreadGroups = await prisma_1.prisma.message.groupBy({
        by: ['orderId'],
        where: { orderId: { in: orderIds }, senderId: { not: customerId }, read: false },
        _count: { id: true },
    });
    const unreadMap = {};
    unreadGroups.forEach(g => { unreadMap[g.orderId] = g._count.id; });
    return orders.map(o => ({ ...o, _unreadMessages: unreadMap[o.id] ?? 0 }));
}
async function sendWhatsAppConfirmation(phone, customerName, orderId, grillmasterName, eventDate) {
    const instance = process.env.ZAPI_INSTANCE;
    const token = process.env.ZAPI_TOKEN;
    if (!instance || !token) {
        console.log('[WhatsApp] ZAPI_INSTANCE/ZAPI_TOKEN nao configurados — pulando envio');
        return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const date = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    }).format(eventDate);
    const message = `🔥 Seu churrasco está confirmado! Olá ${customerName}, seu pedido #${orderId.slice(0, 8)} com ${grillmasterName} foi confirmado para ${date}. Acompanhe em: https://www.techchurras.com.br/orders/${orderId}`;
    try {
        const res = await fetch(`https://api.z-api.io/instances/${instance}/token/${token}/send-text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: cleanPhone, message }),
        });
        if (!res.ok)
            console.log('[WhatsApp] Erro:', res.status, await res.text());
        else
            console.log('[WhatsApp] Mensagem enviada para', cleanPhone);
    }
    catch (err) {
        console.log('[WhatsApp] Falha na requisicao:', err);
    }
}
async function updateOrderStatusDetail(id, statusDetail, userId, role) {
    let authorized = false;
    if (role === 'ADMIN') {
        authorized = true;
    }
    else if (role === 'GRILLMASTER') {
        const gm = await prisma_1.prisma.grillmaster.findUnique({ where: { userId } });
        if (gm) {
            const order = await prisma_1.prisma.order.findFirst({ where: { id, grillmasterId: gm.id } });
            authorized = !!order;
        }
    }
    if (!authorized)
        throw new Error('Nao autorizado');
    const updated = await prisma_1.prisma.order.update({ where: { id }, data: { statusDetail } });
    if (statusDetail === 'Churrasqueiro a caminho') {
        (0, push_service_1.sendPushToUser)(updated.customerId, 'Churrasqueiro a caminho!', 'Seu churrasqueiro esta se deslocando ao local do evento.', `/orders/${id}`).catch(() => { });
    }
    return updated;
}
async function updateOrderStatus(id, status, userId, role) {
    if (userId && role !== 'ADMIN') {
        const existing = await prisma_1.prisma.order.findUnique({
            where: { id },
            include: { grillmaster: { select: { userId: true } } },
        });
        if (!existing)
            throw new Error('Pedido nao encontrado');
        const isAssignedGM = existing.grillmaster?.userId === userId;
        if (!isAssignedGM)
            throw new Error('Sem permissao para alterar este pedido');
    }
    const statusDetailMap = {
        CONFIRMED: 'Pedido confirmado',
        IN_PROGRESS: 'Churrasqueiro chegou',
        COMPLETED: 'Finalizado',
    };
    const updated = await prisma_1.prisma.order.update({
        where: { id },
        data: {
            status: status,
            ...(statusDetailMap[status] ? { statusDetail: statusDetailMap[status] } : {}),
        },
        include: {
            customer: true,
            grillmaster: { include: { user: { select: { name: true } } } },
        },
    });
    if (status === 'CONFIRMED') {
        (0, push_service_1.sendPushToUser)(updated.customerId, 'Pedido confirmado!', `Seu churrasco foi confirmado para ${new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(updated.eventDate)}.`, `/orders/${updated.id}`).catch(() => { });
    }
    if (status === 'COMPLETED' && updated.grillmasterId) {
        prisma_1.prisma.grillmaster.findUnique({ where: { id: updated.grillmasterId } }).then(gm => {
            if (gm)
                (0, push_service_1.sendPushToUser)(gm.userId, 'Pedido concluido!', 'Avalie o cliente para finalizar o pedido.', `/orders/${updated.id}/review-customer`).catch(() => { });
        }).catch(() => { });
        if (updated.paymentStatus === 'PAID') {
            const pts = Math.floor(updated.totalPrice / 10);
            if (pts > 0) {
                prisma_1.prisma.user.update({
                    where: { id: updated.customerId },
                    data: { points: { increment: pts } },
                }).catch(() => { });
            }
        }
    }
    if (status === 'CONFIRMED' && updated.customer.phone) {
        const gmName = updated.grillmaster?.user?.name ?? 'churrasqueiro';
        sendWhatsAppConfirmation(updated.customer.phone, updated.customer.name, updated.id, gmName, updated.eventDate).catch(err => console.log('[WhatsApp] Erro:', err));
    }
    return updated;
}
async function cancelOrder(id, userId, role, reason) {
    let whereClause;
    if (role === 'ADMIN') {
        whereClause = { id };
    }
    else if (role === 'GRILLMASTER') {
        const gm = await prisma_1.prisma.grillmaster.findUnique({ where: { userId } });
        if (!gm)
            throw new Error('Churrasqueiro nao encontrado');
        whereClause = { id, grillmasterId: gm.id };
    }
    else {
        whereClause = { id, customerId: userId };
    }
    const order = await prisma_1.prisma.order.findFirst({ where: whereClause });
    if (!order)
        throw new Error('Pedido nao encontrado');
    if (['IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(order.status)) {
        throw new Error('Nao e possivel cancelar um pedido em andamento, concluido ou ja cancelado');
    }
    let cancellationFee = 0;
    if (order.status === 'CONFIRMED') {
        const hoursUntil = (order.eventDate.getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursUntil < 24) {
            cancellationFee = order.totalPrice * 0.5;
        }
        else if (hoursUntil < 48) {
            cancellationFee = order.totalPrice * 0.3;
        }
    }
    const refundAmount = order.paymentStatus === 'PAID' ? order.totalPrice - cancellationFee : null;
    const cancelledBy = role === 'ADMIN' ? 'ADMIN' : role === 'GRILLMASTER' ? 'GRILLMASTER' : 'CUSTOMER';
    return prisma_1.prisma.order.update({
        where: { id },
        data: {
            status: 'CANCELLED',
            cancelledBy,
            cancellationReason: reason || null,
            cancellationFee: cancellationFee > 0 ? cancellationFee : null,
            refundAmount: refundAmount !== null ? refundAmount : undefined,
        },
    });
}
async function updateOrderLocation(id, lat, lng, userId) {
    const gm = await prisma_1.prisma.grillmaster.findUnique({ where: { userId } });
    if (!gm)
        throw new Error('Nao autorizado');
    const order = await prisma_1.prisma.order.findFirst({ where: { id, grillmasterId: gm.id } });
    if (!order)
        throw new Error('Pedido nao encontrado');
    return prisma_1.prisma.order.update({
        where: { id },
        data: { grillmasterLat: lat, grillmasterLng: lng, grillmasterLastUpdate: new Date() },
        select: { id: true, grillmasterLat: true, grillmasterLng: true, grillmasterLastUpdate: true },
    });
}
async function generateShareToken(id, userId, role) {
    let whereClause = { id, customerId: userId };
    if (role === 'ADMIN')
        whereClause = { id };
    const order = await prisma_1.prisma.order.findFirst({ where: whereClause });
    if (!order)
        throw new Error('Pedido nao encontrado');
    if (order.publicShareToken)
        return { token: order.publicShareToken };
    const token = crypto_1.default.randomBytes(12).toString('hex');
    await prisma_1.prisma.order.update({ where: { id }, data: { publicShareToken: token } });
    return { token };
}
async function getOrderByPublicToken(token) {
    const order = await prisma_1.prisma.order.findUnique({
        where: { publicShareToken: token },
        include: {
            grillmaster: { select: { photoUrl: true, user: { select: { name: true } } } },
            boutique: { select: { name: true } },
        },
    });
    if (!order)
        throw new Error('Pedido nao encontrado');
    const addrParts = order.eventAddress.split(',').map(s => s.trim());
    const eventCity = addrParts.length > 1 ? addrParts.slice(-2).join(', ') : order.eventAddress;
    return {
        status: order.status,
        statusDetail: order.statusDetail,
        eventDate: order.eventDate,
        eventCity,
        guestCount: order.guestCount,
        grillmasterFirstName: order.grillmaster?.user?.name?.split(' ')[0] ?? null,
        grillmasterPhotoUrl: order.grillmaster?.photoUrl ?? null,
        boutiqueName: order.boutique?.name ?? null,
        grillmasterLat: order.grillmasterLat,
        grillmasterLng: order.grillmasterLng,
        grillmasterLastUpdate: order.grillmasterLastUpdate,
        eventAddress: order.eventAddress,
    };
}
async function getRepeatData(id, userId, role) {
    const whereClause = role === 'ADMIN' ? { id } : { id, customerId: userId };
    const order = await prisma_1.prisma.order.findFirst({
        where: whereClause,
        include: { items: { include: { product: { select: { id: true, available: true } } } } },
    });
    if (!order)
        throw new Error('Pedido nao encontrado');
    if (order.status !== 'COMPLETED')
        throw new Error('So e possivel repetir pedidos concluidos');
    const unavailableProductIds = [];
    const items = [];
    for (const item of order.items) {
        if (!item.product || !item.product.available) {
            unavailableProductIds.push(item.productId);
        }
        else {
            items.push({ productId: item.productId, quantity: Number(item.quantity) });
        }
    }
    return {
        grillmasterId: order.grillmasterId,
        boutiqueId: order.boutiqueId,
        guestCount: order.guestCount,
        eventHours: order.eventHours,
        items,
        unavailableProductIds,
    };
}
async function getOrderById(id, userId, role = 'CUSTOMER') {
    let whereClause = { id, customerId: userId };
    if (role === 'ADMIN') {
        whereClause = { id };
    }
    else if (role === 'GRILLMASTER') {
        const gm = await prisma_1.prisma.grillmaster.findUnique({ where: { userId } });
        if (!gm)
            throw new Error('Churrasqueiro nao encontrado');
        whereClause = { id, grillmasterId: gm.id };
    }
    const order = await prisma_1.prisma.order.findFirst({
        where: whereClause,
        include: {
            items: { include: { product: true } },
            grillmaster: { include: { user: true } },
            boutique: true,
            review: { select: { id: true, customerRating: true } },
            customer: { select: { id: true, name: true, averageRating: true } },
        },
    });
    if (!order)
        throw new Error('Pedido nao encontrado');
    return order;
}
//# sourceMappingURL=orders.service.js.map