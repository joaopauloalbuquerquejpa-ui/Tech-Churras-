import { FastifyInstance } from 'fastify'
import {
  createOrderHandler,
  listOrdersHandler,
  getOrderHandler,
  updateOrderStatusHandler,
  updateStatusDetailHandler,
  updateLocationHandler,
  getRepeatDataHandler,
} from './orders.controller'

export async function ordersRoutes(app: FastifyInstance) {
  app.post('/orders', { preHandler: [app.authenticate] }, createOrderHandler)
  app.get('/orders', { preHandler: [app.authenticate] }, listOrdersHandler)
  app.get('/orders/:id', { preHandler: [app.authenticate] }, getOrderHandler)
  app.patch('/orders/:id/status', { preHandler: [app.authenticate] }, updateOrderStatusHandler)
  app.patch('/orders/:id/status-detail', { preHandler: [app.authenticate] }, updateStatusDetailHandler)
  app.patch('/orders/:id/location', { preHandler: [app.authenticate] }, updateLocationHandler)
  app.get('/orders/:id/repeat-data', { preHandler: [app.authenticate] }, getRepeatDataHandler)
}