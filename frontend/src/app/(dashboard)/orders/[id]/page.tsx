'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-500',
  CONFIRMED: 'bg-blue-500',
  IN_PROGRESS: 'bg-orange-500',
  COMPLETED: 'bg-green-500',
  CANCELLED: 'bg-red-500',
}

interface OrderItem {
  id: string
  quantity: number
  unitPrice: number
  product?: { name: string; unit: string }
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
  items?: OrderItem[]
  grillmaster?: {
    user?: { name: string }
    city?: string
    state?: string
    pricePerHour?: number
  }
  boutique?: { name: string }
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const raw = localStorage.getItem('auth-storage')
    const t = raw ? JSON.parse(raw)?.state?.token : null
    fetch('https://tech-churras-production.up.railway.app/orders/' + id, {
      headers: { Authorization: 'Bearer ' + t },
    })
      .then(r => r.json())
      .then(d => setOrder(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-gray-400 p-6">Carregando...</p>
  if (!order) return <p className="text-gray-400 p-6">Pedido não encontrado.</p>

  const gmCost = order.grillmaster?.pricePerHour
    ? order.grillmaster.pricePerHour * order.eventHours
    : null
  const itemsCost = order.items?.reduce((s, i) => s + i.quantity * i.unitPrice, 0) ?? 0

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/orders" className="text-sm text-gray-400 hover:text-white mb-6 inline-block">
        &larr; Voltar para pedidos
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Pedido #{order.id.slice(0, 8)}</h1>
        <span className={'text-sm text-white px-3 py-1 rounded-full font-medium ' + (STATUS_COLOR[order.status] || 'bg-gray-500')}>
          {STATUS_LABEL[order.status] || order.status}
        </span>
      </div>

      <div className="bg-gray-900 rounded-2xl divide-y divide-gray-800 border border-gray-800">

        {/* Grillmaster */}
        {order.grillmaster && (
          <div className="p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Churrasqueiro</p>
            <p className="font-semibold text-lg">{order.grillmaster.user?.name}</p>
            {order.grillmaster.city && (
              <p className="text-sm text-gray-400 mt-0.5">
                {order.grillmaster.city}{order.grillmaster.state ? ', ' + order.grillmaster.state : ''}
              </p>
            )}
            {order.grillmaster.pricePerHour != null && (
              <p className="text-sm text-orange-400 mt-1">
                R$ {Number(order.grillmaster.pricePerHour).toFixed(2)}/hora &times; {order.eventHours}h
                {gmCost != null && (
                  <span className="text-gray-400 ml-2">= R$ {gmCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                )}
              </p>
            )}
          </div>
        )}

        {/* Açougue */}
        {order.boutique && (
          <div className="p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Açougue</p>
            <p className="font-semibold">{order.boutique.name}</p>
          </div>
        )}

        {/* Evento */}
        <div className="p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Data do Evento</p>
          <p className="font-semibold">
            {new Date(order.eventDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Endereço</p>
          <p className="font-semibold">{order.eventAddress}</p>
        </div>

        <div className="p-5 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Horas de Serviço</p>
            <p className="font-semibold">{order.eventHours}h</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Convidados</p>
            <p className="font-semibold">{order.guestCount} pessoas</p>
          </div>
        </div>

        {/* Cortes */}
        {order.items && order.items.length > 0 && (
          <div className="p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">
              Cortes{order.boutique ? ' — ' + order.boutique.name : ''}
            </p>
            <div className="space-y-2">
              {order.items.map(item => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">
                    {item.product?.name ?? 'Produto'} &times; {item.quantity}{item.product?.unit ?? ''}
                  </span>
                  <span className="text-orange-400 font-medium">
                    R$ {(item.quantity * item.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Observações */}
        {order.notes && (
          <div className="p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Observações</p>
            <p className="text-sm text-gray-300 whitespace-pre-line">{order.notes}</p>
          </div>
        )}

        {/* Total */}
        <div className="p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Resumo</p>
          <div className="space-y-1.5 text-sm">
            {gmCost != null && (
              <div className="flex justify-between text-gray-400">
                <span>Mão de obra ({order.eventHours}h)</span>
                <span>R$ {gmCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {itemsCost > 0 && (
              <div className="flex justify-between text-gray-400">
                <span>Insumos{order.boutique ? ' — ' + order.boutique.name : ''}</span>
                <span>R$ {itemsCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-gray-700">
              <span className="font-bold text-white">Total</span>
              <span className="text-2xl font-black text-orange-400">
                R$ {(order.totalPrice ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
