import { FastifyRequest, FastifyReply } from 'fastify'
import { createReview, listGrillmasterReviews, listBoutiqueReviews, createCustomerReview } from './reviews.service'

export async function createReviewHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const customerId = (req.user as any).id
    const { orderId, grillRating, boutiqueRating, grillComment, boutiqueComment, photos } = req.body as any
    const review = await createReview({ orderId, customerId, grillRating, boutiqueRating, grillComment, boutiqueComment, photos })
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
    const { orderId, customerRating, customerComment } = req.body as any
    const review = await createCustomerReview({ orderId, grillmasterUserId, customerRating, customerComment })
    return reply.status(201).send(review)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}
