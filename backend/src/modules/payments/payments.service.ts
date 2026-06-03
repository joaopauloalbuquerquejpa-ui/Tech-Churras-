import Stripe from 'stripe'
import type { Stripe as StripeType } from 'stripe'
import { prisma } from '../../config/prisma'
import dotenv from 'dotenv'

dotenv.config()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function createPaymentIntent(orderId: string, customerId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId },
  })

  if (!order) throw new Error('Pedido não encontrado')
  if (order.paymentId) throw new Error('Pedido já possui pagamento')

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(order.totalPrice * 100),
    currency: 'brl',
    metadata: {
      orderId: order.id,
      customerId,
    },
  })

  await prisma.order.update({
    where: { id: orderId },
    data: { paymentId: paymentIntent.id },
  })

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount: order.totalPrice,
  }
}

export async function confirmPayment(paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

  if (paymentIntent.status !== 'succeeded') {
    throw new Error('Pagamento não confirmado')
  }

  const order = await prisma.order.findFirst({
    where: { paymentId: paymentIntentId },
  })

  if (!order) throw new Error('Pedido não encontrado')

  await prisma.order.update({
    where: { id: order.id },
    data: { status: 'CONFIRMED' },
  })

  return { message: 'Pagamento confirmado com sucesso!', orderId: order.id }
}

export async function handleStripeWebhook(payload: Buffer, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: any

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
  } catch (err) {
    throw new Error('Webhook inválido')
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as any
    await confirmPayment(paymentIntent.id)
  }

  return { received: true }
}