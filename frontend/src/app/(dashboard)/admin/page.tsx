'use client'
import { API_URL } from '@/lib/api'
import { useEffect, useState } from 'react'
import Link from 'next/link'


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
  ordersToday: number
  revenueToday: number
  usersToday: number
  activeOrders: number
  revenueWeek: number
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

interface PendingGrillmaster {
  id: string
  bio: string
  pricePerHour: number
  city: string
  state: string
  experience: number
  isChancelado: boolean
  uniformSent: boolean
  uniformSentAt?: string
  certifiedAt?: string
  trainingModules: number[]
  photoUrl?: string
  galleryUrls?: string[]
  instagram?: string
  churrascoStyle?: string
  user: { name: string; email: string; phone?: string }
}

interface PendingBoutique {
  id: string
  name: string
  description?: string
  city: string
  state: string
  address?: string
  phone?: string
  instagram?: string
  openingHours?: string
  deliveryOrPickup?: string
  pixKey?: string
  logoUrl?: string
  facadeUrl?: string
  galleryUrls?: string[]
  user: { name: string; email: string; phone?: string }
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

interface AdminContract {
  id: string
  partnerId: string
  partnerType: string
  partnerName: string
  partnerEmail: string
  partnerDocument: string
  durationMonths: number
  status: string
  acceptedAt: string | null
  generatedAt: string
  contractText: string
}

const TEAM_JOTA_CERT = 'TC-FUNDADOR-001'

interface TeamJota {
  id: string
  bio: string
  experience: number
  pricePerHour: number
  city: string
  state: string
  specialties: string
  available: boolean
  photoUrl: string
  churrascoStyle: string
  bringsEquipment: boolean
  minGuests: number
  maxGuests: number
  instagram: string
  rating: number
  totalOrders: number
  certificationCode: string
  user: { name: string; email: string }
}

interface ScheduleDay {
  id: string
  date: string
  available: boolean
}

type Tab = 'stats' | 'orders' | 'pending' | 'financeiro' | 'contracts' | 'equipe' | 'leads' | 'metricas'

interface AdvancedMetrics {
  funnel: { total: number; confirmed: number; completed: number; confirmRate: number; completeRate: number }
  revenueByDay: Record<string, number>
  ordersByHour: { hour: number; count: number }[]
  topGms: { id: string; name: string; rating: number; totalOrders: number; acceptedOrders: number; acceptRate: number }[]
}

interface DemandForecast {
  byDayOfWeek: { day: string; count: number; revenue: number }[]
  byHour: { hour: number; count: number }[]
  trendVsLastMonth: number
  next14Days: { date: string; dayName: string; expectedOrders: number; confidence: string }[]
  narrative: string
  totalOrders90d: number
}

interface Lead {
  id: string
  phone: string
  name: string | null
  boutique: string | null
  neighborhood: string | null
  status: string
  source: string
  followUpSent: boolean
  createdAt: string
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [pendingGrillmasters, setPendingGrillmasters] = useState<PendingGrillmaster[]>([])
  const [pendingBoutiques, setPendingBoutiques] = useState<PendingBoutique[]>([])
  const [gmApproveState, setGmApproveState] = useState<Record<string, GmApproveState>>({})
  const [contracts, setContracts] = useState<AdminContract[]>([])
  const [viewContract, setViewContract] = useState<AdminContract | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('stats')
  const [leads, setLeads] = useState<Lead[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [zapiStatus, setZapiStatus] = useState<{ status: string; connected?: boolean; phone?: string | null } | null>(null)
  const [advancedMetrics, setAdvancedMetrics] = useState<AdvancedMetrics | null>(null)
  const [demandForecast, setDemandForecast] = useState<DemandForecast | null>(null)
  const [loadingMetrics, setLoadingMetrics] = useState(false)

  // ── TEAM JOTA ──────────────────────────────────────────────
  const [teamJota, setTeamJota] = useState<TeamJota | null>(null)
  const [tjSchedule, setTjSchedule] = useState<ScheduleDay[]>([])
  const [tjForm, setTjForm] = useState<Partial<TeamJota>>({})
  const [tjSaving, setTjSaving] = useState(false)
  const [tjScheduleMonth, setTjScheduleMonth] = useState(() => {
    const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }
  })
  const [tjTogglingDay, setTjTogglingDay] = useState<string | null>(null)

