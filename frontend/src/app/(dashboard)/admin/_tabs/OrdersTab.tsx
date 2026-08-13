'use client'
import { useEffect, useState } from 'react'
import { API_URL } from '@/lib/api'
import { PinIcon, FlameIcon, MeatIcon, ChevronDownIcon } from '@/components/icons/Icons'
import { Badge, ORDER_STATUS_TONE, ORDER_STATUS_LABEL } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'

function getToken() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
}

interface OrderItem {
  id: string
  quantity: number
  unitPrice: number
  product?: { name: string; unit?: string }
}

interface Order {
  id: string
  status: string
  totalPrice: number
  eventDate: string
  eventAddress: string
  eventHours: number
  guestCount: number
  notes?: string
  paymentStatus?: string
  paidAt?: string
  couponCode?: string
  discountAmount?: number
  cancellationReason?: string
  createdAt: string
  customer?: { name: string; email: string; phone?: string }
  grillmaster?: { user?: { name: string; phone?: string } }
  boutique?: { name: string }
  items?: OrderItem[]
}

type StatusFilter = 'ATIVOS' | 'TODOS' | 'ATENCAO' | 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

const PILLS: { key: StatusFilter; label: string }[] = [
  { key: 'ATIVOS', label: 'Ativos' },
  { key: 'TODOS', label: 'Todos' },
  { key: 'ATENCAO', label: '⚠️ Atenção' },
  { key: 'PENDING', label: 'Pendente' },
  { key: 'CONFIRMED', label: 'Confirmado' },
  { key: 'IN_PROGRESS', label: 'Em andamento' },
  { key: 'COMPLETED', label: 'Concluído' },
  { key: 'CANCELLED', label: 'Cancelado' },
]

const TAKE = 20

export function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<StatusFilter>('ATIVOS')
  const [skip, setSkip] = useState(0)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)

  useEffect(() => { setSkip(0) }, [filter])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params = new URLSearchParams({ skip: String(skip), take: String(TAKE) })
    if (filter === 'ATENCAO') params.set('needsAttention', 'true')
    else if (filter !== 'ATIVOS' && filter !== 'TODOS') params.set('status', filter)
    fetch(`${API_URL}/admin/orders?${params}`, { headers: { Authorization: 'Bearer ' + getToken() } })
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        const list: Order[] = Array.isArray(data) ? data : (data.data ?? [])
        setOrders(filter === 'ATIVOS' ? list.filter(o => o.status !== 'CANCELLED') : list)
        setTotal(data.total ?? list.length)
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [filter, skip])

  async function updateStatus(id: string, status: string) {
    await fetch(API_URL + '/orders/' + id + '/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
      body: JSON.stringify({ status }),
    })
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {PILLS.map(p => (
          <button
            key={p.key}
            onClick={() => setFilter(p.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === p.key ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-500 text-sm">Carregando...</p>}

      {!loading && orders.length === 0 && (
        <EmptyState icon={<ChevronDownIcon size={22} />} message="Nenhum pedido nesse filtro." />
      )}

      <div className="space-y-3">
        {orders.map(order => {
          const isOpen = expandedOrderId === order.id
          return (
            <div key={order.id} className="bg-gray-900 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedOrderId(isOpen ? null : order.id)}
                className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{order.customer?.name || 'Cliente'}</p>
                    <Badge tone={ORDER_STATUS_TONE[order.status] || 'neutral'}>
                      {ORDER_STATUS_LABEL[order.status] || order.status}
                    </Badge>
                    {order.paymentStatus === 'PAID' && <Badge tone="green">Pago</Badge>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(order.eventDate).toLocaleDateString('pt-BR')} · {order.guestCount} pessoas · R$ {(order.totalPrice ?? 0).toFixed(2)}
                  </p>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    Pedido feito em {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <ChevronDownIcon size={16} className={`text-gray-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="border-t border-gray-800 px-4 pb-4 pt-3 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Cliente</p>
                    <p className="text-sm text-white">{order.customer?.name}</p>
                    <p className="text-xs text-gray-400">{order.customer?.email}</p>
                    {order.customer?.phone && <p className="text-xs text-gray-400">{order.customer.phone}</p>}
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Evento</p>
                    <p className="text-sm text-white inline-flex items-center gap-1.5"><PinIcon size={13} /> {order.eventAddress}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                      <span>{new Date(order.eventDate).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</span>
                      <span>{order.eventHours}h</span>
                      <span>{order.guestCount} convidados</span>
                    </div>
                    {order.notes && <p className="text-xs text-yellow-300 mt-1">{order.notes}</p>}
                  </div>

                  {(order.grillmaster || order.boutique) && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Parceiros</p>
                      {order.grillmaster?.user && (
                        <p className="text-xs text-gray-300 inline-flex items-center gap-1.5"><FlameIcon size={11} /> Churrasqueiro: {order.grillmaster.user.name}{order.grillmaster.user.phone ? ` · ${order.grillmaster.user.phone}` : ''}</p>
                      )}
                      {order.boutique && (
                        <p className="text-xs text-gray-300 inline-flex items-center gap-1.5"><MeatIcon size={11} /> Açougue: {order.boutique.name}</p>
                      )}
                    </div>
                  )}

                  {order.items && order.items.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Itens do pedido</p>
                      <div className="space-y-1">
                        {order.items.map(item => (
                          <div key={item.id} className="flex justify-between text-xs text-gray-300">
                            <span>{item.quantity}x {item.product?.name ?? 'Item'}{item.product?.unit ? ` (${item.product.unit})` : ''}</span>
                            <span className="text-gray-400">R$ {(item.unitPrice * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Financeiro</p>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-300">
                      <span>Total: <span className="text-orange-400 font-bold">R$ {(order.totalPrice ?? 0).toFixed(2)}</span></span>
                      {order.couponCode && <span>Cupom: <span className="text-green-400">{order.couponCode}</span> (-R$ {(order.discountAmount ?? 0).toFixed(2)})</span>}
                      <span>Pagamento: <span className={order.paymentStatus === 'PAID' ? 'text-green-400' : 'text-yellow-400'}>{order.paymentStatus ?? 'pendente'}</span></span>
                      {order.paidAt && <span>Pago em: {new Date(order.paidAt).toLocaleDateString('pt-BR')}</span>}
                    </div>
                  </div>

                  {order.cancellationReason && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <p className="text-xs text-red-400">Cancelamento: {order.cancellationReason}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs text-gray-600">
                      ID: {order.id.slice(0, 8)}... · Pedido feito em {new Date(order.createdAt).toLocaleDateString('pt-BR')} às {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-400">Status:</label>
                      <select
                        onChange={e => updateStatus(order.id, e.target.value)}
                        defaultValue={order.status}
                        className="bg-gray-800 text-white text-xs rounded px-2 py-1.5 border border-gray-700"
                      >
                        <option value="PENDING">Pendente</option>
                        <option value="CONFIRMED">Confirmado</option>
                        <option value="IN_PROGRESS">Em andamento</option>
                        <option value="COMPLETED">Concluído</option>
                        <option value="CANCELLED">Cancelado</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {total > TAKE && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-500">{skip + 1}–{Math.min(skip + TAKE, total)} de {total}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setSkip(s => Math.max(0, s - TAKE))}
              disabled={skip === 0}
              className="text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 px-3 py-1.5 rounded-lg"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setSkip(s => s + TAKE)}
              disabled={skip + TAKE >= total}
              className="text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 px-3 py-1.5 rounded-lg"
            >
              Próxima →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
