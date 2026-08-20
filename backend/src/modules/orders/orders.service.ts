import { prisma } from '../../config/prisma'
import { OrderStatus } from '@prisma/client'
import { z } from 'zod'
import crypto from 'crypto'
import { validateCoupon } from '../coupons/coupons.service'
import { sendPushToUser, sendPushToRole, sendWhatsAppToAdmin } from '../push/push.service'
import { emailOrderConfirmed, emailNewOrderGrillmaster, emailOrderCompleted } from '../email/email.service'
import { geocodeAddress, haversineKm } from '../../utils/geo'
import { refundPayment } from '../payments/payments.service'
import { fetchWithTimeout } from '../../utils/http'
import { withSerializableRetry } from '../../utils/db-retry'
import { startDispatch } from '../grillmasters/dispatch.service'
import { AUXILIAR_GUEST_THRESHOLD, AUXILIAR_HOURLY_RATE, calcAuxiliaresNeeded, calcLaborPriceModifier } from '../../utils/pricing'
import { maskPhone } from '../../utils/maskPii'

const VALID_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING:     ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:   ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
}

// Taxa de serviço cobrada do cliente sobre o subtotal (após desconto).
// Receita 100% da plataforma — não entra no repasse de GM nem açougue.
export const SERVICE_FEE_RATE = 0.06

// Preço padrão da plataforma pra quem prepara acompanhamentos (arroz, farofa,
// vinagrete, maionese, salada, chimichurri) — por convidado. Fixo, não
// configurável por açougue/GM, pra evitar o problema que já derrubou o
// gmAccompaniments antigo (preço vindo do cliente sem backing no servidor).
export const SIDE_DISH_RATE_ACOUGUE = 18.50
export const SIDE_DISH_RATE_GRILLMASTER = 25.00

// AUXILIAR_GUEST_THRESHOLD, AUXILIAR_HOURLY_RATE e calcAuxiliaresNeeded
// agora vivem em utils/pricing.ts (reexportados abaixo pra não quebrar
// quem já importa daqui) — evita import circular com dispatch.service.ts,
// que também precisa dessa regra pro despacho automático.
export { AUXILIAR_GUEST_THRESHOLD, AUXILIAR_HOURLY_RATE, calcAuxiliaresNeeded }

export const createOrderSchema = z.object({
  grillmasterId: z.string().optional(),
  boutiqueId: z.string().optional(),
  eventDate: z.string()
    .transform(s => new Date(s))
    .refine(d => {
      const minDate = new Date(Date.now() + 60 * 60 * 1000) // mínimo 1h a partir de agora
      return d >= minDate
    }, { message: 'O evento deve ser agendado com pelo menos 1 hora de antecedência' }),
  eventAddress: z.string().min(5, { message: 'Endereço muito curto (mínimo 5 caracteres)' }),
  eventHours: z.number().int().min(1).max(24).default(4),
  guestCount: z.number().int().min(1),
  notes: z.string().max(1000).optional(),
  kitId: z.string().optional(),
  couponCode: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().positive().max(1000),
  })).optional(),
  gmAccompaniments: z.array(z.object({
    name: z.string().min(2),
    laborPrice: z.number().nonnegative(),
  })).optional(),
  sideDishPreparedBy: z.enum(['ACOUGUE', 'GRILLMASTER']).optional(),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>

interface OrderFraudCheck {
  guestCount: number
  totalPrice: number
  eventDate: Date
  eventAddress?: string | null
  boutiqueId?: string | null
}

async function detectSuspiciousOrder(order: OrderFraudCheck, customerId: string): Promise<void> {
  const flags: string[] = []

  const pricePerGuest = order.guestCount > 0 ? order.totalPrice / order.guestCount : 0
  if (order.totalPrice > 0 && pricePerGuest < 15) {
    flags.push(`Preço/convidado muito baixo: R$${pricePerGuest.toFixed(2)}/pessoa`)
  }

  const hoursUntilEvent = (new Date(order.eventDate).getTime() - Date.now()) / (1000 * 60 * 60)
  if (hoursUntilEvent < 6) {
    flags.push(`Evento em menos de 6h (${hoursUntilEvent.toFixed(1)}h)`)
  }

  const addressLower = (order.eventAddress ?? '').toLowerCase()
  const spKeywords = ['são paulo', 'sp', 'sao paulo', 'guarulhos', 'osasco', 'santo andré', 'campinas', 'abc', 'mauá', 'diadema', 'carapicuíba']
  if (addressLower.length > 10 && !spKeywords.some(k => addressLower.includes(k))) {
    flags.push(`Endereço fora da área SP: "${order.eventAddress?.slice(0, 60)}"`)
  }

  if (order.guestCount > 100 && !order.boutiqueId) {
    flags.push(`${order.guestCount} convidados sem açougue parceiro selecionado`)
  }

  if (flags.length >= 2) {
    const customer = await prisma.user.findUnique({ where: { id: customerId }, select: { name: true, phone: true } }).catch(() => null)
    const eventFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(order.eventDate))
    sendWhatsAppToAdmin(
      `⚠️ *Pedido suspeito — Tech Churras* (${flags.length} flags)\n\n` +
      flags.map(f => `• ${f}`).join('\n') + '\n\n' +
      `👤 ${customer?.name ?? 'Desconhecido'} | ${customer?.phone ?? 'sem tel'}\n` +
      `💰 R$ ${order.totalPrice.toFixed(2)} | ${order.guestCount} pessoas\n` +
      `📅 ${eventFmt}\n\n` +
      `👉 techchurras.com.br/admin`
    ).catch(() => {})
  }
}

