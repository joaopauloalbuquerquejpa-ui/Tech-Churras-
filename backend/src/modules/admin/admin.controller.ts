import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { reportIfUnexpected } from '../../utils/report'

const uuidSchema = z.string().uuid('ID inválido')
const approveGrillmasterBodySchema = z.object({
  pricePerHour: z.number().positive().optional(),
})
import {
  listUsers,
  blockUser,
  listGrillmasters,
  listPendingGrillmasters,
  approveGrillmaster,
  rejectGrillmaster,
  listAwaitingCertification,
  certifyGrillmaster,
  listPendingBoutiques,
  listAllBoutiques,
  approveBoutique,
  rejectBoutique,
  listAllOrders,
  getDashboardStats,
  markOrderPaid,
} from './admin.service'

export async function listUsersHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { skip, take, search } = req.query as { skip?: string; take?: string; search?: string }
    return reply.send(await listUsers(Number(skip ?? 0), Math.min(Number(take ?? 100), 500), search || undefined))
  } catch (err: any) {
    reportIfUnexpected(err)
    return reply.status(500).send({ error: err.message })
  }
}

export async function blockUserHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId } = req.params as { userId: string }
    uuidSchema.parse(userId)
    return reply.send(await blockUser(userId))
  } catch (err: any) {
    reportIfUnexpected(err)
    return reply.status(400).send({ error: err.message })
  }
}

export async function listGrillmastersHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { skip, take } = req.query as { skip?: string; take?: string }
    return reply.send(await listGrillmasters(Number(skip ?? 0), Math.min(Number(take ?? 100), 500)))
  } catch (err: any) {
    reportIfUnexpected(err)
    return reply.status(500).send({ error: err.message })
  }
}

export async function listPendingGrillmastersHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    return reply.send(await listPendingGrillmasters())
  } catch (err: any) {
    reportIfUnexpected(err)
    return reply.status(500).send({ error: err.message })
  }
}

export async function approveGrillmasterHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { grillmasterId } = req.params as { grillmasterId: string }
    uuidSchema.parse(grillmasterId)
    const { pricePerHour } = approveGrillmasterBodySchema.parse(req.body ?? {})
    return reply.send(await approveGrillmaster(grillmasterId, { pricePerHour }))
  } catch (err: any) {
    reportIfUnexpected(err)
    return reply.status(400).send({ error: err.message })
  }
}

export async function rejectGrillmasterHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { grillmasterId } = req.params as { grillmasterId: string }
    uuidSchema.parse(grillmasterId)
    return reply.send(await rejectGrillmaster(grillmasterId))
  } catch (err: any) {
    reportIfUnexpected(err)
    return reply.status(400).send({ error: err.message })
  }
}

export async function listAwaitingCertificationHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    return reply.send(await listAwaitingCertification())
  } catch (err: any) {
    reportIfUnexpected(err)
    return reply.status(500).send({ error: err.message })
  }
}

export async function certifyGrillmasterHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { grillmasterId } = req.params as { grillmasterId: string }
    uuidSchema.parse(grillmasterId)
    return reply.send(await certifyGrillmaster(grillmasterId))
  } catch (err: any) {
    reportIfUnexpected(err)
    return reply.status(400).send({ error: err.message })
  }
}

export async function listPendingBoutiquesHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    return reply.send(await listPendingBoutiques())
  } catch (err: any) {
    reportIfUnexpected(err)
    return reply.status(500).send({ error: err.message })
  }
}

export async function listAllBoutiquesHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { skip, take } = req.query as { skip?: string; take?: string }
    return reply.send(await listAllBoutiques(Number(skip ?? 0), Math.min(Number(take ?? 200), 500)))
  } catch (err: any) {
    reportIfUnexpected(err)
    return reply.status(500).send({ error: err.message })
  }
}

export async function approveBoutiqueHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { boutiqueId } = req.params as { boutiqueId: string }
    uuidSchema.parse(boutiqueId)
    return reply.send(await approveBoutique(boutiqueId))
  } catch (err: any) {
    reportIfUnexpected(err)
    return reply.status(400).send({ error: err.message })
  }
}

export async function rejectBoutiqueHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { boutiqueId } = req.params as { boutiqueId: string }
    uuidSchema.parse(boutiqueId)
    return reply.send(await rejectBoutique(boutiqueId))
  } catch (err: any) {
    reportIfUnexpected(err)
    return reply.status(400).send({ error: err.message })
  }
}

const orderStatusSchema = z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional()

export async function listAllOrdersHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { skip, take, status, needsAttention } = req.query as { skip?: string; take?: string; status?: string; needsAttention?: string }
    const parsedStatus = orderStatusSchema.parse(status)
    return reply.send(await listAllOrders(Number(skip ?? 0), Math.min(Number(take ?? 200), 500), parsedStatus, needsAttention === 'true'))
  } catch (err: any) {
    reportIfUnexpected(err)
    return reply.status(400).send({ error: err.message })
  }
}

export async function markOrderPaidHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { orderId } = req.params as { orderId: string }
    return reply.send(await markOrderPaid(orderId))
  } catch (err: any) {
    reportIfUnexpected(err)
    return reply.status(400).send({ error: err.message })
  }
}

export async function getDashboardStatsHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    return reply.send(await getDashboardStats())
  } catch (err: any) {
    reportIfUnexpected(err)
    return reply.status(500).send({ error: err.message })
  }
}
