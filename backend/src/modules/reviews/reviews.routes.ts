import { FastifyInstance } from 'fastify'
import { createClient } from '@supabase/supabase-js'
import {
  createReviewHandler,
  listGrillmasterReviewsHandler,
  listBoutiqueReviewsHandler,
  createCustomerReviewHandler,
} from './reviews.controller'

export async function reviewsRoutes(app: FastifyInstance) {
  app.post('/reviews', { preHandler: [app.authenticate] }, createReviewHandler)
  app.post('/reviews/customer', { preHandler: [app.authenticate] }, createCustomerReviewHandler)
  app.get('/reviews/grillmaster/:id', listGrillmasterReviewsHandler)
  app.get('/reviews/boutique/:id', listBoutiqueReviewsHandler)

  app.post('/reviews/upload-photo', { preHandler: [app.authenticate] }, async (req, reply) => {
    try {
      const data = await req.file()
      if (!data) return reply.status(400).send({ error: 'Nenhum arquivo enviado' })

      const supabaseUrl = process.env.SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY
      if (!supabaseUrl || !supabaseKey) {
        return reply.status(500).send({ error: 'Supabase nao configurado' })
      }

      const supabase = createClient(supabaseUrl, supabaseKey)
      const buffer = await data.toBuffer()
      const ext = data.filename.split('.').pop() || 'jpg'
      const fileName = `review-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error } = await supabase.storage
        .from('review-photos')
        .upload(fileName, buffer, { contentType: data.mimetype, upsert: false })

      if (error) return reply.status(500).send({ error: error.message })

      const { data: { publicUrl } } = supabase.storage.from('review-photos').getPublicUrl(fileName)
      return reply.send({ url: publicUrl })
    } catch (err: any) {
      return reply.status(500).send({ error: err.message })
    }
  })
}
