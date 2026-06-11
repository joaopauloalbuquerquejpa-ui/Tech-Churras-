import { prisma } from '../../config/prisma'
import crypto from 'crypto'

export async function getPointsBalance(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { points: true } })
  if (!user) throw new Error('Usuario nao encontrado')
  const points = user.points
  const valueInReais = (Math.floor(points / 100)) * 10
  return { points, valueInReais }
}

export async function redeemPoints(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { points: true } })
  if (!user) throw new Error('Usuario nao encontrado')
  if (user.points < 100) throw new Error('Voce precisa de pelo menos 100 pontos para resgatar')

  const pointsToRedeem = Math.floor(user.points / 100) * 100
  const discountValue = (pointsToRedeem / 100) * 10

  const couponCode = 'PONTOS-' + crypto.randomBytes(4).toString('hex').toUpperCase()

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { points: { decrement: pointsToRedeem } },
    }),
    prisma.coupon.create({
      data: {
        code: couponCode,
        discountType: 'FIXED',
        discountValue,
        maxUses: 1,
        active: true,
      },
    }),
    (prisma as any).pointsRedemption.create({
      data: {
        userId,
        pointsUsed: pointsToRedeem,
        discountValue,
        couponCode,
      },
    }),
  ])

  return { couponCode, pointsUsed: pointsToRedeem, discountValue }
}

export async function listRedemptions(userId: string) {
  return (prisma as any).pointsRedemption.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
}
