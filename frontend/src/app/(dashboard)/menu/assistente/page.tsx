'use client'
import { useState, useRef } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import Link from 'next/link'
import { useCartStore } from '@/store/cart'

const BASE = 'https://tech-churras-production.up.railway.app'

function getToken() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
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

interface HowItsMadeItem {
  name: string
  origin: string
  description: string
}

interface AiPlan {
  intro: string
  totalKg: number
  estimatedCost: number
  items: AiItem[]
  tips: string[]
  schedule: string
  howItsMade?: HowItsMadeItem[]
}

interface Product {
  id: string
  name: string
  category: string
  price: number
  unit: string
}

const STYLES = [
  { value: 'menu_tech_churras',       label: 'Menu Tech Churras',       icon: '🔥' },
  { value: 'parrillada_tech_churras', label: 'Parrillada Tech Churras', icon: '🐄' },
  { value: 'especialidade_jota',      label: 'Especialidade Jota',      icon: '⭐' },
]

const PRIORITY_COLOR: Record<string, string> = {
  essencial:    'border-orange-500/60 bg-orange-500/5',
  recomendado:  'border-amber-500/40 bg-amber-500/5',
  opcional:     'border-gray-700 bg-gray-900',
}

const PRIORITY_BADGE: Record<string, string> = {
  essencial:   'bg-orange-500 text-white',
  recomendado: 'bg-amber-500 text-black',
  opcional:    'bg-gray-700 text-gray-300',
}

const CATEGORY_EMOJI: Record<string, string> = {
  CARNE: '🥩', ACOMPANHAMENTO: '🧀', SAL_TEMPERO: '🧂', CARVAO: '⚫', BEBIDA: '🍺', OUTRO: '📦',
}

