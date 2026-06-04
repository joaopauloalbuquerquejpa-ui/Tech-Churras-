'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, logout } = useAuthStore()

  useEffect(() => {
    const raw = localStorage.getItem('auth-storage')
    const token = raw ? JSON.parse(raw)?.state?.token : null
    if (!token) router.push('/login')
  }, [])

  function handleLogout() {
    logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-orange-500">?? Tech Churras</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400">Olá, {user?.name || 'Usuário'}</span>
          <button onClick={handleLogout} className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded text-sm">
            Sair
          </button>
        </div>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  )
}
