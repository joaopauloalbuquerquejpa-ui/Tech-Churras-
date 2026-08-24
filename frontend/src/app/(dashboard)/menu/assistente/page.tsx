'use client'
import { API_URL } from '@/lib/api'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useCartStore } from '@/store/cart'

function getToken() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
}

function getCustomerName(): string {
  try {
    const raw = localStorage.getItem('auth-storage')
    return JSON.parse(raw ?? '{}')?.state?.user?.name ?? ''
  } catch { return '' }
}

interface AiItem {
  category: string
  name: string
  quantity: number
  unit: string
  reason: string
  estimatedPrice: number
  priority: 'essencial' | 'recomendado' | 'opcional'
}

interface AiPlan {
  intro: string
  totalKg: number
  estimatedCost: number
  items: AiItem[]
  tips: string[]
  schedule: string
  howItsMade?: { name: string; origin: string; description: string }[]
}

interface Product {
  id: string
  name: string
  category: string
  price: number
  unit: string
}

interface ChatMsg {
  role: 'user' | 'ai'
  text?: string
  plan?: AiPlan
}

const PRIORITY_COLOR: Record<string, string> = {
  essencial:   'border-orange-500/60 bg-orange-500/5',
  recomendado: 'border-amber-500/40 bg-amber-500/5',
  opcional:    'border-gray-700 bg-gray-900',
}
const PRIORITY_BADGE: Record<string, string> = {
  essencial:   'bg-orange-500 text-white',
  recomendado: 'bg-amber-500 text-black',
  opcional:    'bg-gray-700 text-gray-300',
}
const CATEGORY_EMOJI: Record<string, string> = {
  CARNE: '🥩', ACOMPANHAMENTO: '🧀', SAL_TEMPERO: '🧂', CARVAO: '⚫', BEBIDA: '🍺', OUTRO: '📦',
}

const QUICK_ACTIONS = [
  'Tenho 15 pessoas, aniversário',
  'Me ajuda a calcular a quantidade',
  'Quero algo premium com cortes nobres',
  'Churrasco no estilo gaúcho',
]

function matchProduct(item: AiItem, products: Product[]): Product | undefined {
  const nameLower = item.name.toLowerCase()
  return products.find(p =>
    p.name.toLowerCase().includes(nameLower.split(' ')[0]) ||
    nameLower.includes(p.name.toLowerCase().split(' ')[0])
  )
}

