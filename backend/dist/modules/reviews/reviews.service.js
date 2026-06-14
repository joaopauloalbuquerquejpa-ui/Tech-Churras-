"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReview = createReview;
exports.createCustomerReview = createCustomerReview;
exports.listGrillmasterReviews = listGrillmasterReviews;
exports.listBoutiqueReviews = listBoutiqueReviews;
const prisma_1 = require("../../config/prisma");
async function createReview(data) {
    const order = await prisma_1.prisma.order.findUnique({
        where: { id: data.orderId },
        include: { review: true },
    });
    if (!order)
        throw new Error('Pedido nao encontrado');
    if (order.customerId !== data.customerId)
        throw new Error('Nao autorizado');
    if (order.status !== 'COMPLETED')
        throw new Error('So e possivel avaliar pedidos concluidos');
    if (order.review && order.review.grillRating != null)
        throw new Error('Pedido ja foi avaliado');
    let review;
    if (order.review) {
        review = await prisma_1.prisma.review.update({
            where: { id: order.review.id },
            data: {
                grillRating: data.grillRating,
                boutiqueRating: data.boutiqueRating ?? undefined,
                grillComment: data.grillComment ?? undefined,
                boutiqueComment: data.boutiqueComment ?? undefined,
                photos: data.photos ?? [],
            },
        });
    }
    else {
        review = await prisma_1.prisma.review.create({
            data: {
                orderId: data.orderId,
                customerId: data.customerId,
                grillmasterId: order.grillmasterId ?? undefined,
                boutiqueId: order.boutiqueId ?? undefined,
                grillRating: data.grillRating,
                boutiqueRating: data.boutiqueRating ?? undefined,
                grillComment: data.grillComment ?? undefined,
                boutiqueComment: data.boutiqueComment ?? undefined,
                photos: data.photos ?? [],
            },
        });
    }
    if (order.grillmasterId) {
        const reviews = await prisma_1.prisma.review.findMany({
            where: { grillmasterId: order.grillmasterId, grillRating: { not: null } },
        });
        const avg = reviews.reduce((acc, r) => acc + (r.grillRating ?? 0), 0) / reviews.length;
        await prisma_1.prisma.grillmaster.update({
            where: { id: order.grillmasterId },
            data: { rating: Math.round(avg * 10) / 10 },
        });
    }
    if (order.boutiqueId && data.boutiqueRating) {
        const reviews = await prisma_1.prisma.review.findMany({
            where: { boutiqueId: order.boutiqueId, boutiqueRating: { not: null } },
        });
        const avg = reviews.reduce((acc, r) => acc + (r.boutiqueRating ?? 0), 0) / reviews.length;
        await prisma_1.prisma.boutique.update({
            where: { id: order.boutiqueId },
            data: { rating: Math.round(avg * 10) / 10 },
        });
    }
    return review;
}
async function createCustomerReview(data) {
    const order = await prisma_1.prisma.order.findUnique({
        where: { id: data.orderId },
        include: { review: true, grillmaster: true },
    });
    if (!order)
        throw new Error('Pedido nao encontrado');
    if (order.grillmaster?.userId !== data.grillmasterUserId)
        throw new Error('Nao autorizado');
    if (order.status !== 'COMPLETED')
        throw new Error('So e possivel avaliar pedidos concluidos');
    if (order.review?.customerRating != null)
        throw new Error('Cliente ja foi avaliado');
    let review;
    if (order.review) {
        review = await prisma_1.prisma.review.update({
            where: { id: order.review.id },
            data: { customerRating: data.customerRating, customerComment: data.customerComment },
        });
    }
    else {
        review = await prisma_1.prisma.review.create({
            data: {
                orderId: data.orderId,
                customerId: order.customerId,
                grillmasterId: order.grillmasterId ?? undefined,
                boutiqueId: order.boutiqueId ?? undefined,
                customerRating: data.customerRating,
                customerComment: data.customerComment,
            },
        });
    }
    const customerReviews = await prisma_1.prisma.review.findMany({
        where: { customerRating: { not: null }, order: { customerId: order.customerId } },
    });
    if (customerReviews.length > 0) {
        const avg = customerReviews.reduce((acc, r) => acc + (r.customerRating ?? 0), 0) / customerReviews.length;
        await prisma_1.prisma.user.update({
            where: { id: order.customerId },
            data: { averageRating: Math.round(avg * 10) / 10 },
        });
    }
    return review;
}
async function listGrillmasterReviews(grillmasterId) {
    return prisma_1.prisma.review.findMany({
        where: { grillmasterId },
        include: { customer: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
    });
}
async function listBoutiqueReviews(boutiqueId) {
    return prisma_1.prisma.review.findMany({
        where: { boutiqueId },
        include: { customer: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
    });
}
//# sourceMappingURL=reviews.service.js.map