/**
 * Troca a foto do "Team Jota" pra uma foto real do time em evento (em vez da
 * mesma foto de perfil usada no perfil pessoal do Jota a R$2.000/h) — evita
 * risco de clique errado entre os dois perfis, e representa melhor que Team
 * Jota é um time, não uma pessoa só.
 * Uso: npx tsx src/scripts/swap-team-jota-photo.ts
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import dotenv from 'dotenv'

dotenv.config()

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const updated = await prisma.grillmaster.update({
    where: { certificationCode: 'TC-FUNDADOR-001' },
    data: { photoUrl: 'https://www.techchurras.com.br/churrasco-real-6.jpg' },
  })
  console.log('✅ Foto do Team Jota atualizada:', updated.photoUrl)
}

main()
  .catch(e => { console.error('❌ Erro:', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
