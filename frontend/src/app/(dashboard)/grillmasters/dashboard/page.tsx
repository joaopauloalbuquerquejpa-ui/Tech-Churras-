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
  eventAddress: string
  eventHours: number
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
  available: boolean
}

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
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
  const [contract, setContract] = useState<{ id: string; status: string; durationMonths: number; acceptedAt: string | null; generatedAt: string } | null>(null)
  const [showContractText, setShowContractText] = useState(false)
  const [contractText, setContractText] = useState('')
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [togglingAvail, setTogglingAvail] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

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
      const [res, cRes] = await Promise.all([
        fetch(`${BASE}/grillmasters/me/orders`, { headers: h }),
        fetch(`${BASE}/contracts/my`, { headers: h }),
      ])
      if (!res.ok) { setNotFound(true); return }
      const data = await res.json()
      setProfile(data.grillmaster ?? null)
      setOrders(Array.isArray(data.orders) ? data.orders : [])
      if (cRes.ok) {
        const contracts = await cRes.json()
        if (Array.isArray(contracts) && contracts.length > 0) setContract(contracts[0])
      }
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleAvailability() {
    if (!profile) return
    setTogglingAvail(true)
    try {
      const res = await fetch(`${BASE}/grillmasters`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
        body: JSON.stringify({ available: !profile.available }),
      })
      if (res.ok) setProfile(p => p ? { ...p, available: !p.available } : null)
    } finally {
      setTogglingAvail(false)
    }
  }

  async function handleAccept(orderId: string) {
    setActionLoading(orderId + '-accept')
    try {
      const res = await fetch(`${BASE}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
        body: JSON.stringify({ status: 'CONFIRMED' }),
      })
      if (res.ok) setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'CONFIRMED' } : o))
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject(orderId: string) {
    setActionLoading(orderId + '-reject')
    try {
      const res = await fetch(`${BASE}/orders/${orderId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
        body: JSON.stringify({ reason: 'Churrasqueiro recusou o evento' }),
      })
      if (res.ok) setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'CANCELLED' } : o))
    } finally {
      setActionLoading(null)
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

  const pendingOrders = orders.filter(o => o.status === 'PENDING')
  const upcomingOrders = orders
    .filter(o => (o.status === 'CONFIRMED' || o.status === 'IN_PROGRESS') && new Date(o.eventDate) >= now)
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
  const historyOrders = orders.filter(o => o.status === 'COMPLETED' || o.status === 'CANCELLED')

  const completedOrders = orders.filter(o => o.status === 'COMPLETED')
  const thisMonthOrders = completedOrders.filter(o => new Date(o.eventDate) >= startOfMonth)
  const thisYearOrders = completedOrders.filter(o => new Date(o.eventDate) >= startOfYear)

  const earnedThisMonth = thisMonthOrders.reduce((s, o) => s + o.totalPrice, 0)
  const earnedThisYear = thisYearOrders.reduce((s, o) => s + o.totalPrice, 0)

  const cards = [
    { label: 'Ganhos este mes', value: 'R$ ' + fmt(earnedThisMonth), sub: thisMonthOrders.length + ' pedido(s)', color: 'text-orange-400' },
    { label: 'Ganhos este ano', value: 'R$ ' + fmt(earnedThisYear), sub: thisYearOrders.length + ' pedido(s)', color: 'text-green-400' },
    { label: 'Proximos eventos', value: String(upcomingOrders.length), sub: 'confirmados', color: 'text-blue-400' },
    { label: 'Avaliacao media', value: (profile?.rating ?? 0).toFixed(1) + ' / 5', sub: profile?.totalOrders + ' total', color: 'text-yellow-400' },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
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

      {/* Disponibilidade toggle */}
      <div className={`rounded-xl border px-5 py-4 mb-6 flex items-center justify-between gap-4 ${
        profile?.available
          ? 'bg-green-500/10 border-green-500/30'
          : 'bg-gray-900 border-gray-800'
      }`}>
        <div>
          <p className={`font-semibold text-sm ${profile?.available ? 'text-green-300' : 'text-gray-300'}`}>
            {profile?.available ? 'Disponivel para novos eventos' : 'Indisponivel no momento'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {profile?.available
              ? 'Clientes podem te encontrar e enviar pedidos.'
              : 'Voce nao aparece nas buscas de clientes.'}
          </p>
        </div>
        <button
          onClick={handleToggleAvailability}
          disabled={togglingAvail}
          className={`relative w-14 h-7 rounded-full transition-colors shrink-0 disabled:opacity-60 ${profile?.available ? 'bg-green-500' : 'bg-gray-700'}`}
        >
          <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${profile?.available ? 'translate-x-8' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* Novos Eventos (PENDING) */}
      {pendingOrders.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <h2 className="font-semibold text-orange-300">Novos Eventos — aguardando sua resposta ({pendingOrders.length})</h2>
          </div>
          <div className="space-y-3">
            {pendingOrders.map(o => (
              <div key={o.id} className="bg-gray-900 border border-orange-500/30 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="font-medium text-white">{o.customer?.name ?? 'Cliente'}</p>
                    <p className="text-sm text-gray-400 mt-0.5">{fmtDate(o.eventDate)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {o.eventAddress} · {o.guestCount} convidado{o.guestCount !== 1 ? 's' : ''} · {o.eventHours}h
                      {o.boutique ? ` · Acougue: ${o.boutique.name}` : ''}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-black text-orange-400">R$ {fmt(o.totalPrice)}</p>
                    <p className="text-xs text-gray-600 font-mono">#{o.id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(o.id)}
                    disabled={actionLoading === o.id + '-accept' || actionLoading === o.id + '-reject'}
                    className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                  >
                    {actionLoading === o.id + '-accept' ? 'Aceitando...' : 'Aceitar evento'}
                  </button>
                  <button
                    onClick={() => handleReject(o.id)}
                    disabled={actionLoading === o.id + '-accept' || actionLoading === o.id + '-reject'}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-300 text-sm font-semibold py-2 rounded-lg transition-colors"
                  >
                    {actionLoading === o.id + '-reject' ? 'Recusando...' : 'Recusar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {cards.map(c => (
          <div key={c.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1 leading-tight">{c.label}</p>
            <p className={'text-xl font-bold ' + c.color}>{c.value}</p>
            <p className="text-xs text-gray-600 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Agenda — próximos eventos confirmados */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="font-semibold text-sm">Agenda — Proximos Eventos</h2>
          <span className="text-xs text-gray-500">{upcomingOrders.length} confirmado{upcomingOrders.length !== 1 ? 's' : ''}</span>
        </div>
        {upcomingOrders.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">Nenhum evento confirmado na agenda.</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {upcomingOrders.map(o => {
              const daysUntil = Math.ceil((new Date(o.eventDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
              return (
                <Link key={o.id} href={`/orders/${o.id}`} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-gray-800/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`shrink-0 text-center px-2 py-1 rounded-lg ${daysUntil <= 1 ? 'bg-orange-500/20' : 'bg-blue-500/20'}`}>
                      <p className={`text-xl font-black leading-none ${daysUntil <= 1 ? 'text-orange-400' : 'text-blue-400'}`}>{daysUntil <= 0 ? 'Hj' : daysUntil === 1 ? '1d' : daysUntil + 'd'}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{o.customer?.name ?? 'Cliente'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{fmtDate(o.eventDate)} · {o.guestCount} convidados · {o.eventHours}h</p>
                      <p className="text-xs text-gray-500 truncate">{o.eventAddress}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-orange-400">R$ {fmt(o.totalPrice)}</p>
                    <span className={'text-xs px-2 py-0.5 rounded-full ' + (STATUS_CLASS[o.status] ?? 'bg-gray-700 text-gray-400')}>
                      {STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Aviso jurídico */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-5 py-3 mb-4">
        <p className="text-xs text-yellow-300">
          ⚠️ <strong>Contratos em revisao juridica</strong> — os termos de parceria podem ser atualizados antes do lancamento oficial da plataforma.
        </p>
      </div>

      {/* Card do contrato */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm text-gray-300 uppercase tracking-wide">Meu Contrato</h2>
          {contract && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              contract.status === 'ACCEPTED' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {contract.status === 'ACCEPTED' ? 'Aceito' : 'Pendente de assinatura'}
            </span>
          )}
        </div>
        {contract ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Vigencia</p>
                <p className="text-white font-medium">{contract.durationMonths} meses</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Gerado em</p>
                <p className="text-white font-medium">{new Date(contract.generatedAt).toLocaleDateString('pt-BR')}</p>
              </div>
              {contract.acceptedAt && (
                <div>
                  <p className="text-gray-500 text-xs">Aceito em</p>
                  <p className="text-white font-medium">{new Date(contract.acceptedAt).toLocaleDateString('pt-BR')}</p>
                </div>
              )}
            </div>
            <button
              onClick={async () => {
                const res = await fetch(BASE + '/contracts/' + contract.id, { headers: { Authorization: 'Bearer ' + getToken() } })
                if (res.ok) { const c = await res.json(); setContractText(c.contractText); setShowContractText(true) }
              }}
              className="mt-2 text-sm text-orange-400 hover:text-orange-300 underline"
            >
              Visualizar contrato
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Nenhum contrato gerado ainda. Complete o cadastro para gerar seu contrato.</p>
        )}
      </div>

      {/* Modal de leitura do contrato */}
      {showContractText && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <div>
                <span className="font-bold text-orange-400">Contrato de Parceria</span>
                <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full">MINUTA — REV. JURIDICA PENDENTE</span>
              </div>
              <button onClick={() => setShowContractText(false)} className="text-gray-500 hover:text-white text-xl leading-none">&times;</button>
            </div>
            <div className="p-4 bg-yellow-500/10 border-b border-yellow-500/20">
              <p className="text-xs text-yellow-300">Este contrato esta em fase de revisao juridica e pode ser atualizado antes do lancamento oficial.</p>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <pre className="font-mono text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{contractText}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Histórico */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="font-semibold text-sm">Historico</h2>
          <span className="text-xs text-gray-500">{historyOrders.length} pedido(s)</span>
        </div>
        {historyOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            Nenhum historico ainda.
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {historyOrders.slice(0, 20).map(o => (
              <Link key={o.id} href={`/orders/${o.id}`} className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-gray-800/30 transition-colors">
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
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