function matchProduct(item: AiItem, products: Product[]): Product | undefined {
  const nameLower = item.name.toLowerCase()
  return products.find(p =>
    p.name.toLowerCase().includes(nameLower.split(' ')[0]) ||
    nameLower.includes(p.name.toLowerCase().split(' ')[0])
  )
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

export default function AssistentePage() {
  const { boutiqueId, selectedQty, setSelectedQty } = useCartStore()

  const [style, setStyle]       = useState('menu_tech_churras')
  const [homens, setHomens]     = useState(8)
  const [mulheres, setMulheres] = useState(6)
  const [criancas, setCriancas] = useState(2)
  const [hours, setHours]       = useState(4)
  const [restrictions, setRestrictions] = useState('')

  const [loading, setLoading]     = useState(false)
  const [plan, setPlan]           = useState<AiPlan | null>(null)
  const [boutiqueProducts, setBoutiqueProducts] = useState<Product[]>([])
  const [addedIds, setAddedIds]   = useState<Set<string>>(new Set())
  const [error, setError]         = useState('')

  const resultRef = useRef<HTMLDivElement>(null)

  async function fetchBoutiqueProducts(id: string) {
    try {
      const r = await fetch(`${BASE}/boutiques/${id}/products`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (r.ok) {
        const data = await r.json()
        setBoutiqueProducts(Array.isArray(data) ? data : data.products ?? [])
      }
    } catch {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    setPlan(null)
    setAddedIds(new Set())

    try {
      const r = await fetch(`${BASE}/ai/plan-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ style, homens, mulheres, criancas, hours, restrictions }),
      })
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        throw new Error(err.error || `Erro ${r.status}`)
      }
      const data = await r.json()
      setPlan(data.plan)

      if (boutiqueId) await fetchBoutiqueProducts(boutiqueId)

      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao consultar o assistente')
    } finally {
      setLoading(false)
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

  function addAllToCart() {
    if (!boutiqueId || !boutiqueProducts.length || !plan) return
    const next = { ...selectedQty }
    plan.items.filter(i => i.priority !== 'opcional').forEach(item => {
      const product = matchProduct(item, boutiqueProducts)
      if (product) {
        const current = next[product.id] ?? 0
        next[product.id] = Math.max(current, Math.ceil(item.quantity))
        setAddedIds(prev => new Set(prev).add(item.name))
      }
    })
    setSelectedQty(next)
  }

  const totalPessoas = homens + mulheres + criancas
  const canAddToCart = boutiqueId && boutiqueProducts.length > 0

  return (
    <div className="max-w-3xl mx-auto">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <Link href="/menu" className="text-gray-500 hover:text-gray-300 text-sm">← Menu</Link>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-xl shadow-lg shadow-orange-500/30">
            🤖
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Tech Churras IA</h1>
            <p className="text-gray-500 text-sm">Planejamento de churrasco por Jota Grillmaster</p>
          </div>
        </div>
      </motion.div>

      {/* ── Formulário ── */}
      <motion.form
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
        onSubmit={handleSubmit}
        className="glass-card p-6 mb-6"
      >
        {/* Estilo */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-300 mb-3">Menu Tech Churras</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {STYLES.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStyle(s.value)}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-xs font-semibold transition-all ${
                  style === s.value
                    ? 'border-orange-500 bg-orange-500/10 text-orange-400 scale-105 shadow-orange-500/20 shadow-md'
                    : 'border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                <span className="text-xl">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Convidados */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-300 mb-3">
            Convidados <span className="text-orange-400 font-bold ml-1">{totalPessoas} pessoas</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Homens', value: homens, set: setHomens, icon: '👨', sub: '400g/pessoa' },
              { label: 'Mulheres', value: mulheres, set: setMulheres, icon: '👩', sub: '300g/pessoa' },
              { label: 'Crianças', value: criancas, set: setCriancas, icon: '🧒', sub: '150g/pessoa' },
            ].map(({ label, value, set, icon, sub }) => (
              <div key={label} className="bg-gray-800/60 border border-gray-700 rounded-xl p-3 text-center">
                <div className="text-xl mb-1">{icon}</div>
                <p className="text-xs text-gray-400 mb-2">{label}</p>
                <div className="flex items-center justify-center gap-2">
                  <button type="button" onClick={() => set(Math.max(0, value - 1))}
                    className="w-7 h-7 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold text-sm transition-colors"
                  >−</button>
                  <span className="text-lg font-bold text-white w-6 text-center">{value}</span>
                  <button type="button" onClick={() => set(value + 1)}
                    className="w-7 h-7 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 font-bold text-sm transition-colors"
                  >+</button>
                </div>
                <p className="text-xs text-gray-600 mt-1">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Duração + Restrições */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Duração (horas)</label>
            <select value={hours} onChange={e => setHours(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500"
            >
              {[2,3,4,5,6,8].map(h => <option key={h} value={h}>{h}h</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Restrições alimentares</label>
            <input
              type="text"
              value={restrictions}
              onChange={e => setRestrictions(e.target.value)}
              placeholder="Ex: sem glúten, vegetariano..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || totalPessoas === 0}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3.5 rounded-xl transition-all text-sm shadow-lg shadow-orange-500/20 disabled:shadow-none flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="inline-block"
              >⚙️</motion.span>
              Tech Churras IA calculando...
            </>
          ) : (
            <>🤖 Planejar com Tech Churras IA</>
          )}
        </button>
      </motion.form>

      {/* ── Loading ── */}
      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="glass-card p-8 mb-6 text-center"
          >
            <div className="flex justify-center gap-2 mb-4">
              {[0, 0.15, 0.3].map((delay, i) => (
                <motion.div key={i}
                  animate={{ y: [-8, 0, -8], scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay, ease: 'easeInOut' }}
                  className="w-3 h-3 rounded-full bg-orange-500"
                />
              ))}
            </div>
            <p className="text-gray-400 text-sm">Tech Churras IA calculando quantidades e cortes ideais...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Resultado ── */}
      <AnimatePresence>
        {plan && !loading && (
          <motion.div ref={resultRef} variants={stagger} initial="hidden" animate="show" className="space-y-4">

            {/* Intro card */}
            <motion.div variants={fadeUp}
              className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-950/40 via-gray-900 to-gray-900 p-6"
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-orange-500/5 blur-2xl pointer-events-none" />
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-2xl shadow-lg shadow-orange-500/30">
                  🔥
                </div>
                <div className="flex-1">
                  <p className="text-white leading-relaxed text-sm">{plan.intro}</p>
                  <div className="flex flex-wrap gap-3 mt-4">
                    <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold">
                      {plan.totalKg.toFixed(1)} kg de carne
                    </span>
                    <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                      ~R$ {plan.estimatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Add all button */}
            {canAddToCart && (
              <motion.div variants={fadeUp} className="flex gap-3">
                <button onClick={addAllToCart}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                >
                  🛒 Adicionar Essenciais ao Carrinho
                </button>
                <Link href="/menu/novo"
                  className="px-4 py-3 border border-orange-500/40 text-orange-400 hover:border-orange-500 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap flex items-center"
                >
                  Ver Pedido
                </Link>
              </motion.div>
            )}

            {!canAddToCart && (
              <motion.div variants={fadeUp}
                className="px-4 py-3 rounded-xl border border-gray-700 bg-gray-800/40 text-gray-400 text-sm flex items-center justify-between gap-3"
              >
                <span>💡 Selecione um açougue em <strong className="text-white">Montar Pedido</strong> para adicionar ao carrinho</span>
                <Link href="/menu/novo" className="shrink-0 text-orange-400 font-semibold hover:text-orange-300 text-sm">
                  Montar Pedido →
                </Link>
              </motion.div>
            )}

            {/* Items */}
            <motion.div variants={fadeUp}>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Lista de Compras</h3>
              <div className="space-y-2">
                {plan.items.map((item, i) => {
                  const isAdded = addedIds.has(item.name)
                  const canAdd  = canAddToCart && !!matchProduct(item, boutiqueProducts)
                  return (
                    <motion.div key={i}
                      variants={fadeUp}
                      whileHover={{ scale: 1.008, transition: { duration: 0.15 } }}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                        isAdded ? 'border-green-500/40 bg-green-500/5' : PRIORITY_COLOR[item.priority]
                      }`}
                    >
                      <span className="text-xl shrink-0">{CATEGORY_EMOJI[item.category] ?? '📦'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-white text-sm">{item.name}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${PRIORITY_BADGE[item.priority]}`}>
                            {item.priority}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{item.reason}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-orange-400">{item.quantity} {item.unit}</p>
                        <p className="text-xs text-gray-500">~R${item.estimatedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      {canAddToCart && (
                        <button
                          onClick={() => addToCart(item)}
                          disabled={isAdded || !canAdd}
                          className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all text-base ${
                            isAdded
                              ? 'bg-green-500/20 text-green-400 cursor-default'
                              : canAdd
                                ? 'bg-orange-500/20 hover:bg-orange-500/40 text-orange-400 hover:scale-110'
                                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                          }`}
                          title={isAdded ? 'Adicionado' : canAdd ? 'Adicionar ao carrinho' : 'Produto não encontrado no açougue'}
                        >
                          {isAdded ? '✓' : '+'}
                        </button>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>

            {/* Dicas */}
            {plan.tips.length > 0 && (
              <motion.div variants={fadeUp} className="glass-card p-5">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                  💡 Dicas do Grillmaster
                </h3>
                <ul className="space-y-2">
                  {plan.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-orange-500 mt-0.5 shrink-0">◆</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* ── Como é Feito ── */}
            {/* Conteúdo educativo sobre a tradição de preparo dos itens estrela do menu.
                Futuramente pode alimentar a galeria pública (/galeria) e seção de conteúdo/SEO do site. */}
            {plan.howItsMade && plan.howItsMade.length > 0 && (
              <motion.div variants={fadeUp}>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                  📖 Como é Feito
                </h3>
                <div className="space-y-3">
                  {plan.howItsMade.map((item, i) => (
                    <motion.div key={i} variants={fadeUp}
                      className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/20 via-gray-900 to-gray-900 p-5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 flex items-center justify-center text-lg">
                          🍖
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className="font-bold text-white text-sm">{item.name}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-medium">
                              {item.origin}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 leading-relaxed">{item.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Cronograma */}
            {plan.schedule && (
              <motion.div variants={fadeUp}
                className="px-5 py-4 rounded-xl border border-gray-700 bg-gray-800/30 flex items-start gap-3"
              >
                <span className="text-xl shrink-0">🕐</span>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Cronograma Sugerido</p>
                  <p className="text-sm text-gray-300">{plan.schedule}</p>
                </div>
              </motion.div>
            )}

            {/* CTA inferior */}
            <motion.div variants={fadeUp} className="flex gap-3 pb-4">
              <Link href="/menu/novo"
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl text-sm transition-all text-center shadow-lg shadow-orange-500/20"
              >
                Montar Pedido Completo →
              </Link>
              <button
                onClick={() => { setPlan(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                className="px-4 py-3.5 border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-gray-200 rounded-xl text-sm font-medium transition-colors"
              >
                Novo Plano
              </button>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
