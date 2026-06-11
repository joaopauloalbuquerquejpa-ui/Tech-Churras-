import { FastifyInstance } from 'fastify'
import { prisma } from '../../config/prisma'

export async function publicRoutes(app: FastifyInstance) {
  app.get('/public/orders/:token', async (req, reply) => {
    const { token } = req.params as { token: string }
    const order = await prisma.order.findUnique({
      where: { publicShareToken: token },
      select: {
        id: true,
        status: true,
        statusDetail: true,
        eventDate: true,
        eventAddress: true,
        guestCount: true,
        eventHours: true,
        grillmasterLat: true,
        grillmasterLng: true,
        grillmaster: {
          select: {
            city: true,
            state: true,
            rating: true,
            photoUrl: true,
            user: { select: { name: true } },
          },
        },
        boutique: { select: { name: true } },
        review: { select: { grillRating: true, grillComment: true } },
      },
    })
    if (!order) return reply.status(404).send({ error: 'Pedido nao encontrado' })
    return order
  })
}
