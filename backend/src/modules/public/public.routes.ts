import { FastifyInstance } from 'fastify'
import { prisma } from '../../config/prisma'
import { z } from 'zod'

const uuidParam = z.string().uuid()

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

  // Top testimonials for homepage (text reviews >= 4 stars)
  app.get('/public/testimonials', async (_req, reply) => {
    const reviews = await prisma.review.findMany({
      where: {
        grillRating: { gte: 4 },
        grillComment: { not: null },
      },
      include: {
        grillmaster: { include: { user: { select: { name: true } } } },
        order: {
          select: {
            eventAddress: true,
            customer: { select: { name: true } },
          },
        },
      },
      orderBy: [{ grillRating: 'desc' }, { createdAt: 'desc' }],
      take: 20,
    })
    const unique = reviews.filter(r => r.grillComment && r.grillComment.trim().length > 20)
    return unique.slice(0, 8).map(r => ({
      id: r.id,
      rating: r.grillRating,
      comment: r.grillComment,
      grillmasterName: r.grillmaster?.user?.name ?? null,
      customerFirstName: r.order?.customer?.name?.split(' ')[0] ?? 'Cliente',
      city: r.order?.eventAddress?.split(',').slice(-2, -1)[0]?.trim() ?? null,
    }))
  })

  // Referral code lookup (boutique)
  app.get('/ref/:code', { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, async (req, reply) => {
    const { code } = req.params as { code: string }
    const boutique = await prisma.boutique.findUnique({
      where: { referralCode: code.toUpperCase() },
      select: { id: true, name: true, logoUrl: true, city: true, state: true },
    })
    if (!boutique) return reply.status(404).send({ error: 'Codigo de indicacao nao encontrado' })
    return boutique
  })

  // Registro de visita da equipe comercial
  app.post('/public/visita-equipe', { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, async (req, reply) => {
    const schema = z.object({
      vendedor:     z.string().min(2).max(100),
      tipo:         z.enum(['acougue', 'churrasqueiro']),
      nomeNegocio:  z.string().min(2).max(200),
      nomeDono:     z.string().max(100).optional(),
      telefone:     z.string().min(8).max(20),
      bairro:       z.string().min(2).max(100),
      resultado:    z.enum(['interessado', 'fechou', 'retornar', 'nao_interessado']),
      observacoes:  z.string().max(500).optional(),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ error: 'Dados inválidos', issues: parsed.error.issues })

    const { vendedor, tipo, nomeNegocio, nomeDono, telefone, bairro, resultado, observacoes } = parsed.data
    const phone = telefone.replace(/\D/g, '')

    const statusMap: Record<string, string> = {
      interessado:     'qualified',
      fechou:          'closed',
      retornar:        'new',
      nao_interessado: 'lost',
    }
    const followUpAt = resultado === 'retornar'
      ? new Date(Date.now() + 24 * 60 * 60 * 1000)
      : null

    const notes = [`Vendedor: ${vendedor}`, observacoes].filter(Boolean).join(' | ')

    try {
      await prisma.lead.upsert({
        where: { phone },
        update: {
          name: nomeDono ?? undefined,
          boutique: `[${tipo === 'acougue' ? 'Açougue' : 'Churrasqueiro'}] ${nomeNegocio}`,
          neighborhood: bairro,
          status: statusMap[resultado],
          source: `equipe_${tipo}`,
          notes,
          followUpAt,
          followUpSent: false,
        },
        create: {
          phone,
          name: nomeDono ?? null,
          boutique: `[${tipo === 'acougue' ? 'Açougue' : 'Churrasqueiro'}] ${nomeNegocio}`,
          neighborhood: bairro,
          status: statusMap[resultado],
          source: `equipe_${tipo}`,
          notes,
          followUpAt,
        },
      })
      return reply.send({ ok: true })
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao registrar visita' })
    }
  })

  // Customer referral lookup: GET /ref/user/:userId
  app.get('/ref/user/:userId', { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, async (req, reply) => {
    const { userId } = req.params as { userId: string }
    if (!uuidParam.safeParse(userId).success) return reply.status(404).send({ error: 'Indicacao nao encontrada' })
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, role: true },
    })
    if (!user || user.role !== 'CUSTOMER') return reply.status(404).send({ error: 'Indicacao nao encontrada' })
    // Retorna apenas o primeiro nome para não expor o nome completo
    return { name: user.name.split(' ')[0] }
  })
}
