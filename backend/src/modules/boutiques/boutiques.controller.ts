import { FastifyRequest, FastifyReply } from 'fastify'
import {
  createBoutiqueSchema,
  createProductSchema,
  createBoutique,
  listBoutiques,
  getBoutiqueById,
  addProduct,
} from './boutiques.service'

export async function createBoutiqueHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req.user as any).id
    const data = createBoutiqueSchema.parse(req.body)
    const boutique = await createBoutique(userId, data)
    return reply.status(201).send(boutique)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function listBoutiquesHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { city } = req.query as { city?: string }
    const boutiques = await listBoutiques(city)
    return reply.send(boutiques)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function getBoutiqueHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    const boutique = await getBoutiqueById(id)
    return reply.send(boutique)
  } catch (err: any) {
    return reply.status(404).send({ error: err.message })
  }
}

export async function addProductHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req.user as any).id
    const data = createProductSchema.parse(req.body)
    const product = await addProduct(userId, data)
    return reply.status(201).send(product)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}