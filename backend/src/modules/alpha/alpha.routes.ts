import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../config/prisma'
import { sendWhatsAppToAdmin } from '../push/push.service'

const registerSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  whatsapp: z.string().min(10).max(20),
})

export async function alphaRoutes(app: FastifyInstance) {
  app.post('/alpha/register', {
    config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const result = registerSchema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'Nome e WhatsApp são obrigatórios.' })
    }

    const { name, whatsapp } = result.data
    const cleanPhone = whatsapp.replace(/\D/g, '')

    const tester = await prisma.alphaTester.create({
      data: { name, whatsapp: cleanPhone },
    })

    sendWhatsAppToAdmin(
      `📱 *Novo testador Alpha — Tech Churras!*\n\n` +
      `Nome: ${name}\n` +
      `WhatsApp: ${whatsapp}\n\n` +
      `_Adicione no Play Console: play.google.com/console_`
    ).catch(() => {})

    return reply.status(201).send({ ok: true, id: tester.id })
  })

  app.get('/alpha/count', async (_request, reply) => {
    const count = await prisma.alphaTester.count()
    return reply.send({ count })
  })
}
