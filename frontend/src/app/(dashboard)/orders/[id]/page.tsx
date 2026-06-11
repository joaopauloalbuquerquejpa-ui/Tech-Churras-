'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const BASE = 'https://tech-churras-production.up.railway.app'

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
  CONFIRMED: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED',
}

const NEXT_MAIN_LABEL: Record<string, string> = {
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
  customer?: { id: string; name: string; averageRating?: number | null }
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
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [msgInput, setMsgInput] = useState('')
  const [sending, setSending] = useState(false)
  const [advancing, setAdvancing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const authRef = useRef<ReturnType<typeof getAuth>>({ token: null, user: null })

  useEffect(() => {
    authRef.current = getAuth()
    if (!authRef.current.token) { router.push('/login'); return }
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

  async function fetchOrder() {
    const { token } = authRef.current
    try {
      const res = await fetch(`${BASE}/orders/${id}`, { headers: { Authorization: 'Bearer ' + token } })
      if (res.ok) setOrder(await res.json())
    } finally {
      setLoading(false)
    }
  }

  async function fetchMessages() {
    const { token } = authRef.current
    const res = await fetch(`${BASE}/orders/${id}/messages`, { headers: { Authorization: 'Bearer ' + token } })
    if (res.ok) setMessages(await res.json())
  }

  async function markRead() {
    const { token } = authRef.current
    fetch(`${BASE}/orders/${id}/messages/read`, {
      method: 'PATCH', headers: { Authorization: 'Bearer ' + token },
    }).catch(() => {})
  }

  async function sendMsg(e: React.FormEvent) {
    e.preventDefault()
    if (!msgInput.trim() || sending) return
    setSending(true)
    const { token } = authRef.current
    try {
      const res = await fetch(`${BASE}/orders/${id}/messages`, {
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
        const res = await fetch(`${BASE}/orders/${id}/status-detail`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
          body: JSON.stringify({ statusDetail: action.value }),
        })
        if (res.ok) setOrder(prev => prev ? { ...prev, statusDetail: action.value } : prev)
      } else {
        const res = await fetch(`${BASE}/orders/${id}/status`, {
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

  if (loading) return <p className="text-gray-400 p-6">Carregando...</p>
  if (!order) return <p className="text-gray-400 p-6">Pedido nao encontrado.</p>

  const { user } = authRef.current
  const isGrillmaster = user?.role === 'GRILLMASTER'
  const isOrderGrillmaster = isGrillmaster && order.grillmaster?.user?.id === user?.id
  const nextAction = isOrderGrillmaster ? getNextAction(order.status, order.statusDetail) : null

  const gmCost = order.grillmaster?.pricePerHour
    ? order.grillmaster.pricePerHour * order.eventHours
    : null
  const itemsCost = order.items?.reduce((s, i) => s + i.quantity * i.unitPrice, 0) ?? 0
  const substates = STATUS_SUBSTATES[order.status] ?? []
  const currentSubIdx = order.statusDetail ? substates.indexOf(order.statusDetail) : -1
  const otherPersonName = isOrderGrillmaster
    ? (order.customer?.name ?? 'o cliente')
    : (order.grillmaster?.user?.name ?? 'o churrasqueiro')

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

      {/* Timeline */}
      {substates.length > 0 && (
        <div className="bg-gray-900 rounded-2xl p-5 mb-5 border border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-4">Progresso</p>
          <div className="space-y-0">
            {substates.map((sub, i) => {
              const isDone = i < currentSubIdx
              const isCurrent = i === currentSubIdx
              return (
                <div key={sub} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={[
                      'w-3 h-3 rounded-full mt-1 shrink-0',
                      isDone ? 'bg-orange-500' : isCurrent ? 'bg-orange-500 ring-2 ring-orange-500/40' : 'bg-gray-700',
                    ].join(' ')} />
                    {i < substates.length - 1 && (
                      <div className={['w-0.5 flex-1 min-h-[20px]', isDone || isCurrent ? 'bg-orange-500/40' : 'bg-gray-700'].join(' ')} />
                    )}
                  </div>
                  <p className={[
                    'text-sm pb-4',
                    isDone ? 'text-gray-600 line-through' : isCurrent ? 'text-orange-400 font-semibold' : 'text-gray-600',
                  ].join(' ')}>
                    {sub}
                  </p>
                </div>
              )
            })}
          </div>

          {isOrderGrillmaster && nextAction && (
            <button
              onClick={advanceStatus}
              disabled={advancing}
              className="mt-2 w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
            >
              {advancing
                ? 'Aguarde...'
                : nextAction.type === 'substate'
                  ? 'Avançar: ' + nextAction.value
                  : NEXT_MAIN_LABEL[nextAction.value] ?? 'Avançar'}
            </button>
          )}
        </div>
      )}

      {/* Customer info for grillmaster */}
      {isOrderGrillmaster && order.customer && (
        <div className="bg-gray-900 rounded-2xl p-5 mb-5 border border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Cliente</p>
          <div className="flex items-center justify-between">
            <p className="font-semibold">{order.customer.name}</p>
            {order.customer.averageRating != null ? (
              <div className="flex items-center gap-1.5">
                <Stars n={order.customer.averageRating} />
                <span className="text-sm text-gray-400">{order.customer.averageRating.toFixed(1)}</span>
              </div>
            ) : (
              <span className="text-xs text-gray-600">Sem avaliacoes</span>
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
          <p className="font-semibold">
            {new Date(order.eventDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Endereco</p>
          <p className="font-semibold">{order.eventAddress}</p>
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
          className="block text-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors"
        >
          &#9733; Avaliar churrasqueiro
        </Link>
      )}
    </div>
  )
}
