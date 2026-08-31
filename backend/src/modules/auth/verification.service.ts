import { prisma } from '../../config/prisma'
import { sendWhatsApp } from '../push/push.service'
import crypto from 'crypto'

const CODE_TTL_MINUTES = 10

export async function sendPhoneVerification(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('Usuário não encontrado')
  if (!user.phone) throw new Error('Cadastre um WhatsApp no seu perfil antes de verificar')
  if (user.phoneVerified) return { alreadyVerified: true }

  const code = String(crypto.randomInt(100000, 999999))
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000)
  await prisma.user.update({ where: { id: userId }, data: { phoneVerificationCode: code, phoneVerificationExpiresAt: expiresAt } })

  await sendWhatsApp(user.phone, `🔥 *Tech Churras* — seu código de verificação é *${code}*. Válido por ${CODE_TTL_MINUTES} minutos. Não compartilhe com ninguém.`, 'verificacao')
  return { alreadyVerified: false, sentTo: user.phone.replace(/\D/g, '').replace(/(\d{2})(\d+)(\d{4})/, '$1*****$3') }
}

export async function confirmPhoneVerification(userId: string, code: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('Usuário não encontrado')
  if (user.phoneVerified) return { ok: true }
  if (!user.phoneVerificationCode || !user.phoneVerificationExpiresAt) {
    throw new Error('Nenhum código pendente. Solicite um novo.')
  }
  if (user.phoneVerificationExpiresAt < new Date()) {
    throw new Error('Código expirado. Solicite um novo.')
  }
  if (user.phoneVerificationCode !== code.trim()) {
    throw new Error('Código incorreto')
  }
  await prisma.user.update({ where: { id: userId }, data: { phoneVerified: true, phoneVerificationCode: null, phoneVerificationExpiresAt: null } })
  return { ok: true }
}

// Cross-check leve entre a chave PIX e o CPF/CNPJ declarado — só funciona
// quando a própria chave PIX É o CPF/CNPJ (formato mais comum de detectar
// automaticamente). Pra chaves email/telefone/aleatória não dá pra validar
// titularidade sem uma integração paga de consulta ao DICT do Bacen, que
// não existe hoje — nesses casos sinaliza "não verificável" pro admin
// conferir manualmente, em vez de fingir uma certeza que não existe.
export function checkPixOwnership(pixKey?: string | null, cpfCnpj?: string | null): 'match' | 'mismatch' | 'not_verifiable' {
  if (!pixKey || !cpfCnpj) return 'not_verifiable'
  const cleanPix = pixKey.replace(/\D/g, '')
  const cleanDoc = cpfCnpj.replace(/\D/g, '')
  const pixLooksLikeDoc = cleanPix.length === 11 || cleanPix.length === 14
  if (!pixLooksLikeDoc) return 'not_verifiable'
  return cleanPix === cleanDoc ? 'match' : 'mismatch'
}
