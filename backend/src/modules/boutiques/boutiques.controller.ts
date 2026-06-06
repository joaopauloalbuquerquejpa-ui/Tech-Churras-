import { FastifyRequest, FastifyReply } from 'fastify'
import { createBoutique, listBoutiques, getBoutiqueById, updateBoutique, createBoutiqueSchema } from './boutiques.service'

export async function createBoutiqueHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req as any).user.id
    const data = createBoutiqueSchema.parse(req.body)
    const boutique = await createBoutique(userId, data)
    return reply.status(201).send(boutique)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function listBoutiquesHandler(req: FastifyRequest, reply: FastifyReply) {
  const { city } = req.query as { city?: string }
  const boutiques = await listBoutiques(city)
  return reply.send(boutiques)
}

export async function getBoutiqueByIdHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    const boutique = await getBoutiqueById(id)
    return reply.send(boutique)
  } catch (err: any) {
    return reply.status(404).send({ error: err.message })
  }
}

export async function updateBoutiqueHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req as any).user.id
    const data = createBoutiqueSchema.partial().parse(req.body)
    const boutique = await updateBoutique(userId, data)
    return reply.send(boutique)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}
