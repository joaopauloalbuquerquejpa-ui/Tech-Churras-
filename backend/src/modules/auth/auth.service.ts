import { prisma } from '../../config/prisma'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { emailWelcomeCustomer } from '../email/email.service'
import { sendPushToRole, sendWhatsAppToAdmin } from '../push/push.service'

const TERMS_VERSION = 'v1.2'

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  role: z.enum(['CUSTOMER', 'GRILLMASTER', 'BOUTIQUE']).default('CUSTOMER'),
  referralCode: z.string().optional(),
  conviteId: z.string().optional(),
  acceptedTerms: z.literal(true, {
    message: 'É necessário aceitar os Termos de Uso e a Política de Privacidade',
  }),
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

  const hashedPassword = await bcrypt.hash(data.password, 12)

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
      termsAcceptedAt: new Date(),
      termsVersion: TERMS_VERSION,
    },
    select: { id: true, name: true, email: true, role: true, onboardingCompleted: true, createdAt: true, tokenVersion: true },
  })

  if (referredByBoutiqueId) {
    const couponCode = 'BEMVINDO-' + user.id.slice(0, 6).toUpperCase()
    await prisma.coupon.create({
      data: { code: couponCode, discountType: 'PERCENT', discountValue: 15, maxUses: 1, active: true },
    }).catch((e) => console.error("[notif]", e?.message))
  }

  if (data.conviteId && !referredByBoutiqueId) {
    const referrer = await prisma.user.findUnique({
      where: { id: data.conviteId },
      select: { id: true, role: true },
    }).catch(() => null)
    if (referrer && referrer.role === 'CUSTOMER' && referrer.id !== user.id) {
      const couponCode = 'CONVITE-' + user.id.slice(0, 6).toUpperCase()
      await prisma.coupon.create({
        data: { code: couponCode, discountType: 'PERCENT', discountValue: 10, maxUses: 1, active: true },
      }).catch((e) => console.error("[notif]", e?.message))
    }
  }

  // Fire-and-forget welcome email + admin notification
  if (data.role === 'CUSTOMER') {
    emailWelcomeCustomer(user.email, user.name).catch((e) => console.error("[notif]", e?.message))
    sendPushToRole('ADMIN', '👤 Novo cliente!', `${user.name} se cadastrou na plataforma.`, '/admin').catch((e) => console.error("[notif]", e?.message))
    sendWhatsAppToAdmin(
      `👤 *Novo cliente cadastrado — Tech Churras!*\n\n` +
      `Nome: ${user.name}\n` +
      `Email: ${user.email}\n` +
      `${data.phone ? `📞 ${data.phone}` : ''}\n\n` +
      `👉 https://www.techchurras.com.br/admin`
    ).catch((e) => console.error("[notif]", e?.message))
  }

  if (data.role === 'GRILLMASTER') {
    sendPushToRole('ADMIN', '🔥 Novo Grill Master!', `${user.name} quer ser churrasqueiro. Aprovar em Pendentes.`, '/admin').catch((e) => console.error("[notif]", e?.message))
    sendWhatsAppToAdmin(
      `🔥 *Novo Grill Master cadastrado — Tech Churras!*\n\n` +
      `Nome: ${user.name}\n` +
      `Email: ${user.email}\n` +
      `${data.phone ? `📞 ${data.phone}` : ''}\n\n` +
      `Aprovar em: https://www.techchurras.com.br/admin`
    ).catch((e) => console.error("[notif]", e?.message))
  }

  if (data.role === 'BOUTIQUE') {
    sendPushToRole('ADMIN', '🥩 Novo Açougue!', `${user.name} quer ser parceiro. Aprovar em Pendentes.`, '/admin').catch((e) => console.error("[notif]", e?.message))
    sendWhatsAppToAdmin(
      `🥩 *Novo Açougue parceiro cadastrado — Tech Churras!*\n\n` +
      `Nome: ${user.name}\n` +
      `Email: ${user.email}\n` +
      `${data.phone ? `📞 ${data.phone}` : ''}\n\n` +
      `Aprovar em: https://www.techchurras.com.br/admin`
    ).catch((e) => console.error("[notif]", e?.message))
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
    tokenVersion: user.tokenVersion,
    totpEnabled: user.totpEnabled,
  }
}

export async function markOnboardingCompleted(userId: string) {
  return prisma.user.update({ where: { id: userId }, data: { onboardingCompleted: true } })
}

export async function registerGuest(data: { name: string; phone: string }) {
  const email = `guest_${randomUUID()}@guest.techchurras.com`
  const password = randomUUID()
  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      name: data.name.trim(),
      email,
      password: hashedPassword,
      phone: data.phone.trim(),
      role: 'CUSTOMER',
    },
    select: { id: true, name: true, email: true, role: true, onboardingCompleted: true, tokenVersion: true },
  })

  sendWhatsAppToAdmin(
    `📱 *Pedido via QR Code (guest) — Tech Churras!*\n\n` +
    `Nome: ${user.name}\n` +
    `WhatsApp: ${data.phone}`
  ).catch(() => {})

  return user
}

export async function updateUserProfile(userId: string, data: { name?: string; phone?: string }) {
  // Trocar o telefone invalida a verificação anterior — senão o admin veria
  // "WhatsApp verificado" como garantia de um número que nunca foi confirmado.
  let phoneChanged = false
  if (data.phone !== undefined) {
    const current = await prisma.user.findUnique({ where: { id: userId }, select: { phone: true } })
    phoneChanged = data.phone.trim() !== (current?.phone ?? '')
  }
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name ? { name: data.name.trim() } : {}),
      ...(data.phone !== undefined ? { phone: data.phone.trim() || null } : {}),
      ...(phoneChanged ? { phoneVerified: false, phoneVerificationCode: null, phoneVerificationExpiresAt: null } : {}),
    },
    select: { id: true, name: true, email: true, phone: true, role: true },
  })
}

export async function deleteAccount(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw new Error('Credenciais inválidas')

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) throw new Error('Credenciais inválidas')

  await prisma.$transaction([
    prisma.message.deleteMany({ where: { senderId: user.id } }),
    prisma.review.deleteMany({ where: { customerId: user.id } }),
    prisma.orderItem.deleteMany({ where: { order: { customerId: user.id } } }),
    prisma.order.deleteMany({ where: { customerId: user.id } }),
    prisma.pushSubscription.deleteMany({ where: { userId: user.id } }),
    prisma.address.deleteMany({ where: { userId: user.id } }),
    prisma.pointsRedemption.deleteMany({ where: { userId: user.id } }),
    prisma.favorite.deleteMany({ where: { userId: user.id } }),
    prisma.user.delete({ where: { id: user.id } }),
  ])
}