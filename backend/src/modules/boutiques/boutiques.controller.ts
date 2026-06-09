import { FastifyRequest, FastifyReply } from 'fastify'
import {
  createBoutique,
  listBoutiques,
  getBoutiqueById,
  updateBoutique,
  getMyBoutique,
  createBoutiqueSchema,
  updateBoutiqueSchema,
} from './boutiques.service'
import {
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProduct,
  createProductSchema,
} from './products.service'

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

export async function getMyBoutiqueHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req as any).user.id
    const boutique = await getMyBoutique(userId)
    return reply.send(boutique)
  } catch (err: any) {
    return reply.status(404).send({ error: err.message })
  }
}

export async function updateBoutiqueHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req as any).user.id
    const data = updateBoutiqueSchema.parse(req.body)
    const boutique = await updateBoutique(userId, data)
    return reply.send(boutique)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function createProductHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req as any).user.id
    const data = createProductSchema.parse(req.body)
    const product = await createProduct(userId, data)
    return reply.status(201).send(product)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function updateProductHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req as any).user.id
    const { productId } = req.params as { productId: string }
    const data = createProductSchema.partial().parse(req.body)
    const product = await updateProduct(productId, userId, data)
    return reply.send(product)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function deleteProductHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req as any).user.id
    const { productId } = req.params as { productId: string }
    await deleteProduct(productId, userId)
    return reply.status(204).send()
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function toggleProductHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req as any).user.id
    const { productId } = req.params as { productId: string }
    const product = await toggleProduct(productId, userId)
    return reply.send(product)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}