export async function createOrder(customerId: string, data: CreateOrderInput) {
  const { items, couponCode, gmAccompaniments, sideDishPreparedBy: _rawSideDish, ...orderData } = data

  // Fetch real prices from DB — never trust client-supplied prices
  let itemsWithPrice: { productId: string; quantity: number; unitPrice: number }[] = []
  if (items && items.length > 0) {
    const products = await prisma.product.findMany({
      where: { id: { in: items.map(i => i.productId) } },
      select: { id: true, price: true },
    })
    const priceMap = Object.fromEntries(products.map(p => [p.id, p.price]))
    itemsWithPrice = items
      .filter(i => priceMap[i.productId] !== undefined)
      .map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: priceMap[i.productId] }))
  }

  const itemsTotal = itemsWithPrice.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)

  const grillmaster = data.grillmasterId
    ? await prisma.grillmaster.findUnique({ where: { id: data.grillmasterId } })
    : null
  if (data.grillmasterId && !grillmaster?.approved) {
    throw new Error('Este churrasqueiro não está disponível.')
  }
  if (data.grillmasterId && grillmaster && !grillmaster.available) {
    throw new Error('Este churrasqueiro está indisponível no momento.')
  }
  const boutique = data.boutiqueId
    ? await prisma.boutique.findUnique({ where: { id: data.boutiqueId }, select: { approved: true, offersSideDishPrep: true } })
    : null
  if (data.boutiqueId && !boutique?.approved) {
    throw new Error('Este açougue não está disponível.')
  }

  // GM que representa uma equipe (unlimitedAvailability, ex: Team Jota) já
  // tem capacidade própria pra evento grande — a regra de auxiliar é só pra
  // Grillmaster solo.
  const auxiliaresNeeded = calcAuxiliaresNeeded(data.guestCount)
  if (grillmaster && auxiliaresNeeded > 0 && !grillmaster.unlimitedAvailability && !grillmaster.bringsAuxiliar) {
    throw new Error(`Este Grillmaster atende sozinho até ${AUXILIAR_GUEST_THRESHOLD} convidados. Escolha um Grillmaster com auxiliar cadastrado, ou reduza o número de convidados.`)
  }
  // Cliente pode deixar sem Grillmaster escolhido (Tech Churras notifica todos
  // da região) — nesse caso cobra pela mediana de preço/hora do mercado (não
  // média: um único perfil-âncora premium distorceria a média pra cima) e
  // grava esse valor no pedido. getEligibleGrillmasters usa isso como teto
  // de preço no despacho, pra nenhum Grillmaster ser escalado a trabalhar
  // abaixo do próprio preço cadastrado.
  let estimatedHourlyRate: number | null = null
  if (!grillmaster) {
    // manualBookingOnly (perfil premium/exclusivo, ex: CEO a R$2.000/h) fica
    // fora — só reservável escolhendo de propósito, não deve nem distorcer a
    // mediana nem ser candidato ao despacho automático.
    const pool = await prisma.grillmaster.findMany({
      where: { approved: true, available: true, manualBookingOnly: false },
      select: { pricePerHour: true },
    })
    const prices = pool.map(g => g.pricePerHour).sort((a, b) => a - b)
    estimatedHourlyRate = prices.length === 0 ? 100
      : prices.length % 2 === 0 ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
      : prices[(prices.length - 1) / 2]
  }

  const auxiliarCost = auxiliaresNeeded > 0 && (grillmaster ? !grillmaster.unlimitedAvailability : true)
    ? auxiliaresNeeded * AUXILIAR_HOURLY_RATE * (data.eventHours ?? 4)
    : 0
  // Sobretaxa de fim de semana / desconto por antecedência — só sobre a
  // mão de obra do Grillmaster (a taxa-base), não sobre o auxiliar nem carne.
  const { rate: laborModifierRate } = calcLaborPriceModifier(orderData.eventDate)
  const baseHourlyRate = grillmaster ? grillmaster.pricePerHour : estimatedHourlyRate!
  const grillmasterCost = baseHourlyRate * (data.eventHours ?? 4) * (1 + laborModifierRate) + auxiliarCost

  // F1: gmAccompaniments removidos do MVP — preço não tem backing em DB, cliente poderia manipular
  const accompLaborTotal = 0

  // Preço fixo do servidor (nunca confia em valor vindo do cliente). Se o cliente
  // pediu GRILLMASTER mas o GM escolhido não oferece o serviço, ignora silenciosamente
  // (mesmo padrão de "nunca confiar no cliente" já usado pros preços de produto acima).
  let sideDishPreparedBy: 'ACOUGUE' | 'GRILLMASTER' | undefined
  let sideDishFee = 0
  if (data.sideDishPreparedBy === 'ACOUGUE' && boutique?.offersSideDishPrep) {
    sideDishPreparedBy = 'ACOUGUE'
    sideDishFee = +(SIDE_DISH_RATE_ACOUGUE * data.guestCount).toFixed(2)
  } else if (data.sideDishPreparedBy === 'GRILLMASTER' && grillmaster?.offersSideDishPrep) {
    sideDishPreparedBy = 'GRILLMASTER'
    sideDishFee = +(SIDE_DISH_RATE_GRILLMASTER * data.guestCount).toFixed(2)
  }

  const subtotal = itemsTotal + grillmasterCost + accompLaborTotal + sideDishFee

  let discountAmount = 0
  let appliedCouponCode: string | undefined

  if (couponCode) {
    const result = await validateCoupon(couponCode, subtotal)
    if (result.valid && result.coupon) {
      discountAmount = result.discountAmount!
      appliedCouponCode = result.coupon.code
    }
  }

  const netSubtotal = Math.max(0, subtotal - discountAmount)
  const serviceFee = +(netSubtotal * SERVICE_FEE_RATE).toFixed(2)
  const totalPrice = +(netSubtotal + serviceFee).toFixed(2)

  // Cria pedido + incrementa cupom + valida disponibilidade do GM atomicamente para evitar race condition.
  // withSerializableRetry: se dois clientes colidirem no mesmo GM/horario, o Postgres aborta
  // uma das duas transacoes (40001) de proposito — tenta de novo em vez de estourar 500 direto.
  const order = await withSerializableRetry(() => prisma.$transaction(async (tx) => {
    // GMs com unlimitedAvailability representam uma equipe (varios churrasqueiros
    // reais atendendo em paralelo), nao uma unica pessoa — pulam o check de
    // conflito de agenda que existe pra impedir um GM individual de ser
    // escalado em dois eventos no mesmo dia.
    if (data.grillmasterId && !grillmaster?.unlimitedAvailability) {
      const dayStart = new Date(data.eventDate); dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(data.eventDate); dayEnd.setHours(23, 59, 59, 999)

      const [blockedSchedule, conflictingOrder] = await Promise.all([
        tx.grillmasterSchedule.findFirst({
          where: { grillmasterId: data.grillmasterId, date: { gte: dayStart, lte: dayEnd }, available: false },
        }),
        tx.order.findFirst({
          where: {
            grillmasterId: data.grillmasterId,
            eventDate: { gte: dayStart, lte: dayEnd },
            status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
          },
        }),
      ])
      if (blockedSchedule || conflictingOrder) {
        throw new Error('Este churrasqueiro não está disponível nesta data. Escolha outro horário ou outro Grill Master.')
      }
    }

    if (appliedCouponCode) {
      const freshCoupon = await tx.coupon.findUnique({ where: { code: appliedCouponCode } })
      if (!freshCoupon || !freshCoupon.active ||
          (freshCoupon.maxUses !== null && freshCoupon.usedCount >= freshCoupon.maxUses)) {
        throw new Error('Cupom não está mais disponível. Tente novamente.')
      }
      await tx.coupon.update({ where: { code: appliedCouponCode }, data: { usedCount: { increment: 1 } } })
    }
    return tx.order.create({
      data: {
        customerId,
        ...orderData,
        totalPrice,
        laborPrice: grillmasterCost,
        estimatedHourlyRate,
        serviceFee,
        // Nunca deixar NULL: filtros Prisma com { not: ... } excluem NULL e já
        // quebraram a confirmação de pagamento do webhook
        paymentStatus: 'PENDING',
        couponCode: appliedCouponCode,
        discountAmount,
        gmAccompaniments: gmAccompaniments && gmAccompaniments.length > 0 ? gmAccompaniments : undefined,
        sideDishPreparedBy,
        sideDishFee,
        items: itemsWithPrice.length > 0 ? { create: itemsWithPrice } : undefined,
      },
      include: {
        items: true,
        grillmaster: { include: { user: { select: { name: true, phone: true, email: true } } } },
        boutique: { select: { id: true, name: true, logoUrl: true, city: true, state: true, rating: true } },
      },
    })
  }, { isolationLevel: 'Serializable' }))

  // Notify all admins of new order (push + WhatsApp)
  const adminDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(order.eventDate)
  sendPushToRole('ADMIN', '🔥 Novo pedido!', `R$ ${order.totalPrice.toFixed(2)} — ${order.guestCount} pessoas em ${adminDate}`, '/admin').catch((e) => console.error("[notif]", e?.message))
  prisma.user.findUnique({ where: { id: customerId }, select: { name: true, phone: true } }).then(customer => {
    const adminEventDate = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(order.eventDate)
    const msg =
      `🔥 *Novo pedido — Tech Churras!*\n\n` +
      `👤 Cliente: ${customer?.name ?? 'Cliente'}\n` +
      `📞 ${customer?.phone ?? 'sem telefone'}\n` +
      `💰 R$ ${order.totalPrice.toFixed(2)}\n` +
      `📅 ${adminEventDate}\n` +
      `👥 ${order.guestCount} convidados\n` +
      `📍 ${order.eventAddress}\n\n` +
      `👉 https://www.techchurras.com.br/admin`
    sendWhatsAppToAdmin(msg).catch((e) => console.error("[notif]", e?.message))
  }).catch((e) => console.error("[notif]", e?.message))

  // Notify boutique owner when a new order involves their boutique
  if (order.boutiqueId) {
    const eventDateFmt = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    }).format(order.eventDate)
    prisma.boutique.findUnique({
      where: { id: order.boutiqueId },
      include: { user: { select: { id: true, name: true, phone: true } } },
    }).then(b => {
      if (!b) return
      sendPushToUser(b.userId, '🥩 Novo pedido no seu açougue!', `Evento em ${eventDateFmt} — acesse o dashboard.`, '/boutiques/dashboard').catch((e) => console.error("[notif]", e?.message))
      if (b.user?.phone) {
        const firstName = b.user.name.split(' ')[0]
        const msg = `🥩 *Novo pedido — Tech Churras!*\n\nOlá ${firstName}! Chegou um pedido para o *${order.boutique?.name ?? 'seu açougue'}*.\n\n📅 Evento: ${eventDateFmt}\n👥 ${order.guestCount} convidados\n\nVeja os detalhes e prepare os cortes:\nhttps://www.techchurras.com.br/boutiques/dashboard\n\n_Tech Churras 🔥_`
        sendWhatsAppMessage(b.user.phone, msg, 'new-order-boutique').catch((e) => console.error("[notif]", e?.message))
      }
    }).catch((e) => console.error("[notif]", e?.message))
  }

  // Notify grillmaster of incoming order
  if (order.grillmasterId) {
    Promise.all([
      prisma.grillmaster.findUnique({
        where: { id: order.grillmasterId },
        include: { user: { select: { id: true, email: true, name: true, phone: true } } },
      }),
      prisma.user.findUnique({ where: { id: customerId }, select: { name: true } }),
    ]).then(([gm, customer]) => {
      if (!gm?.user) return
      const date = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(order.eventDate)
      sendPushToUser(gm.user.id, '🔥 Novo pedido!', `Você recebeu um novo pedido para ${date}. Confirme agora.`, '/grillmasters/dashboard').catch((e) => console.error("[notif]", e?.message))
      emailNewOrderGrillmaster(gm.user.email, gm.user.name, order.id, customer?.name ?? 'Cliente', order.eventDate, order.guestCount).catch((e) => console.error("[notif]", e?.message))
      if (gm.user.phone) {
        const firstName = gm.user.name.split(' ')[0]
        const customerName = customer?.name ?? 'Cliente'
        const msg = `🔥 *Novo pedido — Tech Churras!*\n\nOlá ${firstName}! Você recebeu um novo pedido.\n\n👤 Cliente: ${customerName}\n📅 Data: ${date}\n👥 ${order.guestCount} convidados\n\nAcesse o painel para *confirmar agora*:\nhttps://www.techchurras.com.br/grillmasters/dashboard\n\n_Responda rápido — clientes preferem churrasqueiros ágeis! 🔥_`
        sendWhatsAppMessage(gm.user.phone, msg, 'new-order-gm').catch((e) => console.error("[notif]", e?.message))
      }
    }).catch((e) => console.error("[notif]", e?.message))
  }

  detectSuspiciousOrder(order, customerId).catch(() => {})
  startDispatch(order.id).catch(e => console.error('[dispatch] startDispatch falhou', order.id, e?.message))

  return order
}

