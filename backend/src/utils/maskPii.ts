// Log de app no Railway persiste e é visível a quem tem acesso ao projeto —
// evita gravar email/telefone completo de cliente em texto puro (LGPD).
// Mesma ideia já usada em verification.service.ts pra telefone, generalizada.
export function maskEmail(email: string): string {
  const [user, domain] = email.split('@')
  if (!domain) return '***'
  const visible = user.slice(0, 2)
  return `${visible}${'*'.repeat(Math.max(1, user.length - 2))}@${domain}`
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits.replace(/(\d{2})(\d+)(\d{4})/, '$1*****$3')
}
