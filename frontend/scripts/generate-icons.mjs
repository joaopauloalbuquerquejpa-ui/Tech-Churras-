import sharp from 'sharp'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
const input = join(publicDir, 'jota.jpg')

async function generate() {
  await sharp(input)
    .resize(192, 192, { fit: 'cover', position: 'centre' })
    .png()
    .toFile(join(publicDir, 'icon-192.png'))
  console.log('icon-192.png gerado')

  await sharp(input)
    .resize(512, 512, { fit: 'cover', position: 'centre' })
    .png()
    .toFile(join(publicDir, 'icon-512.png'))
  console.log('icon-512.png gerado')
}

generate().catch(console.error)
