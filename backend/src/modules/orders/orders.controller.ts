import { FastifyRequest, FastifyReply } from 'fastify'
import { createOrderSchema, createOrder, listOrders, getOrderById, updateOrderStatus, updateOrderStatusDetail } from './orders.service'

export async function createOrderHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const customerId = (req.user as any).id
    const data = createOrderSchema.parse(req.body)
    const order = await createOrder(customerId, data)
    return reply.status(201).send(order)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function listOrdersHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const customerId = (req.user as any).id
    const orders = await listOrders(customerId)
    return reply.send(orders)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function getOrderHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req.user as any).id
    const role = (req.user as any).role ?? 'CUSTOMER'
    const { id } = req.params as { id: string }
    const order = await getOrderById(id, userId, role)
    return reply.send(order)
  } catch (err: any) {
    return reply.status(404).send({ error: err.message })
  }
}

export async function updateStatusDetailHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req.user as any).id
    const role = (req.user as any).role ?? 'CUSTOMER'
    const { id } = req.params as { id: string }
    const { statusDetail } = req.body as { statusDetail: string }
    const order = await updateOrderStatusDetail(id, statusDetail, userId, role)
    return reply.send(order)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function updateOrderStatusHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    const { status } = req.body as { status: string }
    const order = await updateOrderStatus(id, status)
    return reply.send(order)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}
