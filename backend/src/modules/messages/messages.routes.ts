import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { getMessages, sendMessage, markMessagesRead } from './messages.service'

export async function messagesRoutes(app: FastifyInstance) {
  app.get('/orders/:id/messages', { preHandler: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (req.user as any).id
      const { id } = req.params as { id: string }
      const messages = await getMessages(id, userId)
      return reply.send(messages)
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.post('/orders/:id/messages', { preHandler: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (req.user as any).id
      const { id } = req.params as { id: string }
      const { content } = req.body as { content: string }
      if (!content?.trim()) return reply.status(400).send({ error: 'Mensagem nao pode ser vazia' })
      const msg = await sendMessage(id, userId, content.trim())
      return reply.status(201).send(msg)
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.patch('/orders/:id/messages/read', { preHandler: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (req.user as any).id
      const { id } = req.params as { id: string }
      await markMessagesRead(id, userId)
      return reply.send({ ok: true })
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })
}
