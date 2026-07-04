import { FastifyRequest, FastifyReply } from 'fastify'
import { z, ZodError } from 'zod'
import { reportIfUnexpected } from '../../utils/report'
import { createOrderSchema, createOrder, listOrders, getOrderById, updateOrderStatus, updateOrderStatusDetail, updateOrderLocation, getRepeatData, cancelOrder, generateShareToken, getOrderByPublicToken, getOrderEta, rescheduleOrder } from './orders.service'

const locationSchema = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) })
const cancelSchema = z.object({ reason: z.string().max(500).optional() })

export async function createOrderHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const customerId = (req.user as any).id
    const data = createOrderSchema.parse(req.body)
    const order = await createOrder(customerId, data)
    return reply.status(201).send(order)
  } catch (err: any) {
    if (err instanceof ZodError) {
      const first = err.issues[0]
      return reply.status(400).send({ error: first?.message ?? 'Dados inválidos' })
    }
    reportIfUnexpected(err)
    return reply.status(400).send({ error: err.message })
  }
}

export async function listOrdersHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const customerId = (req.user as any).id
    const orders = await listOrders(customerId)
    return reply.send(orders)
  } catch (err: any) {
    reportIfUnexpected(err)
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
    reportIfUnexpected(err)
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
    reportIfUnexpected(err)
    return reply.status(400).send({ error: err.message })
  }
}

export async function updateOrderStatusHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req.user as any).id
    const role = (req.user as any).role ?? 'CUSTOMER'
    const { id } = req.params as { id: string }
    const { status } = req.body as { status: import('@prisma/client').OrderStatus }
    const order = await updateOrderStatus(id, status, userId, role)
    return reply.send(order)
  } catch (err: any) {
    reportIfUnexpected(err)
    return reply.status(400).send({ error: err.message })
  }
}

export async function updateLocationHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req.user as any).id
    const { id } = req.params as { id: string }
    const { lat, lng } = locationSchema.parse(req.body)
    const result = await updateOrderLocation(id, lat, lng, userId)
    return reply.send(result)
  } catch (err: any) {
    reportIfUnexpected(err)
    return reply.status(400).send({ error: err.message })
  }
}

export async function cancelOrderHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req.user as any).id
    const role = (req.user as any).role ?? 'CUSTOMER'
    const { id } = req.params as { id: string }
    const { reason } = cancelSchema.parse(req.body ?? {})
    const order = await cancelOrder(id, userId, role, reason ?? '')
    return reply.send(order)
  } catch (err: any) {
    reportIfUnexpected(err)
    return reply.status(400).send({ error: err.message })
  }
}

export async function getRepeatDataHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req.user as any).id
    const role = (req.user as any).role ?? 'CUSTOMER'
    const { id } = req.params as { id: string }
    const data = await getRepeatData(id, userId, role)
    return reply.send(data)
  } catch (err: any) {
    reportIfUnexpected(err)
    return reply.status(400).send({ error: err.message })
  }
}

export async function getOrderByPublicTokenHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { token } = req.params as { token: string }
    const data = await getOrderByPublicToken(token)
    return reply.send(data)
  } catch (err: any) {
    reportIfUnexpected(err)
    return reply.status(404).send({ error: err.message })
  }
}

export async function getOrderEtaHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req.user as any).id
    const role = (req.user as any).role ?? 'CUSTOMER'
    const { id } = req.params as { id: string }
    const eta = await getOrderEta(id, userId, role)
    return reply.send(eta)
  } catch (err: any) {
    reportIfUnexpected(err)
    return reply.status(400).send({ error: err.message })
  }
}

export async function rescheduleOrderHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req.user as any).id
    const role = (req.user as any).role ?? 'CUSTOMER'
    const { id } = req.params as { id: string }
    const { eventDate } = req.body as { eventDate: string }
    const newDate = new Date(eventDate)
    if (isNaN(newDate.getTime())) return reply.status(400).send({ error: 'Data inválida' })
    const order = await rescheduleOrder(id, newDate, userId, role)
    return reply.send(order)
  } catch (err: any) {
    reportIfUnexpected(err)
    return reply.status(400).send({ error: err.message })
  }
}

export async function shareOrderHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req.user as any).id
    const role = (req.user as any).role ?? 'CUSTOMER'
    const { id } = req.params as { id: string }
    const data = await generateShareToken(id, userId, role)
    return reply.send(data)
  } catch (err: any) {
    reportIfUnexpected(err)
    return reply.status(400).send({ error: err.message })
  }
}
