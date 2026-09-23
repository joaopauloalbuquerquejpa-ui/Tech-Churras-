import { prisma } from '../../../config/prisma'
import { GM_COMMISSION, BOUTIQUE_COMMISSION, BOUTIQUE_LABOR_BONUS_RATE, INTERNAL_TEAM_PAYOUT_PER_EVENT } from '../../../utils/pricing'

// ── Comissão por nota (proposta aprovada 21/07/2026, desligada até o Jota ativar) ──
// Desligada: COMMISSION_BY_RATING_ENABLED=false (ou ausente) mantém os 7% flat de sempre.
// Janela móvel dos últimos 15 eventos avaliados; menos de 5 eventos = grace period (7% flat).
const COMMISSION_BY_RATING_ENABLED = process.env.COMMISSION_BY_RATING_ENABLED === 'true'
const RATING_WINDOW = 15
const MIN_EVENTS_FOR_TIER = 5

function commissionTierFromRating(avgRating: number): { commission: number; tier: string } {
  if (avgRating >= 4.8) return { commission: 5, tier: 'ELITE' }
  if (avgRating >= 4.5) return { commission: 7, tier: 'PADRAO' }
  if (avgRating >= 4.0) return { commission: 9, tier: 'ATENCAO' }
  return { commission: 12, tier: 'RISCO' }
}

async function resolveGmCommission(grillmasterId: string, flatRate: number): Promise<{ commission: number; tier: string }> {
  if (!COMMISSION_BY_RATING_ENABLED) return { commission: flatRate, tier: 'FLAT' }

  const recentReviews = await prisma.review.findMany({
    where: { grillmasterId, grillRating: { not: null } },
    orderBy: { createdAt: 'desc' },
    take: RATING_WINDOW,
    select: { grillRating: true },
  })

  if (recentReviews.length < MIN_EVENTS_FOR_TIER) return { commission: flatRate, tier: 'NOVATO' }

  const avg = recentReviews.reduce((s, r) => s + (r.grillRating ?? 0), 0) / recentReviews.length
  return commissionTierFromRating(avg)
}

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
  // REFERRAL_BONUS e BOUTIQUE_LABOR_BONUS também usam boutique.id como recipientId
  const btIds = payouts.filter(p => p.type === 'BOUTIQUE' || p.type === 'REFERRAL_BONUS' || p.type === 'BOUTIQUE_LABOR_BONUS').map(p => p.recipientId)

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

  return payouts.map(p => {
    if (p.type === 'GRILLMASTER') return { ...p, recipientName: gmMap.get(p.recipientId) ?? 'Churrasqueiro' }
    const nome = btMap.get(p.recipientId) ?? 'Acougue'
    const sufixo = p.type === 'REFERRAL_BONUS' ? ' (bônus indicação)'
      : p.type === 'BOUTIQUE_LABOR_BONUS' ? ' (bônus mão de obra)'
      : ''
    return { ...p, recipientName: `${nome}${sufixo}` }
  })
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

    // Taxa de acompanhamento (sideDishFee) e cobrada do cliente e vai pra
    // quem de fato preparou - GM ou acougue - com o mesmo rateio de desconto,
    // senao a plataforma fica com 100% de um valor que nao presta o servico.
    const sideDishForGm = order.sideDishPreparedBy === 'GRILLMASTER' ? (order.sideDishFee ?? 0) : 0
    const sideDishForBoutique = order.sideDishPreparedBy === 'ACOUGUE' ? (order.sideDishFee ?? 0) : 0

    // Mão de obra do churrasqueiro = valor travado no pedido (não a tarifa ao vivo do GM).
    // Equipe interna (executionType='INTERNAL') recebe valor fixo por evento,
    // não comissão percentual — a regra de mercado (resolveGmCommission) só
    // se aplica a churrasqueiro independente (marketplace, dormente).
    if (order.grillmasterId && !existingSet.has(`${order.id}:GRILLMASTER`)) {
      const laborGross = +(((order.laborPrice ?? 0) + sideDishForGm) * (1 - discountRatio)).toFixed(2)
      if (laborGross > 0) {
        const isInternal = order.executionType === 'INTERNAL'
        const amount = isInternal ? Math.min(INTERNAL_TEAM_PAYOUT_PER_EVENT, laborGross) : 0
        const { commission } = isInternal
          ? { commission: +(100 - (amount / laborGross) * 100).toFixed(2) }
          : await resolveGmCommission(order.grillmasterId, GM_COMMISSION)
        toCreate.push({
          type: 'GRILLMASTER',
          recipientId: order.grillmasterId,
          orderId: order.id,
          grossAmount: laborGross,
          commission,
          amount: isInternal ? amount : +(laborGross * (1 - commission / 100)).toFixed(2),
          weekStart: monday,
          weekEnd: sunday,
          pixKey: order.grillmaster?.pixKey ?? null,
        })
      }
    }
    // Produtos do açougue = soma dos OrderItems, com o mesmo rateio de desconto
    if (order.boutiqueId && !existingSet.has(`${order.id}:BOUTIQUE`)) {
      const productsGrossRaw = order.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0) + sideDishForBoutique
      const productsGross = +(productsGrossRaw * (1 - discountRatio)).toFixed(2)
      if (productsGross > 0) {
        toCreate.push({
          type: 'BOUTIQUE',
          recipientId: order.boutiqueId,
          orderId: order.id,
          grossAmount: productsGross,
          commission: BOUTIQUE_COMMISSION,
          amount: +(productsGross * (1 - BOUTIQUE_COMMISSION / 100)).toFixed(2),
          weekStart: monday,
          weekEnd: sunday,
          pixKey: order.boutique?.pixKey ?? null,
        })
      }
    }
    // Pivô de modelo (set/2026): açougue ganha um bônus extra sobre a mão de
    // obra do evento, como incentivo por ter insumo vendido junto — mesmo não
    // executando nada. Base de cálculo separada da comissão sobre carne
    // (BOUTIQUE) de propósito, pra não misturar as duas na auditoria.
    // `commission` aqui representa "% que fica com a Tech Churras" só por
    // convenção de campo — nesse tipo é o inverso de BOUTIQUE_LABOR_BONUS_RATE.
    if (order.boutiqueId && !existingSet.has(`${order.id}:BOUTIQUE_LABOR_BONUS`)) {
      const laborGross = +(((order.laborPrice ?? 0) + sideDishForGm) * (1 - discountRatio)).toFixed(2)
      if (laborGross > 0) {
        toCreate.push({
          type: 'BOUTIQUE_LABOR_BONUS',
          recipientId: order.boutiqueId,
          orderId: order.id,
          grossAmount: laborGross,
          commission: +(100 - BOUTIQUE_LABOR_BONUS_RATE).toFixed(2),
          amount: +(laborGross * (BOUTIQUE_LABOR_BONUS_RATE / 100)).toFixed(2),
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
