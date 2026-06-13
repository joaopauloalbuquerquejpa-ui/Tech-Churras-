import { api } from './api'

export async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password })
  localStorage.setItem('token', data.token)
  return data
}

export async function register(name: string, email: string, password: string, referralCode?: string, role?: string) {
  const { data } = await api.post('/auth/register', {
    name, email, password,
    ...(referralCode ? { referralCode } : {}),
    ...(role ? { role } : {}),
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