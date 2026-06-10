import { FastifyRequest, FastifyReply } from 'fastify'
import {
  listUsers,
  blockUser,
  listGrillmasters,
  listPendingGrillmasters,
  approveGrillmaster,
  rejectGrillmaster,
  listPendingBoutiques,
  approveBoutique,
  rejectBoutique,
  listAllOrders,
  getDashboardStats,
  markOrderPaid,
} from './admin.service'

export async function listUsersHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    return reply.send(await listUsers())
  } catch (err: any) {
    return reply.status(500).send({ error: err.message })
  }
}

export async function blockUserHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId } = req.params as { userId: string }
    return reply.send(await blockUser(userId))
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function listGrillmastersHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    return reply.send(await listGrillmasters())
  } catch (err: any) {
    return reply.status(500).send({ error: err.message })
  }
}

export async function listPendingGrillmastersHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    return reply.send(await listPendingGrillmasters())
  } catch (err: any) {
    return reply.status(500).send({ error: err.message })
  }
}

export async function approveGrillmasterHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { grillmasterId } = req.params as { grillmasterId: string }
    const { isChancelado, pricePerHour } = (req.body as any) || {}
    return reply.send(await approveGrillmaster(grillmasterId, { isChancelado, pricePerHour }))
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function rejectGrillmasterHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { grillmasterId } = req.params as { grillmasterId: string }
    return reply.send(await rejectGrillmaster(grillmasterId))
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function listPendingBoutiquesHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    return reply.send(await listPendingBoutiques())
  } catch (err: any) {
    return reply.status(500).send({ error: err.message })
  }
}

export async function approveBoutiqueHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { boutiqueId } = req.params as { boutiqueId: string }
    return reply.send(await approveBoutique(boutiqueId))
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function rejectBoutiqueHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { boutiqueId } = req.params as { boutiqueId: string }
    return reply.send(await rejectBoutique(boutiqueId))
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function listAllOrdersHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    return reply.send(await listAllOrders())
  } catch (err: any) {
    return reply.status(500).send({ error: err.message })
  }
}

export async function markOrderPaidHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { orderId } = req.params as { orderId: string }
    return reply.send(await markOrderPaid(orderId))
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function getDashboardStatsHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    return reply.send(await getDashboardStats())
  } catch (err: any) {
    return reply.status(500).send({ error: err.message })
  }
}
