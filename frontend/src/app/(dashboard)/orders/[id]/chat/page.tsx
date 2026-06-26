'use client'
import { API_URL } from '@/lib/api'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function getAuth() {
  const raw = localStorage.getItem('auth-storage')
  if (!raw) return { token: null, user: null }
  const s = JSON.parse(raw)?.state
  return { token: s?.token ?? null, user: s?.user ?? null }
}

interface Message {
  id: string
  content: string
  createdAt: string
  senderId: string
  read: boolean
  sender: { id: string; name: string; role: string }
}

interface OrderInfo {
  id: string
  grillmaster?: { user?: { id: string; name: string } }
  boutique?: { name: string }
  customerId: string
  customer?: { name: string }
}

export default function ChatPage() {
  const router = useRouter()
  const { id } = useParams() as { id: string }

  const [messages, setMessages] = useState<Message[]>([])
  const [order, setOrder] = useState<OrderInfo | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const authRef = useRef(getAuth())
  const inputRef = useRef<HTMLInputElement>(null)

  const user = authRef.current.user
  const token = authRef.current.token

  const otherName = (() => {
    if (!order || !user) return 'Parceiro'
    if (user.id === order.customerId) return order.grillmaster?.user?.name ?? 'Churrasqueiro'
    return order.customer?.name ?? 'Cliente'
  })()

  useEffect(() => {
    authRef.current = getAuth()
    if (!authRef.current.token) { router.push('/login'); return }
    fetchOrder()
    fetchMessages()
    markRead()

    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseKey || supabaseKey === 'sua_anon_key_aqui') {
      const interval = setInterval(() => { fetchMessages(); markRead() }, 4000)
      return () => clearInterval(interval)
    }

    let channel: any
    ;(async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, supabaseKey)
      channel = supabase.channel(`chat-${id}`)
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
    try {
      const res = await fetch(`${API_URL}/orders/${id}`, {
        headers: { Authorization: `Bearer ${authRef.current.token}` },
      })
      if (res.ok) setOrder(await res.json())
    } catch { /* silent */ } finally { setLoading(false) }
  }

  async function fetchMessages() {
    try {
      const res = await fetch(`${API_URL}/orders/${id}/messages`, {
        headers: { Authorization: `Bearer ${authRef.current.token}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setMessages(data)
      }
    } catch { /* silent */ }
  }

  function markRead() {
    fetch(`${API_URL}/orders/${id}/messages/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authRef.current.token}` },
    }).catch(() => {})
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || sending) return
    const content = input.trim()
    setInput('')
    setSending(true)
    try {
      const res = await fetch(`${API_URL}/orders/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content }),
      })
      if (res.ok) {
        await fetchMessages()
        markRead()
        inputRef.current?.focus()
      }
    } finally { setSending(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="w-8 h-8 rounded-full border-2 border-gray-700 border-t-orange-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-black">
      {/* Header fixo */}
      <div className="shrink-0 bg-gray-950 border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <Link href={`/orders/${id}`} className="text-gray-400 hover:text-white p-1 -ml-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{otherName}</p>
          <p className="text-gray-500 text-xs truncate">Pedido #{id.slice(0, 8)}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shrink-0">
          <span className="text-orange-400 text-sm font-bold">{otherName[0]?.toUpperCase()}</span>
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p className="text-gray-500 text-sm font-medium">Nenhuma mensagem ainda</p>
            <p className="text-gray-600 text-xs mt-1">Fale diretamente com {otherName}</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMine = msg.senderId === user?.id
          const prevMsg = messages[i - 1]
          const showName = !isMine && msg.sender?.name !== prevMsg?.sender?.name

          return (
            <div key={msg.id} className={'flex ' + (isMine ? 'justify-end' : 'justify-start')}>
              <div className={'max-w-[78%] ' + (isMine ? '' : 'flex gap-2 items-end')}>
                {!isMine && (
                  <div className="w-7 h-7 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0 mb-1">
                    <span className="text-xs text-gray-400 font-bold">{msg.sender?.name?.[0]?.toUpperCase()}</span>
                  </div>
                )}
                <div>
                  {showName && (
                    <p className="text-xs text-gray-500 mb-1 ml-1">{msg.sender?.name}</p>
                  )}
                  <div className={[
                    'px-3.5 py-2.5 text-sm leading-relaxed',
                    isMine
                      ? 'bg-orange-500 text-white rounded-2xl rounded-tr-sm'
                      : 'bg-gray-800 text-gray-100 rounded-2xl rounded-tl-sm',
                  ].join(' ')}>
                    {msg.content}
                  </div>
                  <p className={'text-[10px] mt-1 ' + (isMine ? 'text-right text-gray-600' : 'text-gray-700 ml-1')}>
                    {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    {isMine && (
                      <span className="ml-1 text-gray-600">{msg.read ? '✓✓' : '✓'}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input fixo no fundo */}
      <form
        onSubmit={handleSend}
        className="shrink-0 bg-gray-950 border-t border-gray-800 px-3 py-3 flex items-end gap-2"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={`Mensagem para ${otherName}...`}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-orange-500 transition-colors resize-none"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </form>
    </div>
  )
}
