import { FastifyRequest, FastifyReply } from 'fastify'
import {
  createBoutique,
  listBoutiques,
  getBoutiqueById,
  updateBoutique,
  getMyBoutique,
  createBoutiqueSchema,
  updateBoutiqueSchema,
  getKitsByBoutique,
  createKit,
  updateKit,
  deleteKit,
  createKitSchema,
  getBoutiqueDashboardStats,
  getBoutiqueDemandForecast,
  getReferralStats,
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
  try {
    const q = req.query as Record<string, string>
    const boutiques = await listBoutiques({
      city: q.city || undefined,
      minRating: q.minRating ? Number(q.minRating) : undefined,
      sortBy: q.sortBy || undefined,
    })
    return reply.send(boutiques)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
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

export async function getBoutiqueProductsHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    const boutique = await getBoutiqueById(id)
    return reply.send(boutique.products)
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

export async function getKitsByBoutiqueHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    const kits = await getKitsByBoutique(id)
    return reply.send(kits)
  } catch (err: any) {
    return reply.status(500).send({ error: err.message })
  }
}

export async function createKitHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req as any).user.id
    const data = createKitSchema.parse(req.body)
    const kit = await createKit(userId, data)
    return reply.status(201).send(kit)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function updateKitHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req as any).user.id
    const { kitId } = req.params as { kitId: string }
    const data = createKitSchema.partial().parse(req.body)
    const kit = await updateKit(kitId, userId, data)
    return reply.send(kit)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function deleteKitHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req as any).user.id
    const { kitId } = req.params as { kitId: string }
    await deleteKit(kitId, userId)
    return reply.status(204).send()
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


export async function getBoutiqueDashboardStatsHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req.user as any).id
    const stats = await getBoutiqueDashboardStats(userId)
    return reply.send(stats)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function getBoutiqueDemandForecastHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req.user as any).id
    const forecast = await getBoutiqueDemandForecast(userId)
    return reply.send(forecast)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function getBoutiqueReferralStatsHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req.user as any).id
    const stats = await getReferralStats(userId)
    return reply.send(stats)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}