export async function listOrders(customerId: string) {
  const orders = await prisma.order.findMany({
    where: { customerId },
    include: {
      items: { include: { product: true } },
      grillmaster: { include: { user: { select: { name: true, phone: true, email: true } } } },
      boutique: { select: { id: true, name: true, logoUrl: true, city: true, state: true, rating: true } },
      review: { select: { id: true, grillRating: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  const orderIds = orders.map(o => o.id)
  if (orderIds.length === 0) return orders.map(o => ({ ...o, _unreadMessages: 0 }))
  const unreadGroups = await prisma.message.groupBy({
    by: ['orderId'],
    where: { orderId: { in: orderIds }, senderId: { not: customerId }, read: false },
    _count: { id: true },
  })
  const unreadMap: Record<string, number> = {}
  unreadGroups.forEach(g => { unreadMap[g.orderId] = g._count.id })
  return orders.map(o => ({ ...o, _unreadMessages: unreadMap[o.id] ?? 0 }))
}

async function sendWhatsAppMessage(phone: string, message: string, label: string) {
  const instance = process.env.ZAPI_INSTANCE
  const token = process.env.ZAPI_TOKEN
  if (!instance || !token) return
  const cleanPhone = phone.replace(/\D/g, '')
  try {
    const res = await fetchWithTimeout(
      `https://api.z-api.io/instances/${instance}/token/${token}/send-text`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: cleanPhone, message }) }
    )
    if (!res.ok) console.log(`[WhatsApp] ${label} erro:`, res.status)
    else console.log(`[WhatsApp] ${label} enviado para`, maskPhone(cleanPhone))
  } catch (err) {
    console.log(`[WhatsApp] ${label} falha:`, err)
  }
}

async function sendWhatsAppConfirmation(
  phone: string,
  customerName: string,
  orderId: string,
  grillmasterName: string,
  eventDate: Date
) {
  const instance = process.env.ZAPI_INSTANCE
  const token = process.env.ZAPI_TOKEN
  if (!instance || !token) {
    console.log('[WhatsApp] ZAPI_INSTANCE/ZAPI_TOKEN nao configurados — pulando envio')
    return
  }
  const date = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(eventDate)
  const message = `🔥 Seu churrasco está confirmado! Olá ${customerName}, seu pedido #${orderId.slice(0, 8)} com ${grillmasterName} foi confirmado para ${date}. Acompanhe em: https://www.techchurras.com.br/orders/${orderId}`
  await sendWhatsAppMessage(phone, message, 'confirmacao')
}

export async function updateOrderStatusDetail(id: string, statusDetail: string, userId: string, role: string) {
  let authorized = false
  if (role === 'ADMIN') {
    authorized = true
  } else if (role === 'GRILLMASTER') {
    const gm = await prisma.grillmaster.findUnique({ where: { userId } })
    if (gm) {
      const order = await prisma.order.findFirst({ where: { id, grillmasterId: gm.id } })
      authorized = !!order
    }
  }
  if (!authorized) throw new Error('Nao autorizado')
  const updated = await prisma.order.update({ where: { id }, data: { statusDetail } })
  if (statusDetail === 'Churrasqueiro a caminho') {
    sendPushToUser(
      updated.customerId,
      'Churrasqueiro a caminho!',
      'Seu churrasqueiro esta se deslocando ao local do evento.',
      `/orders/${id}`
    ).catch((e) => console.error("[notif]", e?.message))
  }
  return updated
}

export async function updateOrderStatus(id: string, status: OrderStatus, userId?: string, role?: string) {
  // F3: userId é obrigatório para qualquer chamada não-admin
  if (!userId && role !== 'ADMIN') {
    throw new Error('userId é obrigatório para atualizar status de pedido')
  }
  if (userId && role !== 'ADMIN') {
    const existing = await prisma.order.findUnique({
      where: { id },
      include: { grillmaster: { select: { userId: true } } },
    })
    if (!existing) throw new Error('Pedido nao encontrado')
    const isAssignedGM = existing.grillmaster?.userId === userId
    if (!isAssignedGM) throw new Error('Sem permissao para alterar este pedido')
    const allowed = VALID_TRANSITIONS[existing.status] ?? []
    if (!allowed.includes(status)) {
      throw new Error(`Transicao invalida: ${existing.status} -> ${status}`)
    }
    if (status === 'CONFIRMED' && existing.paymentStatus !== 'PAID') {
      throw new Error('Pedido precisa estar pago antes de confirmar')
    }
  }
  const statusDetailMap: Partial<Record<string, string>> = {
    CONFIRMED: 'Pedido confirmado',
    IN_PROGRESS: 'Churrasqueiro chegou',
    COMPLETED: 'Finalizado',
  }
  // F6: transição atômica — WHERE status = <esperado> previne race condition de dupla confirmação
  const expectedStatus = Object.entries(VALID_TRANSITIONS).find(([, nexts]) => nexts.includes(status))?.[0] as OrderStatus | undefined
  if (expectedStatus) {
    const result = await prisma.order.updateMany({ where: { id, status: expectedStatus }, data: { status } })
    if (result.count === 0) throw new Error(`Transicao invalida ou pedido ja processado: -> ${status}`)
  }
  const updated = await prisma.order.update({
    where: { id },
    data: {
      status,
      ...(statusDetailMap[status] ? { statusDetail: statusDetailMap[status] } : {}),
    },
    include: {
      customer: true,
      grillmaster: { include: { user: { select: { name: true } } } },
    },
  })
  if (status === 'CONFIRMED') {
    sendPushToUser(
      updated.customerId,
      'Pedido confirmado!',
      `Seu churrasco foi confirmado para ${new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(updated.eventDate)}.`,
      `/orders/${updated.id}`
    ).catch((e) => console.error("[notif]", e?.message))
    emailOrderConfirmed(
      updated.customer.email,
      updated.customer.name,
      updated.id,
      updated.grillmaster?.user?.name ?? 'churrasqueiro',
      updated.eventDate,
      updated.eventAddress ?? ''
    ).catch((e) => console.error("[notif]", e?.message))
  }
  if (status === 'COMPLETED' && updated.grillmasterId) {
    prisma.grillmaster.update({
      where: { id: updated.grillmasterId },
      data: { totalOrders: { increment: 1 } },
    }).then(gm => {
      sendPushToUser(gm.userId, 'Pedido concluido!', 'Avalie o cliente para finalizar o pedido.', `/orders/${updated.id}/review-customer`).catch((e) => console.error("[notif]", e?.message))
    }).catch((e) => console.error("[notif]", e?.message))

    const gmName = updated.grillmaster?.user?.name ?? 'churrasqueiro'
    sendPushToUser(
      updated.customerId,
      '🌟 Como foi o churrasco?',
      `Avalie ${gmName} e ajude outros clientes a encontrar os melhores!`,
      `/orders/${updated.id}/review`
    ).catch((e) => console.error("[notif]", e?.message))

    if (updated.paymentStatus === 'PAID') {
      const pts = Math.floor(updated.totalPrice / 10)
      if (pts > 0) {
        prisma.user.update({
          where: { id: updated.customerId },
          data: { points: { increment: pts } },
        }).catch((e) => console.error("[notif]", e?.message))
      }
    }
  }
  if (status === 'CONFIRMED' && updated.customer.phone) {
    const gmName = updated.grillmaster?.user?.name ?? 'churrasqueiro'
    sendWhatsAppConfirmation(
      updated.customer.phone,
      updated.customer.name,
      updated.id,
      gmName,
      updated.eventDate
    ).catch((e) => console.error("[notif]", e?.message))
  }
  // Notify boutique to prepare the order when GM confirms
  if (status === 'CONFIRMED') {
    prisma.order.findUnique({
      where: { id },
      include: {
        boutique: { include: { user: { select: { name: true, phone: true } } } },
        grillmaster: { include: { user: { select: { name: true } } } },
      },
    }).then(o => {
      if (!o?.boutique?.user?.phone) return
      const date = new Intl.DateTimeFormat('pt-BR', {
        weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
      }).format(o.eventDate)
      const firstName = o.boutique.user.name.split(' ')[0]
      const gmName = o.grillmaster?.user?.name ?? 'churrasqueiro'
      const msg = `✅ *Pedido confirmado — separe os cortes!*\n\nOlá ${firstName}, o churrasqueiro *${gmName}* confirmou o pedido e passará no seu açougue.\n\n📅 Evento: ${date}\n👥 ${o.guestCount} convidados\n\nSepare os cortes e acompanhamentos para quando ele chegar:\nhttps://www.techchurras.com.br/boutiques/dashboard\n\n_Tech Churras 🔥_`
      sendWhatsAppMessage(o.boutique.user.phone, msg, 'order-confirmed-boutique').catch((e) => console.error("[notif]", e?.message))
    }).catch((e) => console.error("[notif]", e?.message))
  }
  if (status === 'COMPLETED' && updated.customer.phone) {
    const gmName = updated.grillmaster?.user?.name ?? 'churrasqueiro'
    const msg = `⭐ Como foi o churrasco com ${gmName}?\n\nEsperamos que tenha sido incrível! Avalie o evento em 1 minuto e ajude outros clientes:\nhttps://www.techchurras.com.br/orders/${updated.id}/review\n\n🔥 Tech Churras`
    sendWhatsAppMessage(updated.customer.phone, msg, 'review-pos-evento').catch((e) => console.error("[notif]", e?.message))
  }
  if (status === 'COMPLETED') {
    const gmName = updated.grillmaster?.user?.name ?? 'churrasqueiro'
    emailOrderCompleted(updated.customer.email, updated.customer.name, updated.id, gmName).catch((e) => console.error("[notif]", e?.message))
    const completedDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(updated.eventDate)
    sendWhatsAppToAdmin(
      `✅ *Evento concluído — Tech Churras!*\n\n` +
      `👤 Cliente: ${updated.customer.name}\n` +
      `🔥 GM: ${gmName}\n` +
      `💰 R$ ${updated.totalPrice.toFixed(2)}\n` +
      `📅 ${completedDate} · ${updated.guestCount} pessoas\n\n` +
      `Aguarde a avaliação do cliente! ⭐\nhttps://www.techchurras.com.br/admin`
    ).catch((e) => console.error("[notif]", e?.message))
  }
  return updated
}

export async function cancelOrder(id: string, userId: string, role: string, reason: string) {
  let whereClause: Record<string, any>
  if (role === 'ADMIN') {
    whereClause = { id }
  } else if (role === 'GRILLMASTER') {
    const gm = await prisma.grillmaster.findUnique({ where: { userId } })
    if (!gm) throw new Error('Churrasqueiro nao encontrado')
    whereClause = { id, grillmasterId: gm.id }
  } else {
    whereClause = { id, customerId: userId }
  }

  const order = await prisma.order.findFirst({ where: whereClause })
  if (!order) throw new Error('Pedido nao encontrado')
  if (['IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(order.status)) {
    throw new Error('Nao e possivel cancelar um pedido em andamento, concluido ou ja cancelado')
  }

  // Taxa de cancelamento só se aplica quando é o CLIENTE que desiste em cima
  // da hora — se o churrasqueiro cancela (ou admin cancela em nome dele), o
  // cliente não pode ser penalizado por um problema que não é dele.
  let cancellationFee = 0
  if (order.status === 'CONFIRMED' && role !== 'GRILLMASTER') {
    const hoursUntil = (order.eventDate.getTime() - Date.now()) / (1000 * 60 * 60)
    if (hoursUntil < 24) {
      cancellationFee = order.totalPrice * 0.5
    } else if (hoursUntil < 48) {
      cancellationFee = order.totalPrice * 0.3
    }
  }

  const refundAmount = order.paymentStatus === 'PAID' ? order.totalPrice - cancellationFee : null
  const cancelledBy = role === 'ADMIN' ? 'ADMIN' : role === 'GRILLMASTER' ? 'GRILLMASTER' : 'CUSTOMER'

  const needsRefund = order.paymentStatus === 'PAID' && order.paymentId && refundAmount !== null && refundAmount > 0

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      cancelledBy,
      cancellationReason: reason || null,
      cancellationFee: cancellationFee > 0 ? cancellationFee : null,
      refundAmount: refundAmount !== null ? refundAmount : undefined,
      refundStatus: needsRefund ? 'PENDING' : null,
    },
    include: { grillmaster: { select: { userId: true } } },
  })

  // Notify the other party about the cancellation
  const eventDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(order.eventDate)
  if (cancelledBy === 'CUSTOMER' && updated.grillmaster?.userId) {
    sendPushToUser(updated.grillmaster.userId, 'Pedido cancelado', `O cliente cancelou o pedido de ${eventDate}.`, '/grillmasters/dashboard').catch((e) => console.error("[notif]", e?.message))
  } else if (cancelledBy === 'GRILLMASTER') {
    sendPushToUser(order.customerId, 'Pedido cancelado', `Seu pedido de ${eventDate} foi cancelado pelo churrasqueiro.`, `/orders/${id}`).catch((e) => console.error("[notif]", e?.message))
  }

  // Executar estorno no MP com rastreamento de status
  if (needsRefund) {
    refundPayment(order.paymentId!, refundAmount!)
      .then(() => {
        prisma.order.update({ where: { id }, data: { refundStatus: 'DONE' } }).catch(() => {})
      })
      .catch((e: any) => {
        prisma.order.update({ where: { id }, data: { refundStatus: 'FAILED' } }).catch(() => {})
        console.error('[cancelOrder] Falha ao estornar no MP:', e?.message)
        sendWhatsAppToAdmin(
          `🚨 *FALHA NO ESTORNO — Tech Churras!*\n\nPedido ${id}: R$ ${refundAmount!.toFixed(2)} NÃO devolvido ao cliente.\nVerificar Mercado Pago manualmente.\nhttps://www.techchurras.com.br/admin`
        ).catch(() => {})
      })
  }

  // Notify admin of cancellation
  const cancelledByLabel = cancelledBy === 'CUSTOMER' ? 'cliente' : cancelledBy === 'GRILLMASTER' ? 'churrasqueiro' : 'admin'
  sendWhatsAppToAdmin(
    `🚨 *Pedido cancelado — Tech Churras!*\n\n` +
    `📅 Evento: ${eventDate}\n` +
    `💰 R$ ${order.totalPrice.toFixed(2)}\n` +
    `❌ Cancelado por: ${cancelledByLabel}\n` +
    `${reason ? `📝 Motivo: ${reason}` : ''}\n` +
    `${cancellationFee > 0 ? `💸 Taxa de cancelamento: R$ ${cancellationFee.toFixed(2)}` : ''}\n\n` +
    `https://www.techchurras.com.br/admin`
  ).catch((e) => console.error("[notif]", e?.message))

  return updated
}

