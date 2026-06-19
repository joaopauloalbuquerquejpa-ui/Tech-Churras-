import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { addFavorite, removeFavorite, listFavorites } from './favorites.service'

const favoriteSchema = z.object({
  targetType: z.enum(['GRILLMASTER', 'BOUTIQUE']),
  targetId: z.string().min(1),
})

export async function favoritesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  app.get('/favorites', async (req) => {
    const userId = (req.user as any).id
    return listFavorites(userId)
  })

  app.post('/favorites', async (req, reply) => {
    const userId = (req.user as any).id
    const parsed = favoriteSchema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0].message })
    return addFavorite(userId, parsed.data.targetType, parsed.data.targetId)
  })

  app.delete('/favorites/:targetType/:targetId', async (req, reply) => {
    const userId = (req.user as any).id
    const { targetType, targetId } = req.params as any
    await removeFavorite(userId, targetType, targetId)
    return reply.code(204).send()
  })
}