  async function fetchAll(silent = false) {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    const h = { Authorization: 'Bearer ' + getToken() }
    try {
      const [s, o, pg, pb, c, allGms, lds] = await Promise.all([
        fetch(API_URL + '/admin/stats', { headers: h }).then(r => r.json()),
        fetch(API_URL + '/admin/orders', { headers: h }).then(r => r.json()),
        fetch(API_URL + '/admin/grillmasters/pending', { headers: h }).then(r => r.json()),
        fetch(API_URL + '/admin/boutiques/pending', { headers: h }).then(r => r.json()),
        fetch(API_URL + '/contracts/all', { headers: h }).then(r => r.ok ? r.json() : []),
        fetch(API_URL + '/admin/grillmasters', { headers: h }).then(r => r.ok ? r.json() : []),
        fetch(API_URL + '/admin/leads', { headers: h }).then(r => r.ok ? r.json() : []),
      ])
      setStats(s)
      setOrders(Array.isArray(o) ? o : o.orders || [])
      const gms: PendingGrillmaster[] = Array.isArray(pg) ? pg : []
      setPendingGrillmasters(gms)
      const init: Record<string, GmApproveState> = {}
      gms.forEach(g => { init[g.id] = { isChancelado: false, pricePerHour: g.pricePerHour } })
      setGmApproveState(prev => ({ ...init, ...prev }))
      setPendingBoutiques(Array.isArray(pb) ? pb : [])
      setContracts(Array.isArray(c) ? c : [])
      setLeads(Array.isArray(lds) ? lds : [])
      setLastUpdated(new Date())

      // Z-API health (não bloqueia o resto)
      fetch(API_URL + '/admin/zapi-status', { headers: h })
        .then(r => r.ok ? r.json() : null)
        .then(z => { if (z) setZapiStatus(z) })
        .catch(() => {})

      // Team Jota
      const tj = (Array.isArray(allGms) ? allGms : []).find((g: any) => g.certificationCode === TEAM_JOTA_CERT)
      if (tj) {
        setTeamJota(tj)
        setTjForm({
          bio: tj.bio, experience: tj.experience, pricePerHour: tj.pricePerHour,
          specialties: tj.specialties, churrascoStyle: tj.churrascoStyle,
          bringsEquipment: tj.bringsEquipment, minGuests: tj.minGuests, maxGuests: tj.maxGuests,
          instagram: tj.instagram, available: tj.available,
        })
        fetch(API_URL + '/admin/grillmasters/' + tj.id + '/schedule', { headers: h })
          .then(r => r.ok ? r.json() : [])
          .then(sc => setTjSchedule(Array.isArray(sc) ? sc : []))
          .catch(() => {})
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function saveTjProfile() {
    if (!teamJota) return
    setTjSaving(true)
    try {
      const res = await fetch(API_URL + '/admin/grillmasters/' + teamJota.id + '/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
        body: JSON.stringify(tjForm),
      })
      if (res.ok) {
        const updated = await res.json()
        setTeamJota(prev => prev ? { ...prev, ...updated } : prev)
      }
    } finally { setTjSaving(false) }
  }

  async function toggleTjDay(dateStr: string) {
    if (!teamJota || tjTogglingDay) return
    setTjTogglingDay(dateStr)
    try {
      const res = await fetch(API_URL + '/admin/grillmasters/' + teamJota.id + '/schedule/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
        body: JSON.stringify({ date: dateStr }),
      })
      if (res.ok) {
        const result = await res.json()
        if (result.deleted) {
          setTjSchedule(prev => prev.filter(d => d.date.startsWith(dateStr)))
        } else {
          setTjSchedule(prev => {
            const filtered = prev.filter(d => !d.date.startsWith(dateStr))
            return [...filtered, result]
          })
        }
        // Refresh schedule
        const h = { Authorization: 'Bearer ' + getToken() }
        fetch(API_URL + '/admin/grillmasters/' + teamJota.id + '/schedule', { headers: h })
          .then(r => r.ok ? r.json() : [])
          .then(sc => setTjSchedule(Array.isArray(sc) ? sc : []))
      }
    } finally { setTjTogglingDay(null) }
  }

  async function toggleTjAvailable() {
    if (!teamJota) return
    const newVal = !teamJota.available
    const res = await fetch(API_URL + '/admin/grillmasters/' + teamJota.id + '/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
      body: JSON.stringify({ available: newVal }),
    })
    if (res.ok) {
      setTeamJota(prev => prev ? { ...prev, available: newVal } : prev)
      setTjForm(prev => ({ ...prev, available: newVal }))
    }
  }

  useEffect(() => {
    fetchAll()
    const interval = setInterval(() => fetchAll(true), 30000)
    return () => clearInterval(interval)
  }, [])

  async function updateStatus(id: string, status: string) {
    await fetch(API_URL + '/orders/' + id + '/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
      body: JSON.stringify({ status }),
    })
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
  }

