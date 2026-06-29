import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface AuthStore {
  user: User | null
  token: string | null
  setUser: (user: User) => void
  setToken: (token: string) => void
  logout: () => void
}

function setCookie(name: string, value: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${value}; path=/; max-age=2592000; SameSite=Lax`
}

function clearCookie(name: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; path=/; max-age=0`
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user) => {
        set({ user })
        setCookie('tc-role', user.role)
      },
      setToken: (token) => {
        set({ token })
        setCookie('tc-auth', '1')
      },
      logout: () => {
        localStorage.removeItem('token')
        set({ user: null, token: null })
        clearCookie('tc-auth')
        clearCookie('tc-role')
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)