import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'
import { prisma } from '../../config/prisma'
import { sendPushToUser, sendWhatsAppToAdmin } from '../push/push.service'
import { emailOrderConfirmed } from '../email/email.service'
import { fetchWithTimeout } from '../../utils/http'
import dotenv from 'dotenv'

dotenv.config()

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'https://www.techchurras.com.br'
const BACKEND_URL = process.env.BACKEND_URL ?? 'https://tech-churras-production.up.railway.app'

function getClients() {
  const token = process.env.MP_ACCESS_TOKEN
  if (!token) throw new Error('MP_ACCESS_TOKEN nao configurado. Adicione no Railway.')
  const client = new MercadoPagoConfig({ accessToken: token })
  return { preference: new Preference(client), payment: new Payment(client), token }
}

export async function createPreference(orderId: string, customerId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId },
    include: { grillmaster: { include: { user: true } }, boutique: true },
  })
  if (!order) throw new Error('Pedido nao encontrado')
  if (!order.totalPrice || order.totalPrice <= 0) throw new Error('Pedido sem valor - nada a pagar')

  const gmName = order.grillmaster?.user?.name ?? 'Grillmaster'
  const title = `Churrasco - ${gmName} - Pedido #${order.id.slice(0, 8)}`

  const { preference: preferenceClient, token } = getClients()

  const result = await preferenceClient.create({
    body: {
      items: [
        {
          id: order.id,
          title,
          quantity: 1,
          unit_price: order.totalPrice,
          currency_id: 'BRL',
        },
      ],
      back_urls: {
        success: `${FRONTEND_URL}/orders/${order.id}?payment=success`,
        failure: `${FRONTEND_URL}/orders/${order.id}?payment=failure`,
        pending: `${FRONTEND_URL}/orders/${order.id}?payment=pending`,
      },
      auto_return: 'approved',
      external_reference: order.id,
      notification_url: `${BACKEND_URL}/payments/webhook`,
    },
  })

  await prisma.order.update({
    where: { id: orderId },
    data: { paymentId: result.id },
  })

  const isSandbox = token.startsWith('TEST-')
  return {
    checkout_url: isSandbox ? result.sandbox_init_point : result.init_point,
    preferenceId: result.id,
    amount: order.totalPrice,
  }
}

