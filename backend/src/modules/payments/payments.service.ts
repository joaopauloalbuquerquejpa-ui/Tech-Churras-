import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'
import { prisma } from '../../config/prisma'
import dotenv from 'dotenv'

dotenv.config()

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'https://tech-churras.vercel.app'
const BACKEND_URL = process.env.BACKEND_URL ?? 'https://tech-churras-production.up.railway.app'

const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })
const preferenceClient = new Preference(mpClient)
const paymentClient = new Payment(mpClient)

export async function createPreference(orderId: string, customerId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId },
    include: { grillmaster: { include: { user: true } }, boutique: true },
  })
  if (!order) throw new Error('Pedido nao encontrado')

  const gmName = order.grillmaster?.user?.name ?? 'Grillmaster'
  const title = `Churrasco - ${gmName} - Pedido #${order.id.slice(0, 8)}`

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

  const isSandbox = process.env.MP_ACCESS_TOKEN?.startsWith('TEST-')
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

  const payment = await paymentClient.get({ id: paymentId })

  if (payment.status === 'approved') {
    const orderId = payment.external_reference
    if (!orderId) return { received: true }

    await prisma.order.updateMany({
      where: { id: orderId },
      data: {
        paymentId: String(paymentId),
        paymentStatus: 'PAID',
        paidAt: new Date(),
        status: 'CONFIRMED',
      },
    })
  }

  return { received: true }
}
