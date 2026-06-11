import { FastifyInstance } from 'fastify'
import { validateCoupon } from './coupons.service'

export async function couponsRoutes(app: FastifyInstance) {
  app.post('/coupons/validate', async (req, reply) => {
    const { code, orderValue } = req.body as any
    if (!code || orderValue === undefined) {
      return reply.code(400).send({ error: 'code e orderValue sao obrigatorios' })
    }
    return validateCoupon(code, Number(orderValue))
  })
}
