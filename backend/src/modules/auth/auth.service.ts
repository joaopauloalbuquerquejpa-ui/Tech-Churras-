import { prisma } from '../../config/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  role: z.enum(['CUSTOMER', 'GRILLMASTER', 'BOUTIQUE']).default('CUSTOMER'),
  referralCode: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>

export async function registerUser(data: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) throw new Error('Email já cadastrado')

  const hashedPassword = await bcrypt.hash(data.password, 10)

  let referredByBoutiqueId: string | undefined
  if (data.referralCode) {
    const boutique = await prisma.boutique.findUnique({ where: { referralCode: data.referralCode.toUpperCase() } })
    if (boutique) referredByBoutiqueId = boutique.id
  }

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      phone: data.phone,
      role: data.role,
      referredByBoutiqueId,
    },
    select: { id: true, name: true, email: true, role: true, onboardingCompleted: true, createdAt: true },
  })

  if (referredByBoutiqueId) {
    const couponCode = 'BEMVINDO-' + user.id.slice(0, 6).toUpperCase()
    await prisma.coupon.create({
      data: { code: couponCode, discountType: 'PERCENT', discountValue: 15, maxUses: 1, active: true },
    }).catch(() => {})
  }

  return user
}

export async function loginUser(data: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  })

  if (!user) {
    throw new Error('Credenciais inválidas')
  }

  const validPassword = await bcrypt.compare(data.password, user.password)

  if (!validPassword) {
    throw new Error('Credenciais inválidas')
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    onboardingCompleted: user.onboardingCompleted,
  }
}

export async function markOnboardingCompleted(userId: string) {
  return prisma.user.update({ where: { id: userId }, data: { onboardingCompleted: true } })
}
