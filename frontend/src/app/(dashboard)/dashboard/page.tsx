'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'

const BASE = 'https://tech-churras-production.up.railway.app'

function getToken() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [stats, setStats] = useState({ orders: 0, grillmasters: 0, boutiques: 0 })

  useEffect(() => {
    const raw = localStorage.getItem('auth-storage')
    const token = raw ? JSON.parse(raw)?.state?.token : null
    if (!token) router.push('/login')
  }, [])

  useEffect(() => {
    const h = { Authorization: 'Bearer ' + getToken() }
    fetch(BASE + '/orders', { headers: h })
      .then(r => r.json())
      .then(d => setStats(prev => ({ ...prev, orders: Array.isArray(d) ? d.length : 0 })))
      .catch(() => {})
    fetch(BASE + '/grillmasters', { headers: h })
      .then(r => r.json())
      .then(d => {
        const arr = Array.isArray(d) ? d : d.grillmasters ?? []
        setStats(prev => ({ ...prev, grillmasters: arr.length }))
      })
      .catch(() => {})
    fetch(BASE + '/boutiques', { headers: h })
      .then(r => r.json())
      .then(d => {
        const arr = Array.isArray(d) ? d : d.boutiques ?? []
        setStats(prev => ({ ...prev, boutiques: arr.length }))
      })
      .catch(() => {})
  }, [])

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold">
          Olá, {user?.name?.split(' ')[0] || 'seja bem-vindo'}
        </h2>
        <p className="text-gray-500 text-sm mt-1">O que vamos churrasquear hoje?</p>
      </div>

      {/* CTA Banner */}
      <div
        className="rounded-2xl p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6"
        style={{
          background: 'radial-gradient(ellipse at 70% 50%, rgba(249,115,22,0.25) 0%, transparent 65%), #111111',
          border: '1px solid rgba(249,115,22,0.3)',
        }}
      >
        <div>
          <p className="text-xs font-bold tracking-widest text-orange-400 uppercase mb-2">
            Novo pedido
          </p>
          <h3 className="text-2xl font-black text-white mb-1">
            Pronto para um churrasco incrível?
          </h3>
          <p className="text-gray-400 text-sm">
            Grillmaster chancelado + cortes premium + calculadora inteligente
          </p>
        </div>
        <Link
          href="/menu"
          className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all hover:-translate-y-0.5 shadow-lg shadow-orange-500/20 whitespace-nowrap"
        >
          Montar Meu Churrasco
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/orders" className="bg-gray-900 p-6 rounded-xl border border-gray-800 hover:border-orange-500/30 transition-colors group">
          <p className="text-gray-500 text-sm">Meus Pedidos</p>
          <p className="text-3xl font-bold text-orange-500 mt-1 group-hover:scale-105 transition-transform origin-left">{stats.orders}</p>
        </Link>
        <Link href="/grillmasters" className="bg-gray-900 p-6 rounded-xl border border-gray-800 hover:border-orange-500/30 transition-colors group">
          <p className="text-gray-500 text-sm">Churrasqueiros</p>
          <p className="text-3xl font-bold text-orange-500 mt-1 group-hover:scale-105 transition-transform origin-left">{stats.grillmasters}</p>
        </Link>
        <Link href="/boutiques" className="bg-gray-900 p-6 rounded-xl border border-gray-800 hover:border-orange-500/30 transition-colors group">
          <p className="text-gray-500 text-sm">Açougues</p>
          <p className="text-3xl font-bold text-orange-500 mt-1 group-hover:scale-105 transition-transform origin-left">{stats.boutiques}</p>
        </Link>
      </div>

      {/* Trust row */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-500">
        <span>✓ Profissionais chancelados por Jota Grillmaster</span>
        <span>✓ Sem surpresas — preço fechado antes do evento</span>
        <span>✓ Grillmaster retira os insumos no açougue para você</span>
        <span>✓ Suporte durante todo o evento</span>
      </div>
    </div>
  )
}
