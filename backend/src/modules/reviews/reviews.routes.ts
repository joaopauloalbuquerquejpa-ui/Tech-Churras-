import { FastifyInstance } from 'fastify'
import {
  createReviewHandler,
  listGrillmasterReviewsHandler,
  listBoutiqueReviewsHandler,
  createCustomerReviewHandler,
} from './reviews.controller'

export async function reviewsRoutes(app: FastifyInstance) {
  app.post('/reviews', { preHandler: [app.authenticate] }, createReviewHandler)
  app.post('/reviews/customer', { preHandler: [app.authenticate] }, createCustomerReviewHandler)
  app.get('/reviews/grillmaster/:id', listGrillmasterReviewsHandler)
  app.get('/reviews/boutique/:id', listBoutiqueReviewsHandler)
}
