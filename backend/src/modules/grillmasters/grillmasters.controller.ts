import { FastifyRequest, FastifyReply } from 'fastify'
import {
  createGrillmasterSchema,
  createGrillmaster,
  listGrillmasters,
  getGrillmasterById,
  updateGrillmaster,
} from './grillmasters.service'

export async function createGrillmasterHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req.user as any).id
    const data = createGrillmasterSchema.parse(req.body)
    const grillmaster = await createGrillmaster(userId, data)
    return reply.status(201).send(grillmaster)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function listGrillmastersHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { city } = req.query as { city?: string }
    const grillmasters = await listGrillmasters(city)
    return reply.send(grillmasters)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function getGrillmasterHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    const grillmaster = await getGrillmasterById(id)
    return reply.send(grillmaster)
  } catch (err: any) {
    return reply.status(404).send({ error: err.message })
  }
}

export async function updateGrillmasterHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req.user as any).id
    const data = createGrillmasterSchema.partial().parse(req.body)
    const grillmaster = await updateGrillmaster(userId, data)
    return reply.send(grillmaster)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}