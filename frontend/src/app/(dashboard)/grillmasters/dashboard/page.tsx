'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'

const BASE = 'https://tech-churras-production.up.railway.app'

function getToken() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
}

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX = 1200
      const scale = Math.min(1, MAX / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(b => resolve(b ?? file), 'image/jpeg', 0.82)
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

async function uploadImageFile(file: File): Promise<string> {
  const blob = await compressImage(file)
  const fd = new FormData()
  fd.append('file', blob, 'photo.jpg')
  const res = await fetch(BASE + '/upload/image', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + getToken() },
    body: fd,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erro ao fazer upload')
  return data.url as string
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
  notes?: string
  createdAt: string
  customer: { name: string; email: string }
  boutique?: { name: string }
}

interface ScheduleEntry {
  id: string
  date: string
  available: boolean
}

interface GrillmasterProfile {
  id: string
  approved: boolean
  rating: number
  totalOrders: number
  pricePerHour: number
  city: string
  state: string
  isChancelado: boolean
  available: boolean
  bio?: string
  experience: number
  specialties?: string
  photoUrl?: string
  galleryUrls: string[]
  instagram?: string
  videoUrl?: string
  churrascoStyle?: string
  bringsEquipment: boolean
  minGuests?: number
  maxGuests?: number
  trainingModules: number[]
  certificationCode?: string
  certifiedAt?: string
  uniformSent: boolean
}

type Tab = 'eventos' | 'agenda' | 'perfil' | 'treinamento' | 'financeiro'

const TRAINING_MODULES = [
  {
    id: 1,
    title: 'Apresentação Tech Churras',
    desc: 'Nossos valores, missão e o que significa ser um churrasqueiro Tech Churras. Postura profissional, uniforme e pontualidade.',
    videoPlaceholder: 'https://youtube.com/watch?v=PLACEHOLDER_MODULO_1',
  },
  {
    id: 2,
    title: 'Padrão de Cortes e Técnicas',
    desc: 'A qualidade dos cortes nobres que usamos, controle de temperatura, ponto certo da carne e preparo das guarnições.',
    videoPlaceholder: 'https://youtube.com/watch?v=PLACEHOLDER_MODULO_2',
  },
  {
    id: 3,
    title: 'Experiência do Cliente',
    desc: 'Como chegamos no evento, como nos apresentamos ao anfitrião, como interagimos com os convidados e como finalizamos com excelência.',
    videoPlaceholder: 'https://youtube.com/watch?v=PLACEHOLDER_MODULO_3',
  },
  {
    id: 4,
    title: 'Uso da Plataforma',
    desc: 'Como aceitar e recusar pedidos, usar o chat com o cliente, atualizar status do evento e reportar problemas.',
    videoPlaceholder: 'https://youtube.com/watch?v=PLACEHOLDER_MODULO_4',
  },
]

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Aguardando', CONFIRMED: 'Confirmado', IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluido', CANCELLED: 'Cancelado',
}
const STATUS_CLASS: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-400', CONFIRMED: 'bg-blue-500/20 text-blue-400',
  IN_PROGRESS: 'bg-orange-500/20 text-orange-400', COMPLETED: 'bg-green-500/20 text-green-400',
  CANCELLED: 'bg-gray-700 text-gray-400',
}

