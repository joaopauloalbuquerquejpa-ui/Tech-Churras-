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

interface Order {
  id: string
  status: string
  paymentStatus?: string
  totalPrice: number
  eventDate: string
  guestCount: number
  createdAt: string
  customer: { name: string; email: string }
  boutique?: { name: string }
}

interface GrillmasterProfile {
  id: string
  rating: number
  totalOrders: number
  pricePerHour: number
  city: string
  state: string
  isChancelado: boolean
}

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Aguardando',
  CONFIRMED: 'Confirmado',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluido',
  CANCELLED: 'Cancelado',
}
const STATUS_CLASS: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  CONFIRMED: 'bg-blue-500/20 text-blue-400',
  IN_PROGRESS: 'bg-orange-500/20 text-orange-400',
  COMPLETED: 'bg-green-500/20 text-green-400',
  CANCELLED: 'bg-gray-700 text-gray-400',
}

export default function GrillmasterDashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [profile, setProfile] = useState<GrillmasterProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!user) return
    if (user.role !== 'GRILLMASTER') {
      router.replace('/dashboard')
      return
    }
    load()
  }, [user])

  async function load() {
    setLoading(true)
    try {
      const h = { Authorization: 'Bearer ' + getToken() }
      const res = await fetch(`${BASE}/grillmasters/me/orders`, { headers: h })
      if (!res.ok) { setNotFound(true); return }
      const data = await res.json()
      setProfile(data.grillmaster ?? null)
      setOrders(Array.isArray(data.orders) ? data.orders : [])
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-900 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-gray-900 rounded-xl" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <p className="text-gray-400 mb-4">Voce nao tem um perfil de churrasqueiro cadastrado.</p>
        <Link href="/grillmasters/new"
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm">
          Cadastrar como churrasqueiro
        </Link>
      </div>
    )
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  const completedOrders = orders.filter(o => o.status === 'COMPLETED')
  const thisMonthOrders = completedOrders.filter(o => new Date(o.eventDate) >= startOfMonth)
  const thisYearOrders = completedOrders.filter(o => new Date(o.eventDate) >= startOfYear)

  const earnedThisMonth = thisMonthOrders.reduce((s, o) => s + o.totalPrice, 0)
  const earnedThisYear = thisYearOrders.reduce((s, o) => s + o.totalPrice, 0)

  const cards = [
    { label: 'Ganhos este mes', value: 'R$ ' + fmt(earnedThisMonth), sub: thisMonthOrders.length + ' pedido(s)', color: 'text-orange-400' },
    { label: 'Ganhos este ano', value: 'R$ ' + fmt(earnedThisYear), sub: thisYearOrders.length + ' pedido(s)', color: 'text-green-400' },
    { label: 'Pedidos concluidos', value: String(thisMonthOrders.length), sub: 'este mes', color: 'text-blue-400' },
    { label: 'Avaliacao media', value: (profile?.rating ?? 0).toFixed(1) + ' / 5', sub: profile?.totalOrders + ' total', color: 'text-yellow-400' },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">Meu Dashboard</h1>
            {profile?.isChancelado && (
              <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 text-xs font-bold px-2 py-0.5 rounded-full">
                CHANCELADO
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {profile ? `${profile.city}, ${profile.state} — R$ ${fmt(profile.pricePerHour)}/h` : ''}
          </p>
        </div>
        <Link href="/grillmasters/new"
          className="text-sm text-orange-400 hover:text-orange-300 border border-orange-500/30 px-3 py-1.5 rounded-lg transition-colors">
          Editar perfil
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {cards.map(c => (
          <div key={c.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1 leading-tight">{c.label}</p>
            <p className={'text-xl font-bold ' + c.color}>{c.value}</p>
            <p className="text-xs text-gray-600 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="font-semibold">Pedidos recentes</h2>
          <span className="text-xs text-gray-500">{orders.length} total</span>
        </div>
        {orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            Voce ainda nao recebeu pedidos.
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {orders.slice(0, 20).map(o => (
              <div key={o.id} className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-gray-800/30 transition-colors">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-white truncate">{o.customer?.name ?? 'Cliente'}</p>
                    <span className={'text-xs px-2 py-0.5 rounded-full font-medium ' + (STATUS_CLASS[o.status] ?? 'bg-gray-700 text-gray-400')}>
                      {STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(o.eventDate).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })} — {o.guestCount} convidado{o.guestCount !== 1 ? 's' : ''}
                    {o.boutique ? ` — ${o.boutique.name}` : ''}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-orange-400">R$ {fmt(o.totalPrice)}</p>
                  <p className="text-xs text-gray-600 font-mono">#{o.id.slice(0, 8)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
