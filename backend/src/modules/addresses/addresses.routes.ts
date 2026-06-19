import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import {
  listAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress,
} from './addresses.service'

const createAddressSchema = z.object({
  label: z.string().min(1),
  street: z.string().min(1),
  number: z.string().min(1),
  complement: z.string().optional(),
  neighborhood: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(2).max(2),
  zipCode: z.string().min(8).max(9),
  isDefault: z.boolean().optional(),
})

const updateAddressSchema = createAddressSchema.partial()

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
      const parsed = createAddressSchema.safeParse(req.body)
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.issues[0].message })
      return reply.status(201).send(await createAddress(userId, parsed.data))
    } catch (err: any) { return reply.status(400).send({ error: err.message }) }
  })

  app.patch('/addresses/:id', { preHandler: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (req.user as any).id
      const { id } = req.params as { id: string }
      const parsed = updateAddressSchema.safeParse(req.body)
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.issues[0].message })
      return reply.send(await updateAddress(id, userId, parsed.data))
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