export default function GrillmasterDashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  const [tab, setTab] = useState<Tab>('eventos')
  const [orders, setOrders] = useState<Order[]>([])
  const [profile, setProfile] = useState<GrillmasterProfile | null>(null)
  const [contract, setContract] = useState<{ id: string; status: string; durationMonths: number; acceptedAt: string | null; generatedAt: string } | null>(null)
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [togglingAvail, setTogglingAvail] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Profile form
  const [profileForm, setProfileForm] = useState<Partial<GrillmasterProfile>>({})
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')
  const [uploadingGallery, setUploadingGallery] = useState(false)

  // Calendar
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }
  })
  const [togglingDate, setTogglingDate] = useState<string | null>(null)

  // Training
  const [checkedModules, setCheckedModules] = useState<Set<number>>(new Set())
  const [certifying, setCertifying] = useState(false)
  const [showContractText, setShowContractText] = useState(false)
  const [contractText, setContractText] = useState('')

  // GPS tracking
  const [gpsOrderId, setGpsOrderId] = useState<string | null>(null)
  const [gpsActive, setGpsActive] = useState(false)
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'requesting' | 'active' | 'error'>('idle')
  const [gpsDistanceKm, setGpsDistanceKm] = useState<number | null>(null)
  const [gpsLastUpdate, setGpsLastUpdate] = useState<Date | null>(null)
  const [gpsShareToken, setGpsShareToken] = useState<string | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const lastSentRef = useRef<number>(0)

  useEffect(() => {
    if (!user) return
    if (user.role !== 'GRILLMASTER') { router.replace('/dashboard'); return }
    load()
  }, [user])

  async function load() {
    setLoading(true)
    try {
      const h = { Authorization: 'Bearer ' + getToken() }
      const [res, cRes, sRes] = await Promise.all([
        fetch(`${BASE}/grillmasters/me/orders`, { headers: h }),
        fetch(`${BASE}/contracts/my`, { headers: h }),
        fetch(`${BASE}/grillmasters/schedule`, { headers: h }),
      ])
      if (!res.ok) { setNotFound(true); return }
      const data = await res.json()
      const p = data.grillmaster ?? null
      setProfile(p)
      if (p) {
        setProfileForm({
          bio: p.bio ?? '', pricePerHour: p.pricePerHour, city: p.city, state: p.state,
          specialties: p.specialties ?? '', churrascoStyle: p.churrascoStyle ?? '',
          bringsEquipment: p.bringsEquipment, minGuests: p.minGuests, maxGuests: p.maxGuests,
          instagram: p.instagram ?? '', videoUrl: p.videoUrl ?? '',
          photoUrl: p.photoUrl ?? '', galleryUrls: p.galleryUrls ?? [],
          experience: p.experience,
        })
        setCheckedModules(new Set(p.trainingModules))
      }
      setOrders(Array.isArray(data.orders) ? data.orders : [])
      if (cRes.ok) {
        const contracts = await cRes.json()
        if (Array.isArray(contracts) && contracts.length > 0) setContract(contracts[0])
      }
      if (sRes.ok) setSchedule(await sRes.json())
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  async function sendLocation(orderId: string, lat: number, lng: number) {
    const now = Date.now()
    if (now - lastSentRef.current < 12000) return
    lastSentRef.current = now
    try {
      await fetch(`${BASE}/orders/${orderId}/location`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
        body: JSON.stringify({ lat, lng }),
      })
      setGpsLastUpdate(new Date())
    } catch {}
  }

  async function startGps(orderId: string, eventAddress: string) {
    if (!('geolocation' in navigator)) { setGpsStatus('error'); return }
    setGpsOrderId(orderId)
    setGpsStatus('requesting')

    // Get share token to show the link
    try {
      const res = await fetch(`${BASE}/orders/${orderId}/share`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + getToken() },
      })
      if (res.ok) {
        const d = await res.json()
        if (d.shareToken) setGpsShareToken(d.shareToken)
      }
    } catch {}

    // Update status detail to "a caminho"
    try {
      await fetch(`${BASE}/orders/${orderId}/status-detail`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
        body: JSON.stringify({ statusDetail: 'Churrasqueiro a caminho' }),
      })
    } catch {}

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setGpsActive(true)
        setGpsStatus('active')
        sendLocation(orderId, latitude, longitude)
      },
      () => setGpsStatus('error'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    )
  }

  function stopGps() {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setGpsActive(false)
    setGpsStatus('idle')
    setGpsOrderId(null)
    setGpsDistanceKm(null)
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
    } finally { setTogglingAvail(false) }
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
    } finally { setActionLoading(null) }
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
    } finally { setActionLoading(null) }
  }

  async function handleToggleScheduleDay(dateStr: string) {
    setTogglingDate(dateStr)
    try {
      const res = await fetch(`${BASE}/grillmasters/schedule/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
        body: JSON.stringify({ date: dateStr }),
      })
      if (res.ok) {
        const updated = await res.json()
        setSchedule(prev => {
          const idx = prev.findIndex(s => s.date.startsWith(dateStr))
          if (idx >= 0) {
            const next = [...prev]; next[idx] = updated; return next
          }
          return [...prev, updated]
        })
      }
    } finally { setTogglingDate(null) }
  }

  async function handleSaveProfile() {
    setSavingProfile(true); setProfileMsg('')
    try {
      const res = await fetch(`${BASE}/grillmasters`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
        body: JSON.stringify(profileForm),
      })
      if (res.ok) {
        const updated = await res.json()
        setProfile(p => p ? { ...p, ...updated } : null)
        setProfileMsg('Perfil salvo com sucesso!')
      } else {
        const d = await res.json()
        setProfileMsg('Erro: ' + (d.error ?? 'tente novamente'))
      }
    } finally { setSavingProfile(false) }
  }

  async function handleCompleteTraining() {
    if (checkedModules.size < 4) return
    setCertifying(true)
    try {
      const h = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() }
      for (const id of [1, 2, 3, 4]) {
        await fetch(`${BASE}/grillmasters/training/${id}/complete`, { method: 'POST', headers: h })
      }
      await load()
    } finally { setCertifying(false) }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse space-y-4">
        <div className="h-10 bg-gray-900 rounded-xl w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-gray-900 rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🔥</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Bem-vindo à Tech Churras!</h1>
          <p className="text-gray-400 text-sm">Você está a poucos passos de começar a receber pedidos de churrasco.</p>
        </div>

        <div className="space-y-3 mb-8">
          <div className="bg-gray-900 border border-orange-500/30 rounded-xl p-4 flex items-start gap-4">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">1</div>
            <div>
              <p className="font-semibold text-white">Complete seu perfil</p>
              <p className="text-gray-400 text-xs mt-0.5">Adicione sua foto, bio, especialidades e valor por hora.</p>
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 flex items-start gap-4 opacity-60">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-gray-400 font-bold text-sm shrink-0">2</div>
            <div>
              <p className="font-semibold text-gray-300">Aguardar aprovação</p>
              <p className="text-gray-500 text-xs mt-0.5">Nossa equipe analisa seu perfil em até 24h.</p>
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 flex items-start gap-4 opacity-60">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-gray-400 font-bold text-sm shrink-0">3</div>
            <div>
              <p className="font-semibold text-gray-300">Receber pedidos</p>
              <p className="text-gray-500 text-xs mt-0.5">Você recebe notificações e pode aceitar ou recusar eventos.</p>
            </div>
          </div>
        </div>

        <Link
          href="/grillmasters/new"
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold text-center block transition-colors"
        >
          Cadastrar meu perfil agora
        </Link>
        <p className="text-center text-xs text-gray-600 mt-3">Gratuito · Sem mensalidade · Comissão só nos eventos</p>
      </div>
    )
  }

  if (profile && !profile.approved) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">⏳</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Perfil em análise</h1>
          <p className="text-gray-400 text-sm">Recebemos seu cadastro! Nossa equipe está revisando suas informações.</p>
        </div>

        <div className="bg-gray-900 rounded-xl p-5 mb-6 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-green-400">✓</span>
            <span className="text-sm text-gray-300">Perfil enviado</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-yellow-400">●</span>
            <span className="text-sm text-white font-medium">Análise em andamento (até 24h)</span>
          </div>
          <div className="flex items-center gap-3 opacity-40">
            <span className="text-gray-500">○</span>
            <span className="text-sm text-gray-400">Aprovação e ativação</span>
          </div>
        </div>

        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 text-sm text-orange-300">
          Você receberá uma notificação assim que seu perfil for aprovado. Fique de olho no WhatsApp também!
        </div>

        <Link
          href="/grillmasters/new"
          className="mt-4 text-center block text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Editar informações do cadastro
        </Link>
      </div>
    )
  }

  const now = new Date()
  const pendingOrders = orders.filter(o => o.status === 'PENDING')
  const upcomingOrders = orders
    .filter(o => (o.status === 'CONFIRMED' || o.status === 'IN_PROGRESS') && new Date(o.eventDate) >= now)
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
  const historyOrders = orders.filter(o => o.status === 'COMPLETED' || o.status === 'CANCELLED')
  const completedOrders = orders.filter(o => o.status === 'COMPLETED')
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const earnedThisMonth = completedOrders.filter(o => new Date(o.eventDate) >= startOfMonth).reduce((s, o) => s + o.totalPrice * 0.93, 0)
  const earnedThisYear = completedOrders.filter(o => new Date(o.eventDate) >= startOfYear).reduce((s, o) => s + o.totalPrice * 0.93, 0)
  const totalEarningsAllTime = completedOrders.reduce((s, o) => s + o.totalPrice * 0.93, 0)
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0, 0, 0, 0)
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const earnedToday = completedOrders.filter(o => new Date(o.eventDate) >= todayMidnight).reduce((s, o) => s + o.totalPrice * 0.93, 0)
  const earnedThisWeek = completedOrders.filter(o => new Date(o.eventDate) >= startOfWeek).reduce((s, o) => s + o.totalPrice * 0.93, 0)
  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const dEnd = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 0, 23, 59, 59)
    const label = d.toLocaleDateString('pt-BR', { month: 'short' })
    const monthEarnings = completedOrders
      .filter(o => { const od = new Date(o.eventDate); return od >= d && od <= dEnd })
      .reduce((s, o) => s + o.totalPrice * 0.93, 0)
    const count = completedOrders.filter(o => { const od = new Date(o.eventDate); return od >= d && od <= dEnd }).length
    return { label, earnings: monthEarnings, count }
  })
  const maxMonthEarning = Math.max(...last6Months.map(m => m.earnings), 1)

  // Events happening today (±2h window to handle timezone offset)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const todayOrders = upcomingOrders.filter(o => {
    const d = new Date(o.eventDate)
    return d >= todayStart && d < todayEnd
  })

  // Calendar helpers
  const { year, month } = calMonth
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const scheduleMap: Record<string, boolean> = {}
  schedule.forEach(s => {
    const key = s.date.slice(0, 10)
    scheduleMap[key] = s.available
  })
  const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

  const trainingDone = profile?.certifiedAt

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-2xl font-bold">Meu Dashboard</h1>
            {profile?.isChancelado && (
              <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 text-xs font-bold px-2 py-0.5 rounded-full">
                CHANCELADO TC
              </span>
            )}
            {!profile?.isChancelado && !trainingDone && (
              <button onClick={() => setTab('treinamento')}
                className="bg-orange-500/10 text-orange-400 border border-orange-500/30 text-xs font-semibold px-2 py-0.5 rounded-full hover:bg-orange-500/20 transition-colors">
                Completar treinamento →
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {profile ? `${profile.city}, ${profile.state} — R$ ${fmt(profile.pricePerHour)}/h` : ''}
          </p>
        </div>
        {profile && (
          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/grillmasters/${profile.id}`} target="_blank"
              className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors">
              Ver perfil público
            </Link>
            <button
              onClick={() => {
                const url = `https://www.techchurras.com.br/grillmasters/${profile.id}`
                const msg = `🔥 Olá! Sou churrasqueiro parceiro Tech Churras.\n\nVeja meu perfil e contrate para o seu próximo evento:\n${url}`
                window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
              }}
              className="text-xs bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-lg transition-colors font-semibold"
            >
              Compartilhar perfil
            </button>
          </div>
        )}
      </div>

      {/* ── Completude do perfil ── */}
      {profile && (() => {
        const fields = [
          { label: 'Foto de perfil', ok: !!profile.photoUrl },
          { label: 'Bio', ok: !!(profile.bio && profile.bio.length > 20) },
          { label: 'Especialidades', ok: !!profile.specialties },
          { label: 'Estilo de churrasco', ok: !!profile.churrascoStyle },
          { label: 'Instagram', ok: !!profile.instagram },
          { label: 'Galeria (1+ foto)', ok: (profile.galleryUrls?.length ?? 0) > 0 },
          { label: 'Mín. convidados', ok: !!profile.minGuests },
          { label: 'Máx. convidados', ok: !!profile.maxGuests },
        ]
        const pct = Math.round(fields.filter(f => f.ok).length / fields.length * 100)
        const missing = fields.filter(f => !f.ok)
        if (pct >= 87) return null
        return (
          <div className="mb-5 bg-orange-500/5 border border-orange-500/20 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-bold text-white text-sm">Perfil {pct}% completo</p>
                <p className="text-xs text-gray-500 mt-0.5">Perfis completos aparecem em primeiro nas buscas</p>
              </div>
              <span className="text-2xl font-black text-orange-400">{pct}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
              <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {missing.map(f => (
                <span key={f.label} className="text-xs bg-gray-800 text-gray-400 px-2.5 py-1 rounded-full border border-gray-700">
                  + {f.label}
                </span>
              ))}
            </div>
            <button
              onClick={() => setTab('perfil')}
              className="text-xs bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-xl transition-colors"
            >
              Completar perfil →
            </button>
          </div>
        )
      })()}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-900 p-1 rounded-xl overflow-x-auto">
        {(['eventos', 'agenda', 'financeiro', 'perfil', 'treinamento'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 min-w-max py-2 px-4 rounded-lg text-sm font-semibold capitalize transition-colors relative ${
              tab === t ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
            }`}>
            {t}
            {t === 'eventos' && pendingOrders.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {pendingOrders.length}
              </span>
            )}
            {t === 'treinamento' && !trainingDone && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* ── ABA EVENTOS ── */}
      {tab === 'eventos' && (
        <div className="space-y-6">

          {/* 🚗 GPS TRACKER — aparece quando há evento hoje */}
          {todayOrders.length > 0 && (
            <div className={`rounded-2xl border p-5 transition-all ${gpsActive ? 'bg-green-500/10 border-green-500/40' : 'bg-gray-900 border-orange-500/30'}`}>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  {gpsActive && <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shrink-0" />}
                  <h2 className={`font-bold text-sm ${gpsActive ? 'text-green-300' : 'text-orange-300'}`}>
                    {gpsActive ? 'GPS Ativo — Clientes vendo você ao vivo' : `Evento hoje — Ativar modo GPS`}
                  </h2>
                </div>
                {gpsActive && gpsLastUpdate && (
                  <span className="text-xs text-gray-500">Atualizado: {gpsLastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                )}
              </div>

              {!gpsActive ? (
                <div>
                  {todayOrders.map(o => (
                    <div key={o.id} className="flex items-center justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">{o.customer?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{o.eventAddress} · {o.guestCount} convidados</p>
                      </div>
                      <button
                        onClick={() => startGps(o.id, o.eventAddress)}
                        disabled={gpsStatus === 'requesting'}
                        className="shrink-0 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors"
                      >
                        {gpsStatus === 'requesting' ? 'Ativando...' : '📍 Ativar GPS'}
                      </button>
                    </div>
                  ))}
                  {gpsStatus === 'error' && (
                    <p className="text-xs text-red-400 mt-2">Permissão de GPS negada. Ative o GPS nas configurações do celular.</p>
                  )}
                  <p className="text-xs text-gray-600 mt-2">Ao ativar, clientes poderão ver você chegando em tempo real no mapa.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {gpsShareToken && (
                    <div className="bg-gray-800 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-2">Compartilhe com os convidados:</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs text-orange-300 font-mono truncate">
                          techchurras.com.br/acompanhar/{gpsShareToken}
                        </code>
                        <button
                          onClick={() => {
                            const url = `https://www.techchurras.com.br/acompanhar/${gpsShareToken}`
                            const msg = `🔥 Me acompanhe chegando ao churrasco!\n\n${url}`
                            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
                          }}
                          className="shrink-0 bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                        >
                          WhatsApp
                        </button>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={stopGps}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold py-2.5 rounded-xl text-sm transition-colors"
                  >
                    Parar rastreamento GPS
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Toggle disponibilidade */}
          <div className={`rounded-xl border px-5 py-4 flex items-center justify-between gap-4 ${
            profile?.available ? 'bg-green-500/10 border-green-500/30' : 'bg-gray-900 border-gray-800'
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
            <button onClick={handleToggleAvailability} disabled={togglingAvail}
              className={`relative w-14 h-7 rounded-full transition-colors shrink-0 disabled:opacity-60 ${profile?.available ? 'bg-green-500' : 'bg-gray-700'}`}>
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${profile?.available ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Novos Eventos */}
          {pendingOrders.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-block w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                <h2 className="font-semibold text-orange-300">Novos Eventos — aguardando sua resposta ({pendingOrders.length})</h2>
              </div>
              <div className="space-y-3">
                {pendingOrders.map(o => {
                  const gmEarning = o.totalPrice * 0.93
                  return (
                    <div key={o.id} className="bg-gray-900 border border-orange-500/30 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <p className="font-medium text-white">{o.customer?.name ?? 'Cliente'}</p>
                          <p className="text-sm text-gray-400 mt-0.5">{fmtDate(o.eventDate)}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {o.eventAddress} · {o.guestCount} convidado{o.guestCount !== 1 ? 's' : ''} · {o.eventHours}h
                            {o.boutique ? ` · ${o.boutique.name}` : ''}
                          </p>
                          {o.notes && <p className="text-xs text-gray-400 mt-1 italic">"{o.notes}"</p>}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-lg font-black text-orange-400">R$ {fmt(gmEarning)}</p>
                          <p className="text-xs text-gray-500">sua parte (93%)</p>
                          <p className="text-xs text-gray-600 font-mono">#{o.id.slice(0, 8)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleAccept(o.id)}
                          disabled={!!actionLoading}
                          className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg transition-colors">
                          {actionLoading === o.id + '-accept' ? 'Aceitando...' : 'Aceitar evento'}
                        </button>
                        <button onClick={() => handleReject(o.id)}
                          disabled={!!actionLoading}
                          className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-300 text-sm font-semibold py-2 rounded-lg transition-colors">
                          {actionLoading === o.id + '-reject' ? 'Recusando...' : 'Recusar'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {pendingOrders.length === 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
              <p className="text-gray-400 text-sm">Nenhum novo evento aguardando resposta.</p>
              <p className="text-gray-600 text-xs mt-1">Quando um cliente te selecionar, o evento aparecerá aqui.</p>
            </div>
          )}

          {/* Stats — Uber Driver style */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Hoje', value: earnedToday > 0 ? 'R$ ' + fmt(earnedToday) : '—', sub: 'líquido (93%)', color: 'text-white' },
              { label: 'Esta semana', value: earnedThisWeek > 0 ? 'R$ ' + fmt(earnedThisWeek) : '—', sub: 'líquido (93%)', color: 'text-orange-400' },
              { label: 'Este mês', value: 'R$ ' + fmt(earnedThisMonth), sub: 'líquido (93%)', color: 'text-green-400' },
              { label: 'Este ano', value: 'R$ ' + fmt(earnedThisYear), sub: new Date().getFullYear().toString(), color: 'text-blue-400' },
            ].map(c => (
              <div key={c.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1 leading-tight">{c.label}</p>
                <p className={'text-xl font-bold ' + c.color}>{c.value}</p>
                <p className="text-xs text-gray-600 mt-0.5">{c.sub}</p>
              </div>
            ))}
          </div>

          {/* Próximos eventos confirmados */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
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
                  const isToday = daysUntil <= 0
                  return (
                    <div key={o.id} className="px-5 py-4">
                      <Link href={`/orders/${o.id}`} className="flex items-center justify-between gap-4 hover:opacity-80 transition-opacity">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`shrink-0 text-center px-2 py-1 rounded-lg ${isToday ? 'bg-orange-500/20' : 'bg-blue-500/20'}`}>
                            <p className={`text-xl font-black leading-none ${isToday ? 'text-orange-400' : 'text-blue-400'}`}>
                              {daysUntil <= 0 ? 'Hj' : daysUntil === 1 ? '1d' : daysUntil + 'd'}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white">{o.customer?.name ?? 'Cliente'}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{fmtDate(o.eventDate)} · {o.guestCount} convidados · {o.eventHours}h</p>
                            <p className="text-xs text-gray-500 truncate">{o.eventAddress}</p>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold text-orange-400">R$ {fmt(o.totalPrice * 0.93)}</p>
                          <span className={'text-xs px-2 py-0.5 rounded-full ' + (STATUS_CLASS[o.status] ?? 'bg-gray-700 text-gray-400')}>
                            {STATUS_LABEL[o.status] ?? o.status}
                          </span>
                        </div>
                      </Link>
                      {/* Quick status buttons for today's events */}
                      {isToday && (
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {o.status === 'CONFIRMED' && (
                            <>
                              <button
                                onClick={() => {
                                  setActionLoading(o.id + '-detail')
                                  fetch(`${BASE}/orders/${o.id}/status-detail`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
                                    body: JSON.stringify({ statusDetail: 'Churrasqueiro a caminho' }),
                                  }).then(() => setOrders(prev => prev.map(x => x.id === o.id ? { ...x, status: 'CONFIRMED' } : x)))
                                    .finally(() => setActionLoading(null))
                                }}
                                disabled={!!actionLoading}
                                className="flex-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-xs font-semibold py-1.5 rounded-lg transition-colors disabled:opacity-50"
                              >
                                🚗 A caminho
                              </button>
                              <button
                                onClick={() => {
                                  setActionLoading(o.id + '-start')
                                  fetch(`${BASE}/orders/${o.id}/status`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
                                    body: JSON.stringify({ status: 'IN_PROGRESS' }),
                                  }).then(() => setOrders(prev => prev.map(x => x.id === o.id ? { ...x, status: 'IN_PROGRESS' } : x)))
                                    .finally(() => setActionLoading(null))
                                }}
                                disabled={!!actionLoading}
                                className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs font-semibold py-1.5 rounded-lg transition-colors disabled:opacity-50"
                              >
                                🔥 Iniciar evento
                              </button>
                            </>
                          )}
                          {o.status === 'IN_PROGRESS' && (
                            <button
                              onClick={() => {
                                setActionLoading(o.id + '-complete')
                                fetch(`${BASE}/orders/${o.id}/status`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
                                  body: JSON.stringify({ status: 'COMPLETED' }),
                                }).then(() => setOrders(prev => prev.map(x => x.id === o.id ? { ...x, status: 'COMPLETED' } : x)))
                                  .finally(() => setActionLoading(null))
                              }}
                              disabled={!!actionLoading}
                              className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 text-xs font-semibold py-1.5 rounded-lg transition-colors disabled:opacity-50"
                            >
                              ✅ Finalizar evento
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Contrato */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-5 py-3">
            <p className="text-xs text-yellow-300">⚠️ <strong>Contratos em revisao juridica</strong> — os termos podem ser atualizados antes do lancamento oficial.</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm text-gray-300 uppercase tracking-wide">Meu Contrato</h2>
              {contract && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${contract.status === 'ACCEPTED' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {contract.status === 'ACCEPTED' ? 'Aceito' : 'Pendente de assinatura'}
                </span>
              )}
            </div>
            {contract ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-gray-500 text-xs">Vigencia</p><p className="text-white font-medium">{contract.durationMonths} meses</p></div>
                  <div><p className="text-gray-500 text-xs">Gerado em</p><p className="text-white font-medium">{new Date(contract.generatedAt).toLocaleDateString('pt-BR')}</p></div>
                  {contract.acceptedAt && <div><p className="text-gray-500 text-xs">Aceito em</p><p className="text-white font-medium">{new Date(contract.acceptedAt).toLocaleDateString('pt-BR')}</p></div>}
                </div>
                <button onClick={async () => {
                  const res = await fetch(BASE + '/contracts/' + contract.id, { headers: { Authorization: 'Bearer ' + getToken() } })
                  if (res.ok) { const c = await res.json(); setContractText(c.contractText); setShowContractText(true) }
                }} className="mt-2 text-sm text-orange-400 hover:text-orange-300 underline">
                  Visualizar contrato
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nenhum contrato gerado ainda.</p>
            )}
          </div>

          {/* Histórico */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="font-semibold text-sm">Historico</h2>
              <span className="text-xs text-gray-500">{historyOrders.length} pedido(s)</span>
            </div>
            {historyOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">Nenhum historico ainda.</div>
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
                        {new Date(o.eventDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} — {o.guestCount} convidado{o.guestCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-orange-400">R$ {fmt(o.totalPrice * 0.93)}</p>
                      <p className="text-xs text-gray-600 font-mono">#{o.id.slice(0, 8)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ABA AGENDA ── */}
      {tab === 'agenda' && (
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-sm text-gray-400 mb-4">
              Marque os dias em que você <strong className="text-white">NÃO está disponível</strong>. Dias marcados em cinza não aparecerão para clientes.
            </p>

            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCalMonth(m => {
                const d = new Date(m.year, m.month - 1, 1)
                return { year: d.getFullYear(), month: d.getMonth() }
              })} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                ‹
              </button>
              <span className="font-semibold text-white">{MONTHS_PT[month]} {year}</span>
              <button onClick={() => setCalMonth(m => {
                const d = new Date(m.year, m.month + 1, 1)
                return { year: d.getFullYear(), month: d.getMonth() }
              })} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                ›
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
                <div key={d} className="text-center text-xs text-gray-600 font-medium py-1">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={'e' + i} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const isPast = new Date(dateStr) < new Date(new Date().toDateString())
                const isMarkedUnavail = scheduleMap[dateStr] === false
                const isToggling = togglingDate === dateStr
                return (
                  <button key={day} onClick={() => !isPast && handleToggleScheduleDay(dateStr)}
                    disabled={isPast || isToggling}
                    className={`aspect-square rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                      isPast ? 'text-gray-700 cursor-default' :
                      isMarkedUnavail ? 'bg-gray-700 text-gray-400' :
                      'bg-orange-500/20 text-orange-300 hover:bg-orange-500/40'
                    } ${isToggling ? 'opacity-50' : ''}`}>
                    {day}
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-4 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-orange-500/20" />
                <span>Disponível</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-gray-700" />
                <span>Indisponível</span>
              </div>
            </div>
          </div>

          {/* Toggle disponibilidade geral */}
          <div className={`rounded-xl border px-5 py-4 flex items-center justify-between gap-4 ${
            profile?.available ? 'bg-green-500/10 border-green-500/30' : 'bg-gray-900 border-gray-800'
          }`}>
            <div>
              <p className={`font-semibold text-sm ${profile?.available ? 'text-green-300' : 'text-gray-300'}`}>
                {profile?.available ? 'Aceitando pedidos agora' : 'Pausado — nao apareco nas buscas'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Toggle geral de disponibilidade (independente do calendário)</p>
            </div>
            <button onClick={handleToggleAvailability} disabled={togglingAvail}
              className={`relative w-14 h-7 rounded-full transition-colors shrink-0 disabled:opacity-60 ${profile?.available ? 'bg-green-500' : 'bg-gray-700'}`}>
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${profile?.available ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      )}

      {/* ── ABA PERFIL ── */}
      {tab === 'perfil' && (
        <div className="space-y-6">
          {/* Profile completeness */}
          {(() => {
            const checks = [
              { label: 'Foto de perfil', done: !!profileForm.photoUrl },
              { label: 'Bio / apresentação', done: (profileForm.bio ?? '').length >= 30 },
              { label: 'Especialidades', done: !!(profileForm.specialties) },
              { label: 'Estilo de churrasco', done: !!(profileForm.churrascoStyle) },
              { label: '3+ fotos na galeria', done: (profileForm.galleryUrls ?? []).length >= 3 },
              { label: 'Instagram', done: !!(profileForm.instagram) },
              { label: 'Vídeo de apresentação', done: !!(profileForm.videoUrl) },
            ]
            const done = checks.filter(c => c.done).length
            const pct = Math.round((done / checks.length) * 100)
            const color = pct >= 80 ? 'text-green-400' : pct >= 50 ? 'text-yellow-400' : 'text-orange-400'
            const barColor = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-orange-500'
            return (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-sm">Completude do Perfil</h2>
                  <span className={`text-2xl font-black ${color}`}>{pct}%</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full mb-4">
                  <div className={`h-1.5 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {checks.map(c => (
                    <div key={c.label} className={`flex items-center gap-1.5 text-xs ${c.done ? 'text-gray-400' : 'text-gray-600'}`}>
                      <span className={c.done ? 'text-green-400' : 'text-gray-700'}>
                        {c.done ? '✓' : '○'}
                      </span>
                      {c.label}
                    </div>
                  ))}
                </div>
                {pct < 80 && (
                  <p className="text-xs text-gray-600 mt-3">Perfis completos recebem 3x mais pedidos. Complete os itens acima para melhorar seu ranqueamento.</p>
                )}
              </div>
            )
          })()}

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-5">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-400">Perfil Profissional</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Cidade</label>
                <input value={profileForm.city ?? ''} onChange={e => setProfileForm(f => ({ ...f, city: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Estado (UF)</label>
                <input value={profileForm.state ?? ''} onChange={e => setProfileForm(f => ({ ...f, state: e.target.value }))}
                  maxLength={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Preço por hora (R$)</label>
                <input type="number" min={0} value={profileForm.pricePerHour ?? ''} onChange={e => setProfileForm(f => ({ ...f, pricePerHour: Number(e.target.value) }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Anos de experiência</label>
                <input type="number" min={0} value={profileForm.experience ?? ''} onChange={e => setProfileForm(f => ({ ...f, experience: Number(e.target.value) }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Min. convidados</label>
                <input type="number" min={0} value={profileForm.minGuests ?? ''} onChange={e => setProfileForm(f => ({ ...f, minGuests: Number(e.target.value) }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Máx. convidados</label>
                <input type="number" min={0} value={profileForm.maxGuests ?? ''} onChange={e => setProfileForm(f => ({ ...f, maxGuests: Number(e.target.value) }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Bio (apresentação)</label>
              <textarea value={profileForm.bio ?? ''} onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))} rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 resize-none" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Especialidades</label>
              <textarea value={profileForm.specialties ?? ''} onChange={e => setProfileForm(f => ({ ...f, specialties: e.target.value }))} rows={2}
                placeholder="Ex: churrasco gaúcho, parrillada argentina, defumados, espetinhos, eventos corporativos..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 resize-none placeholder-gray-600" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Estilo de churrasco</label>
                <input value={profileForm.churrascoStyle ?? ''} onChange={e => setProfileForm(f => ({ ...f, churrascoStyle: e.target.value }))}
                  placeholder="Ex: Gaúcho, Mineiro, Paulistano..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 placeholder-gray-600" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Instagram</label>
                <input value={profileForm.instagram ?? ''} onChange={e => setProfileForm(f => ({ ...f, instagram: e.target.value }))}
                  placeholder="@seuperfil"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 placeholder-gray-600" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Vídeo de apresentação (URL YouTube ou Instagram)</label>
              <input value={profileForm.videoUrl ?? ''} onChange={e => setProfileForm(f => ({ ...f, videoUrl: e.target.value }))}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 placeholder-gray-600" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">URL da foto de perfil</label>
              <input value={profileForm.photoUrl ?? ''} onChange={e => setProfileForm(f => ({ ...f, photoUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 placeholder-gray-600" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-2">Galeria de eventos ({(profileForm.galleryUrls ?? []).length} fotos)</label>
              {(profileForm.galleryUrls ?? []).map((url, i) => (
                <div key={i} className="flex items-center gap-2 mb-1.5">
                  <input value={url} readOnly className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-300" />
                  <button onClick={() => setProfileForm(f => ({ ...f, galleryUrls: (f.galleryUrls ?? []).filter((_, j) => j !== i) }))}
                    className="text-red-400 hover:text-red-300 text-sm px-2">✕</button>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <label
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${uploadingGallery ? 'bg-orange-500/50 pointer-events-none' : 'bg-orange-500 hover:bg-orange-600'} text-white`}
                >
                  {uploadingGallery ? '⏳ Enviando...' : '📷 Adicionar foto da galeria'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingGallery}
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      e.target.value = ''
                      if (!file) return
                      setUploadingGallery(true)
                      try {
                        const url = await uploadImageFile(file)
                        setProfileForm(f => ({ ...f, galleryUrls: [...(f.galleryUrls ?? []), url] }))
                      } catch (err: any) {
                        alert('Erro ao fazer upload: ' + err.message)
                      } finally {
                        setUploadingGallery(false)
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-white font-medium">Tenho churrasqueira própria</p>
                <p className="text-xs text-gray-500">Equipamentos incluídos no serviço</p>
              </div>
              <button onClick={() => setProfileForm(f => ({ ...f, bringsEquipment: !f.bringsEquipment }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${profileForm.bringsEquipment ? 'bg-orange-500' : 'bg-gray-700'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${profileForm.bringsEquipment ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {profileMsg && (
              <p className={`text-sm text-center font-medium ${profileMsg.startsWith('Erro') ? 'text-red-400' : 'text-green-400'}`}>{profileMsg}</p>
            )}

            <button onClick={handleSaveProfile} disabled={savingProfile}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors">
              {savingProfile ? 'Salvando...' : 'Salvar Perfil'}
            </button>
          </div>
        </div>
      )}

      {/* ── ABA TREINAMENTO ── */}
      {tab === 'treinamento' && (
        <div className="space-y-6">
          {trainingDone ? (
            /* Certificado */
            <div>
              <style>{`@media print { .no-print { display: none !important; } body { background: white !important; } }`}</style>
              <div className="no-print mb-4 flex items-center justify-between">
                <p className="text-green-400 font-semibold text-sm">Treinamento concluído! Seu certificado está abaixo.</p>
                <button onClick={() => window.print()}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                  Imprimir certificado
                </button>
              </div>
              <div id="certificado" className="bg-white text-gray-900 rounded-2xl p-10 border-4 border-orange-400 text-center">
                <div className="mb-6">
                  <p className="text-orange-600 font-black text-2xl tracking-wide">🔥 TECH CHURRAS</p>
                  <p className="text-gray-500 text-xs mt-1 tracking-widest uppercase">Plataforma de Churrasqueiros Premium</p>
                </div>
                <p className="text-gray-700 text-sm mb-3">Certificamos que</p>
                <p className="text-3xl font-black text-gray-900 mb-3">{user?.name ?? 'Churrasqueiro'}</p>
                <p className="text-gray-700 text-sm mb-6 max-w-sm mx-auto">
                  concluiu com êxito o <strong>Programa de Formação e Chancela Tech Churras</strong>, atestando domínio dos padrões de qualidade, atendimento ao cliente e uso da plataforma.
                </p>
                <div className="flex items-center justify-center gap-8 mb-6 text-sm text-gray-600">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Data de conclusão</p>
                    <p className="font-bold">{new Date(profile!.certifiedAt!).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Código de certificação</p>
                    <p className="font-mono font-bold text-orange-600">{profile!.certificationCode}</p>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-5">
                  <p className="text-xs text-gray-400 mb-1">Assinado por</p>
                  <p className="font-bold text-gray-800">Jota Albuquerque</p>
                  <p className="text-xs text-gray-500">Fundador — Tech Churras</p>
                </div>
              </div>
            </div>
          ) : (
            /* Treinamento pendente */
            <div className="space-y-4">
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-5">
                <h2 className="font-bold text-orange-300 mb-1">Treinamento obrigatório para Chancela Tech Churras</h2>
                <p className="text-sm text-gray-400">
                  Complete os 4 módulos abaixo para receber seu certificado digital e ser exibido como churrasqueiro chancelado na plataforma.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-800 rounded-full">
                    <div className="h-1.5 bg-orange-500 rounded-full transition-all" style={{ width: `${(checkedModules.size / 4) * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-400">{checkedModules.size}/4</span>
                </div>
              </div>

              {TRAINING_MODULES.map(mod => {
                const done = checkedModules.has(mod.id)
                return (
                  <div key={mod.id} className={`rounded-xl border p-5 transition-colors ${done ? 'bg-green-500/5 border-green-500/30' : 'bg-gray-900 border-gray-800'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${done ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
                        {done ? '✓' : mod.id}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${done ? 'text-green-300' : 'text-white'}`}>Módulo {mod.id} — {mod.title}</p>
                        <p className="text-xs text-gray-400 mt-1">{mod.desc}</p>
                        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                          <span>🎬</span>
                          <span className="font-mono truncate">{mod.videoPlaceholder}</span>
                          <span className="text-gray-600">(vídeo em breve)</span>
                        </div>
                        <label className="flex items-center gap-2 mt-3 cursor-pointer group">
                          <input type="checkbox" checked={done}
                            onChange={e => {
                              const next = new Set(checkedModules)
                              if (e.target.checked) next.add(mod.id); else next.delete(mod.id)
                              setCheckedModules(next)
                            }}
                            className="w-4 h-4 accent-orange-500" />
                          <span className="text-xs text-gray-400 group-hover:text-white transition-colors">Assisti e entendi o conteúdo deste módulo</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )
              })}

              <button onClick={handleCompleteTraining}
                disabled={checkedModules.size < 4 || certifying}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors">
                {certifying ? 'Gerando certificado...' : checkedModules.size < 4 ? `Conclua todos os módulos (${checkedModules.size}/4)` : 'Concluir treinamento e gerar certificado'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── ABA FINANCEIRO ── */}
      {tab === 'financeiro' && (
        <div className="space-y-6">
          {/* Totals */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Total recebido (histórico)', value: 'R$ ' + fmt(totalEarningsAllTime), sub: completedOrders.length + ' eventos concluídos', color: 'text-green-400' },
              { label: 'Este mês', value: 'R$ ' + fmt(earnedThisMonth), sub: 'líquido 93%', color: 'text-orange-400' },
              { label: 'Este ano', value: 'R$ ' + fmt(earnedThisYear), sub: new Date().getFullYear().toString(), color: 'text-blue-400' },
            ].map(c => (
              <div key={c.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1 leading-tight">{c.label}</p>
                <p className={'text-2xl font-black ' + c.color}>{c.value}</p>
                <p className="text-xs text-gray-600 mt-0.5">{c.sub}</p>
              </div>
            ))}
          </div>

          {/* 6-month chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-400 mb-5">Ganhos — Últimos 6 Meses</h2>
            <div className="flex items-end gap-2 h-36">
              {last6Months.map(m => (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-xs text-gray-400 font-semibold">
                    {m.earnings > 0 ? 'R$' + (m.earnings >= 1000 ? Math.round(m.earnings / 1000) + 'k' : Math.round(m.earnings)) : ''}
                  </span>
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${Math.max((m.earnings / maxMonthEarning) * 100, m.earnings > 0 ? 4 : 2)}%`,
                      background: m.earnings > 0 ? 'rgb(249 115 22)' : 'rgb(31 41 55)',
                    }}
                  />
                  <span className="text-xs text-gray-500 capitalize">{m.label}</span>
                  {m.count > 0 && <span className="text-[10px] text-gray-600">{m.count}ev</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Commission breakdown */}
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-5">
            <h2 className="font-semibold text-sm text-orange-300 mb-3">Como funciona sua remuneração</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Valor total do evento</span>
                <span className="font-bold text-white">100%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Taxa de plataforma Tech Churras</span>
                <span className="font-semibold text-red-400">− 7%</span>
              </div>
              <div className="h-px bg-gray-700 my-2" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-300 font-semibold">Você recebe (via PIX)</span>
                <span className="font-black text-green-400 text-lg">93%</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">Repasse realizado semanalmente após conclusão e avaliação do evento.</p>
          </div>

          {/* Completed orders list */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="font-semibold text-sm">Eventos Pagos</h2>
              <span className="text-xs text-gray-500">{completedOrders.length} concluídos</span>
            </div>
            {completedOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">Nenhum evento concluído ainda.</div>
            ) : (
              <div className="divide-y divide-gray-800">
                {completedOrders
                  .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
                  .slice(0, 30)
                  .map(o => {
                    const net = o.totalPrice * 0.93
                    const fee = o.totalPrice * 0.07
                    return (
                      <div key={o.id} className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-gray-800/30 transition-colors">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white">{o.customer?.name ?? 'Cliente'}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(o.eventDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} · {o.guestCount} convidados · {o.eventHours}h
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold text-green-400">+R$ {fmt(net)}</p>
                          <p className="text-xs text-gray-600">bruto R$ {fmt(o.totalPrice)} / taxa R$ {fmt(fee)}</p>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>

          {/* Next payout banner */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-5 py-4 flex items-center gap-4">
            <div className="shrink-0 w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-xl">💰</div>
            <div>
              <p className="font-semibold text-green-300 text-sm">Próximo repasse</p>
              <p className="text-xs text-gray-400 mt-0.5">Todo domingo os valores de eventos concluídos na semana são enviados ao seu PIX cadastrado.</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal contrato */}
      {showContractText && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <span className="font-bold text-orange-400">Contrato de Parceria</span>
              <button onClick={() => setShowContractText(false)} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <pre className="font-mono text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{contractText}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
