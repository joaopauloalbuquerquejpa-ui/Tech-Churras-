import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { validateCoupon } from './coupons.service'

const validateCouponSchema = z.object({
  code: z.string().min(1),
  orderValue: z.number().min(0),
})

export async function couponsRoutes(app: FastifyInstance) {
  // Rota publica (convidado pode estar previewando cupom antes de criar conta
  // no fim do wizard) - auth e' opcional, so pra saber de quem e' o pedido
  // quando o cliente ja esta logado. Cupom pessoal (customerId setado) exige
  // login pra validar de verdade; sem token, so cupom sem dono passa.
  app.post('/coupons/validate', { config: { rateLimit: { max: 15, timeWindow: '1 minute' } } }, async (req, reply) => {
    const parsed = validateCouponSchema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0].message })
    let customerId: string | undefined
    try {
      await req.jwtVerify()
      customerId = (req.user as { id: string }).id
    } catch { /* convidado sem token - segue sem customerId */ }
    return validateCoupon(parsed.data.code, parsed.data.orderValue, undefined, customerId)
  })
}
