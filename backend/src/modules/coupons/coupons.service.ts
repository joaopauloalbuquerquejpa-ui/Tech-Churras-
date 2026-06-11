import { prisma } from '../../config/prisma'

export async function validateCoupon(code: string, orderValue: number) {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase().trim() } })
  if (!coupon) return { valid: false, reason: 'Cupom nao encontrado' }
  if (!coupon.active) return { valid: false, reason: 'Cupom inativo' }
  if (coupon.validUntil && coupon.validUntil < new Date()) return { valid: false, reason: 'Cupom expirado' }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses!) return { valid: false, reason: 'Cupom esgotado' }
  if (coupon.minOrderValue && orderValue < coupon.minOrderValue) {
    return { valid: false, reason: `Pedido minimo de R$ ${coupon.minOrderValue.toFixed(2)}` }
  }

  const raw =
    coupon.discountType === 'PERCENT'
      ? (orderValue * coupon.discountValue) / 100
      : coupon.discountValue

  const discountAmount = Math.min(raw, orderValue)

  return { valid: true, coupon, discountAmount }
}

export async function listCoupons() {
  return prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } })
}

export async function createCoupon(data: {
  code: string
  discountType: string
  discountValue: number
  minOrderValue?: number
  maxUses?: number
  validUntil?: string
}) {
  return prisma.coupon.create({
    data: {
      code: data.code.toUpperCase().trim(),
      discountType: data.discountType,
      discountValue: data.discountValue,
      minOrderValue: data.minOrderValue ?? null,
      maxUses: data.maxUses ?? null,
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
    },
  })
}

export async function toggleCoupon(id: string, active: boolean) {
  return prisma.coupon.update({ where: { id }, data: { active } })
}
