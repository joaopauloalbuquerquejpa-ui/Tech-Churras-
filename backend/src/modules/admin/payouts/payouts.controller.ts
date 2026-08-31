import { FastifyRequest, FastifyReply } from 'fastify'
import { listPayouts, getPayoutsSummary, generatePayouts, markPayoutPaid } from './payouts.service'
import { reportIfUnexpected } from '../../../utils/report'

export async function listPayoutsHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { status, weekStart, type } = req.query as Record<string, string>
    const result = await listPayouts(status, weekStart, type)
    return reply.send(result)
  } catch (err: any) {
    reportIfUnexpected(err)
    return reply.status(400).send({ error: err.message })
  }
}

export async function getPayoutsSummaryHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const result = await getPayoutsSummary()
    return reply.send(result)
  } catch (err: any) {
    reportIfUnexpected(err)
    return reply.status(400).send({ error: err.message })
  }
}

export async function generatePayoutsHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const result = await generatePayouts()
    return reply.status(201).send(result)
  } catch (err: any) {
    reportIfUnexpected(err)
    return reply.status(400).send({ error: err.message })
  }
}

export async function markPayoutPaidHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    const result = await markPayoutPaid(id)
    return reply.send(result)
  } catch (err: any) {
    reportIfUnexpected(err)
    return reply.status(400).send({ error: err.message })
  }
}
