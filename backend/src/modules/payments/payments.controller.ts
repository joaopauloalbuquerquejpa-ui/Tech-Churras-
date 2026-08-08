import { FastifyRequest, FastifyReply } from 'fastify'
import * as Sentry from '@sentry/node'
import { createPreference, handleMPWebhook } from './payments.service'
import { reportIfUnexpected } from '../../utils/report'
import { verifyMPSignature } from '../../utils/mercadopago'

export async function createPreferenceHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const customerId = (req.user as any).id
    const { orderId } = req.body as { orderId: string }
    const result = await createPreference(orderId, customerId)
    return reply.status(201).send(result)
  } catch (err: any) {
    reportIfUnexpected(err)
    return reply.status(400).send({ error: err.message })
  }
}

export async function mpWebhookHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    // MP pode enviar type/data.id no body OU nos query params dependendo da versão
    const query = req.query as Record<string, string>
    const body = (req.body as any) ?? {}
    const paymentId = String(body.data?.id ?? query['data.id'] ?? query['id'] ?? '')

    if (!verifyMPSignature(req, paymentId)) {
      req.log.warn('[webhook] Assinatura MP inválida — requisição rejeitada')
      return reply.status(401).send({ error: 'Assinatura inválida' })
    }

    const payload = {
      type: body.type ?? query['type'],
      data: { id: paymentId },
    }
    const result = await handleMPWebhook(payload)
    return reply.send(result)
  } catch (err: any) {
    // Webhook de pagamento: QUALQUER falha aqui é dinheiro em risco — sempre reportar
    Sentry.captureException(err)
    return reply.status(500).send({ error: err.message })
  }
}