export async function updateOrderLocation(id: string, lat: number, lng: number, userId: string) {
  const gm = await prisma.grillmaster.findUnique({ where: { userId } })
  if (!gm) throw new Error('Nao autorizado')
  const order = await prisma.order.findFirst({ where: { id, grillmasterId: gm.id } })
  if (!order) throw new Error('Pedido nao encontrado')
  return prisma.order.update({
    where: { id },
    data: { grillmasterLat: lat, grillmasterLng: lng, grillmasterLastUpdate: new Date() },
    select: { id: true, grillmasterLat: true, grillmasterLng: true, grillmasterLastUpdate: true },
  })
}

export async function generateShareToken(id: string, userId: string, role: string) {
  let whereClause: Record<string, any> = { id, customerId: userId }
  if (role === 'ADMIN') whereClause = { id }
  const order = await prisma.order.findFirst({ where: whereClause })
  if (!order) throw new Error('Pedido nao encontrado')
  if (order.publicShareToken) return { token: order.publicShareToken }
  const token = crypto.randomBytes(12).toString('hex')
  await prisma.order.update({ where: { id }, data: { publicShareToken: token } })
  return { token }
}

export async function getOrderByPublicToken(token: string) {
  const order = await prisma.order.findUnique({
    where: { publicShareToken: token },
    include: {
      grillmaster: { select: { photoUrl: true, user: { select: { name: true } } } },
      boutique: { select: { name: true } },
    },
  })
  if (!order) throw new Error('Pedido nao encontrado')
  const addrParts = order.eventAddress.split(',').map(s => s.trim())
  const eventCity = addrParts.length > 1 ? addrParts.slice(-2).join(', ') : order.eventAddress
  return {
    status: order.status,
    statusDetail: order.statusDetail,
    eventDate: order.eventDate,
    eventCity,
    guestCount: order.guestCount,
    grillmasterFirstName: order.grillmaster?.user?.name?.split(' ')[0] ?? null,
    grillmasterPhotoUrl: (order.grillmaster as any)?.photoUrl ?? null,
    boutiqueName: order.boutique?.name ?? null,
    grillmasterLat: order.grillmasterLat,
    grillmasterLng: order.grillmasterLng,
    grillmasterLastUpdate: order.grillmasterLastUpdate,
    eventAddress: order.eventAddress,
  }
}

