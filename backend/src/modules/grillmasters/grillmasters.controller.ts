import { FastifyRequest, FastifyReply } from 'fastify'
import {
  createGrillmasterSchema,
  createGrillmaster,
  listGrillmasters,
  getGrillmasterById,
  updateGrillmaster,
  getMyGrillmasterOrders,
  getGrillmasterSchedule,
  toggleScheduleDay,
  completeTrainingModule,
  markUniformSent,
} from './grillmasters.service'

export async function createGrillmasterHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const user = req.user as any
    if (user.role !== 'GRILLMASTER' && user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Apenas contas de churrasqueiro podem criar um perfil de parceiro' })
    }
    const userId = user.id
    const data = createGrillmasterSchema.parse(req.body)
    const grillmaster = await createGrillmaster(userId, data)
    return reply.status(201).send(grillmaster)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function listGrillmastersHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const q = req.query as Record<string, string>
    const result = await listGrillmasters({
      city: q.city || undefined,
      minPrice: q.minPrice ? Number(q.minPrice) : undefined,
      maxPrice: q.maxPrice ? Number(q.maxPrice) : undefined,
      minRating: q.minRating ? Number(q.minRating) : undefined,
      specialty: q.specialty || undefined,
      sortBy: q.sortBy || undefined,
      available: q.available !== 'false',
      page: q.page ? Number(q.page) : 1,
      limit: q.limit ? Number(q.limit) : 9,
    })
    return reply.send(result)
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

export async function getMyOrdersHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req.user as any).id
    return reply.send(await getMyGrillmasterOrders(userId))
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function getScheduleHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req.user as any).id
    return reply.send(await getGrillmasterSchedule(userId))
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function toggleScheduleHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req.user as any).id
    const { date } = req.body as { date: string }
    if (!date) return reply.status(400).send({ error: 'date required' })
    return reply.send(await toggleScheduleDay(userId, date))
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function completeModuleHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req.user as any).id
    const { moduleId } = req.params as { moduleId: string }
    return reply.send(await completeTrainingModule(userId, Number(moduleId)))
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function markUniformSentHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { grillmasterId } = req.params as { grillmasterId: string }
    return reply.send(await markUniformSent(grillmasterId))
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}