import { FastifyInstance } from 'fastify'
import {
  createOrderHandler,
  listOrdersHandler,
  getOrderHandler,
  updateOrderStatusHandler,
  updateStatusDetailHandler,
  updateLocationHandler,
  getRepeatDataHandler,
  cancelOrderHandler,
  shareOrderHandler,
  getOrderByPublicTokenHandler,
} from './orders.controller'

export async function ordersRoutes(app: FastifyInstance) {
  // rota publica — sem autenticacao, deve vir antes de /:id
  app.get('/orders/public/:token', getOrderByPublicTokenHandler)

  app.post('/orders', { preHandler: [app.authenticate], config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, createOrderHandler)
  app.get('/orders', { preHandler: [app.authenticate] }, listOrdersHandler)
  app.get('/orders/:id', { preHandler: [app.authenticate] }, getOrderHandler)
  app.patch('/orders/:id/status', { preHandler: [app.authenticate] }, updateOrderStatusHandler)
  app.patch('/orders/:id/status-detail', { preHandler: [app.authenticate] }, updateStatusDetailHandler)
  app.patch('/orders/:id/location', { preHandler: [app.authenticate] }, updateLocationHandler)
  app.patch('/orders/:id/cancel', { preHandler: [app.authenticate] }, cancelOrderHandler)
  app.get('/orders/:id/repeat-data', { preHandler: [app.authenticate] }, getRepeatDataHandler)
  app.post('/orders/:id/share', { preHandler: [app.authenticate] }, shareOrderHandler)
}