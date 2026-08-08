import { FastifyRequest } from 'fastify'
import { createHmac, timingSafeEqual } from 'crypto'

export function verifyMPSignature(req: FastifyRequest, paymentId: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) {
    req.log.error('[webhook] MP_WEBHOOK_SECRET não configurado — rejeitando webhook')
    return false
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

  // Rejeita webhooks com timestamp > 5 minutos (previne replay attacks)
  const nowSeconds = Math.floor(Date.now() / 1000)
  if (Math.abs(nowSeconds - Number(ts)) > 300) {
    req.log.warn('[webhook] Timestamp fora da janela de 5 minutos — possível replay')
    return false
  }

  const manifest = `id:${paymentId};request-id:${xRequestId ?? ''};ts:${ts}`
  const expected = createHmac('sha256', secret).update(manifest).digest('hex')

  try {
    return timingSafeEqual(Buffer.from(v1, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}
