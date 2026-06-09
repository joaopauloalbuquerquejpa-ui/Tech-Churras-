'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

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

interface OrderDetail {
  id: string
  status: string
  totalPrice: number
  eventDate: string
  eventAddress: string
  eventHours: number
  guestCount: number
  notes?: string
  grillmaster?: {
    user?: { name: string }
    city?: string
    state?: string
    pricePerHour?: number
  }
  boutique?: {
    name: string
  }
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const raw = localStorage.getItem('auth-storage')
    const t = raw ? JSON.parse(raw)?.state?.token : null
    fetch('https://tech-churras-production.up.railway.app/orders/' + id, {
      headers: { Authorization: 'Bearer ' + t }
    })
      .then(r => r.json())
      .then(d => setOrder(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-gray-400 p-6">Carregando...</p>
  if (!order) return <p className="text-gray-400 p-6">Pedido nao encontrado.</p>

  const statusColor = STATUS_COLOR[order.status] || 'bg-gray-500'
  const statusLabel = STATUS_LABEL[order.status] || order.status

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Link href="/orders" className="text-sm text-gray-400 hover:text-white mb-6 inline-block">
        &larr; Voltar para pedidos
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Pedido #{order.id.slice(0, 8)}</h1>
        <span className={"text-sm text-white px-3 py-1 rounded-full font-medium " + statusColor}>
          {statusLabel}
        </span>
      </div>

      <div className="bg-gray-900 rounded-xl divide-y divide-gray-700">
        {order.grillmaster && (
          <div className="p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Churrasqueiro</p>
            <p className="font-semibold text-lg">{order.grillmaster.user?.name}</p>
            {order.grillmaster.city && (
              <p className="text-sm text-gray-400 mt-0.5">
                {order.grillmaster.city}{order.grillmaster.state ? ', ' + order.grillmaster.state : ''}
              </p>
            )}
            {order.grillmaster.pricePerHour != null && (
              <p className="text-sm text-orange-400 mt-1">
                R$ {Number(order.grillmaster.pricePerHour).toFixed(2)}/hora
              </p>
            )}
          </div>
        )}

        {order.boutique && (
          <div className="p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Acougue</p>
            <p className="font-semibold">{order.boutique.name}</p>
          </div>
        )}

        <div className="p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Data do Evento</p>
          <p className="font-semibold">{new Date(order.eventDate).toLocaleDateString('pt-BR')}</p>
        </div>

        <div className="p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Endereco</p>
          <p className="font-semibold">{order.eventAddress}</p>
        </div>

        <div className="p-5 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Horas de servico</p>
            <p className="font-semibold">{order.eventHours}h</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Convidados</p>
            <p className="font-semibold">{order.guestCount} pessoas</p>
          </div>
        </div>

        {order.notes && (
          <div className="p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Observacoes</p>
            <p className="text-sm text-gray-300">{order.notes}</p>
          </div>
        )}

        <div className="p-5 flex items-center justify-between">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Total</p>
          <p className="text-2xl font-bold text-orange-400">
            R$ {(order.totalPrice ?? 0).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  )
}
