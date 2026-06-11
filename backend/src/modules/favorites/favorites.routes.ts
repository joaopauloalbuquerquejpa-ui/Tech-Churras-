import { FastifyInstance } from 'fastify'
import { addFavorite, removeFavorite, listFavorites } from './favorites.service'

export async function favoritesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  app.get('/favorites', async (req) => {
    const userId = (req.user as any).id
    return listFavorites(userId)
  })

  app.post('/favorites', async (req, reply) => {
    const userId = (req.user as any).id
    const { targetType, targetId } = req.body as any
    if (!targetType || !targetId) {
      return reply.code(400).send({ error: 'targetType e targetId sao obrigatorios' })
    }
    return addFavorite(userId, targetType, targetId)
  })

  app.delete('/favorites/:targetType/:targetId', async (req, reply) => {
    const userId = (req.user as any).id
    const { targetType, targetId } = req.params as any
    await removeFavorite(userId, targetType, targetId)
    return reply.code(204).send()
  })
}
