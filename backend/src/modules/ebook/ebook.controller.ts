import { FastifyRequest, FastifyReply } from 'fastify'
import * as Sentry from '@sentry/node'
import path from 'path'
import fs from 'fs'
import { createEbookPreference, handleEbookWebhook, getPaidPurchaseByToken } from './ebook.service'
import { verifyMPSignature } from '../../utils/mercadopago'
import { reportIfUnexpected } from '../../utils/report'

export async function ebookCheckoutHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { name, email } = req.body as { name: string; email: string }
    if (!name?.trim() || !email?.trim()) {
      return reply.status(400).send({ error: 'Nome e email são obrigatórios' })
    }
    const result = await createEbookPreference(name.trim(), email.trim())
    return reply.status(201).send(result)
  } catch (err: any) {
    reportIfUnexpected(err)
    return reply.status(400).send({ error: err.message })
  }
}

export async function ebookWebhookHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const query = req.query as Record<string, string>
    const body = (req.body as any) ?? {}
    const paymentId = String(body.data?.id ?? query['data.id'] ?? query['id'] ?? '')

    if (!verifyMPSignature(req, paymentId)) {
      req.log.warn('[ebook webhook] Assinatura MP inválida — requisição rejeitada')
      return reply.status(401).send({ error: 'Assinatura inválida' })
    }

    const payload = { type: body.type ?? query['type'], data: { id: paymentId } }
    const result = await handleEbookWebhook(payload)
    return reply.send(result)
  } catch (err: any) {
    Sentry.captureException(err)
    return reply.status(500).send({ error: err.message })
  }
}

export async function ebookDownloadHandler(req: FastifyRequest, reply: FastifyReply) {
  const { token } = req.params as { token: string }
  const purchase = await getPaidPurchaseByToken(token)
  if (!purchase) {
    return reply.status(404).send({ error: 'Link inválido ou pagamento não confirmado' })
  }
  const filePath = path.join(__dirname, '../../../assets/ebook-metodo-churrasco-exotico.pdf')
  const stream = fs.createReadStream(filePath)
  return reply
    .header('Content-Type', 'application/pdf')
    .header('Content-Disposition', 'attachment; filename="O-Metodo-do-Churrasco-Exotico.pdf"')
    .send(stream)
}
