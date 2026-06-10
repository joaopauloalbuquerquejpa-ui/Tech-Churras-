import { FastifyRequest, FastifyReply } from 'fastify'
import { listPayouts, getPayoutsSummary, generatePayouts, markPayoutPaid } from './payouts.service'

export async function listPayoutsHandler(req: FastifyRequest, reply: FastifyReply) {
  const { status, weekStart, type } = req.query as Record<string, string>
  const result = await listPayouts(status, weekStart, type)
  return reply.send(result)
}

export async function getPayoutsSummaryHandler(req: FastifyRequest, reply: FastifyReply) {
  const result = await getPayoutsSummary()
  return reply.send(result)
}

export async function generatePayoutsHandler(req: FastifyRequest, reply: FastifyReply) {
  const result = await generatePayouts()
  return reply.status(201).send(result)
}

export async function markPayoutPaidHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const result = await markPayoutPaid(id)
  return reply.send(result)
}
