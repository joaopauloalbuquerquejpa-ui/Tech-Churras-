import { prisma } from '../../config/prisma'
import { sendPushToUser, sendWhatsAppToAdmin } from '../push/push.service'
import { emailPartnerApproved } from '../email/email.service'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function sendWhatsApp(phone: string, message: string, label: string) {
  const instance = process.env.ZAPI_INSTANCE
  const token = process.env.ZAPI_TOKEN
  if (!instance || !token) return
  const clean = phone.replace(/\D/g, '')
  try {
    const res = await fetch(
      `https://api.z-api.io/instances/${instance}/token/${token}/send-text`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: clean, message }) }
    )
    if (!res.ok) console.log(`[WhatsApp] ${label} erro:`, res.status)
  } catch {}
}

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

export async function listUsers(skip = 0, take = 100) {
  const [data, total] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.user.count(),
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
  return prisma.grillmaster.findMany({
    where: { approved: false },
    include: { user: { select: { name: true, email: true, phone: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function approveGrillmaster(
  grillmasterId: string,
  extras?: { isChancelado?: boolean; pricePerHour?: number }
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
      ...(extras?.isChancelado !== undefined ? { isChancelado: extras.isChancelado } : {}),
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
    data: { approved: false, available: false },
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

export async function listPendingBoutiques() {
  return prisma.boutique.findMany({
    where: { approved: false },
    include: { user: { select: { name: true, email: true, phone: true } } },
    orderBy: { createdAt: 'desc' },
  })
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
  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + 60)
  const updated = await prisma.boutique.update({ where: { id: boutiqueId }, data: { approved: true, referralCode, trialEndsAt } })
  console.log(JSON.stringify({ audit: 'BOUTIQUE_APPROVED', boutiqueId, name: boutique.name, ts: new Date().toISOString() }))
  if (boutique.user) {
    const name = boutique.user.name.split(' ')[0]
    sendPushToUser(
      boutique.user.id,
      '🎉 Açougue aprovado! 60 dias grátis iniciados.',
      `Parabéns ${name}! O açougue ${boutique.name} está ativo. Aproveite seus 60 dias de uso gratuito!`,
      '/boutiques/dashboard'
    ).catch((e) => console.error("[notif]", e?.message))
    emailPartnerApproved(boutique.user.email, boutique.user.name, 'BOUTIQUE', 'https://www.techchurras.com.br/boutiques/dashboard').catch((e) => console.error("[notif]", e?.message))
    if (boutique.user.phone) {
      sendWhatsApp(
        boutique.user.phone,
        `🥩 Parabéns ${name}! O açougue *${boutique.name}* foi *aprovado* na Tech Churras!\n\n🎁 Você tem *60 dias GRÁTIS* para testar tudo.\n\n*QR code do seu balcão:*\nhttps://www.techchurras.com.br/pedido?boutique=${boutique.id}\n\nAcesse seu painel completo:\nhttps://www.techchurras.com.br/boutiques/dashboard`,
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
  const updated = await prisma.boutique.update({ where: { id: boutiqueId }, data: { approved: false } })
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

export async function listAllOrders(skip = 0, take = 200) {
  const [data, total] = await Promise.all([
    prisma.order.findMany({
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
    prisma.order.count(),
  ])
  return { data, total, skip, take }
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
    prisma.order.aggregate({ _sum: { totalPrice: true } }),
    prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.order.aggregate({ where: { createdAt: { gte: todayStart } }, _sum: { totalPrice: true } }),
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.order.count({ where: { status: { in: ['CONFIRMED', 'IN_PROGRESS'] } } }),
    prisma.order.aggregate({ where: { createdAt: { gte: weekStart } }, _sum: { totalPrice: true } }),
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

  const [ordersYesterday, revenueYesterday, newUsers, activeOrders, pendingGMs, qualifiedLeads, revenueWeek] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: yesterday, lt: todayStart } } }),
    prisma.order.aggregate({ where: { createdAt: { gte: yesterday, lt: todayStart }, status: 'COMPLETED' }, _sum: { totalPrice: true } }),
    prisma.user.count({ where: { createdAt: { gte: yesterday, lt: todayStart } } }),
    prisma.order.count({ where: { status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] } } }),
    prisma.grillmaster.count({ where: { approved: false } }),
    prisma.lead.count({ where: { status: 'qualified', createdAt: { gte: yesterday, lt: todayStart } } }),
    prisma.order.aggregate({ where: { createdAt: { gte: weekStart }, status: 'COMPLETED' }, _sum: { totalPrice: true } }),
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
    `🥩 Leads açougue ontem: *${qualifiedLeads}*\n\n` +
    `👉 techchurras.com.br/admin`

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