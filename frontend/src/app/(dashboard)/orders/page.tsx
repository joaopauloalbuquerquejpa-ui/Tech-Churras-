'use client'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const BASE = 'https://tech-churras-production.up.railway.app'

interface Order {
  id: string
  status: string
  totalPrice: number
  eventDate: string
  eventAddress: string
  eventHours: number
  guestCount: number
  grillmaster?: { user?: { name: string } }
  boutique?: { name: string }
  review?: { id: string } | null
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluido',
  CANCELLED: 'Cancelado',
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-500',
  CONFIRMED: 'bg-blue-500',
  IN_PROGRESS: 'bg-orange-500',
  COMPLETED: 'bg-green-500',
  CANCELLED: 'bg-red-500',
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchOrders() }, [])

  async function fetchOrders() {
    try {
      const raw = localStorage.getItem('auth-storage')
      const t = raw ? JSON.parse(raw)?.state?.token : null
      if (!t) { router.push('/login'); return }
      const res = await fetch(BASE + '/orders', {
        headers: { Authorization: 'Bearer ' + t }
      })
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : data.orders || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Meus Pedidos</h1>
        <Link href="/orders/new" className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          Novo Pedido
        </Link>
      </div>
      {loading && <p className="text-gray-400">Carregando...</p>}
      {!loading && orders.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">Nenhum pedido ainda.</p>
          <Link href="/orders/new" className="mt-4 inline-block bg-orange-500 text-white px-6 py-2 rounded-lg">
            Fazer primeiro pedido
          </Link>
        </div>
      )}
      <div className="space-y-4">
        {orders.map(order => {
          const date = order.eventDate
            ? new Date(order.eventDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—'
          const gmName = order.grillmaster?.user?.name || 'Nao selecionado'
          const isCompleted = order.status === 'COMPLETED'
          const hasReview = !!order.review

          return (
            <div key={order.id} className="bg-gray-900 rounded-2xl p-5 border border-gray-800 hover:border-orange-500/30 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500 font-mono">#{order.id.slice(0, 8)}</span>
                <div className="flex items-center gap-2">
                  {isCompleted && (
                    hasReview ? (
                      <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2.5 py-1 rounded-full font-medium">
                        &#10003; Avaliado
                      </span>
                    ) : (
                      <Link
                        href={'/orders/' + order.id + '/review'}
                        className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2.5 py-1 rounded-full font-medium hover:bg-orange-500/30 transition-colors"
                      >
                        &#9733; Avaliar
                      </Link>
                    )
                  )}
                  <span className={'text-xs text-white px-2.5 py-1 rounded-full font-medium ' + (STATUS_COLOR[order.status] || 'bg-gray-500')}>
                    {STATUS_LABEL[order.status] || order.status}
                  </span>
                </div>
              </div>

              <Link href={'/orders/' + order.id} className="block group">
                <div className="flex items-end justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold group-hover:text-orange-400 transition-colors">{gmName}</span>
                      {order.boutique && (
                        <span className="text-xs text-gray-500">&middot; {order.boutique.name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                      <span>{date}</span>
                      <span className="text-gray-600">|</span>
                      <span>{order.guestCount} {order.guestCount === 1 ? 'convidado' : 'convidados'}</span>
                      <span className="text-gray-600">|</span>
                      <span>{order.eventHours}h de servico</span>
                    </div>
                  </div>
                  <p className="text-orange-400 font-bold text-xl shrink-0">
                    R$ {(order.totalPrice ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </Link>

              {order.status === 'PENDING' && (
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <Link
                    href={'/orders/' + order.id + '/payment'}
                    className="inline-flex items-center gap-2 text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    Pagar agora
                  </Link>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
