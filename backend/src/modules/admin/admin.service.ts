import { prisma } from '../../config/prisma'
import { sendPushToUser, sendWhatsAppToAdmin, sendWhatsApp } from '../push/push.service'
import { emailPartnerApproved } from '../email/email.service'
import Anthropic from '@anthropic-ai/sdk'
import { checkPixOwnership } from '../auth/verification.service'
import { TRIAL_ORDERS_THRESHOLD } from '../../utils/pricing'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const GRILLMASTER_EDITABLE_FIELDS = new Set([
  'bio', 'experience', 'pricePerHour', 'city', 'state', 'specialties',
  'available', 'isChancelado', 'photoUrl', 'churrascoStyle',
  'bringsEquipment', 'minGuests', 'maxGuests', 'instagram', 'videoUrl',
])

export async function updateGrillmasterProfile(grillmasterId: string, data: Record<string, unknown>) {
  const safe = Object.fromEntries(
    Object.entries(data).filter(([k]) => GRILLMASTER_EDITABLE_FIELDS.has(k))
  )
  return prisma.grillmaster.update({ where: { id: grillmasterId }, data: safe })
}

export async function listUsers(skip = 0, take = 100, search?: string) {
  const where = search
    ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { email: { contains: search, mode: 'insensitive' as const } }] }
    : undefined
  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, phone: true, phoneVerified: true,
        role: true, points: true, createdAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ])
  return { data, total, skip, take }
}

export async function blockUser(userId: string) {
  return prisma.user.update({ where: { id: userId }, data: { role: 'CUSTOMER' } })
}

export async function listGrillmasters(skip = 0, take = 100) {
  const [data, total] = await Promise.all([
    prisma.grillmaster.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.grillmaster.count(),
  ])
  return { data, total, skip, take }
}

