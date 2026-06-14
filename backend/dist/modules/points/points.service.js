"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPointsBalance = getPointsBalance;
exports.redeemPoints = redeemPoints;
exports.listRedemptions = listRedemptions;
const prisma_1 = require("../../config/prisma");
const crypto_1 = __importDefault(require("crypto"));
async function getPointsBalance(userId) {
    const user = await prisma_1.prisma.user.findUnique({ where: { id: userId }, select: { points: true } });
    if (!user)
        throw new Error('Usuario nao encontrado');
    const points = user.points;
    const valueInReais = (Math.floor(points / 100)) * 10;
    return { points, valueInReais };
}
async function redeemPoints(userId) {
    const user = await prisma_1.prisma.user.findUnique({ where: { id: userId }, select: { points: true } });
    if (!user)
        throw new Error('Usuario nao encontrado');
    if (user.points < 100)
        throw new Error('Voce precisa de pelo menos 100 pontos para resgatar');
    const pointsToRedeem = Math.floor(user.points / 100) * 100;
    const discountValue = (pointsToRedeem / 100) * 10;
    const couponCode = 'PONTOS-' + crypto_1.default.randomBytes(4).toString('hex').toUpperCase();
    await prisma_1.prisma.$transaction([
        prisma_1.prisma.user.update({
            where: { id: userId },
            data: { points: { decrement: pointsToRedeem } },
        }),
        prisma_1.prisma.coupon.create({
            data: {
                code: couponCode,
                discountType: 'FIXED',
                discountValue,
                maxUses: 1,
                active: true,
            },
        }),
        prisma_1.prisma.pointsRedemption.create({
            data: {
                userId,
                pointsUsed: pointsToRedeem,
                discountValue,
                couponCode,
            },
        }),
    ]);
    return { couponCode, pointsUsed: pointsToRedeem, discountValue };
}
async function listRedemptions(userId) {
    return prisma_1.prisma.pointsRedemption.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
}
//# sourceMappingURL=points.service.js.map