export async function getRepeatData(id: string, userId: string, role: string) {
  const whereClause = role === 'ADMIN' ? { id } : { id, customerId: userId }
  const order = await prisma.order.findFirst({
    where: whereClause,
    include: { items: { include: { product: { select: { id: true, available: true } } } } },
  })
  if (!order) throw new Error('Pedido nao encontrado')
  if (order.status !== 'COMPLETED') throw new Error('So e possivel repetir pedidos concluidos')
  const unavailableProductIds: string[] = []
  const items: { productId: string; quantity: number }[] = []
  for (const item of order.items) {
    if (!item.product || !item.product.available) {
      unavailableProductIds.push(item.productId)
    } else {
      items.push({ productId: item.productId, quantity: Number(item.quantity) })
    }
  }
  return {
    grillmasterId: order.grillmasterId,
    boutiqueId: order.boutiqueId,
    guestCount: order.guestCount,
    eventHours: order.eventHours,
    items,
    unavailableProductIds,
  }
}

export async function getOrderById(id: string, userId: string, role: string = 'CUSTOMER') {
  let whereClause: Record<string, any> = { id, customerId: userId }
  if (role === 'ADMIN') {
    whereClause = { id }
  } else if (role === 'GRILLMASTER') {
    const gm = await prisma.grillmaster.findUnique({ where: { userId } })
    if (!gm) throw new Error('Churrasqueiro nao encontrado')
    whereClause = { id, grillmasterId: gm.id }
  }
  const order = await prisma.order.findFirst({
    where: whereClause,
    include: {
      items: { include: { product: true } },
      grillmaster: { include: { user: { select: { name: true, phone: true, email: true } } } },
      boutique: { select: { id: true, name: true, logoUrl: true, city: true, state: true, rating: true } },
      review: { select: { id: true, customerRating: true } },
      customer: { select: { id: true, name: true, averageRating: true, _count: { select: { orders: true } } } },
      kit: true,
    },
  })
  if (!order) throw new Error('Pedido nao encontrado')
  return order
}

