'use client'
import { useEffect, useState } from 'react'

interface Order {
  id: string
  status: string
  totalPrice: number
  eventDate: string
  user?: { name: string; email: string }
  grillmaster?: { user?: { name: string } }
  boutique?: { name: string }
}

interface Stats {
  totalOrders: number
  totalUsers: number
  totalGrillmasters: number
  totalRevenue: number
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-500',
  CONFIRMED: 'bg-blue-500',
  IN_PROGRESS: 'bg-orange-500',
  COMPLETED: 'bg-green-500',
  CANCELLED: 'bg-red-500',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluido',
  CANCELLED: 'Cancelado',
}

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'orders' | 'stats'>('stats')

  useEffect(() => {
    const raw = localStorage.getItem('auth-storage')
    const t = raw ? JSON.parse(raw)?.state?.token : null
    const h = { Authorization: 'Bearer ' + t }
    const base = 'https://tech-churras-production.up.railway.app'
    Promise.all([
      fetch(base + '/admin/stats', { headers: h }).then(r => r.json()),
      fetch(base + '/orders', { headers: h }).then(r => r.json()),
    ]).then(([s, o]) => {
      setStats(s)
      setOrders(Array.isArray(o) ? o : o.orders || [])
    }).finally(() => setLoading(false))
  }, [])

  async function updateStatus(id: string, status: string) {
    const raw = localStorage.getItem('auth-storage')
    const t = raw ? JSON.parse(raw)?.state?.token : null
    await fetch('https://tech-churras-production.up.railway.app/orders/' + id + '/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t },
      body: JSON.stringify({ status })
    })
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
  }

  if (loading) return <p className='text-gray-400'>Carregando...</p>

  return (
    <div>
      <h1 className='text-2xl font-bold mb-6'>Painel Admin</h1>
      <div className='flex gap-2 mb-6'>
        <button onClick={() => setTab('stats')} className={'px-4 py-2 rounded-lg font-medium ' + (tab === 'stats' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400')}>Resumo</button>
        <button onClick={() => setTab('orders')} className={'px-4 py-2 rounded-lg font-medium ' + (tab === 'orders' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400')}>Pedidos</button>
      </div>
      {tab === 'stats' && stats && (
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <div className='bg-gray-900 rounded-xl p-5'><p className='text-gray-400 text-sm'>Total Pedidos</p><p className='text-3xl font-bold text-orange-400'>{stats.totalOrders}</p></div>
          <div className='bg-gray-900 rounded-xl p-5'><p className='text-gray-400 text-sm'>Usuarios</p><p className='text-3xl font-bold text-orange-400'>{stats.totalUsers}</p></div>
          <div className='bg-gray-900 rounded-xl p-5'><p className='text-gray-400 text-sm'>Churrasqueiros</p><p className='text-3xl font-bold text-orange-400'>{stats.totalGrillmasters}</p></div>
          <div className='bg-gray-900 rounded-xl p-5'><p className='text-gray-400 text-sm'>Receita Total</p><p className='text-3xl font-bold text-green-400'>R$ {stats.totalRevenue?.toFixed(2)}</p></div>
        </div>
      )}
      {tab === 'orders' && (
        <div className='space-y-3'>
          {orders.length === 0 && <p className='text-gray-400'>Nenhum pedido.</p>}
          {orders.map(order => (
            <div key={order.id} className='bg-gray-900 rounded-xl p-4'>
              <div className='flex items-center justify-between mb-2'>
                <div><p className='font-medium'>{order.user?.name || 'Usuario'}</p><p className='text-xs text-gray-400'>{order.user?.email}</p></div>
                <span className={'text-xs text-white px-2 py-1 rounded-full ' + (STATUS_COLOR[order.status] || 'bg-gray-500')}>{STATUS_LABEL[order.status] || order.status}</span>
              </div>
              <div className='flex items-center justify-between'>
                <div className='text-sm text-gray-400'>
                  {order.grillmaster && <p>Churrasqueiro: {order.grillmaster.user?.name}</p>}
                  {order.boutique && <p>Acougue: {order.boutique.name}</p>}
                  <p>Evento: {new Date(order.eventDate).toLocaleDateString('pt-BR')}</p>
                </div>
                <select onChange={e => updateStatus(order.id, e.target.value)} defaultValue={order.status} className='bg-gray-800 text-white text-xs rounded px-2 py-1'>
                  <option value='PENDING'>Pendente</option>
                  <option value='CONFIRMED'>Confirmado</option>
                  <option value='IN_PROGRESS'>Em andamento</option>
                  <option value='COMPLETED'>Concluido</option>
                  <option value='CANCELLED'>Cancelado</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}