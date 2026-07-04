import { prisma } from '../../../config/prisma'

function getWeekBounds(date: Date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { monday, sunday }
}

export async function listPayouts(status?: string, weekStart?: string, type?: string) {
  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (type) where.type = type
  if (weekStart) {
    const d = new Date(weekStart)
    where.weekStart = { gte: d, lt: new Date(d.getTime() + 7 * 24 * 60 * 60 * 1000) }
  }

  const payouts = await prisma.payout.findMany({ where, orderBy: { createdAt: 'desc' } })

  const gmIds = payouts.filter(p => p.type === 'GRILLMASTER').map(p => p.recipientId)
  const btIds = payouts.filter(p => p.type === 'BOUTIQUE').map(p => p.recipientId)

  const [gms, bts] = await Promise.all([
    gmIds.length > 0
      ? prisma.grillmaster.findMany({
          where: { id: { in: gmIds } },
          include: { user: { select: { name: true } } },
        })
      : [],
    btIds.length > 0
      ? prisma.boutique.findMany({ where: { id: { in: btIds } }, select: { id: true, name: true } })
      : [],
  ])

  const gmMap = new Map(gms.map(g => [g.id, g.user.name]))
  const btMap = new Map((bts as { id: string; name: string }[]).map(b => [b.id, b.name]))

  return payouts.map(p => ({
    ...p,
    recipientName:
      p.type === 'GRILLMASTER'
        ? (gmMap.get(p.recipientId) ?? 'Churrasqueiro')
        : (btMap.get(p.recipientId) ?? 'Acougue'),
  }))
}

export async function getPayoutsSummary() {
  const { monday, sunday } = getWeekBounds()

  const payouts = await prisma.payout.findMany({
    where: { weekStart: { gte: monday, lte: sunday } },
  })

  const pending = payouts.filter(p => p.status === 'PENDING')
  const paid = payouts.filter(p => p.status === 'PAID')

  return {
    weekStart: monday,
    weekEnd: sunday,
    totalPending: +pending.reduce((s, p) => s + p.amount, 0).toFixed(2),
    totalPaid: +paid.reduce((s, p) => s + p.amount, 0).toFixed(2),
    totalCommission: +payouts.reduce((s, p) => s + (p.grossAmount - p.amount), 0).toFixed(2),
    count: { pending: pending.length, paid: paid.length, total: payouts.length },
  }
}

export async function generatePayouts() {
  const { monday, sunday } = getWeekBounds()
  const GM_COMMISSION = 7        // plataforma retém 7% da mão de obra
  const BOUTIQUE_COMMISSION = 10 // plataforma retém 10% das carnes

  const orders = await prisma.order.findMany({
    where: {
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      updatedAt: { gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
    },
    include: {
      grillmaster: { select: { id: true, pixKey: true } },
      boutique: { select: { id: true, pixKey: true } },
      items: { select: { unitPrice: true, quantity: true } },
    },
  })

  if (orders.length === 0) {
    return { created: 0, skipped: 0, message: 'Nenhum pedido elegivel encontrado.' }
  }

  const existing = await prisma.payout.findMany({
    where: { orderId: { in: orders.map(o => o.id) } },
    select: { orderId: true, type: true },
  })
  const existingSet = new Set(existing.map(p => `${p.orderId}:${p.type}`))

  const toCreate: {
    type: string; recipientId: string; orderId: string
    grossAmount: number; commission: number; amount: number
    weekStart: Date; weekEnd: Date; pixKey?: string | null
  }[] = []

  for (const order of orders) {
    // Desconto (cupom/indicação) é rateado proporcionalmente entre mão de obra e produtos,
    // para que GM e açougue não sejam pagos sobre um valor que o cliente nunca pagou.
    // serviceFee é receita da plataforma e fica fora da base de rateio.
    const subtotal = order.totalPrice - (order.serviceFee ?? 0) + (order.discountAmount ?? 0)
    const discountRatio = subtotal > 0 && order.discountAmount ? Math.min(order.discountAmount / subtotal, 1) : 0

    // Mão de obra do churrasqueiro = valor travado no pedido (não a tarifa ao vivo do GM)
    if (order.grillmasterId && !existingSet.has(`${order.id}:GRILLMASTER`)) {
      const laborGross = +((order.laborPrice ?? 0) * (1 - discountRatio)).toFixed(2)
      if (laborGross > 0) {
        toCreate.push({
          type: 'GRILLMASTER',
          recipientId: order.grillmasterId,
          orderId: order.id,
          grossAmount: laborGross,
          commission: GM_COMMISSION,
          amount: +(laborGross * 0.93).toFixed(2),
          weekStart: monday,
          weekEnd: sunday,
          pixKey: order.grillmaster?.pixKey ?? null,
        })
      }
    }
    // Produtos do açougue = soma dos OrderItems, com o mesmo rateio de desconto
    if (order.boutiqueId && !existingSet.has(`${order.id}:BOUTIQUE`)) {
      const productsGrossRaw = order.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
      const productsGross = +(productsGrossRaw * (1 - discountRatio)).toFixed(2)
      if (productsGross > 0) {
        toCreate.push({
          type: 'BOUTIQUE',
          recipientId: order.boutiqueId,
          orderId: order.id,
          grossAmount: productsGross,
          commission: BOUTIQUE_COMMISSION,
          amount: +(productsGross * 0.90).toFixed(2),
          weekStart: monday,
          weekEnd: sunday,
          pixKey: order.boutique?.pixKey ?? null,
        })
      }
    }
  }

  if (toCreate.length > 0) {
    await prisma.payout.createMany({ data: toCreate })
  }

  return {
    created: toCreate.length,
    skipped: existing.length,
    message: `${toCreate.length} repasse(s) gerado(s). ${existing.length} ja existiam.`,
  }
}

export async function markPayoutPaid(payoutId: string) {
  return prisma.payout.update({
    where: { id: payoutId },
    data: { status: 'PAID', paidAt: new Date() },
  })
}