export async function rescheduleOrder(id: string, newDate: Date, userId: string, role: string) {
  let whereClause: Record<string, any> = { id, customerId: userId }
  if (role === 'ADMIN') whereClause = { id }

  const order = await prisma.order.findFirst({ where: whereClause })
  if (!order) throw new Error('Pedido não encontrado')
  if (['IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(order.status)) {
    throw new Error('Não é possível remarcar um pedido em andamento, concluído ou cancelado')
  }
  const today = new Date(); today.setHours(0, 0, 0, 0)
  if (newDate < today) throw new Error('A nova data não pode ser no passado')

  const updated = await prisma.order.update({
    where: { id },
    data: { eventDate: newDate },
    include: {
      grillmaster: { include: { user: { select: { id: true, name: true } } } },
      customer: { select: { name: true, phone: true } },
    },
  })

  if (updated.grillmaster?.user?.id) {
    const date = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(newDate)
    sendPushToUser(
      updated.grillmaster.user.id,
      '📅 Pedido remarcado',
      `${updated.customer.name} remarcou o evento para ${date}.`,
      '/grillmasters/dashboard'
    ).catch((e) => console.error("[notif]", e?.message))
  }

  return updated
}

export async function getOrderEta(id: string, userId: string, role: string) {
  let whereClause: Record<string, any> = { id, customerId: userId }
  if (role === 'ADMIN') {
    whereClause = { id }
  } else if (role === 'GRILLMASTER') {
    const gm = await prisma.grillmaster.findUnique({ where: { userId } })
    if (!gm) throw new Error('Churrasqueiro nao encontrado')
    whereClause = { id, grillmasterId: gm.id }
  }

  const order = await prisma.order.findFirst({
    where: whereClause,
    select: {
      eventAddress: true,
      grillmasterLat: true,
      grillmasterLng: true,
      grillmasterLastUpdate: true,
      status: true,
    },
  })
  if (!order) throw new Error('Pedido nao encontrado')

  if (!order.grillmasterLat || !order.grillmasterLng) {
    return { available: false, reason: 'Localizacao do churrasqueiro nao disponivel' }
  }

  // Geocode event address (cached per-request, no DB storage needed)
  const eventCoords = await geocodeAddress(order.eventAddress)
  if (!eventCoords) {
    return { available: false, reason: 'Nao foi possivel geocodificar o endereco do evento' }
  }

  const distanceKm = haversineKm(
    order.grillmasterLat, order.grillmasterLng,
    eventCoords.lat, eventCoords.lng,
  )

  // Speed: 30 km/h urban average + 5 min buffer
  const etaMinutes = Math.round((distanceKm / 30) * 60) + 5
  const etaLabel = etaMinutes < 2 ? 'chegando' : etaMinutes < 60
    ? `~${etaMinutes} min`
    : `~${Math.round(etaMinutes / 60)}h`

  return {
    available: true,
    distanceKm: +distanceKm.toFixed(2),
    etaMinutes,
    etaLabel,
    gmLat: order.grillmasterLat,
    gmLng: order.grillmasterLng,
    eventLat: eventCoords.lat,
    eventLng: eventCoords.lng,
    lastUpdate: order.grillmasterLastUpdate,
  }
}