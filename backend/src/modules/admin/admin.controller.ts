import { FastifyRequest, FastifyReply } from 'fastify'
import {
  listUsers,
  blockUser,
  listGrillmasters,
  approveGrillmaster,
  listAllOrders,
  getDashboardStats,
} from './admin.service'

export async function listUsersHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const users = await listUsers()
    return reply.send(users)
  } catch (err: any) {
    return reply.status(500).send({ error: err.message })
  }
}

export async function blockUserHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId } = req.params as { userId: string }
    const user = await blockUser(userId)
    return reply.send(user)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function listGrillmastersHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const grillmasters = await listGrillmasters()
    return reply.send(grillmasters)
  } catch (err: any) {
    return reply.status(500).send({ error: err.message })
  }
}

export async function approveGrillmasterHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { grillmasterId } = req.params as { grillmasterId: string }
    const grillmaster = await approveGrillmaster(grillmasterId)
    return reply.send(grillmaster)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function listAllOrdersHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const orders = await listAllOrders()
    return reply.send(orders)
  } catch (err: any) {
    return reply.status(500).send({ error: err.message })
  }
}

export async function getDashboardStatsHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const stats = await getDashboardStats()
    return reply.send(stats)
  } catch (err: any) {
    return reply.status(500).send({ error: err.message })
  }
}