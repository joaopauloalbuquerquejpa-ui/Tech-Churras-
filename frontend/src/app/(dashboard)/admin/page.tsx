'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const BASE = 'https://tech-churras-production.up.railway.app'

function getToken() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
}

interface Stats {
  totalOrders: number
  totalUsers: number
  totalGrillmasters: number
  totalBoutiques: number
  totalRevenue: number
}

interface Order {
  id: string
  status: string
  totalPrice: number
  eventDate: string
  customer?: { name: string; email: string }
  grillmaster?: { user?: { name: string } }
  boutique?: { name: string }
}

interface PendingGrillmaster {
  id: string
  bio: string
  pricePerHour: number
  city: string
  state: string
  experience: number
  isChancelado: boolean
  user: { name: string; email: string }
}

interface PendingBoutique {
  id: string
  name: string
  description?: string
  city: string
  state: string
  user: { name: string; email: string }
}

interface GmApproveState {
  isChancelado: boolean
  pricePerHour: number
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
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
}

type Tab = 'stats' | 'orders' | 'pending'

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [pendingGrillmasters, setPendingGrillmasters] = useState<PendingGrillmaster[]>([])
  const [pendingBoutiques, setPendingBoutiques] = useState<PendingBoutique[]>([])
  const [gmApproveState, setGmApproveState] = useState<Record<string, GmApproveState>>({})
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('stats')

  useEffect(() => {
    const h = { Authorization: 'Bearer ' + getToken() }
    Promise.all([
      fetch(BASE + '/admin/stats', { headers: h }).then(r => r.json()),
      fetch(BASE + '/admin/orders', { headers: h }).then(r => r.json()),
      fetch(BASE + '/admin/grillmasters/pending', { headers: h }).then(r => r.json()),
      fetch(BASE + '/admin/boutiques/pending', { headers: h }).then(r => r.json()),
    ]).then(([s, o, pg, pb]) => {
      setStats(s)
      setOrders(Array.isArray(o) ? o : o.orders || [])
      const gms: PendingGrillmaster[] = Array.isArray(pg) ? pg : []
      setPendingGrillmasters(gms)
      const init: Record<string, GmApproveState> = {}
      gms.forEach(g => { init[g.id] = { isChancelado: false, pricePerHour: g.pricePerHour } })
      setGmApproveState(init)
      setPendingBoutiques(Array.isArray(pb) ? pb : [])
    }).finally(() => setLoading(false))
  }, [])

  async function updateStatus(id: string, status: string) {
    await fetch(BASE + '/orders/' + id + '/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
      body: JSON.stringify({ status }),
    })
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
  }

  async function approveGrillmaster(id: string) {
    const state = gmApproveState[id] || { isChancelado: false, pricePerHour: 0 }
    const res = await fetch(BASE + '/admin/grillmasters/' + id + '/approve', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
      body: JSON.stringify({ isChancelado: state.isChancelado, pricePerHour: state.pricePerHour }),
    })
    if (res.ok) setPendingGrillmasters(prev => prev.filter(g => g.id !== id))
  }

  async function rejectGrillmaster(id: string) {
    const res = await fetch(BASE + '/admin/grillmasters/' + id + '/reject', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + getToken() },
    })
    if (res.ok) setPendingGrillmasters(prev => prev.filter(g => g.id !== id))
  }

  async function approveBoutique(id: string) {
    const res = await fetch(BASE + '/admin/boutiques/' + id + '/approve', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + getToken() },
    })
    if (res.ok) setPendingBoutiques(prev => prev.filter(b => b.id !== id))
  }

  async function rejectBoutique(id: string) {
    const res = await fetch(BASE + '/admin/boutiques/' + id + '/reject', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + getToken() },
    })
    if (res.ok) setPendingBoutiques(prev => prev.filter(b => b.id !== id))
  }

  function setGmField(id: string, field: keyof GmApproveState, value: boolean | number) {
    setGmApproveState(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  const pendingCount = pendingGrillmasters.length + pendingBoutiques.length

  if (loading) return <p className="text-gray-400">Carregando...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Painel Admin</h1>

      <div className="flex gap-2 mb-6">
        {([
          { key: 'stats', label: 'Resumo' },
          { key: 'orders', label: 'Pedidos' },
          { key: 'pending', label: pendingCount > 0 ? 'Pendentes (' + pendingCount + ')' : 'Pendentes' },
        ] as { key: Tab; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={"px-4 py-2 rounded-lg font-medium text-sm " + (tab === t.key ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'stats' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gray-900 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Total Pedidos</p>
            <p className="text-3xl font-bold text-orange-400">{stats.totalOrders}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Usuários</p>
            <p className="text-3xl font-bold text-orange-400">{stats.totalUsers}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Churrasqueiros</p>
            <p className="text-3xl font-bold text-orange-400">{stats.totalGrillmasters}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Açougues</p>
            <p className="text-3xl font-bold text-orange-400">{stats.totalBoutiques}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Receita Total</p>
            <p className="text-3xl font-bold text-green-400">R$ {(stats.totalRevenue ?? 0).toFixed(2)}</p>
          </div>
          <Link
            href="/admin/repasses"
            className="bg-gray-900 rounded-xl p-5 border border-orange-500/20 hover:border-orange-500/50 hover:bg-gray-800 transition-all group"
          >
            <p className="text-gray-400 text-sm group-hover:text-orange-400 transition-colors">Repasses Semanais</p>
            <p className="text-lg font-bold text-orange-400 mt-1">Gerenciar</p>
            <p className="text-xs text-gray-600 mt-1">Controle de pagamentos para parceiros</p>
          </Link>
        </div>
      )}

      {tab === 'orders' && (
        <div className="space-y-3">
          {orders.length === 0 && <p className="text-gray-400">Nenhum pedido.</p>}
          {orders.map(order => (
            <div key={order.id} className="bg-gray-900 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium">{order.customer?.name || 'Cliente'}</p>
                  <p className="text-xs text-gray-400">{order.customer?.email}</p>
                </div>
                <span className={"text-xs text-white px-2 py-1 rounded-full " + (STATUS_COLOR[order.status] || 'bg-gray-500')}>
                  {STATUS_LABEL[order.status] || order.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400 space-y-0.5">
                  {order.grillmaster && <p>Churrasqueiro: {order.grillmaster.user?.name}</p>}
                  {order.boutique && <p>Açougue: {order.boutique.name}</p>}
                  <p>Data: {new Date(order.eventDate).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-orange-400 font-bold">R$ {(order.totalPrice ?? 0).toFixed(2)}</span>
                  <select
                    onChange={e => updateStatus(order.id, e.target.value)}
                    defaultValue={order.status}
                    className="bg-gray-800 text-white text-xs rounded px-2 py-1"
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
          ))}
        </div>
      )}

      {tab === 'pending' && (
        <div className="space-y-6">
          {/* Churrasqueiros pendentes */}
          <div>
            <h2 className="text-lg font-semibold mb-3">
              Churrasqueiros ({pendingGrillmasters.length})
            </h2>
            {pendingGrillmasters.length === 0 && (
              <p className="text-gray-400 text-sm">Nenhum churrasqueiro aguardando aprovação.</p>
            )}
            <div className="space-y-3">
              {pendingGrillmasters.map(g => {
                const gmState = gmApproveState[g.id] || { isChancelado: false, pricePerHour: g.pricePerHour }
                return (
                  <div key={g.id} className="bg-gray-900 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">{g.user.name}</p>
                          {gmState.isChancelado && (
                            <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-medium">
                              Chancelado
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mb-1">{g.user.email}</p>
                        <p className="text-sm text-gray-300 line-clamp-2">{g.bio}</p>
                        <div className="flex gap-3 mt-2 text-xs text-gray-400">
                          <span>{g.city}, {g.state}</span>
                          <span>{g.experience} anos exp.</span>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => approveGrillmaster(g.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => rejectGrillmaster(g.id)}
                          className="bg-red-700 hover:bg-red-800 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
                        >
                          Reprovar
                        </button>
                      </div>
                    </div>

                    {/* Campos de aprovação */}
                    <div className="border-t border-gray-800 pt-3 flex flex-wrap items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={gmState.isChancelado}
                          onChange={e => setGmField(g.id, 'isChancelado', e.target.checked)}
                          className="accent-orange-500 w-4 h-4"
                        />
                        <span className="text-sm text-gray-300">Conceder Chancela Jota</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-400 whitespace-nowrap">Valor por hora (R$)</label>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={gmState.pricePerHour}
                          onChange={e => setGmField(g.id, 'pricePerHour', +e.target.value)}
                          className="bg-gray-800 rounded-lg px-3 py-1.5 text-white text-sm w-28"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Açougues pendentes */}
          <div>
            <h2 className="text-lg font-semibold mb-3">
              Açougues ({pendingBoutiques.length})
            </h2>
            {pendingBoutiques.length === 0 && (
              <p className="text-gray-400 text-sm">Nenhum açougue aguardando aprovação.</p>
            )}
            <div className="space-y-3">
              {pendingBoutiques.map(b => (
                <div key={b.id} className="bg-gray-900 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{b.name}</p>
                      <p className="text-xs text-gray-400 mb-1">{b.user.name} &middot; {b.user.email}</p>
                      {b.description && <p className="text-sm text-gray-300 line-clamp-2">{b.description}</p>}
                      <p className="text-xs text-gray-400 mt-1">{b.city}, {b.state}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => approveBoutique(b.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
                      >
                        Aprovar
                      </button>
                      <button
                        onClick={() => rejectBoutique(b.id)}
                        className="bg-red-700 hover:bg-red-800 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
                      >
                        Reprovar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