  async function approveGrillmaster(id: string) {
    const state = gmApproveState[id] || { isChancelado: false, pricePerHour: 0 }
    const res = await fetch(API_URL + '/admin/grillmasters/' + id + '/approve', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
      body: JSON.stringify({ isChancelado: state.isChancelado, pricePerHour: state.pricePerHour }),
    })
    if (res.ok) setPendingGrillmasters(prev => prev.filter(g => g.id !== id))
  }

  async function rejectGrillmaster(id: string) {
    const res = await fetch(API_URL + '/admin/grillmasters/' + id + '/reject', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + getToken() },
    })
    if (res.ok) setPendingGrillmasters(prev => prev.filter(g => g.id !== id))
  }

  async function markUniformSent(grillmasterId: string) {
    const res = await fetch(API_URL + '/admin/grillmasters/' + grillmasterId + '/uniform', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + getToken() },
    })
    if (res.ok) {
      setPendingGrillmasters(prev => prev.map(g =>
        g.id === grillmasterId ? { ...g, uniformSent: true, uniformSentAt: new Date().toISOString() } : g
      ))
    }
  }

  async function approveBoutique(id: string) {
    const res = await fetch(API_URL + '/admin/boutiques/' + id + '/approve', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + getToken() },
    })
    if (res.ok) setPendingBoutiques(prev => prev.filter(b => b.id !== id))
  }

  async function rejectBoutique(id: string) {
    const res = await fetch(API_URL + '/admin/boutiques/' + id + '/reject', {
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Painel Admin</h1>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-500">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
              Atualizado às {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {refreshing ? '↻' : 'Atualizar'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {([
          { key: 'stats', label: 'Resumo' },
          { key: 'orders', label: 'Pedidos (' + orders.length + ')' },
          { key: 'pending', label: pendingCount > 0 ? 'Pendentes (' + pendingCount + ')' : 'Pendentes' },
          { key: 'financeiro', label: 'Financeiro' },
          { key: 'contracts', label: 'Contratos (' + contracts.length + ')' },
          { key: 'equipe', label: 'Minha Equipe' },
          { key: 'leads', label: leads.length > 0 ? 'Leads (' + leads.length + ')' : 'Leads' },
          { key: 'metricas', label: '📊 Métricas IA' },
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
        <div className="space-y-4">
          {/* Today highlights */}
          <div className="bg-gradient-to-r from-orange-900/20 to-gray-900 border border-orange-500/20 rounded-2xl p-5">
            <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-4">Hoje</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Pedidos hoje</p>
                <p className="text-3xl font-black text-white">{stats.ordersToday}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Receita hoje</p>
                <p className="text-2xl font-black text-green-400">R$ {(stats.revenueToday ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Novos usuários</p>
                <p className="text-3xl font-black text-white">{stats.usersToday}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Pedidos ativos</p>
                <p className="text-3xl font-black text-orange-400">{stats.activeOrders}</p>
              </div>
            </div>
          </div>

          {/* All-time stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-900 rounded-xl p-5">
              <p className="text-gray-400 text-sm">Total Pedidos</p>
              <p className="text-3xl font-bold text-orange-400">{stats.totalOrders}</p>
              <p className="text-xs text-gray-600 mt-1">R$ {(stats.revenueWeek ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} últimos 7 dias</p>
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
              <p className="text-3xl font-bold text-green-400">R$ {(stats.totalRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <Link
              href="/admin/repasses"
              className="bg-gray-900 rounded-xl p-5 border border-orange-500/20 hover:border-orange-500/50 hover:bg-gray-800 transition-all group"
            >
              <p className="text-gray-400 text-sm group-hover:text-orange-400 transition-colors">Repasses Semanais</p>
              <p className="text-lg font-bold text-orange-400 mt-1">Gerenciar →</p>
              <p className="text-xs text-gray-600 mt-1">Pagamentos para parceiros</p>
            </Link>
            <Link
              href="/admin/onboarding-acougue"
              className="bg-gray-900 rounded-xl p-5 border border-green-500/20 hover:border-green-500/50 hover:bg-gray-800 transition-all group"
            >
              <p className="text-gray-400 text-sm group-hover:text-green-400 transition-colors">Onboarding Açougue</p>
              <p className="text-lg font-bold text-green-400 mt-1">Roteiro →</p>
              <p className="text-xs text-gray-600 mt-1">Script de visita presencial</p>
            </Link>
          </div>

          {/* Z-API Status */}
          {zapiStatus && (
            <div className={[
              'rounded-xl p-4 border flex items-center justify-between gap-4',
              zapiStatus.status === 'not_configured' ? 'bg-gray-900 border-gray-700' :
              zapiStatus.status === 'ok' && zapiStatus.connected ? 'bg-green-900/20 border-green-500/30' :
              'bg-red-900/20 border-red-500/30',
            ].join(' ')}>
              <div className="flex items-center gap-3">
                <span className={[
                  'inline-block w-2.5 h-2.5 rounded-full shrink-0',
                  zapiStatus.status === 'not_configured' ? 'bg-gray-600' :
                  zapiStatus.status === 'ok' && zapiStatus.connected ? 'bg-green-400 animate-pulse' :
                  'bg-red-400',
                ].join(' ')} />
                <div>
                  <p className="text-sm font-semibold text-white">WhatsApp (Z-API)</p>
                  <p className="text-xs text-gray-500">
                    {zapiStatus.status === 'not_configured' ? 'Não configurado — ZAPI_INSTANCE/ZAPI_TOKEN ausentes' :
                     zapiStatus.status === 'ok' && zapiStatus.connected ? `Conectado${zapiStatus.phone ? ' · ' + zapiStatus.phone : ''}` :
                     zapiStatus.status === 'ok' && !zapiStatus.connected ? 'Instância offline — reconecte no painel Z-API' :
                     'Erro ao verificar: ' + (zapiStatus as any).message}
                  </p>
                </div>
              </div>
              {zapiStatus.status === 'ok' && !zapiStatus.connected && (
                <a
                  href="https://app.z-api.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0"
                >
                  Reconectar
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'orders' && (
        <div className="space-y-3">
          {orders.length === 0 && <p className="text-gray-400">Nenhum pedido.</p>}
          {orders.map(order => {
            const isOpen = expandedOrderId === order.id
            return (
              <div key={order.id} className="bg-gray-900 rounded-xl overflow-hidden">
                {/* Linha resumo — clicável */}
                <button
                  onClick={() => setExpandedOrderId(isOpen ? null : order.id)}
                  className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{order.customer?.name || 'Cliente'}</p>
                      <span className={"text-xs text-white px-2 py-0.5 rounded-full " + (STATUS_COLOR[order.status] || 'bg-gray-500')}>
                        {STATUS_LABEL[order.status] || order.status}
                      </span>
                      {order.paymentStatus === 'PAID' && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Pago</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(order.eventDate).toLocaleDateString('pt-BR')} · {order.guestCount} pessoas · R$ {(order.totalPrice ?? 0).toFixed(2)}
                    </p>
                  </div>
                  <span className="text-gray-500 text-sm">{isOpen ? '▲' : '▼'}</span>
                </button>

                {/* Detalhe expandido */}
                {isOpen && (
                  <div className="border-t border-gray-800 px-4 pb-4 pt-3 space-y-4">
                    {/* Cliente */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Cliente</p>
                      <p className="text-sm text-white">{order.customer?.name}</p>
                      <p className="text-xs text-gray-400">{order.customer?.email}</p>
                      {order.customer?.phone && <p className="text-xs text-gray-400">📞 {order.customer.phone}</p>}
                    </div>

                    {/* Evento */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Evento</p>
                      <p className="text-sm text-white">📍 {order.eventAddress}</p>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                        <span>📅 {new Date(order.eventDate).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</span>
                        <span>⏱ {order.eventHours}h</span>
                        <span>👥 {order.guestCount} convidados</span>
                      </div>
                      {order.notes && <p className="text-xs text-yellow-300 mt-1">📝 {order.notes}</p>}
                    </div>

                    {/* Parceiros */}
                    {(order.grillmaster || order.boutique) && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Parceiros</p>
                        {order.grillmaster?.user && (
                          <p className="text-xs text-gray-300">🔥 Churrasqueiro: {order.grillmaster.user.name}{order.grillmaster.user.phone ? ` · ${order.grillmaster.user.phone}` : ''}</p>
                        )}
                        {order.boutique && (
                          <p className="text-xs text-gray-300">🥩 Açougue: {order.boutique.name}</p>
                        )}
                      </div>
                    )}

                    {/* Itens */}
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

                    {/* Financeiro */}
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

                    {/* Ações */}
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-xs text-gray-600">ID: {order.id.slice(0, 8)}...</p>
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
                        <p className="text-xs text-gray-400 mb-0.5">{g.user.email}</p>
                        {g.user.phone && <p className="text-xs text-gray-400 mb-1">📞 {g.user.phone}</p>}
                        <p className="text-sm text-gray-300 line-clamp-2">{g.bio}</p>
                        <div className="flex gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                          <span>{g.city}, {g.state}</span>
                          <span>{g.experience} anos exp.</span>
                          {g.churrascoStyle && <span className="text-orange-400">{g.churrascoStyle}</span>}
                          {g.instagram && <span className="text-pink-400">@{g.instagram}</span>}
                        </div>
                        {/* Photo mini-grid */}
                        {(g.photoUrl || (g.galleryUrls && g.galleryUrls.length > 0)) && (
                          <div className="flex gap-1.5 mt-2">
                            {g.photoUrl && (
                              <a href={g.photoUrl} target="_blank" rel="noopener noreferrer">
                                <img src={g.photoUrl} alt="foto" className="w-10 h-10 rounded-lg object-cover border border-gray-700 hover:opacity-80" />
                              </a>
                            )}
                            {(g.galleryUrls ?? []).slice(0, 4).map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                <img src={url} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-700 hover:opacity-80" />
                              </a>
                            ))}
                          </div>
                        )}
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
                      <div className="flex items-center gap-2 ml-auto">
                        {g.trainingModules?.length === 4 && (
                          <span className="text-xs text-green-400 font-medium">Treinamento ✓</span>
                        )}
                        <button
                          onClick={() => markUniformSent(g.id)}
                          disabled={g.uniformSent}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            g.uniformSent
                              ? 'bg-green-500/20 text-green-400 cursor-default'
                              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          }`}
                        >
                          {g.uniformSent ? '✓ Uniforme enviado' : 'Marcar uniforme enviado'}
                        </button>
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
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-lg">{b.name}</p>
                      <p className="text-xs text-gray-400">{b.user.name} &middot; {b.user.email}</p>
                      {(b.user.phone || b.phone) && (
                        <p className="text-xs text-gray-400">📞 {b.phone || b.user.phone}</p>
                      )}
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

                  {b.description && <p className="text-sm text-gray-300 mb-2">{b.description}</p>}

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-400 mb-2">
                    <span>📍 {b.address ? `${b.address}, ` : ''}{b.city}, {b.state}</span>
                    {b.instagram && <span className="text-pink-400">📸 @{b.instagram}</span>}
                    {b.openingHours && <span>🕐 {b.openingHours}</span>}
                    {b.deliveryOrPickup && <span>🚚 {b.deliveryOrPickup}</span>}
                    {b.pixKey && <span>💸 Pix: {b.pixKey}</span>}
                  </div>

                  {/* Fotos */}
                  {(b.logoUrl || b.facadeUrl || (b.galleryUrls && b.galleryUrls.length > 0)) && (
                    <div className="flex gap-1.5 flex-wrap">
                      {b.logoUrl && (
                        <a href={b.logoUrl} target="_blank" rel="noopener noreferrer" title="Logo">
                          <img src={b.logoUrl} alt="logo" className="w-16 h-16 rounded-lg object-cover border border-gray-700 hover:opacity-80" />
                        </a>
                      )}
                      {b.facadeUrl && (
                        <a href={b.facadeUrl} target="_blank" rel="noopener noreferrer" title="Fachada">
                          <img src={b.facadeUrl} alt="fachada" className="w-24 h-16 rounded-lg object-cover border border-gray-700 hover:opacity-80" />
                        </a>
                      )}
                      {(b.galleryUrls ?? []).map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt="" className="w-16 h-16 rounded-lg object-cover border border-gray-700 hover:opacity-80" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'equipe' && (
        <div className="space-y-6">
          {!teamJota ? (
            <p className="text-gray-400">Team Jota não encontrado (certificationCode TC-FUNDADOR-001).</p>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <img src={teamJota.photoUrl} alt="Team Jota" className="w-16 h-16 rounded-full object-cover border-2 border-orange-500" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-white text-lg">{teamJota.user?.name}</h2>
                    <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full">TC-FUNDADOR-001</span>
                    <span className="text-xs text-yellow-400">⭐ {teamJota.rating.toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-gray-400">{teamJota.user?.email}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{teamJota.city}, {teamJota.state} · {teamJota.totalOrders} pedidos</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={toggleTjAvailable}
                    className={'px-4 py-2 rounded-xl font-bold text-sm transition-colors ' + (teamJota.available ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300')}
                  >
                    {teamJota.available ? '🟢 Online — aceita pedidos' : '⚫ Offline — fora do ar'}
                  </button>
                  <p className="text-xs text-gray-600">{teamJota.available ? 'Aparece nas buscas' : 'Não aparece nas buscas'}</p>
                </div>
              </div>

              {/* ── AGENDA ─────────────────────────────────── */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">📅 Agenda — dias disponíveis</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTjScheduleMonth(prev => {
                        let m = prev.month - 1; let y = prev.year
                        if (m < 0) { m = 11; y-- }
                        return { year: y, month: m }
                      })}
                      className="text-gray-400 hover:text-white px-2 py-1 rounded-lg bg-gray-800 text-sm"
                    >‹</button>
                    <span className="text-sm text-gray-300 font-medium w-28 text-center">
                      {new Date(tjScheduleMonth.year, tjScheduleMonth.month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                      onClick={() => setTjScheduleMonth(prev => {
                        let m = prev.month + 1; let y = prev.year
                        if (m > 11) { m = 0; y++ }
                        return { year: y, month: m }
                      })}
                      className="text-gray-400 hover:text-white px-2 py-1 rounded-lg bg-gray-800 text-sm"
                    >›</button>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mb-3">Clique em um dia para marcar/desmarcar como disponível. Dias verdes = disponíveis para pedidos.</p>

                {(() => {
                  const { year, month } = tjScheduleMonth
                  const firstDay = new Date(year, month, 1).getDay()
                  const daysInMonth = new Date(year, month + 1, 0).getDate()
                  const today = new Date(); today.setHours(0,0,0,0)

                  const availableDates = new Set(
                    tjSchedule
                      .filter(s => s.available)
                      .map(s => s.date.slice(0, 10))
                  )

                  const cells: (number | null)[] = [
                    ...Array(firstDay).fill(null),
                    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
                  ]

                  return (
                    <div>
                      <div className="grid grid-cols-7 gap-1 mb-1">
                        {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
                          <div key={d} className="text-center text-xs text-gray-500 font-medium py-1">{d}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {cells.map((day, i) => {
                          if (!day) return <div key={i} />
                          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                          const cellDate = new Date(year, month, day)
                          const isPast = cellDate < today
                          const isAvailable = availableDates.has(dateStr)
                          const isToggling = tjTogglingDay === dateStr

                          return (
                            <button
                              key={i}
                              disabled={isPast || !!tjTogglingDay}
                              onClick={() => toggleTjDay(dateStr)}
                              className={[
                                'rounded-lg py-2 text-sm font-medium transition-all',
                                isPast ? 'text-gray-700 cursor-default' :
                                isToggling ? 'bg-orange-500/40 text-white animate-pulse' :
                                isAvailable ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-900/30' :
                                'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white',
                              ].join(' ')}
                            >
                              {day}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}

                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> Disponível</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-800 inline-block" /> Sem dados</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-700 opacity-40 inline-block" /> Passado</span>
                </div>
              </div>

              {/* ── EDITAR PERFIL ──────────────────────────── */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="font-semibold text-white mb-4">✏️ Editar perfil</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Bio</label>
                    <textarea
                      rows={4}
                      value={tjForm.bio ?? ''}
                      onChange={e => setTjForm(p => ({ ...p, bio: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm resize-none focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Especialidades (separadas por vírgula)</label>
                    <input
                      value={tjForm.specialties ?? ''}
                      onChange={e => setTjForm(p => ({ ...p, specialties: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Estilo de churrasco</label>
                    <input
                      value={tjForm.churrascoStyle ?? ''}
                      onChange={e => setTjForm(p => ({ ...p, churrascoStyle: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Preço/hora (R$)</label>
                      <input type="number" value={tjForm.pricePerHour ?? 0}
                        onChange={e => setTjForm(p => ({ ...p, pricePerHour: +e.target.value }))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Mín. convidados</label>
                      <input type="number" value={tjForm.minGuests ?? 0}
                        onChange={e => setTjForm(p => ({ ...p, minGuests: +e.target.value }))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Máx. convidados</label>
                      <input type="number" value={tjForm.maxGuests ?? 0}
                        onChange={e => setTjForm(p => ({ ...p, maxGuests: +e.target.value }))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Anos de exp.</label>
                      <input type="number" value={tjForm.experience ?? 0}
                        onChange={e => setTjForm(p => ({ ...p, experience: +e.target.value }))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Instagram</label>
                      <input
                        value={tjForm.instagram ?? ''}
                        onChange={e => setTjForm(p => ({ ...p, instagram: e.target.value }))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                        placeholder="@techchurras"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer pb-2">
                        <input type="checkbox"
                          checked={tjForm.bringsEquipment ?? false}
                          onChange={e => setTjForm(p => ({ ...p, bringsEquipment: e.target.checked }))}
                          className="accent-orange-500 w-4 h-4"
                        />
                        <span className="text-sm text-gray-300">Leva equipamento</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={saveTjProfile}
                      disabled={tjSaving}
                      className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
                    >
                      {tjSaving ? 'Salvando...' : 'Salvar alterações'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'financeiro' && (() => {
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
            {/* Cards de resumo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-900 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Receita total (pago)</p>
                <p className="text-2xl font-black text-green-400">R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">A receber (pedidos ativos)</p>
                <p className="text-2xl font-black text-orange-400">R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Comissão acumulada (7%)</p>
                <p className="text-2xl font-black text-yellow-400">R$ {commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Pedidos pagos</p>
                <p className="text-2xl font-black text-white">{paid.length}</p>
              </div>
            </div>

            {/* Mês a mês */}
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

            {/* Tabela de pedidos pagos */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-gray-300">Pedidos recebidos</h3>
                <a href="/admin/repasses" className="text-xs text-orange-400 hover:text-orange-300">Gerenciar repasses →</a>
              </div>
              {paid.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhum pedido pago ainda.</p>
              ) : (
                <div className="bg-gray-900 rounded-xl overflow-hidden">
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

            {/* Pedidos pendentes de pagamento */}
            {pending.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm text-gray-300 mb-3">A receber — pedidos ativos sem pagamento confirmado</h3>
                <div className="space-y-2">
                  {pending.map(o => (
                    <div key={o.id} className="bg-gray-900 rounded-xl px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white">{o.customer?.name}</p>
                        <p className="text-xs text-gray-500">{new Date(o.eventDate).toLocaleDateString('pt-BR')} · {STATUS_LABEL[o.status]}</p>
                      </div>
                      <span className="text-orange-400 font-bold">R$ {(o.totalPrice ?? 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })()}

      {tab === 'contracts' && (
        <div>

          {contracts.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum contrato gerado até o momento.</p>
          ) : (
            <div className="space-y-3">
              {contracts.map(c => (
                <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{c.partnerName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${c.partnerType === 'BOUTIQUE' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {c.partnerType === 'BOUTIQUE' ? 'Açougue' : 'Churrasqueiro'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'ACCEPTED' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {c.status === 'ACCEPTED' ? 'Aceito' : 'Pendente'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{c.partnerEmail} · {c.partnerDocument}</p>
                    <p className="text-xs text-gray-600">
                      Vigência: {c.durationMonths} meses · Gerado: {new Date(c.generatedAt).toLocaleDateString('pt-BR')}
                      {c.acceptedAt && ` · Aceito: ${new Date(c.acceptedAt).toLocaleDateString('pt-BR')}`}
                    </p>
                  </div>
                  <button
                    onClick={() => setViewContract(c)}
                    className="shrink-0 text-xs text-orange-400 hover:text-orange-300 border border-orange-900 px-3 py-1.5 rounded-lg"
                  >
                    Ver
                  </button>
                </div>
              ))}
            </div>
          )}

          {viewContract && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
              <div className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between p-5 border-b border-gray-800">
                  <div>
                    <span className="font-bold text-orange-400">{viewContract.partnerName}</span>
                    <span className="ml-2 text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">v1.0 — Aprovado</span>
                  </div>
                  <button onClick={() => setViewContract(null)} className="text-gray-500 hover:text-white text-xl leading-none">&times;</button>
                </div>
                <div className="flex-1 overflow-y-auto p-5">
                  <pre className="font-mono text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{viewContract.contractText}</pre>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {tab === 'leads' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-lg">Leads WhatsApp</h2>
              <p className="text-xs text-gray-500 mt-0.5">Captados pelo bot de captação de açougues</p>
            </div>
            <button
              onClick={async () => {
                const h = { Authorization: 'Bearer ' + getToken(), 'Content-Type': 'application/json' }
                if (!confirm('Rodar migração trialEndsAt para boutiques aprovadas sem trial?')) return
                const r = await fetch(API_URL + '/admin/migrate/trial-ends-at', { method: 'POST', headers: h })
                const d = await r.json()
                alert(`Migração OK: ${d.updated} boutiques atualizadas`)
              }}
              className="text-xs text-gray-500 hover:text-gray-300 border border-gray-700 px-3 py-1.5 rounded-lg"
            >
              Migrar trialEndsAt
            </button>
          </div>

          {leads.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum lead captado ainda. O bot vai popular aqui automaticamente.</p>
          ) : (
            <div className="space-y-2">
              {leads.map(lead => {
                const statusColors: Record<string, string> = {
                  new:       'bg-gray-700 text-gray-300',
                  qualified: 'bg-orange-500/20 text-orange-400',
                  contacted: 'bg-blue-500/20 text-blue-400',
                  converted: 'bg-green-500/20 text-green-400',
                  dead:      'bg-red-500/20 text-red-400',
                }
                const statusLabels: Record<string, string> = {
                  new: 'Novo', qualified: 'Qualificado', contacted: 'Contatado', converted: 'Convertido', dead: 'Frio',
                }
                return (
                  <div key={lead.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{lead.name || 'Sem nome'}</span>
                        {lead.boutique && <span className="text-orange-400 text-xs">{lead.boutique}</span>}
                        {lead.neighborhood && <span className="text-gray-500 text-xs">{lead.neighborhood}</span>}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[lead.status] || 'bg-gray-700 text-gray-300'}`}>
                          {statusLabels[lead.status] || lead.status}
                        </span>
                        {lead.followUpSent && <span className="text-xs text-blue-400">follow-up enviado</span>}
                      </div>
                      <p className="text-xs text-gray-500">
                        {lead.phone} · {new Date(lead.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                      <a
                        href={`https://wa.me/55${lead.phone.replace(/\D/g, '')}`}
                        target="_blank" rel="noreferrer"
                        className="text-xs text-green-400 hover:text-green-300 border border-green-900 px-2 py-1 rounded"
                      >
                        WhatsApp
                      </a>
                      {(['qualified','contacted','converted','dead'] as const).filter(s => s !== lead.status).map(s => (
                        <button key={s}
                          onClick={async () => {
                            const r = await fetch(API_URL + '/admin/leads/' + lead.id + '/status', {
                              method: 'PATCH',
                              headers: { Authorization: 'Bearer ' + getToken(), 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: s }),
                            })
                            if (r.ok) {
                              const updated = await r.json()
                              setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: updated.status } : l))
                            }
                          }}
                          className="text-xs text-gray-400 hover:text-white border border-gray-700 px-2 py-1 rounded"
                        >
                          {statusLabels[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ───── TAB: Métricas IA ───── */}
      {tab === 'metricas' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">Métricas Avançadas + Previsão IA</h2>
            <button
              onClick={async () => {
                setLoadingMetrics(true)
                const h = { Authorization: 'Bearer ' + getToken() }
                const [adv, fc] = await Promise.all([
                  fetch(API_URL + '/admin/metrics/advanced', { headers: h }).then(r => r.json()).catch(() => null),
                  fetch(API_URL + '/admin/demand-forecast', { headers: h }).then(r => r.json()).catch(() => null),
                ])
                setAdvancedMetrics(adv)
                setDemandForecast(fc)
                setLoadingMetrics(false)
              }}
              disabled={loadingMetrics}
              className="text-sm bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {loadingMetrics ? 'Carregando...' : advancedMetrics ? 'Atualizar' : 'Carregar dados'}
            </button>
          </div>

          {!advancedMetrics && !loadingMetrics && (
            <div className="text-center py-12 text-gray-500">Clique em "Carregar dados" para ver as métricas.</div>
          )}

          {loadingMetrics && (
            <div className="text-center py-12 text-gray-400">Analisando dados com IA... (pode levar alguns segundos)</div>
          )}

          {advancedMetrics && (
            <>
              {/* Funil de conversão */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <p className="text-sm font-semibold text-gray-400 mb-4">Funil de conversão — todos os tempos</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-black text-white">{advancedMetrics.funnel.total}</p>
                    <p className="text-xs text-gray-500 mt-1">Pedidos criados</p>
                  </div>
                  <div>
                    <p className="text-3xl font-black text-blue-400">{advancedMetrics.funnel.confirmed}</p>
                    <p className="text-xs text-gray-500 mt-1">Confirmados ({advancedMetrics.funnel.confirmRate}%)</p>
                  </div>
                  <div>
                    <p className="text-3xl font-black text-green-400">{advancedMetrics.funnel.completed}</p>
                    <p className="text-xs text-gray-500 mt-1">Concluídos ({advancedMetrics.funnel.completeRate}%)</p>
                  </div>
                </div>
              </div>

              {/* Top GMs */}
              {advancedMetrics.topGms.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <p className="text-sm font-semibold text-gray-400 mb-4">Top churrasqueiros — por pedidos</p>
                  <div className="space-y-3">
                    {advancedMetrics.topGms.map((gm, i) => (
                      <div key={gm.id} className="flex items-center gap-3">
                        <span className="text-gray-600 text-sm w-4">{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-white">{gm.name}</p>
                            <span className="text-xs text-gray-500">{gm.acceptRate}% aceite</span>
                          </div>
                          <div className="flex gap-1 mt-1">
                            <div className="h-1.5 rounded-full bg-orange-500" style={{ width: gm.acceptedOrders * 16 + 'px', maxWidth: '100%' }} />
                            <div className="h-1.5 rounded-full bg-gray-700" style={{ width: (gm.totalOrders - gm.acceptedOrders) * 16 + 'px', maxWidth: '100%' }} />
                          </div>
                        </div>
                        <span className="text-xs text-yellow-400">★ {gm.rating}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Previsão de demanda */}
          {demandForecast && (
            <>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-400">Previsão de demanda — próximos 14 dias</p>
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${demandForecast.trendVsLastMonth >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {demandForecast.trendVsLastMonth >= 0 ? '+' : ''}{demandForecast.trendVsLastMonth}% vs mês anterior
                  </span>
                </div>

                {demandForecast.narrative && (
                  <div className="text-sm text-gray-300 whitespace-pre-line leading-relaxed border-l-2 border-orange-500/40 pl-3">
                    {demandForecast.narrative}
                  </div>
                )}

                <div className="grid grid-cols-7 gap-1">
                  {demandForecast.next14Days.map(d => (
                    <div key={d.date} className={`rounded-lg p-2 text-center ${d.expectedOrders >= 2 ? 'bg-orange-500/20 border border-orange-500/30' : 'bg-gray-800'}`}>
                      <p className="text-[10px] text-gray-500">{d.dayName.slice(0, 3)}</p>
                      <p className="text-xs font-bold text-white mt-0.5">{d.expectedOrders.toFixed(1)}</p>
                      <p className={`text-[9px] mt-0.5 ${d.confidence === 'alta' ? 'text-green-400' : d.confidence === 'média' ? 'text-yellow-400' : 'text-gray-600'}`}>
                        {d.confidence}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pedidos por dia da semana */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <p className="text-sm font-semibold text-gray-400 mb-4">Pedidos por dia da semana (90 dias)</p>
                <div className="space-y-2">
                  {demandForecast.byDayOfWeek.map(d => {
                    const max = Math.max(...demandForecast.byDayOfWeek.map(x => x.count), 1)
                    return (
                      <div key={d.day} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-14 shrink-0">{d.day.slice(0, 3)}</span>
                        <div className="flex-1 bg-gray-800 rounded-full h-2">
                          <div className="h-2 rounded-full bg-orange-500" style={{ width: (d.count / max * 100) + '%' }} />
                        </div>
                        <span className="text-xs text-gray-400 w-6 text-right">{d.count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}