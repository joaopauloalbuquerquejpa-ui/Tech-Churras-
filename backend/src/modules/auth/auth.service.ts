import { prisma } from '../../config/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  role: z.enum(['CUSTOMER', 'GRILLMASTER', 'BOUTIQUE']).default('CUSTOMER'),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>

export async function registerUser(data: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  })

  if (existing) {
    throw new Error('Email já cadastrado')
  }

  const hashedPassword = await bcrypt.hash(data.password, 10)

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      phone: data.phone,
      role: data.role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  })

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
  }
}
