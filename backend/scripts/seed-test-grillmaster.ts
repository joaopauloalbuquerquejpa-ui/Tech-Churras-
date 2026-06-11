import bcrypt from 'bcryptjs'
import { prisma } from '../src/config/prisma'

async function main() {
  const email = 'grillmaster@teste.com'

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log('Usuário já existe:', existing.id)
    const gm = await prisma.grillmaster.findUnique({ where: { userId: existing.id } })
    if (gm) {
      console.log('Grillmaster:', gm.id, 'approved:', gm.approved, 'available:', gm.available)
    }
    return
  }

  const password = await bcrypt.hash('123456', 10)

  const user = await prisma.user.create({
    data: {
      name: 'Zé do Churrasco (Teste)',
      email,
      password,
      role: 'GRILLMASTER',
      phone: '11999990001',
    },
  })

  const gm = await prisma.grillmaster.create({
    data: {
      userId: user.id,
      bio: 'Churrasqueiro de teste. 15 anos domando a brasa.',
      experience: 15,
      pricePerHour: 120,
      city: 'Sao Paulo',
      state: 'SP',
      available: true,
      approved: true,
      rating: 4.8,
      specialties: 'Picanha, Costela, Frango',
    },
  })

  console.log('Criado!')
  console.log('  User ID:', user.id)
  console.log('  Email:', email)
  console.log('  Grillmaster ID:', gm.id)
  console.log('  approved:', gm.approved, '| available:', gm.available)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => (prisma as any).$disconnect())
