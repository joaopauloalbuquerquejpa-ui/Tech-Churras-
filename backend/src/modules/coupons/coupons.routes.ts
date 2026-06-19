import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { validateCoupon } from './coupons.service'

const validateCouponSchema = z.object({
  code: z.string().min(1),
  orderValue: z.number().min(0),
})

export async function couponsRoutes(app: FastifyInstance) {
  app.post('/coupons/validate', { config: { rateLimit: { max: 15, timeWindow: '1 minute' } } }, async (req, reply) => {
    const parsed = validateCouponSchema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0].message })
    return validateCoupon(parsed.data.code, parsed.data.orderValue)
  })
}
