import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'
import { prisma } from '../../config/prisma'
import { emailEbookDelivered } from '../email/email.service'
import { sendWhatsAppToAdmin } from '../push/push.service'

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'https://www.techchurras.com.br'
const BACKEND_URL = process.env.BACKEND_URL ?? 'https://tech-churras-production.up.railway.app'
const EBOOK_PRICE = 19.9

function getClients() {
  const token = process.env.MP_ACCESS_TOKEN
  if (!token) throw new Error('MP_ACCESS_TOKEN nao configurado. Adicione no Railway.')
  const client = new MercadoPagoConfig({ accessToken: token })
  return { preference: new Preference(client), payment: new Payment(client), token }
}

export async function createEbookPreference(name: string, email: string) {
  const purchase = await prisma.ebookPurchase.create({
    data: { name, email, amount: EBOOK_PRICE },
  })

  const { preference: preferenceClient, token } = getClients()

  const result = await preferenceClient.create({
    body: {
      items: [
        {
          id: purchase.id,
          title: 'O Método do Churrasco Exótico — E-book',
          quantity: 1,
          unit_price: EBOOK_PRICE,
          currency_id: 'BRL',
        },
      ],
      payer: { email },
      back_urls: {
        success: `${FRONTEND_URL}/metodo-do-churrasco-exotico?status=success`,
        failure: `${FRONTEND_URL}/metodo-do-churrasco-exotico?status=failure`,
        pending: `${FRONTEND_URL}/metodo-do-churrasco-exotico?status=pending`,
      },
      auto_return: 'approved',
      external_reference: `ebook:${purchase.id}`,
      notification_url: `${BACKEND_URL}/ebook/webhook`,
    },
  })

  const isSandbox = token.startsWith('TEST-')
  return {
    checkout_url: isSandbox ? result.sandbox_init_point : result.init_point,
  }
}

export async function handleEbookWebhook(payload: any) {
  const type = payload?.type
  const paymentId = payload?.data?.id
  if (type !== 'payment' || !paymentId) return { received: true }

  const { payment: paymentClient } = getClients()

  let payment: any
  try {
    payment = await paymentClient.get({ id: paymentId })
  } catch (err: any) {
    console.error(`[ebook webhook] Falha ao buscar pagamento ${paymentId} no MP:`, err?.message)
    throw new Error(`Falha ao buscar pagamento ${paymentId}`)
  }

  const ref = String(payment.external_reference ?? '')
  if (!ref.startsWith('ebook:')) return { received: true }
  const purchaseId = ref.slice('ebook:'.length)

  prisma.paymentEvent.create({
    data: {
      paymentId: String(paymentId),
      orderId: purchaseId,
      type: 'ebook_payment',
      status: payment.status ?? null,
      rawPayload: payment,
    },
  }).catch((e: any) => console.error('[ebook webhook] Falha ao gravar payment_event:', e?.message))

  if (payment.status !== 'approved') return { received: true }

  // Idempotência: só marca como PAID se ainda não estiver
  const updateResult = await prisma.ebookPurchase.updateMany({
    where: { id: purchaseId, status: { not: 'PAID' } },
    data: { status: 'PAID', paidAt: new Date(), paymentId: String(paymentId) },
  })
  if (updateResult.count === 0) return { received: true }

  const purchase = await prisma.ebookPurchase.findUnique({ where: { id: purchaseId } })
  if (!purchase) return { received: true }

  const downloadUrl = `${BACKEND_URL}/ebook/download/${purchase.downloadToken}`
  emailEbookDelivered(purchase.email, purchase.name, downloadUrl).catch((e) => console.error('[ebook email]', e?.message))
  sendWhatsAppToAdmin(
    `📖 *Venda do e-book — Tech Churras!*\n\n👤 ${purchase.name}\n📧 ${purchase.email}\n💰 R$ ${purchase.amount.toFixed(2)}`
  ).catch(() => {})

  return { received: true }
}

export async function getPaidPurchaseByToken(token: string) {
  return prisma.ebookPurchase.findFirst({ where: { downloadToken: token, status: 'PAID' } })
}