export async function listPendingGrillmasters() {
  const list = await prisma.grillmaster.findMany({
    where: { approved: false, rejected: false },
    include: { user: { select: { name: true, email: true, phone: true, phoneVerified: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return list.map(g => ({ ...g, pixOwnership: checkPixOwnership(g.pixKey, g.cpfCnpj) }))
}

export async function approveGrillmaster(
  grillmasterId: string,
  extras?: { pricePerHour?: number }
) {
  const gm = await prisma.grillmaster.findUnique({
    where: { id: grillmasterId },
    include: { user: { select: { id: true, name: true, email: true, phone: true } } },
  })
  const updated = await prisma.grillmaster.update({
    where: { id: grillmasterId },
    data: {
      approved: true,
      available: true,
      rejected: false,
      ...(extras?.pricePerHour !== undefined ? { pricePerHour: extras.pricePerHour } : {}),
    },
  })
  console.log(JSON.stringify({ audit: 'GRILLMASTER_APPROVED', grillmasterId, name: gm?.user?.name, ts: new Date().toISOString() }))
  if (gm?.user) {
    const name = gm.user.name.split(' ')[0]
    sendPushToUser(
      gm.user.id,
      '🎉 Perfil aprovado!',
      `Parabéns ${name}! Você já está ativo na Tech Churras e pode receber pedidos.`,
      '/grillmasters/dashboard'
    ).catch((e) => console.error("[notif]", e?.message))
    emailPartnerApproved(gm.user.email, gm.user.name, 'GRILLMASTER', 'https://www.techchurras.com.br/grillmasters/dashboard').catch((e) => console.error("[notif]", e?.message))
    if (gm.user.phone) {
      sendWhatsApp(
        gm.user.phone,
        `🔥 Parabéns ${name}! Seu perfil de churrasqueiro foi *aprovado* na Tech Churras!\n\nVocê já pode receber pedidos. Acesse seu painel:\nhttps://www.techchurras.com.br/grillmasters/dashboard`,
        'gm-aprovado'
      ).catch((e) => console.error("[notif]", e?.message))
    }
  }
  return updated
}

export async function rejectGrillmaster(grillmasterId: string) {
  const gm = await prisma.grillmaster.findUnique({
    where: { id: grillmasterId },
    include: { user: { select: { id: true, name: true } } },
  })
  const updated = await prisma.grillmaster.update({
    where: { id: grillmasterId },
    data: { approved: false, available: false, rejected: true },
  })
  console.log(JSON.stringify({ audit: 'GRILLMASTER_REJECTED', grillmasterId, name: gm?.user?.name, ts: new Date().toISOString() }))
  if (gm?.user) {
    sendPushToUser(
      gm.user.id,
      'Perfil em revisão',
      'Precisamos de mais informações sobre seu perfil. Entre em contato com o suporte.',
      '/grillmasters/dashboard'
    ).catch((e) => console.error("[notif]", e?.message))
  }
  return updated
}

// GMs já aprovados (podem trabalhar) mas ainda sem Chancela — aguardando entrevista pessoal com o Jota
export async function listAwaitingCertification() {
  return prisma.grillmaster.findMany({
    where: { approved: true, certifiedAt: null },
    include: { user: { select: { name: true, email: true, phone: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

// Chancela concedida manualmente pelo admin, depois da entrevista pessoal — nunca automática
export async function certifyGrillmaster(grillmasterId: string) {
  const gm = await prisma.grillmaster.findUnique({
    where: { id: grillmasterId },
    include: { user: { select: { id: true, name: true, phone: true } } },
  })
  if (!gm) throw new Error('Churrasqueiro não encontrado')
  const { randomUUID } = await import('crypto')
  const updated = await prisma.grillmaster.update({
    where: { id: grillmasterId },
    data: {
      isChancelado: true,
      certificationCode: 'TC-' + randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase(),
      certifiedAt: new Date(),
    },
  })
  console.log(JSON.stringify({ audit: 'GRILLMASTER_CERTIFIED', grillmasterId, name: gm.user?.name, ts: new Date().toISOString() }))
  if (gm.user) {
    sendPushToUser(
      gm.user.id,
      '🏅 Chancela Tech Churras!',
      'Parabéns! Depois da nossa conversa, você recebeu a Chancela Tech Churras. Seu certificado já está no painel.',
      '/grillmasters/dashboard'
    ).catch((e) => console.error("[notif]", e?.message))
    if (gm.user.phone) {
      sendWhatsApp(
        gm.user.phone,
        `🏅 Parabéns! Você recebeu a *Chancela Tech Churras* depois da nossa conversa.\n\nSeu certificado já está disponível no seu painel:\nhttps://www.techchurras.com.br/grillmasters/dashboard`,
        'gm-certificado'
      ).catch((e) => console.error("[notif]", e?.message))
    }
  }
  return updated
}

export async function listPendingBoutiques() {
  const list = await prisma.boutique.findMany({
    where: { approved: false, rejected: false },
    include: { user: { select: { name: true, email: true, phone: true, phoneVerified: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return list.map(b => ({ ...b, pixOwnership: checkPixOwnership(b.pixKey, b.cpfCnpj) }))
}

// Diretório completo pra admin revisar qualquer açougue a qualquer momento —
// não só os pendentes, que somem da tela assim que aprovados.
export async function listAllBoutiques(skip = 0, take = 200) {
  const [data, total] = await Promise.all([
    prisma.boutique.findMany({
      include: { user: { select: { name: true, email: true, phone: true, phoneVerified: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.boutique.count(),
  ])
  return { data: data.map(b => ({ ...b, pixOwnership: checkPixOwnership(b.pixKey, b.cpfCnpj) })), total, skip, take }
}

function generateReferralCode(name: string): string {
  const prefix = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'ACOU'
  const suffix = String(Math.floor(1000 + Math.random() * 9000))
  return prefix + suffix
}

export async function approveBoutique(boutiqueId: string) {
  const boutique = await prisma.boutique.findUnique({
    where: { id: boutiqueId },
    include: { user: { select: { id: true, name: true, email: true, phone: true } } },
  })
  if (!boutique) throw new Error('Acougue nao encontrado')
  let referralCode = boutique.referralCode
  if (!referralCode) {
    let code = generateReferralCode(boutique.name)
    const existing = await prisma.boutique.findUnique({ where: { referralCode: code } })
    if (existing) code = generateReferralCode(boutique.name)
    referralCode = code
  }

  // Modelo Açougue Embaixador: todo novo açougue aprovado paga R$369/mês
  // (mensalidade única, sem plano padrão de R$497) — sem limite de vagas,
  // sem exclusividade regional. `isFounder` no schema virou sinônimo de "já
  // é Embaixador" (nome do campo mantido por ora pra não mexer em
  // migration/índice à toa; o rótulo pro usuário já é outro).
  // Trial não é mais por prazo (30 dias corriam mesmo sem nenhum pedido
  // completo, cobrando de quem não viu a plataforma funcionar ainda) — vira
  // "grátis até completar TRIAL_ORDERS_THRESHOLD pedidos" (utils/pricing.ts),
  // calculado ao vivo em getBoutiqueDashboardStats. trialEndsAt não é mais
  // setado aqui; campo mantido no schema só por histórico.
  const monthlyFee = 369

  const updated = await prisma.boutique.update({
    where: { id: boutiqueId },
    data: { approved: true, rejected: false, referralCode, isFounder: true, monthlyFee },
  })
  console.log(JSON.stringify({ audit: 'BOUTIQUE_APPROVED', boutiqueId, name: boutique.name, ts: new Date().toISOString() }))
  if (boutique.user) {
    const name = boutique.user.name.split(' ')[0]
    sendPushToUser(
      boutique.user.id,
      `🎉 Açougue aprovado! Embaixador — grátis até o ${TRIAL_ORDERS_THRESHOLD}º pedido.`,
      `Parabéns ${name}! O açougue ${boutique.name} está ativo. Você é Açougue Embaixador — grátis até completar ${TRIAL_ORDERS_THRESHOLD} pedidos, depois R$ ${monthlyFee}/mês.`,
      '/boutiques/dashboard'
    ).catch((e) => console.error("[notif]", e?.message))
    emailPartnerApproved(boutique.user.email, boutique.user.name, 'BOUTIQUE', 'https://www.techchurras.com.br/boutiques/dashboard').catch((e) => console.error("[notif]", e?.message))
    if (boutique.user.phone) {
      sendWhatsApp(
        boutique.user.phone,
        `🥩 Parabéns ${name}! O açougue *${boutique.name}* foi *aprovado* na Tech Churras!\n\n` +
        `🎁 Você é *Açougue Embaixador* — *grátis até completar ${TRIAL_ORDERS_THRESHOLD} pedidos* e depois R$${monthlyFee}/mês.` +
        `\n\n*QR code do seu balcão:*\nhttps://www.techchurras.com.br/pedido?boutique=${boutique.id}\n\nAcesse seu painel completo:\nhttps://www.techchurras.com.br/boutiques/dashboard`,
        'boutique-aprovado'
      ).catch((e) => console.error("[notif]", e?.message))
    }
  }
  return updated
}

export async function rejectBoutique(boutiqueId: string) {
  const boutique = await prisma.boutique.findUnique({
    where: { id: boutiqueId },
    include: { user: { select: { id: true, name: true } } },
  })
  const updated = await prisma.boutique.update({ where: { id: boutiqueId }, data: { approved: false, rejected: true } })
  console.log(JSON.stringify({ audit: 'BOUTIQUE_REJECTED', boutiqueId, name: boutique?.name, ts: new Date().toISOString() }))
  if (boutique?.user) {
    sendPushToUser(
      boutique.user.id,
      'Cadastro em revisão',
      'Precisamos de mais informações sobre seu açougue. Entre em contato com o suporte.',
      '/boutiques/dashboard'
    ).catch((e) => console.error("[notif]", e?.message))
  }
  return updated
}

export async function getBoutiqueReferralStats(boutiqueId: string) {
  const [referred, converted] = await Promise.all([
    prisma.user.count({ where: { referredByBoutiqueId: boutiqueId } }),
    prisma.user.count({
      where: {
        referredByBoutiqueId: boutiqueId,
        orders: { some: { paymentStatus: 'PAID' } },
      },
    }),
  ])
  return { boutiqueId, referred, converted }
}

// Estorno que falhou/ficou preso, ou disputa/chargeback — hoje o único alerta pra
// esses dois estados é WhatsApp via Z-API (instável em produção). Isso dá uma
// segunda via: mesmo com Z-API fora do ar, dá pra achar isso entrando no painel.
function needsAttentionWhere() {
  return {
    OR: [
      { refundStatus: { in: ['PENDING', 'FAILED'] } },
      { paymentStatus: { startsWith: 'DISPUTE_' } },
    ],
  }
}

export async function listAllOrders(skip = 0, take = 200, status?: string, needsAttention?: boolean) {
  const where = needsAttention ? needsAttentionWhere() : status ? { status: status as any } : undefined
  const [data, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        customer: { select: { name: true, email: true, phone: true } },
        grillmaster: { include: { user: { select: { name: true, phone: true } } } },
        boutique: { select: { name: true } },
        items: { include: { product: { select: { name: true, price: true, unit: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.order.count({ where }),
  ])
  return { data, total, skip, take }
}

export async function countOrdersNeedingAttention() {
  return prisma.order.count({ where: needsAttentionWhere() })
}

export async function markOrderPaid(orderId: string) {
  return prisma.order.update({
    where: { id: orderId },
    data: { status: 'COMPLETED', paymentStatus: 'PAID', paidAt: new Date() },
  })
}

export async function getDashboardStats() {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 7)
  weekStart.setHours(0, 0, 0, 0)

  const [
    totalUsers,
    totalOrders,
    totalBoutiques,
    totalGrillmasters,
    revenue,
    ordersToday,
    revenueToday,
    usersToday,
    activeOrders,
    revenueWeek,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.boutique.count(),
    prisma.grillmaster.count(),
    // Receita = apenas dinheiro que entrou de fato (pedido pago), janelas por paidAt
    prisma.order.aggregate({ where: { paymentStatus: 'PAID' }, _sum: { totalPrice: true } }),
    prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.order.aggregate({ where: { paymentStatus: 'PAID', paidAt: { gte: todayStart } }, _sum: { totalPrice: true } }),
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.order.count({ where: { status: { in: ['CONFIRMED', 'IN_PROGRESS'] } } }),
    prisma.order.aggregate({ where: { paymentStatus: 'PAID', paidAt: { gte: weekStart } }, _sum: { totalPrice: true } }),
  ])

  return {
    totalUsers,
    totalOrders,
    totalBoutiques,
    totalGrillmasters,
    totalRevenue: revenue._sum.totalPrice ?? 0,
    ordersToday,
    revenueToday: revenueToday._sum.totalPrice ?? 0,
    usersToday,
    activeOrders,
    revenueWeek: revenueWeek._sum.totalPrice ?? 0,
  }
}

export async function getAdvancedMetrics() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [funnel, recentOrders, gmOrders] = await Promise.all([
    // Funil de conversão
    Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: { in: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] } } }),
      prisma.order.count({ where: { status: 'COMPLETED' } }),
    ]),
    // Pedidos dos últimos 30 dias com hora de criação
    prisma.order.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, totalPrice: true, status: true },
      orderBy: { createdAt: 'asc' },
    }),
    // GMs com contagem de pedidos aceitos vs recebidos
    prisma.grillmaster.findMany({
      select: {
        id: true,
        user: { select: { name: true } },
        photoUrl: true,
        rating: true,
        _count: { select: { orders: true } },
        orders: {
          where: { status: { in: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] } },
          select: { id: true },
        },
      },
      orderBy: { orders: { _count: 'desc' } },
      take: 10,
    }),
  ])

  // Funil
  const [total, confirmed, completed] = funnel
  const funnelData = {
    total,
    confirmed,
    completed,
    confirmRate: total > 0 ? Math.round((confirmed / total) * 100) : 0,
    completeRate: confirmed > 0 ? Math.round((completed / confirmed) * 100) : 0,
  }

  // Receita por dia (últimos 30 dias)
  const revenueByDay: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    revenueByDay[d.toISOString().slice(0, 10)] = 0
  }
  for (const o of recentOrders) {
    if (o.status === 'COMPLETED') {
      const day = o.createdAt.toISOString().slice(0, 10)
      if (day in revenueByDay) revenueByDay[day] = (revenueByDay[day] ?? 0) + (o.totalPrice ?? 0)
    }
  }

  // Pedidos por hora do dia
  const ordersByHour = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }))
  for (const o of recentOrders) {
    const h = o.createdAt.getHours()
    ordersByHour[h].count++
  }

  // Top GMs por aceitação
  const topGms = gmOrders
    .filter(gm => gm._count.orders > 0)
    .map(gm => ({
      id: gm.id,
      name: gm.user.name,
      photoUrl: gm.photoUrl,
      rating: gm.rating,
      totalOrders: gm._count.orders,
      acceptedOrders: gm.orders.length,
      acceptRate: Math.round((gm.orders.length / gm._count.orders) * 100),
    }))
    .sort((a, b) => b.totalOrders - a.totalOrders)
    .slice(0, 5)

  return { funnel: funnelData, revenueByDay, ordersByHour, topGms }
}

// ── Feature 1: Resumo diário por WhatsApp para o fundador
export async function sendDailySummary(): Promise<void> {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 7)

  const [ordersYesterday, revenueYesterday, newUsers, activeOrders, pendingGMs, qualifiedLeads, revenueWeek, attentionCount] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: yesterday, lt: todayStart } } }),
    prisma.order.aggregate({ where: { createdAt: { gte: yesterday, lt: todayStart }, status: 'COMPLETED' }, _sum: { totalPrice: true } }),
    prisma.user.count({ where: { createdAt: { gte: yesterday, lt: todayStart } } }),
    prisma.order.count({ where: { status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] } } }),
    prisma.grillmaster.count({ where: { approved: false } }),
    prisma.lead.count({ where: { status: 'qualified', createdAt: { gte: yesterday, lt: todayStart } } }),
    prisma.order.aggregate({ where: { createdAt: { gte: weekStart }, status: 'COMPLETED' }, _sum: { totalPrice: true } }),
    countOrdersNeedingAttention(),
  ])

  const revenue = revenueYesterday._sum.totalPrice ?? 0
  const weekRevenue = revenueWeek._sum.totalPrice ?? 0
  const dateStr = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' }).format(yesterday)

  const message =
    `🔥 *Resumo Tech Churras — ${dateStr}*\n\n` +
    `📦 Pedidos ontem: *${ordersYesterday}*\n` +
    `💰 Receita confirmada: *R$ ${revenue.toFixed(2)}*\n` +
    `📈 Receita semana: *R$ ${weekRevenue.toFixed(2)}*\n` +
    `👤 Novos usuários: *${newUsers}*\n` +
    `🔴 Pedidos ativos agora: *${activeOrders}*\n` +
    `⏳ GMs aguardando aprovação: *${pendingGMs}*\n` +
    `🥩 Leads açougue ontem: *${qualifiedLeads}*\n` +
    (attentionCount > 0 ? `\n⚠️ *${attentionCount} pedido(s) com estorno pendente/falho ou disputa* — checar /admin\n` : '') +
    `\n👉 techchurras.com.br/admin`

  await sendWhatsAppToAdmin(message)
  console.log('[DailySummary] Resumo enviado')
}

