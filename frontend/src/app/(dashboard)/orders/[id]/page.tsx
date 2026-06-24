'use client'
import { API_URL } from '@/lib/api'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Events } from '@/lib/analytics'

const OrderMap = dynamic(() => import('./OrderMap'), { ssr: false })


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

const STATUS_SUBSTATES: Record<string, string[]> = {
  CONFIRMED: ['Pedido confirmado', 'Acougue separando carnes', 'Churrasqueiro a caminho'],
  IN_PROGRESS: ['Churrasqueiro chegou', 'Preparando o churrasco', 'Servindo'],
  COMPLETED: ['Finalizado'],
}

const NEXT_MAIN_STATUS: Record<string, string> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED',
}

const NEXT_MAIN_LABEL: Record<string, string> = {
  CONFIRMED: 'Confirmar pedido',
  IN_PROGRESS: 'Iniciar servico',
  COMPLETED: 'Concluir pedido',
}

function getNextAction(status: string, statusDetail: string | null | undefined) {
  const substates = STATUS_SUBSTATES[status] ?? []
  const idx = statusDetail ? substates.indexOf(statusDetail) : -1
  if (idx < substates.length - 1) return { type: 'substate' as const, value: substates[idx + 1] }
  if (NEXT_MAIN_STATUS[status]) return { type: 'status' as const, value: NEXT_MAIN_STATUS[status] }
  return null
}

interface OrderItem {
  id: string
  quantity: number
  unitPrice: number
  product?: { name: string; unit: string }
}

interface Message {
  id: string
  content: string
  createdAt: string
  senderId: string
  sender: { id: string; name: string; role: string }
}

interface OrderDetail {
  id: string
  status: string
  statusDetail?: string | null
  totalPrice: number
  eventDate: string
  eventAddress: string
  eventHours: number
  guestCount: number
  notes?: string
  couponCode?: string
  discountAmount?: number
  paymentStatus?: string | null
  items?: OrderItem[]
  grillmaster?: {
    id: string
    user?: { id: string; name: string }
    city?: string
    state?: string
    pricePerHour?: number
  }
  boutique?: { name: string }
  review?: { id: string; customerRating?: number | null } | null
  customer?: { id: string; name: string; averageRating?: number | null; _count?: { orders: number } }
  grillmasterLat?: number | null
  grillmasterLng?: number | null
  cancelledBy?: string | null
  cancellationReason?: string | null
  cancellationFee?: number | null
  refundAmount?: number | null
  publicShareToken?: string | null
}

function getAuth() {
  try {
    const raw = localStorage.getItem('auth-storage')
    const state = raw ? JSON.parse(raw)?.state : null
    return {
      token: state?.token as string | null,
      user: state?.user as { id: string; name: string; role: string } | null,
    }
  } catch {
    return { token: null, user: null }
  }
}

