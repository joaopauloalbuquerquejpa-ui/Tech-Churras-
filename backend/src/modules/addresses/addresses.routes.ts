import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import {
  listAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress,
} from './addresses.service'

export async function addressesRoutes(app: FastifyInstance) {
  app.get('/addresses', { preHandler: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (req.user as any).id
      return reply.send(await listAddresses(userId))
    } catch (err: any) { return reply.status(400).send({ error: err.message }) }
  })

  app.post('/addresses', { preHandler: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (req.user as any).id
      const data = req.body as any
      return reply.status(201).send(await createAddress(userId, data))
    } catch (err: any) { return reply.status(400).send({ error: err.message }) }
  })

  app.patch('/addresses/:id', { preHandler: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (req.user as any).id
      const { id } = req.params as { id: string }
      return reply.send(await updateAddress(id, userId, req.body as any))
    } catch (err: any) { return reply.status(400).send({ error: err.message }) }
  })

  app.delete('/addresses/:id', { preHandler: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (req.user as any).id
      const { id } = req.params as { id: string }
      await deleteAddress(id, userId)
      return reply.send({ ok: true })
    } catch (err: any) { return reply.status(400).send({ error: err.message }) }
  })

  app.patch('/addresses/:id/default', { preHandler: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (req.user as any).id
      const { id } = req.params as { id: string }
      return reply.send(await setDefaultAddress(id, userId))
    } catch (err: any) { return reply.status(400).send({ error: err.message }) }
  })
}