export async function handleMPWebhook(payload: any) {
  const type = payload?.type
  const paymentId = payload?.data?.id

  if (type !== 'payment' || !paymentId) return { received: true }

  const { payment: paymentClient } = getClients()

  let payment: any
  try {
    payment = await paymentClient.get({ id: paymentId })
  } catch (err: any) {
    console.error(`[webhook] Falha ao buscar pagamento ${paymentId} no MP:`, err?.message)
    throw new Error(`Falha ao buscar pagamento ${paymentId}`)
  }

  if (payment.status === 'approved') {
    const orderId = payment.external_reference
    if (!orderId) return { received: true }

    const updateResult = await prisma.order.updateMany({
      // paymentStatus nasce NULL e { not: 'PAID' } exclui NULL no Prisma — sem o
      // OR explícito, NENHUM pagamento era confirmado (verificado contra produção em 15/07)
      where: {
        id: orderId,
        OR: [{ paymentStatus: null }, { paymentStatus: { not: 'PAID' } }],
        status: { notIn: ['CANCELLED', 'COMPLETED'] },
      },
      data: {
        paymentId: String(paymentId),
        paymentStatus: 'PAID',
        paidAt: new Date(),
        status: 'CONFIRMED',
        statusDetail: 'Pedido confirmado',
      },
    })

    // Idempotência: se nenhuma linha foi atualizada, pagamento já foi processado OU o pedido foi cancelado
    if (updateResult.count === 0) {
      const existing = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true, paymentStatus: true, totalPrice: true, customerId: true } })
      if (existing && existing.status === 'CANCELLED' && existing.paymentStatus !== 'PAID') {
        // Pagamento aprovado chegou após o cancelamento: não reativar, alertar admin para estorno manual
        sendWhatsAppToAdmin(
          `🚨 *Pagamento aprovado em pedido CANCELADO — Tech Churras!*\n\n` +
          `📋 Pedido: ${orderId}\n` +
          `💰 Valor: R$ ${existing.totalPrice.toFixed(2)}\n` +
          `💳 MP payment ID: ${paymentId}\n\n` +
          `O pedido foi cancelado antes do webhook chegar. O pedido NÃO foi reativado.\n` +
          `Estorne manualmente no Mercado Pago: https://www.techchurras.com.br/admin`
        ).catch(() => {})
      }
      return { received: true }
    }

    // Notify GM, boutique and customer of payment-confirmed order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        grillmaster: { include: { user: { select: { id: true, name: true, phone: true } } } },
        boutique: { include: { user: { select: { id: true, name: true, phone: true } } } },
        customer: { select: { id: true, name: true, email: true } },
      },
    })
    if (order?.grillmaster?.user) {
      const date = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(order.eventDate)
      sendPushToUser(order.grillmaster.user.id, '💳 Pagamento confirmado!', `${order.customer.name} pagou. Evento em ${date}. Confirme sua presença.`, '/grillmasters/dashboard').catch((e) => console.error("[notif]", e?.message))
    }
    if (order?.boutique?.user) {
      const date = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(order.eventDate)
      sendPushToUser(order.boutique.user.id, '🥩 Novo pedido pago!', `Separe os cortes para o evento de ${date} (${order.guestCount} pessoas). Pedido confirmado!`, '/boutiques/dashboard').catch((e) => console.error("[notif]", e?.message))
      if (order.boutique.user.phone) {
        const instance = process.env.ZAPI_INSTANCE
        const token = process.env.ZAPI_TOKEN
        if (instance && token) {
          const clean = order.boutique.user.phone.replace(/\D/g, '')
          const msg = `🔥 *Pedido confirmado — Tech Churras!*\n\n` +
            `🥩 *${order.boutique.name}*\n` +
            `📋 Pedido: #${orderId.slice(-6).toUpperCase()}\n` +
            `📅 Evento: ${date}\n` +
            `👥 ${order.guestCount} pessoas\n` +
            `💰 Valor pedido: R$ ${order.totalPrice.toFixed(2)}\n\n` +
            `Separe os cortes! Acompanhe no painel:\nhttps://www.techchurras.com.br/boutiques/dashboard`
          fetchWithTimeout(`https://api.z-api.io/instances/${instance}/token/${token}/send-text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: clean, message: msg }),
          }).catch((e) => console.error('[notif boutique WA]', e?.message))
        }
      }
    }
    if (order?.customer) {
      sendPushToUser(order.customer.id, '✅ Pagamento confirmado!', 'Seu churrasco está confirmado! Acompanhe os detalhes no app.', `/orders/${orderId}`).catch((e) => console.error("[notif]", e?.message))
      emailOrderConfirmed(
        order.customer.email,
        order.customer.name,
        orderId,
        order.grillmaster?.user?.name ?? 'churrasqueiro',
        order.eventDate,
        order.eventAddress ?? ''
      ).catch((e) => console.error("[notif]", e?.message))
      triggerReferralBonus(order.customer.id, orderId).catch((e) => console.error("[notif]", e?.message))
    }
    if (order) {
      const date = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).format(order.eventDate)
      sendWhatsAppToAdmin(
        `💳 *Pagamento confirmado — Tech Churras!*\n\n` +
        `👤 ${order.customer?.name}\n` +
        `💰 R$ ${order.totalPrice.toFixed(2)}\n` +
        `📅 ${date} · ${order.guestCount} pessoas\n` +
        `🔥 GM: ${order.grillmaster?.user?.name ?? '—'}\n\n` +
        `Dinheiro a caminho! 🎉\nhttps://www.techchurras.com.br/admin`
      ).catch((e) => console.error("[notif]", e?.message))
    }
  }

  if (['refunded', 'charged_back', 'in_mediation'].includes(payment.status)) {
    const orderId = payment.external_reference
    if (orderId) {
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: `DISPUTE_${payment.status.toUpperCase()}` },
      }).catch((e: any) => console.error('[webhook] Falha ao marcar disputa:', e?.message))
      sendWhatsAppToAdmin(
        `🚨 *CHARGEBACK/ESTORNO — Tech Churras!*\n\n` +
        `📋 Pedido: ${orderId}\n` +
        `❌ Status MP: ${payment.status}\n\n` +
        `Verifique o painel do Mercado Pago imediatamente.\nhttps://www.techchurras.com.br/admin`
      ).catch(() => {})
    }
  }

  return { received: true }
}

export async function refundPayment(paymentId: string, amount: number): Promise<void> {
  const { payment: paymentClient } = getClients()
  await (paymentClient as any).refund({ id: Number(paymentId), body: { amount } })
}

async function triggerReferralBonus(customerId: string, orderId: string) {
  const customer = await prisma.user.findUnique({
    where: { id: customerId },
    select: { referredByBoutiqueId: true },
  })
  if (!customer?.referredByBoutiqueId) return

  // Only on first paid order
  const previousPaid = await prisma.order.count({
    where: { customerId, paymentStatus: 'PAID', id: { not: orderId } },
  })
  if (previousPaid > 0) return

  // Avoid duplicate bonus
  const exists = await prisma.payout.findFirst({
    where: { type: 'REFERRAL_BONUS', recipientId: customer.referredByBoutiqueId, notes: customerId },
  })
  if (exists) return

  const boutique = await prisma.boutique.findUnique({
    where: { id: customer.referredByBoutiqueId },
    select: { pixKey: true, userId: true },
  })

  const now = new Date()
  await prisma.payout.create({
    data: {
      type: 'REFERRAL_BONUS',
      recipientId: customer.referredByBoutiqueId,
      orderId,
      amount: 40,
      commission: 0,
      grossAmount: 40,
      status: 'PENDING',
      weekStart: now,
      weekEnd: now,
      pixKey: boutique?.pixKey ?? null,
      notes: customerId,
    },
  })

  // Notify boutique owner
  if (boutique?.userId) {
    sendPushToUser(
      boutique.userId,
      '🎉 Bônus de indicação!',
      'Você ganhou R$ 40 por converter um novo cliente para a Tech Churras.',
      '/boutiques/dashboard'
    ).catch((e) => console.error("[notif]", e?.message))
  }
}