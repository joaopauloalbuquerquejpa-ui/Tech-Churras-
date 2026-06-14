"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCoupon = validateCoupon;
exports.listCoupons = listCoupons;
exports.createCoupon = createCoupon;
exports.toggleCoupon = toggleCoupon;
const prisma_1 = require("../../config/prisma");
async function validateCoupon(code, orderValue) {
    const coupon = await prisma_1.prisma.coupon.findUnique({ where: { code: code.toUpperCase().trim() } });
    if (!coupon)
        return { valid: false, reason: 'Cupom nao encontrado' };
    if (!coupon.active)
        return { valid: false, reason: 'Cupom inativo' };
    if (coupon.validUntil && coupon.validUntil < new Date())
        return { valid: false, reason: 'Cupom expirado' };
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses)
        return { valid: false, reason: 'Cupom esgotado' };
    if (coupon.minOrderValue && orderValue < coupon.minOrderValue) {
        return { valid: false, reason: `Pedido minimo de R$ ${coupon.minOrderValue.toFixed(2)}` };
    }
    const raw = coupon.discountType === 'PERCENT'
        ? (orderValue * coupon.discountValue) / 100
        : coupon.discountValue;
    const discountAmount = Math.min(raw, orderValue);
    return { valid: true, coupon, discountAmount };
}
async function listCoupons() {
    return prisma_1.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
}
async function createCoupon(data) {
    return prisma_1.prisma.coupon.create({
        data: {
            code: data.code.toUpperCase().trim(),
            discountType: data.discountType,
            discountValue: data.discountValue,
            minOrderValue: data.minOrderValue ?? null,
            maxUses: data.maxUses ?? null,
            validUntil: data.validUntil ? new Date(data.validUntil) : null,
        },
    });
}
async function toggleCoupon(id, active) {
    return prisma_1.prisma.coupon.update({ where: { id }, data: { active } });
}
//# sourceMappingURL=coupons.service.js.map