// ── Feature 5: Previsão de demanda com IA
export async function getDemandForecast() {
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: ninetyDaysAgo } },
    select: { createdAt: true, totalPrice: true, status: true, guestCount: true, eventAddress: true },
    orderBy: { createdAt: 'asc' },
  })

  // Pedidos por dia da semana (0=Dom, 6=Sáb)
  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
  const byDow = Array.from({ length: 7 }, (_, i) => ({ day: dayNames[i], count: 0, revenue: 0 }))
  const byHour = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }))

  for (const o of orders) {
    const dow = o.createdAt.getDay()
    byDow[dow].count++
    if (o.status === 'COMPLETED') byDow[dow].revenue += o.totalPrice ?? 0
    byHour[o.createdAt.getHours()].count++
  }

  // Tendência: últimas 4 semanas vs 4 semanas anteriores
  const fourWeeksAgo = new Date(); fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)
  const eightWeeksAgo = new Date(); eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)
  const recent4w = orders.filter(o => o.createdAt >= fourWeeksAgo).length
  const prev4w = orders.filter(o => o.createdAt >= eightWeeksAgo && o.createdAt < fourWeeksAgo).length
  const trendPct = prev4w > 0 ? Math.round(((recent4w - prev4w) / prev4w) * 100) : 0

  // Previsão dos próximos 14 dias baseada na média por dia da semana
  const totalWeeks = 13
  const next14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i + 1)
    const dow = d.getDay()
    const avgPerWeek = totalWeeks > 0 ? byDow[dow].count / totalWeeks : 0
    return {
      date: d.toISOString().slice(0, 10),
      dayName: dayNames[dow],
      expectedOrders: Math.round(avgPerWeek * 10) / 10,
      confidence: byDow[dow].count >= 5 ? 'alta' : byDow[dow].count >= 2 ? 'média' : 'baixa',
    }
  })

  // Narrativa gerada pela IA
  const peakDow = [...byDow].sort((a, b) => b.count - a.count).slice(0, 2).map(d => d.day)
  const peakHour = [...byHour].sort((a, b) => b.count - a.count)[0]

  let narrative = ''
  try {
    const resp = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Você é analista de dados de uma plataforma de churrascos em São Paulo. Gere uma análise de previsão de demanda em 3 bullet points curtos (máximo 2 linhas cada) em português. Use os dados:\n- Total de pedidos nos últimos 90 dias: ${orders.length}\n- Dias mais movimentados: ${peakDow.join(' e ')}\n- Hora de pico: ${peakHour.hour}h\n- Tendência vs mês anterior: ${trendPct > 0 ? '+' : ''}${trendPct}%\n- Receita top dia: ${byDow.reduce((a, b) => a.revenue > b.revenue ? a : b).day}\n\nSeja direto, sem introdução. Use emojis no início de cada bullet.`,
      }],
    })
    narrative = resp.content[0].type === 'text' ? resp.content[0].text.trim() : ''
  } catch {}

  return { byDayOfWeek: byDow, byHour, trendVsLastMonth: trendPct, next14Days, narrative, totalOrders90d: orders.length }
}