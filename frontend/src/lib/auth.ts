import { api } from './api'

export async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password })
  if (data.token) localStorage.setItem('token', data.token)
  return data
}

export async function verifyTotp(preToken: string, code: string) {
  const { data } = await api.post('/auth/2fa/verify', { code }, {
    headers: { Authorization: `Bearer ${preToken}` },
  })
  localStorage.setItem('token', data.token)
  return data
}

export async function register(name: string, email: string, password: string, acceptedTerms: boolean, referralCode?: string, role?: string, phone?: string, conviteId?: string) {
  const { data } = await api.post('/auth/register', {
    name, email, password, acceptedTerms,
    ...(referralCode ? { referralCode } : {}),
    ...(role ? { role } : {}),
    ...(phone ? { phone } : {}),
    ...(conviteId ? { conviteId } : {}),
  })
  localStorage.setItem('token', data.token)
  return data
}

export function logout() {
  localStorage.removeItem('token')
}

export function getToken() {
  return localStorage.getItem('token')
}