'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function DashboardPage() {
  const router = useRouter()
  const { user, logout } = useAuthStore()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) router.push('/login')
  }, [])

  function handleLogout() {
    logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-orange-500">🔥 Tech Churras</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400">Olá, {user?.name || 'Usuário'}</span>
          <button
            onClick={handleLogout}
            className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm transition"
          >
            Sair
          </button>
        </div>
      </nav>

      <main className="p-6">
        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
            <p className="text-gray-400 text-sm">Meus Pedidos</p>
            <p className="text-3xl font-bold text-orange-500 mt-1">0</p>
          </div>
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
            <p className="text-gray-400 text-sm">Churrasqueiros</p>
            <p className="text-3xl font-bold text-orange-500 mt-1">0</p>
          </div>
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
            <p className="text-gray-400 text-sm">Açougues</p>
            <p className="text-3xl font-bold text-orange-500 mt-1">0</p>
          </div>
        </div>
      </main>
    </div>
  )
}