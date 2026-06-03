import { FastifyInstance } from 'fastify'
import {
  createOrderHandler,
  listOrdersHandler,
  getOrderHandler,
  updateOrderStatusHandler,
} from './orders.controller'

export async function ordersRoutes(app: FastifyInstance) {
  app.post('/orders', { preHandler: [app.authenticate] }, createOrderHandler)
  app.get('/orders', { preHandler: [app.authenticate] }, listOrdersHandler)
  app.get('/orders/:id', { preHandler: [app.authenticate] }, getOrderHandler)
  app.patch('/orders/:id/status', { preHandler: [app.authenticate] }, updateOrderStatusHandler)
}