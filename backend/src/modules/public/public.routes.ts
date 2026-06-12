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

  // Gallery: reviews with photos, rated >= 4
  app.get('/public/gallery', async (req, reply) => {
    const { page = '1' } = req.query as { page?: string }
    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const pageSize = 20
    const reviews = await prisma.review.findMany({
      where: {
        OR: [{ grillRating: { gte: 4 } }, { customerRating: { gte: 4 } }],
      },
      include: {
        grillmaster: { include: { user: { select: { name: true } } } },
        order: { select: { eventAddress: true, eventDate: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * pageSize,
      take: pageSize * 3, // over-fetch since we filter by photos
    })
    const withPhotos = reviews.filter(r => r.photos.length > 0).slice(0, pageSize)
    const total = await prisma.review.count({
      where: { OR: [{ grillRating: { gte: 4 } }, { customerRating: { gte: 4 } }] },
    })
    return {
      items: withPhotos.map(r => ({
        id: r.id,
        photos: r.photos,
        grillComment: r.grillComment,
        grillRating: r.grillRating,
        grillmasterName: r.grillmaster?.user?.name ?? null,
        city: r.order?.eventAddress?.split(',').slice(-1)[0]?.trim() ?? null,
        eventDate: r.order?.eventDate ?? null,
      })),
      page: pageNum,
      total,
    }
  })

  // Referral code lookup
  app.get('/ref/:code', async (req, reply) => {
    const { code } = req.params as { code: string }
    const boutique = await prisma.boutique.findUnique({
      where: { referralCode: code.toUpperCase() },
      select: { id: true, name: true, logoUrl: true, city: true, state: true },
    })
    if (!boutique) return reply.status(404).send({ error: 'Codigo de indicacao nao encontrado' })
    return boutique
  })
}