function PlanCard({ plan, products, addedIds, onAdd, onAddAll }: {
  plan: AiPlan
  products: Product[]
  addedIds: Set<string>
  onAdd: (item: AiItem) => void
  onAddAll: () => void
}) {
  const canAddToCart = products.length > 0
  return (
    <div className="space-y-3 w-full">
      <div className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-950/40 via-gray-900 to-gray-900 p-4">
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-orange-500/5 blur-2xl pointer-events-none" />
        <p className="text-white leading-relaxed text-sm">{plan.intro}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold">
            {plan.totalKg.toFixed(1)} kg de proteína
          </span>
          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            ~R$ {plan.estimatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {canAddToCart && (
        <button onClick={onAddAll}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
        >
          🛒 Adicionar essenciais ao carrinho
        </button>
      )}

      <div className="space-y-1.5">
        {plan.items.map((item, i) => {
          const isAdded = addedIds.has(item.name)
          const canAdd = canAddToCart && !!matchProduct(item, products)
          return (
            <div key={i}
              className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${isAdded ? 'border-green-500/40 bg-green-500/5' : PRIORITY_COLOR[item.priority]}`}
            >
              <span className="text-base shrink-0">{CATEGORY_EMOJI[item.category] ?? '📦'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-white text-xs">{item.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${PRIORITY_BADGE[item.priority]}`}>
                    {item.priority}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">{item.reason}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-orange-400">{item.quantity} {item.unit}</p>
                <p className="text-[10px] text-gray-500">~R${item.estimatedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              {canAddToCart && (
                <button onClick={() => onAdd(item)} disabled={isAdded || !canAdd}
                  className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all text-sm ${
                    isAdded ? 'bg-green-500/20 text-green-400 cursor-default'
                    : canAdd ? 'bg-orange-500/20 hover:bg-orange-500/40 text-orange-400'
                    : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  {isAdded ? '✓' : '+'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {plan.tips.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">💡 Dicas</p>
          <ul className="space-y-1">
            {plan.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                <span className="text-orange-500 shrink-0 mt-0.5">◆</span>{tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {plan.schedule && (
        <div className="px-3 py-2.5 rounded-xl border border-gray-700 bg-gray-800/30 flex items-start gap-2">
          <span className="shrink-0">🕐</span>
          <p className="text-xs text-gray-300">{plan.schedule}</p>
        </div>
      )}

      <Link href="/menu/novo"
        className="block w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3 rounded-xl text-sm transition-all text-center shadow-lg shadow-orange-500/20"
      >
        Montar pedido completo →
      </Link>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-sm shrink-0">
        🔥
      </div>
      <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          {[0, 0.2, 0.4].map((delay, i) => (
            <motion.div key={i}
              animate={{ y: [-3, 0, -3] }}
              transition={{ repeat: Infinity, duration: 0.8, delay, ease: 'easeInOut' }}
              className="w-1.5 h-1.5 rounded-full bg-gray-400"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AssistentePage() {
  const { boutiqueId, selectedQty, setSelectedQty } = useCartStore()

  const [messages, setMessages]       = useState<ChatMsg[]>([])
  const [input, setInput]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [addedIds, setAddedIds]       = useState<Set<string>>(new Set())
  const [boutiqueProducts, setBoutiqueProducts] = useState<Product[]>([])
  const [apiHistory, setApiHistory]   = useState<{ role: 'user' | 'assistant'; content: string }[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLInputElement>(null)

  // Greeting on mount
  useEffect(() => {
    const name = getCustomerName()
    const firstName = name.split(' ')[0]
    const greeting = firstName
      ? `${firstName}, que bom ter você aqui! 🔥 Vou te ajudar a planejar o churrasco perfeito. Me conta: quantas pessoas vêm e qual é a ocasião?`
      : `Boa! Vou te ajudar a planejar o churrasco perfeito. 🔥 Me conta: quantas pessoas vêm e qual é a ocasião?`
    setMessages([{ role: 'ai', text: greeting }])
  }, [])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Load boutique products if connected
  useEffect(() => {
    if (!boutiqueId) return
    fetch(`${API_URL}/boutiques/${boutiqueId}/products`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then(r => r.ok ? r.json() : null).then(data => {
      if (data) setBoutiqueProducts(Array.isArray(data) ? data : data.products ?? [])
    }).catch(() => {})
  }, [boutiqueId])

  async function generatePlan(params: { style: string; homens: number; mulheres: number; criancas: number; hours: number; occasion: string }) {
    const r = await fetch(`${API_URL}/ai/plan-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ ...params, customerName: getCustomerName() }),
    })
    if (!r.ok) return null
    const data = await r.json()
    return (data.plan as AiPlan) || null
  }

  async function send(text: string) {
    if (!text.trim() || loading) return
    setInput('')
    setLoading(true)
    setMessages(prev => [...prev, { role: 'user', text }])

    const newHistory = [...apiHistory, { role: 'user' as const, content: text }]
    setApiHistory(newHistory)

    try {
      const r = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ messages: newHistory, customerName: getCustomerName() }),
      })
      if (!r.ok) throw new Error()
      const data = await r.json()
      const rawReply: string = data.reply || ''

      // planParams já vem validado pelo schema estrito da tool no backend —
      // não é mais um marcador de texto pra extrair/parsear aqui.
      let plan: AiPlan | undefined
      if (data.planParams) {
        try {
          plan = await generatePlan(data.planParams) ?? undefined
        } catch { /* ignore */ }
      }

      // A API da Anthropic rejeita content vazio num turno de histórico — a IA
      // pode chamar a tool generate_plan sem nenhum texto antes (o system
      // prompt pede, mas não obriga), o que deixaria rawReply === '' aqui.
      const historyContent = rawReply || 'Beleza, montando o plano pra você! 🔥'
      setApiHistory(prev => [...prev, { role: 'assistant', content: historyContent }])
      setMessages(prev => [...prev, { role: 'ai', text: rawReply || undefined, plan }])
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Tive um probleminha aqui, pode repetir? 🙏' }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  function addToCart(item: AiItem) {
    if (!boutiqueId || !boutiqueProducts.length) return
    const product = matchProduct(item, boutiqueProducts)
    if (!product) return
    const current = selectedQty[product.id] ?? 0
    setSelectedQty({ ...selectedQty, [product.id]: Math.max(current, Math.ceil(item.quantity)) })
    setAddedIds(prev => new Set(prev).add(item.name))
  }

  function addAllToCart(plan: AiPlan) {
    if (!boutiqueId || !boutiqueProducts.length) return
    const next = { ...selectedQty }
    plan.items.filter(i => i.priority !== 'opcional').forEach(item => {
      const product = matchProduct(item, boutiqueProducts)
      if (product) {
        next[product.id] = Math.max(next[product.id] ?? 0, Math.ceil(item.quantity))
        setAddedIds(prev => new Set(prev).add(item.name))
      }
    })
    setSelectedQty(next)
  }

  const showQuickActions = messages.length <= 1 && !loading

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)] max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-gray-800 shrink-0">
        <Link href="/menu" className="text-gray-500 hover:text-gray-300 text-sm mr-1">←</Link>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-lg shadow-lg shadow-orange-500/30">
          🔥
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-none">Tech Churras IA</p>
          <p className="text-xs text-green-400 mt-0.5">Online agora</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {msg.role === 'ai' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-sm shrink-0 mb-0.5">
                🔥
              </div>
            )}
            <div className={`max-w-[85%] flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {msg.text && (
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-orange-500 text-white rounded-br-sm'
                    : 'bg-gray-800 border border-gray-700 text-gray-200 rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
              )}
              {msg.plan && (
                <PlanCard
                  plan={msg.plan}
                  products={boutiqueProducts}
                  addedIds={addedIds}
                  onAdd={addToCart}
                  onAddAll={() => addAllToCart(msg.plan!)}
                />
              )}
            </div>
          </motion.div>
        ))}

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <TypingIndicator />
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick action chips */}
      <AnimatePresence>
        {showQuickActions && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="px-4 pb-2 flex gap-2 overflow-x-auto shrink-0"
            style={{ scrollbarWidth: 'none' }}
          >
            {QUICK_ACTIONS.map(action => (
              <button key={action} onClick={() => send(action)}
                className="shrink-0 px-3 py-1.5 bg-gray-800 border border-gray-700 hover:border-orange-500/50 text-gray-300 text-xs rounded-full transition-all whitespace-nowrap"
              >
                {action}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className="px-4 pb-4 pt-2 border-t border-gray-800 shrink-0">
        <form onSubmit={e => { e.preventDefault(); send(input) }} className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            placeholder="Escreva sua mensagem..."
            className="flex-1 bg-gray-800 border border-gray-700 focus:border-orange-500 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-11 h-11 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-500 text-white flex items-center justify-center transition-all shrink-0 text-lg font-bold"
          >
            {loading ? '⏳' : '↑'}
          </button>
        </form>
      </div>

    </div>
  )
}
