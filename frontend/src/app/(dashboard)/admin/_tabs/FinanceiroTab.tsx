'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { API_URL } from '@/lib/api'
import { Badge, ORDER_STATUS_TONE, ORDER_STATUS_LABEL } from '@/components/admin/ui/Badge'
import { MetricCard } from '@/components/admin/ui/MetricCard'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import { CashIcon, ClipboardIcon } from '@/components/icons/Icons'

function getToken() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
}

interface Order {
  id: string
  status: string
  totalPrice: number
  eventDate: string
  paymentStatus?: string
  paidAt?: string
  createdAt: string
  customer?: { name: string; email: string }
  grillmaster?: { user?: { name: string } }
}

export function FinanceiroTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch(`${API_URL}/admin/orders?take=500`, { headers: { Authorization: 'Bearer ' + getToken() } })
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        setOrders(Array.isArray(data) ? data : (data.data ?? []))
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) return <p className="text-gray-500 text-sm">Carregando...</p>

  const paid = orders.filter(o => o.paymentStatus === 'PAID')
  const pending = orders.filter(o => o.paymentStatus !== 'PAID' && o.status !== 'CANCELLED')
  const totalPaid = paid.reduce((s, o) => s + (o.totalPrice ?? 0), 0)
  const totalPending = pending.reduce((s, o) => s + (o.totalPrice ?? 0), 0)
  const commission = totalPaid * 0.07
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthOrders = paid.filter(o => new Date(o.createdAt) >= monthStart)
  const monthRevenue = monthOrders.reduce((s, o) => s + (o.totalPrice ?? 0), 0)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthOrders = paid.filter(o => {
    const d = new Date(o.createdAt)
    return d >= lastMonthStart && d < monthStart
  })
  const lastMonthRevenue = lastMonthOrders.reduce((s, o) => s + (o.totalPrice ?? 0), 0)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={<CashIcon size={18} />} label="Receita total (pago)" value={`R$ ${totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} accent="green" />
        <MetricCard icon={<CashIcon size={18} />} label="A receber (pedidos ativos)" value={`R$ ${totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} accent="orange" />
        <MetricCard icon={<CashIcon size={18} />} label="Comissão acumulada (7%)" value={`R$ ${commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} accent="blue" />
        <MetricCard icon={<ClipboardIcon size={18} />} label="Pedidos pagos" value={paid.length} accent="neutral" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900 rounded-xl p-4 border border-orange-500/20">
          <p className="text-xs text-gray-500 mb-1">Este mês</p>
          <p className="text-xl font-bold text-white">R$ {monthRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-gray-600 mt-1">{monthOrders.length} pedidos</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Mês passado</p>
          <p className="text-xl font-bold text-gray-400">R$ {lastMonthRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-gray-600 mt-1">{lastMonthOrders.length} pedidos</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-gray-300">Pedidos recebidos</h3>
          <Link href="/admin/repasses" className="text-xs text-orange-400 hover:text-orange-300">Gerenciar repasses →</Link>
        </div>
        {paid.length === 0 ? (
          <EmptyState icon={<CashIcon size={22} />} message="Nenhum pedido pago ainda." />
        ) : (
          <div className="bg-gray-900 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-xs text-gray-500">
                  <th className="text-left px-4 py-2">Cliente</th>
                  <th className="text-left px-4 py-2 hidden md:table-cell">Data evento</th>
                  <th className="text-left px-4 py-2 hidden md:table-cell">Churrasqueiro</th>
                  <th className="text-right px-4 py-2">Total</th>
                  <th className="text-right px-4 py-2 hidden md:table-cell">Comissão (7%)</th>
                  <th className="text-left px-4 py-2 hidden md:table-cell">Pago em</th>
                </tr>
              </thead>
              <tbody>
                {paid.map(o => (
                  <tr key={o.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-2.5">
                      <p className="text-white font-medium">{o.customer?.name}</p>
                      <p className="text-xs text-gray-500">{o.customer?.email}</p>
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell text-gray-400 text-xs">
                      {new Date(o.eventDate).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell text-gray-400 text-xs">
                      {o.grillmaster?.user?.name ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-green-400">
                      R$ {(o.totalPrice ?? 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-right hidden md:table-cell text-yellow-400 text-xs">
                      R$ {((o.totalPrice ?? 0) * 0.07).toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell text-gray-500 text-xs">
                      {o.paidAt ? new Date(o.paidAt).toLocaleDateString('pt-BR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-800/50">
                  <td colSpan={3} className="px-4 py-2.5 text-xs text-gray-500 hidden md:table-cell">Total</td>
                  <td className="px-4 py-2.5 text-right font-black text-green-400">
                    R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-2.5 text-right font-black text-yellow-400 hidden md:table-cell">
                    R$ {commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="hidden md:table-cell" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {pending.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm text-gray-300 mb-3">A receber — pedidos ativos sem pagamento confirmado</h3>
          <div className="space-y-2">
            {pending.map(o => (
              <div key={o.id} className="bg-gray-900 rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">{o.customer?.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-gray-500">{new Date(o.eventDate).toLocaleDateString('pt-BR')}</p>
                    <Badge tone={ORDER_STATUS_TONE[o.status] || 'neutral'}>{ORDER_STATUS_LABEL[o.status] || o.status}</Badge>
                  </div>
                </div>
                <span className="text-orange-400 font-bold">R$ {(o.totalPrice ?? 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
