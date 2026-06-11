import { FastifyInstance } from 'fastify'
import {
  createOrderHandler,
  listOrdersHandler,
  getOrderHandler,
  updateOrderStatusHandler,
  updateStatusDetailHandler,
} from './orders.controller'

export async function ordersRoutes(app: FastifyInstance) {
  app.post('/orders', { preHandler: [app.authenticate] }, createOrderHandler)
  app.get('/orders', { preHandler: [app.authenticate] }, listOrdersHandler)
  app.get('/orders/:id', { preHandler: [app.authenticate] }, getOrderHandler)
  app.patch('/orders/:id/status', { preHandler: [app.authenticate] }, updateOrderStatusHandler)
  app.patch('/orders/:id/status-detail', { preHandler: [app.authenticate] }, updateStatusDetailHandler)
}