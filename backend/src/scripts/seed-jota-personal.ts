/**
 * Cria o perfil pessoal do Jota Albuquerque como Grillmaster (CEO & Fundador),
 * separado do "Team Jota" (perfil de equipe, unlimitedAvailability, usado como
 * fallback de capacidade do sistema de despacho — não mexe nele).
 * Uso: npx tsx src/scripts/seed-jota-personal.ts
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import dotenv from 'dotenv'

dotenv.config()

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const EMAIL = 'jota@techchurras.com.br'
const PASSWORD = 'TechChurras@2026!'

async function main() {
  let user = await prisma.user.findUnique({ where: { email: EMAIL } })
  if (!user) {
    const hashed = await bcrypt.hash(PASSWORD, 12)
    user = await prisma.user.create({
      data: {
        name: 'Jota Albuquerque',
        email: EMAIL,
        password: hashed,
        role: 'GRILLMASTER',
        onboardingCompleted: true,
        phoneVerified: true,
      },
    })
    console.log(`✅ Usuário criado: ${EMAIL} / senha: ${PASSWORD}`)
  } else {
    console.log(`✅ Usuário já existe: ${EMAIL}`)
  }

  let gm = await prisma.grillmaster.findUnique({ where: { userId: user.id } })
  if (!gm) {
    gm = await prisma.grillmaster.create({
      data: {
        userId: user.id,
        bio: 'Fundador e CEO da Tech Churras. 13 anos à frente da Jota BBQ Eventos, já assinou churrascos para artistas e atletas de referência nacional e hoje lidera o Bahari of Brazil, hub culinário em parceria oficial com o Governo de Zanzibar. Atendimento pessoal, para quem quer o padrão mais alto possível.',
        experience: 13,
        pricePerHour: 2000,
        city: 'São Paulo',
        state: 'SP',
        approved: true,
        isChancelado: true,
        certificationCode: 'TC-CEO-000001',
        certifiedAt: new Date(),
        specialties: 'Churrasco de alto padrão, eventos corporativos e exclusivos',
        churrascoStyle: 'Autoral',
        bringsEquipment: true,
        bringsAuxiliar: true,
        minGuests: 1,
        maxGuests: 200,
        photoUrl: 'https://www.techchurras.com.br/jota.jpg',
        latitude: -23.5614,
        longitude: -46.6558,
        available: true,
        manualBookingOnly: true,
      },
    })
    console.log('✅ Perfil de churrasqueiro pessoal criado — R$2.000/h, CEO & Fundador')
  } else {
    if (!gm.manualBookingOnly) {
      gm = await prisma.grillmaster.update({ where: { id: gm.id }, data: { manualBookingOnly: true } })
      console.log('✅ Perfil já existia — marcado como manualBookingOnly (fora do despacho automático)')
    } else {
      console.log('✅ Perfil de churrasqueiro pessoal já existe')
    }
  }

  console.log('\nID do Grillmaster:', gm.id)
  console.log('Certificado:', gm.certificationCode)
}

main()
  .catch(e => { console.error('❌ Erro:', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
