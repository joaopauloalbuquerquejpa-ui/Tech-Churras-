'use client'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import Link from 'next/link'

interface Order {
  id: string
  status: string
  totalPrice: number
  eventDate: string
  grillmaster?: { user?: { name: string } }
  boutique?: { name: string }
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
  const { token } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchOrders() }, [])

  async function fetchOrders() {
    try {
      const raw = localStorage.getItem('auth-storage')
      const t = raw ? JSON.parse(raw)?.state?.token : null
      const res = await fetch('https://tech-churras-production.up.railway.app/orders', {
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
        <Link href="/orders/new" className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium">
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
        {orders.map(order => (
          <Link key={order.id} href={"/orders/" + order.id} className="block bg-gray-900 rounded-xl p-5 hover:bg-gray-800 transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">#{order.id.slice(0, 8)}</span>
              <span className={"text-xs text-white px-2 py-1 rounded-full " + (STATUS_COLOR[order.status] || "bg-gray-500")}>
                {STATUS_LABEL[order.status] || order.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Churrasqueiro: {order.grillmaster?.user?.name || "Nao selecionado"}</p>
                {order.boutique && <p className="text-sm">Acougue: {order.boutique.name}</p>}
              </div>
              <p className="text-orange-400 font-bold text-lg">R$ {(order.totalPrice ?? 0).toFixed(2)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}