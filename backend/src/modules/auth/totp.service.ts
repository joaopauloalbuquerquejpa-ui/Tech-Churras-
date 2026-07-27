import { generateSecret, generateURI, verify } from 'otplib'
import QRCode from 'qrcode'

export function generateTotpSecret() {
  return generateSecret()
}

export async function verifyTotpCode(secret: string, code: string): Promise<boolean> {
  try {
    const result = await verify({ secret, token: code, epochTolerance: 30 })
    return result.valid
  } catch {
    return false
  }
}

export async function buildTotpQrCode(email: string, secret: string): Promise<string> {
  const otpauth = generateURI({ issuer: 'Tech Churras Admin', label: email, secret })
  return QRCode.toDataURL(otpauth)
}
