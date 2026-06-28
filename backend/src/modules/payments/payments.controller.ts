import { FastifyRequest, FastifyReply } from 'fastify'
import { createHmac, timingSafeEqual } from 'crypto'
import { createPreference, handleMPWebhook } from './payments.service'

function verifyMPSignature(req: FastifyRequest, paymentId: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) {
    // Sem secret configurado — aceita mas avisa (remover após configurar no Railway)
    req.log.warn('[webhook] MP_WEBHOOK_SECRET não configurado — assinatura não validada')
    return true
  }

  const xSignature = req.headers['x-signature'] as string | undefined
  const xRequestId = req.headers['x-request-id'] as string | undefined

  if (!xSignature) {
    req.log.warn('[webhook] x-signature ausente')
    return false
  }

  // Extrai ts e v1 do header x-signature: "ts=123456,v1=abcdef..."
  const parts: Record<string, string> = {}
  xSignature.split(',').forEach((part) => {
    const [key, val] = part.split('=')
    if (key && val) parts[key.trim()] = val.trim()
  })

  const { ts, v1 } = parts
  if (!ts || !v1) return false

  const manifest = `id:${paymentId};request-id:${xRequestId ?? ''};ts:${ts}`
  const expected = createHmac('sha256', secret).update(manifest).digest('hex')

  try {
    return timingSafeEqual(Buffer.from(v1, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

export async function createPreferenceHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const customerId = (req.user as any).id
    const { orderId } = req.body as { orderId: string }
    const result = await createPreference(orderId, customerId)
    return reply.status(201).send(result)
  } catch (err: any) {
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
    return reply.status(400).send({ error: err.message })
  }
}
