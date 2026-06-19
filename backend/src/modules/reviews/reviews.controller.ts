import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { createReview, listGrillmasterReviews, listBoutiqueReviews, createCustomerReview } from './reviews.service'

const createReviewSchema = z.object({
  orderId: z.string().min(1),
  grillRating: z.number().int().min(1).max(5),
  boutiqueRating: z.number().int().min(1).max(5).optional(),
  grillComment: z.string().max(1000).optional(),
  boutiqueComment: z.string().max(1000).optional(),
  photos: z.array(z.string().url()).optional(),
})

const createCustomerReviewSchema = z.object({
  orderId: z.string().min(1),
  customerRating: z.number().int().min(1).max(5),
  customerComment: z.string().max(1000).optional(),
})

export async function createReviewHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const customerId = (req.user as any).id
    const parsed = createReviewSchema.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.issues[0].message })
    const review = await createReview({ ...parsed.data, customerId })
    return reply.status(201).send(review)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function listGrillmasterReviewsHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    const reviews = await listGrillmasterReviews(id)
    return reply.send(reviews)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function listBoutiqueReviewsHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    const reviews = await listBoutiqueReviews(id)
    return reply.send(reviews)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function createCustomerReviewHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const grillmasterUserId = (req.user as any).id
    const parsed = createCustomerReviewSchema.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.issues[0].message })
    const review = await createCustomerReview({ ...parsed.data, grillmasterUserId })
    return reply.status(201).send(review)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}
