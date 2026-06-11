import { FastifyInstance } from 'fastify'
import { getPointsBalance, redeemPoints, listRedemptions } from './points.service'

export async function pointsRoutes(app: FastifyInstance) {
  app.get('/points/balance', { preHandler: [app.authenticate] }, async (req, reply) => {
    try {
      const userId = (req.user as any).id
      const data = await getPointsBalance(userId)
      return data
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.post('/points/redeem', { preHandler: [app.authenticate] }, async (req, reply) => {
    try {
      const userId = (req.user as any).id
      const data = await redeemPoints(userId)
      return data
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.get('/points/redemptions', { preHandler: [app.authenticate] }, async (req, reply) => {
    try {
      const userId = (req.user as any).id
      const data = await listRedemptions(userId)
      return data
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })
}