function Stars({ n }: { n: number }) {
  return (
    <span className="text-yellow-400 text-sm">
      {Array.from({ length: 5 }, (_, i) => (i < Math.floor(n) ? '★' : '☆')).join('')}
    </span>
  )
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentResult = searchParams.get('payment')
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [msgInput, setMsgInput] = useState('')
  const [sending, setSending] = useState(false)
  const [advancing, setAdvancing] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: string } | null>(null)
  const [shareLoading, setShareLoading] = useState(false)
  const [shareToast, setShareToast] = useState('')
  const [payingNow, setPayingNow] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const authRef = useRef<ReturnType<typeof getAuth>>({ token: null, user: null })

  useEffect(() => {
    const auth = getAuth()
    authRef.current = auth
    setCurrentUser(auth.user)
    if (!auth.token) { router.push('/login'); return }
    fetchOrder()
    fetchMessages()
    markRead()

    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseKey || supabaseKey === 'sua_anon_key_aqui') {
      const interval = setInterval(fetchMessages, 5000)
      return () => clearInterval(interval)
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    let channel: any
    ;(async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(supabaseUrl!, supabaseKey!)
      channel = supabase.channel(`msgs-${id}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'Message',
          filter: `orderId=eq.${id}`,
        }, () => { fetchMessages(); markRead() })
        .subscribe()
    })()
    return () => { channel?.unsubscribe() }
  }, [id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (order?.statusDetail !== 'Churrasqueiro a caminho') return
    const interval = setInterval(fetchOrder, 10000)
    return () => clearInterval(interval)
  }, [order?.statusDetail])

  // Dispara Purchase para todos os canais quando pagamento é confirmado
  useEffect(() => {
    if (paymentResult === 'success' && order?.totalPrice) {
      Events.purchase(order.id, order.totalPrice)
    }
  }, [paymentResult, order?.id, order?.totalPrice])

  // Auto-refresh status for customers on active (non-terminal) orders
  useEffect(() => {
    if (!order) return
    if (['COMPLETED', 'CANCELLED'].includes(order.status)) return
    if (order.statusDetail === 'Churrasqueiro a caminho') return // 10s interval already active
    const interval = setInterval(fetchOrder, 30000)
    return () => clearInterval(interval)
  }, [order?.status, order?.statusDetail])

  useEffect(() => {
    if (!order || !currentUser) return
    const isGM = currentUser.role === 'GRILLMASTER' && order.grillmaster?.user?.id === currentUser.id
    if (!isGM || order.statusDetail !== 'Churrasqueiro a caminho') return
    if (!navigator.geolocation) return
    const watchId = navigator.geolocation.watchPosition(
      pos => {
        const { token } = authRef.current
        fetch(`${API_URL}/orders/${id}/location`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
          body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        }).catch(() => {})
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [order?.statusDetail, currentUser])

  async function fetchOrder() {
    const { token } = authRef.current
    try {
      const res = await fetch(`${API_URL}/orders/${id}`, { headers: { Authorization: 'Bearer ' + token } })
      if (res.ok) setOrder(await res.json())
    } finally {
      setLoading(false)
    }
  }

  async function fetchMessages() {
    const { token } = authRef.current
    try {
      const res = await fetch(`${API_URL}/orders/${id}/messages`, { headers: { Authorization: 'Bearer ' + token } })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setMessages(data)
      }
    } catch {
      // falha silenciosa — chat fica vazio, page nao quebra
    }
  }

  async function markRead() {
    const { token } = authRef.current
    fetch(`${API_URL}/orders/${id}/messages/read`, {
      method: 'PATCH', headers: { Authorization: 'Bearer ' + token },
    }).catch(() => {})
  }

  async function sendMsg(e: React.FormEvent) {
    e.preventDefault()
    if (!msgInput.trim() || sending) return
    setSending(true)
    const { token } = authRef.current
    try {
      const res = await fetch(`${API_URL}/orders/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ content: msgInput.trim() }),
      })
      if (res.ok) {
        const msg = await res.json()
        setMessages(prev => [...prev, msg])
        setMsgInput('')
      }
    } finally {
      setSending(false)
    }
  }

  async function advanceStatus() {
    if (!order || advancing) return
    const { token } = authRef.current
    const action = getNextAction(order.status, order.statusDetail)
    if (!action) return
    setAdvancing(true)
    try {
      if (action.type === 'substate') {
        const res = await fetch(`${API_URL}/orders/${id}/status-detail`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
          body: JSON.stringify({ statusDetail: action.value }),
        })
        if (res.ok) setOrder(prev => prev ? { ...prev, statusDetail: action.value } : prev)
      } else {
        const res = await fetch(`${API_URL}/orders/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
          body: JSON.stringify({ status: action.value }),
        })
        if (res.ok) {
          const updated = await res.json()
          setOrder(prev => prev ? { ...prev, status: updated.status, statusDetail: updated.statusDetail } : prev)
          if (action.value === 'COMPLETED') {
            router.push(`/orders/${id}/review-customer`)
          }
        }
      }
    } finally {
      setAdvancing(false)
    }
  }

  function computeFeePreview(o: OrderDetail): { fee: number; label: string; isFree: boolean } {
    if (o.status === 'PENDING') return { fee: 0, label: 'Cancelamento gratuito (pedido ainda nao confirmado).', isFree: true }
    if (o.status !== 'CONFIRMED') return { fee: 0, label: '', isFree: true }
    const hours = (new Date(o.eventDate).getTime() - Date.now()) / (1000 * 60 * 60)
    if (hours < 24) {
      const fee = o.totalPrice * 0.5
      return { fee, label: `Faltam menos de 24h para o evento. Multa de 50% = R$ ${fee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`, isFree: false }
    }
    if (hours < 48) {
      const fee = o.totalPrice * 0.3
      return { fee, label: `Faltam entre 24h e 48h para o evento. Multa de 30% = R$ ${fee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`, isFree: false }
    }
    return { fee: 0, label: 'Faltam mais de 48h para o evento. Cancelamento gratuito.', isFree: true }
  }

  async function handleCancel() {
    if (!order || cancelling) return
    setCancelling(true)
    const { token } = authRef.current
    try {
      const res = await fetch(`${API_URL}/orders/${id}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ reason: cancelReason }),
      })
      if (res.ok) {
        const updated = await res.json()
        setOrder(prev => prev ? {
          ...prev,
          status: updated.status,
          cancelledBy: updated.cancelledBy,
          cancellationReason: updated.cancellationReason,
          cancellationFee: updated.cancellationFee,
          refundAmount: updated.refundAmount,
        } : prev)
        setCancelModalOpen(false)
        setCancelReason('')
      }
    } finally {
      setCancelling(false)
    }
  }

  async function getShareToken(): Promise<string | null> {
    const { token } = authRef.current
    const res = await fetch(`${API_URL}/orders/${id}/share`, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.token ?? null
  }

  async function handleShare() {
    if (!order || shareLoading) return
    setShareLoading(true)
    try {
      const shareToken = await getShareToken()
      if (shareToken) {
        const url = `https://www.techchurras.com.br/acompanhar/${shareToken}`
        await navigator.clipboard.writeText(url)
        setShareToast('Link copiado!')
        setTimeout(() => setShareToast(''), 3000)
      }
    } finally {
      setShareLoading(false)
    }
  }

  async function handlePayNow() {
    if (!order || payingNow) return
    setPayingNow(true)
    try {
      const { token } = authRef.current
      const r = await fetch(`${API_URL}/payments/create-preference`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId: order.id }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Erro ao iniciar pagamento')
      window.location.href = data.checkout_url
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao iniciar pagamento')
      setPayingNow(false)
    }
  }

  async function shareWhatsApp() {
    if (!order || shareLoading) return
    setShareLoading(true)
    try {
      const shareToken = await getShareToken()
      if (shareToken) {
        const url = `https://www.techchurras.com.br/acompanhar/${shareToken}`
        const eventDateStr = new Date(order.eventDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
        const gmName = order.grillmaster?.user?.name ?? 'churrasqueiro'
        const msg = `🔥 Churrasco confirmado!\n\n📅 ${eventDateStr}\n👨‍🍳 ${gmName} via Tech Churras\n\nAcompanhe ao vivo:\n${url}`
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
      }
    } finally {
      setShareLoading(false)
    }
  }

  if (loading) return <p className="text-gray-400 p-6">Carregando...</p>
  if (!order) return <p className="text-gray-400 p-6">Pedido nao encontrado.</p>

  const { user } = authRef.current
  const isGrillmaster = user?.role === 'GRILLMASTER'
  const isOrderGrillmaster = isGrillmaster && order.grillmaster?.user?.id === user?.id
  const nextAction = isOrderGrillmaster ? getNextAction(order.status, order.statusDetail) : null
  const canCancel = ['PENDING', 'CONFIRMED'].includes(order.status)
  const feePreview = canCancel ? computeFeePreview(order) : null

  const gmCost = order.grillmaster?.pricePerHour
    ? order.grillmaster.pricePerHour * order.eventHours
    : null
  const itemsCost = order.items?.reduce((s, i) => s + i.quantity * i.unitPrice, 0) ?? 0
  const otherPersonName = isOrderGrillmaster
    ? (order.customer?.name ?? 'o cliente')
    : (order.grillmaster?.user?.name ?? 'o churrasqueiro')

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/orders" className="text-sm text-gray-400 hover:text-white mb-6 inline-block">
        &larr; Voltar para pedidos
      </Link>

      {/* Payment success banner */}
      {paymentResult === 'success' && order && (
        <div className="mb-6 bg-green-900/30 border border-green-500/40 rounded-2xl p-5">
          <div className="text-center mb-4">
            <p className="text-5xl mb-3 animate-pulseScale">🎉</p>
            <h2 className="text-xl font-black text-green-300 mb-1">Churrasco reservado!</h2>
            <p className="text-gray-400 text-sm">
              {order.grillmaster?.user?.name ?? 'O churrasqueiro'} foi notificado e confirmará em breve.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => {
                const gmName = order.grillmaster?.user?.name ?? 'churrasqueiro'
                const date = new Date(order.eventDate).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
                const msg = `🔥 Churrasco marcado!\n\nCom ${gmName} em ${date}.\nContratei via Tech Churras.\n\nAcompanhe ao vivo pelo link:\nhttps://www.techchurras.com.br/orders/${order.id}`
                window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
              }}
              className="flex-1 min-w-max inline-flex items-center justify-center gap-2 bg-green-600/20 hover:bg-green-600/30 border border-green-600/40 text-green-400 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              Compartilhar
            </button>
            <button
              onClick={() => {
                const start = new Date(order.eventDate)
                const end = new Date(start.getTime() + (order.eventHours || 4) * 3600 * 1000)
                const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'
                const gmName = order.grillmaster?.user?.name ?? 'Churrasqueiro Tech Churras'
                const title = `Churrasco com ${gmName}`
                const details = `Evento confirmado pela Tech Churras. Acompanhe: https://www.techchurras.com.br/orders/${order.id}`
                const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(order.eventAddress ?? '')}`
                window.open(url, '_blank')
              }}
              className="flex-1 min-w-max inline-flex items-center justify-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/40 text-blue-400 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Google Calendar
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Pedido #{order.id.slice(0, 8)}</h1>
        <span className={'text-sm text-white px-3 py-1 rounded-full font-medium ' + (STATUS_COLOR[order.status] || 'bg-gray-500')}>
          {STATUS_LABEL[order.status] || order.status}
        </span>
      </div>

      {/* Journey Timeline */}
      {order.status !== 'CANCELLED' && (() => {
        const journeySteps = [
          { label: 'Pedido feito', icon: '📋' },
          { label: 'Pagamento confirmado', icon: '💳' },
          { label: 'Churrasqueiro a caminho', icon: '🚗' },
          { label: 'Churrasco em andamento', icon: '🔥' },
          { label: 'Concluído', icon: '🎉' },
        ]
        let currentStep = 0
        if (order.status === 'CONFIRMED') {
          currentStep = order.statusDetail === 'Churrasqueiro a caminho' ? 2 : 1
        } else if (order.status === 'IN_PROGRESS') {
          currentStep = 3
        } else if (order.status === 'COMPLETED') {
          currentStep = 5
        }
        return (
          <div className="bg-gray-900 rounded-2xl p-5 mb-5 border border-gray-800">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-4">Acompanhe seu pedido</p>
            <div className="space-y-0">
              {journeySteps.map((step, i) => {
                const isDone = i < currentStep
                const isCurrent = i === currentStep
                return (
                  <div key={step.label} className="flex gap-3 items-start">
                    <div className="flex flex-col items-center">
                      <div className={[
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0',
                        isDone ? 'bg-green-500 text-white' : isCurrent ? 'bg-orange-500 text-white ring-4 ring-orange-500/20' : 'bg-gray-800 text-gray-600',
                      ].join(' ')}>
                        {isDone ? '✓' : step.icon}
                      </div>
                      {i < journeySteps.length - 1 && (
                        <div className={['w-0.5 flex-1 min-h-[16px] my-1', isDone ? 'bg-green-500/40' : 'bg-gray-800'].join(' ')} />
                      )}
                    </div>
                    <div className="py-1.5">
                      <p className={[
                        'text-sm',
                        isDone ? 'text-gray-500' : isCurrent ? 'text-white font-semibold' : 'text-gray-600',
                      ].join(' ')}>
                        {step.label}
                      </p>
                      {isCurrent && order.statusDetail && order.statusDetail !== step.label && (
                        <p className="text-xs text-orange-400/80 mt-0.5">{order.statusDetail}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Payment CTA for customer — when confirmed but not yet paid */}
      {!isGrillmaster && order.status === 'CONFIRMED' && order.paymentStatus !== 'PAID' && (
        <div className="bg-orange-500/10 border border-orange-500/40 rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">💳</span>
            <div>
              <p className="font-bold text-white">Confirme o pagamento</p>
              <p className="text-xs text-gray-400">Seu churrasco está reservado — finalize o pagamento para garantir</p>
            </div>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-400">Total do evento</span>
            <span className="text-xl font-black text-white">
              R$ {order.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <button
            onClick={handlePayNow}
            disabled={payingNow}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-base"
          >
            {payingNow ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Aguarde...
              </>
            ) : (
              <>💳 Pagar agora</>
            )}
          </button>
          <p className="text-center text-xs text-gray-600 mt-2">Pix, cartão de crédito ou débito via Mercado Pago</p>
        </div>
      )}

      {/* Customer profile for grillmaster — shown above action button */}
      {isOrderGrillmaster && order.customer && (
        <div className="bg-gray-900 rounded-2xl p-5 mb-5 border border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Cliente</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">{order.customer.name}</p>
              {order.customer._count?.orders != null && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {order.customer._count.orders} {order.customer._count.orders === 1 ? 'pedido' : 'pedidos'} na plataforma
                </p>
              )}
            </div>
            {order.customer.averageRating != null ? (
              <div className="flex flex-col items-end gap-1">
                <Stars n={order.customer.averageRating} />
                <span className="text-xs text-gray-400">{order.customer.averageRating.toFixed(1)} / 5</span>
              </div>
            ) : (
              <span className="text-xs text-gray-600 bg-gray-800 px-2.5 py-1 rounded-full">Novo cliente</span>
            )}
          </div>
          {order.status === 'COMPLETED' && !order.review?.customerRating && (
            <Link
              href={`/orders/${id}/review-customer`}
              className="mt-3 inline-block text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-3 py-1.5 rounded-lg hover:bg-orange-500/30 transition-colors"
            >
              Avaliar este cliente
            </Link>
          )}
        </div>
      )}

      {isOrderGrillmaster && nextAction && (
        <button
          onClick={advanceStatus}
          disabled={advancing}
          className="mb-5 w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
        >
          {advancing
            ? 'Aguarde...'
            : nextAction.type === 'substate'
              ? 'Avançar: ' + nextAction.value
              : NEXT_MAIN_LABEL[nextAction.value] ?? 'Avançar'}
        </button>
      )}

      {/* Cancellation info */}
      {order.status === 'CANCELLED' && (
        <div className="bg-red-950/40 rounded-2xl p-5 mb-5 border border-red-800/50">
          <p className="text-xs text-red-400 uppercase tracking-wide mb-2 font-semibold">Pedido Cancelado</p>
          {order.cancelledBy && (
            <p className="text-sm text-gray-300 mb-1">
              Cancelado por: <span className="text-white font-medium">
                {order.cancelledBy === 'CUSTOMER' ? 'Cliente' : order.cancelledBy === 'GRILLMASTER' ? 'Churrasqueiro' : 'Administracao'}
              </span>
            </p>
          )}
          {order.cancellationReason && (
            <p className="text-sm text-gray-300 mb-1">
              Motivo: <span className="text-gray-200">{order.cancellationReason}</span>
            </p>
          )}
          {order.cancellationFee != null && order.cancellationFee > 0 && (
            <p className="text-sm text-red-400 mt-2 font-semibold">
              Multa: R$ {order.cancellationFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          )}
          {order.refundAmount != null && (
            <p className="text-sm text-green-400">
              Reembolso: R$ {order.refundAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          )}
        </div>
      )}

      {/* Map when grillmaster is on the way */}
      {order.statusDetail === 'Churrasqueiro a caminho' && (
        <div className="mb-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Rastreamento</p>
          <OrderMap
            eventAddress={order.eventAddress}
            grillmasterLat={order.grillmasterLat}
            grillmasterLng={order.grillmasterLng}
          />
        </div>
      )}

      {/* Order details */}
      <div className="bg-gray-900 rounded-2xl divide-y divide-gray-800 border border-gray-800 mb-5">
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

        {order.boutique && (
          <div className="p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Acougue</p>
            <p className="font-semibold">{order.boutique.name}</p>
          </div>
        )}

        <div className="p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Data do Evento</p>
          <p className="font-semibold mb-2">
            {new Date(order.eventDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
          {order.status !== 'CANCELLED' && (() => {
            const start = new Date(order.eventDate)
            const end = new Date(start.getTime() + (order.eventHours ?? 4) * 3600000)
            const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
            const gmName = order.grillmaster?.user?.name ?? 'Churrasqueiro'
            const gcUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Churrasco — Tech Churras')}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(`Churrasqueiro: ${gmName}\nContratado via Tech Churras`)}&location=${encodeURIComponent(order.eventAddress)}`
            return (
              <a href={gcUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Adicionar ao Google Calendar
              </a>
            )
          })()}
        </div>

        <div className="p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Endereco</p>
          <p className="font-semibold mb-2">{order.eventAddress}</p>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.eventAddress)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
            Como chegar (Google Maps)
          </a>
        </div>

        <div className="p-5 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Horas de Servico</p>
            <p className="font-semibold">{order.eventHours}h</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Convidados</p>
            <p className="font-semibold">{order.guestCount} pessoas</p>
          </div>
        </div>

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

        {order.notes && (
          <div className="p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Observacoes</p>
            <p className="text-sm text-gray-300 whitespace-pre-line">{order.notes}</p>
          </div>
        )}

        <div className="p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Resumo</p>
          <div className="space-y-1.5 text-sm">
            {gmCost != null && (
              <div className="flex justify-between text-gray-400">
                <span>Mao de obra ({order.eventHours}h)</span>
                <span>R$ {gmCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {itemsCost > 0 && (
              <div className="flex justify-between text-gray-400">
                <span>Insumos{order.boutique ? ' — ' + order.boutique.name : ''}</span>
                <span>R$ {itemsCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {(order.discountAmount ?? 0) > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Desconto{order.couponCode ? ' (' + order.couponCode + ')' : ''}</span>
                <span>- R$ {(order.discountAmount ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
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

      {/* Chat */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden mb-5">
        <div className="p-4 border-b border-gray-800">
          <p className="text-sm font-semibold">Chat do Pedido</p>
          <p className="text-xs text-gray-500 mt-0.5">Comunique-se com {otherPersonName}</p>
        </div>

        <div className="h-72 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-xs text-gray-600 py-8">Nenhuma mensagem ainda. Inicie a conversa!</p>
          )}
          {messages.map(msg => {
            const isMine = msg.senderId === user?.id
            return (
              <div key={msg.id} className={'flex ' + (isMine ? 'justify-end' : 'justify-start')}>
                <div className="max-w-[75%]">
                  {!isMine && (
                    <p className="text-xs text-gray-500 mb-1 ml-1">{msg.sender?.name ?? 'Desconhecido'}</p>
                  )}
                  <div className={'px-3 py-2 rounded-2xl text-sm ' + (isMine ? 'bg-orange-500 text-white rounded-tr-sm' : 'bg-gray-800 text-gray-100 rounded-tl-sm')}>
                    {msg.content}
                  </div>
                  <p className={'text-[10px] mt-0.5 ' + (isMine ? 'text-right text-gray-500' : 'text-gray-600')}>
                    {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMsg} className="p-3 border-t border-gray-800 flex gap-2">
          <input
            type="text"
            value={msgInput}
            onChange={e => setMsgInput(e.target.value)}
            placeholder="Digite uma mensagem..."
            className="flex-1 bg-gray-800 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-orange-500"
          />
          <button
            type="submit"
            disabled={!msgInput.trim() || sending}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
          >
            Enviar
          </button>
        </form>
      </div>

      {/* Avaliar button for customer */}
      {!isGrillmaster && order.status === 'COMPLETED' && !order.review?.id && (
        <Link
          href={`/orders/${id}/review`}
          className="block text-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors mb-4"
        >
          &#9733; Avaliar churrasqueiro
        </Link>
      )}

      {/* Share buttons */}
      <div className="mb-4 space-y-2 relative">
        <button
          onClick={shareWhatsApp}
          disabled={shareLoading}
          className="w-full flex items-center justify-center gap-2 bg-green-600/20 hover:bg-green-600/30 border border-green-600/40 text-green-400 hover:text-green-300 font-medium py-2.5 rounded-xl text-sm transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          {shareLoading ? 'Gerando link...' : 'Compartilhar no WhatsApp'}
        </button>
        <button
          onClick={handleShare}
          disabled={shareLoading}
          className="w-full border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white font-medium py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Copiar link de acompanhamento
        </button>
        {shareToast && (
          <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-4 py-2 rounded-lg whitespace-nowrap shadow-lg z-10">
            {shareToast}
          </div>
        )}
      </div>

      {/* Cancel button */}
      {canCancel && (
        <button
          onClick={() => setCancelModalOpen(true)}
          className="w-full border border-red-800/60 hover:border-red-600 text-red-400 hover:text-red-300 font-medium py-2.5 rounded-xl text-sm transition-colors"
        >
          Cancelar pedido
        </button>
      )}

      {/* Cancel modal */}
      {cancelModalOpen && feePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-700 shadow-2xl">
            <h2 className="text-lg font-bold mb-1">Cancelar pedido</h2>
            <p className="text-xs text-gray-500 mb-4">#{order.id.slice(0, 8)}</p>

            <div className={[
              'rounded-xl p-4 mb-5 text-sm',
              feePreview.isFree
                ? 'bg-green-500/10 border border-green-500/30 text-green-300'
                : 'bg-red-500/10 border border-red-500/30 text-red-300',
            ].join(' ')}>
              {feePreview.label}
            </div>

            <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">
              Motivo do cancelamento (opcional)
            </label>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Descreva o motivo..."
              rows={3}
              className="w-full bg-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-red-500 resize-none mb-5"
            />

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-colors"
              >
                {cancelling ? 'Cancelando...' : 'Confirmar cancelamento'}
              </button>
              <button
                onClick={() => { setCancelModalOpen(false); setCancelReason('') }}
                disabled={cancelling}
                className="px-5 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 text-sm transition-colors"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}