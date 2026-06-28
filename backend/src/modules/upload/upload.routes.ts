import { FastifyInstance } from 'fastify'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const MAX_SIZE = 5 * 1024 * 1024

// Detecta tipo real pelo magic bytes — ignora o Content-Type declarado pelo cliente
function detectMagicMime(buf: Buffer): string | null {
  if (buf.length < 12) return null
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'image/jpeg'
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return 'image/png'
  if (buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') return 'image/webp'
  return null
}

const MIME_EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

export async function uploadRoutes(app: FastifyInstance) {
  app.post('/upload/image', { preHandler: [app.authenticate], config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (req, reply) => {
    try {
      const data = await req.file()
      if (!data) return reply.status(400).send({ error: 'Nenhum arquivo enviado' })
      const buffer = await data.toBuffer()
      if (buffer.byteLength > MAX_SIZE) {
        return reply.status(400).send({ error: 'Arquivo muito grande. Maximo 5MB.' })
      }
      const realMime = detectMagicMime(buffer)
      if (!realMime) {
        return reply.status(400).send({ error: 'Tipo de arquivo nao permitido. Use JPG, PNG ou WebP.' })
      }
      const supabaseUrl = process.env.SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY
      if (!supabaseUrl || !supabaseKey) {
        return reply.status(500).send({ error: 'Supabase nao configurado' })
      }
      const supabase = createClient(supabaseUrl, supabaseKey)
      const ext = MIME_EXT[realMime]
      const fileName = `partner-${Date.now()}-${randomUUID()}.${ext}`
      const { error } = await supabase.storage
        .from('partner-images')
        .upload(fileName, buffer, { contentType: realMime, upsert: false })
      if (error) return reply.status(500).send({ error: error.message })
      const { data: { publicUrl } } = supabase.storage.from('partner-images').getPublicUrl(fileName)
      return reply.send({ url: publicUrl })
    } catch (err: any) {
      return reply.status(500).send({ error: err.message })
    }
  })
}
