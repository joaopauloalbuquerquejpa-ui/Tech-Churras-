'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'

const BASE = 'https://tech-churras-production.up.railway.app'
const VIDEO_CARNE = 'https://videos.pexels.com/video-files/5409634/5409634-uhd_2560_1440_25fps.mp4'

function getToken() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
}

function useCountUp(target: number, duration = 1400) {
  const [count, setCount] = useState(0)
  const started = useRef(false)
  useEffect(() => {
    if (target === 0 || started.current) return
    started.current = true
    const start = performance.now()
    function frame(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(frame)
      else setCount(target)
    }
    requestAnimationFrame(frame)
  }, [target, duration])
  return count
}

function useInView(ref: React.RefObject<Element | null>) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [ref])
  return visible
}

interface Order {
  id: string
  status: string
  totalPrice: number
  eventDate: string
  grillmaster?: { user?: { name: string } }
  boutique?: { name: string }
  review?: { id: string; grillRating?: number | null } | null
}

function useCountdown(target: string | null) {
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, past: false })
  useEffect(() => {
    if (!target) return
    function tick() {
      const diff = new Date(target!).getTime() - Date.now()
      if (diff <= 0) { setT({ days: 0, hours: 0, minutes: 0, past: true }); return }
      setT({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        past: false,
      })
    }
    tick()
    const id = setInterval(tick, 60000)
    return () => clearInterval(id)
  }, [target])
  return t
}

interface FeaturedGM {
  id: string
  pricePerHour: number
  rating: number
  photoUrl?: string
  churrascoStyle?: string
  isChancelado?: boolean
  city: string
  state: string
  user: { name: string }
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-500',
  CONFIRMED: 'bg-blue-500',
  IN_PROGRESS: 'bg-orange-500',
  COMPLETED: 'bg-green-500',
  CANCELLED: 'bg-red-500',
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [rawStats, setRawStats] = useState({ orders: 0, grillmasters: 0, boutiques: 0 })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [nextEvent, setNextEvent] = useState<Order | null>(null)
  const [pendingReviews, setPendingReviews] = useState<Order[]>([])
  const [points, setPoints] = useState<number | null>(null)
  const [featuredGMs, setFeaturedGMs] = useState<FeaturedGM[]>([])
  const countdown = useCountdown(nextEvent?.eventDate ?? null)
  const statsRef = useRef<HTMLDivElement>(null)
  const statsVisible = useInView(statsRef)
  const ordersRef = useRef<HTMLDivElement>(null)
  const ordersVisible = useInView(ordersRef)

  const ordersCount = useCountUp(statsVisible ? rawStats.orders : 0)
  const gmCount = useCountUp(statsVisible ? rawStats.grillmasters : 0)
  const boutiquesCount = useCountUp(statsVisible ? rawStats.boutiques : 0)

  useEffect(() => {
    const raw = localStorage.getItem('auth-storage')
    const token = raw ? JSON.parse(raw)?.state?.token : null
    if (!token) router.push('/login')
  }, [router])

  useEffect(() => {
    const h = { Authorization: 'Bearer ' + getToken() }
    fetch(BASE + '/orders', { headers: h })
      .then(r => r.json())
      .then(d => {
        const arr: Order[] = Array.isArray(d) ? d : []
        setRawStats(prev => ({ ...prev, orders: arr.length }))
        setRecentOrders(arr.slice(0, 3))
        const upcoming = arr
          .filter(o => ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(o.status) && new Date(o.eventDate) > new Date())
          .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
        if (upcoming.length > 0) setNextEvent(upcoming[0])
        const needsReview = arr.filter(o => o.status === 'COMPLETED' && !o.review?.grillRating).slice(0, 2)
        setPendingReviews(needsReview)
      })
      .catch(() => {})
    fetch(BASE + '/grillmasters', { headers: h })
      .then(r => r.json())
      .then(d => {
        const arr = Array.isArray(d) ? d : d.grillmasters ?? []
        setRawStats(prev => ({ ...prev, grillmasters: arr.length }))
        setFeaturedGMs(arr.slice(0, 6))
      })
      .catch(() => {})
    fetch(BASE + '/boutiques', { headers: h })
      .then(r => r.json())
      .then(d => {
        const arr = Array.isArray(d) ? d : d.boutiques ?? []
        setRawStats(prev => ({ ...prev, boutiques: arr.length }))
      })
      .catch(() => {})
    fetch(BASE + '/points/balance', { headers: h })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setPoints(d.points) })
      .catch(() => {})
  }, [])

  const firstName = user?.name?.split(' ')[0] || 'seja bem-vindo'

  async function shareNextEvent() {
    if (!nextEvent) return
    try {
      const h = { Authorization: 'Bearer ' + getToken() }
      const res = await fetch(`${BASE}/orders/${nextEvent.id}/share`, { method: 'POST', headers: h })
      if (res.ok) {
        const d = await res.json()
        const token = d.shareToken ?? d.publicShareToken
        if (token) {
          const url = `https://www.techchurras.com.br/acompanhar/${token}`
          const date = new Date(nextEvent.eventDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
          const gmName = nextEvent.grillmaster?.user?.name ?? 'churrasqueiro'
          const msg = `🔥 Churrasco marcado para ${date} com ${gmName}!\n\nAcompanhe ao vivo:\n${url}`
          window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
        }
      }
    } catch {}
  }

  return (
    <div>

      {/* ── Banner hero com vídeo ── */}
      <section className="relative rounded-2xl overflow-hidden mb-8" style={{ minHeight: 220 }}>
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 0 }}
        >
          <source src={VIDEO_CARNE} type="video/mp4" />
        </video>

        {/* Fallback gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 70% 50%, rgba(249,115,22,0.25) 0%, transparent 65%), #111111',
            zIndex: 0,
          }}
        />

        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.75) 100%)',
            zIndex: 1,
          }}
        />

        <div
          className="relative flex flex-col md:flex-row items-center justify-between gap-6 py-10 px-8"
          style={{ zIndex: 2 }}
        >
          <div className="animate-fadeInUp" style={{ animationDelay: '0.1s', opacity: 0 }}>
            <p className="text-xs font-bold tracking-widest text-orange-400 uppercase mb-1">
              Novo pedido
            </p>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-1">
              Olá, {firstName}! Pronto para o próximo churrasco?
            </h2>
            <p className="text-gray-400 text-sm">
              Grillmaster chancelado + cortes premium + calculadora inteligente
            </p>
          </div>
          <span
            className="shrink-0 animate-fadeInUp"
            style={{ animationDelay: '0.3s', opacity: 0 }}
          >
            <Link
              href="/menu"
              className="block bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-xl text-base transition-all hover:-translate-y-0.5 shadow-lg shadow-orange-500/30 whitespace-nowrap animate-flamePulse"
            >
              Montar Meu Churrasco
            </Link>
          </span>
        </div>
      </section>

      {/* ── Próximo churrasco ── */}
      {nextEvent && !countdown.past && (
        <div className="block mb-8 bg-gradient-to-r from-orange-900/30 to-red-900/10 border border-orange-500/40 rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">Próximo churrasco</span>
                <span className={'text-xs px-2 py-0.5 rounded-full font-medium ' + (
                  nextEvent.status === 'IN_PROGRESS' ? 'bg-orange-500 text-white animate-pulse' :
                  nextEvent.status === 'CONFIRMED' ? 'bg-blue-500 text-white' :
                  'bg-yellow-500 text-black'
                )}>
                  {STATUS_LABEL[nextEvent.status]}
                </span>
              </div>
              <p className="font-bold text-white text-base truncate">
                {nextEvent.grillmaster?.user?.name ?? 'Churrasqueiro'}{nextEvent.boutique ? ' · ' + nextEvent.boutique.name : ''}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(nextEvent.eventDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
            {!countdown.past && (
              <div className="shrink-0 text-right">
                <div className="flex gap-2">
                  {countdown.days > 0 && (
                    <div className="bg-gray-900 rounded-lg px-2 py-1.5 min-w-[44px] text-center">
                      <p className="text-lg font-black text-orange-400 tabular-nums">{countdown.days}</p>
                      <p className="text-[9px] text-gray-500 uppercase">dias</p>
                    </div>
                  )}
                  <div className="bg-gray-900 rounded-lg px-2 py-1.5 min-w-[44px] text-center">
                    <p className="text-lg font-black text-orange-400 tabular-nums">{String(countdown.hours).padStart(2,'0')}</p>
                    <p className="text-[9px] text-gray-500 uppercase">horas</p>
                  </div>
                  <div className="bg-gray-900 rounded-lg px-2 py-1.5 min-w-[44px] text-center">
                    <p className="text-lg font-black text-orange-400 tabular-nums">{String(countdown.minutes).padStart(2,'0')}</p>
                    <p className="text-[9px] text-gray-500 uppercase">min</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Link href={'/orders/' + nextEvent.id}
              className="flex-1 text-center bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-xs font-semibold py-2 rounded-xl transition-colors">
              Ver detalhes →
            </Link>
            {(nextEvent.status === 'CONFIRMED' || nextEvent.status === 'IN_PROGRESS') && (
              <button onClick={shareNextEvent}
                className="flex-1 flex items-center justify-center gap-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs font-semibold py-2 rounded-xl transition-colors">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.9 2C6.458 2 2.015 6.443 2.015 11.885c0 1.778.468 3.51 1.36 5.034L2 22l5.225-1.372a9.86 9.86 0 004.675 1.187C17.342 21.815 22 17.385 22 11.9 22 6.458 17.342 2 11.9 2z"/></svg>
                Compartilhar
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Avaliacoes pendentes ── */}
      {pendingReviews.length > 0 && (
        <div className="mb-8 bg-gradient-to-r from-yellow-900/20 to-orange-900/10 border border-yellow-500/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">⭐</span>
            <p className="font-bold text-white text-sm">
              {pendingReviews.length === 1 ? 'Você tem 1 churrasco para avaliar!' : `Você tem ${pendingReviews.length} churrascos para avaliar!`}
            </p>
          </div>
          <div className="space-y-2">
            {pendingReviews.map(o => (
              <Link key={o.id} href={`/orders/${o.id}/review`}
                className="flex items-center justify-between bg-gray-900/60 hover:bg-gray-900/80 rounded-xl px-4 py-3 transition-colors group">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {o.grillmaster?.user?.name ?? 'Churrasqueiro'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(o.eventDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
                <span className="shrink-0 text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-3 py-1 rounded-full font-semibold group-hover:bg-yellow-500/30 transition-colors">
                  Avaliar ★
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Stats com counter ── */}
      <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { href: '/orders',      label: 'Meus Pedidos',   value: ordersCount    },
          { href: '/grillmasters', label: 'Churrasqueiros', value: gmCount        },
          { href: '/boutiques',   label: 'Acougues',        value: boutiquesCount },
        ].map((s, i) => (
          <Link
            key={s.href}
            href={s.href}
            className="glass-card p-6 hover:border-orange-500/30 transition-all group hover:-translate-y-0.5 animate-slideInFromRight"
            style={{ animationDelay: `${i * 0.12}s`, opacity: 0 }}
          >
            <p className="text-gray-500 text-sm">{s.label}</p>
            <p className="text-3xl font-bold text-orange-500 mt-1 transition-transform group-hover:scale-105 origin-left">
              {s.value}
            </p>
          </Link>
        ))}
      </div>

      {/* ── Featured Grillmasters carousel ── */}
      {featuredGMs.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Churrasqueiros em Destaque</h3>
            <Link href="/grillmasters" className="text-xs text-orange-400 hover:text-orange-300">Ver todos</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
            {featuredGMs.map(gm => {
              const name = gm.user?.name ?? 'Churrasqueiro'
              const isFounder = ['jota', 'albuquerque', 'joao paulo'].some(k => name.toLowerCase().includes(k))
              const photo = isFounder ? '/jota.jpg' : gm.photoUrl
              return (
                <Link
                  key={gm.id}
                  href={'/grillmasters/' + gm.id}
                  className="shrink-0 w-36 glass-card overflow-hidden hover:border-orange-500/30 transition-all hover:scale-[1.03]"
                >
                  <div className="h-24 overflow-hidden">
                    {photo ? (
                      <img src={photo} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-900/40 to-gray-900 flex items-center justify-center">
                        <span className="text-2xl font-black text-white/30">{name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-semibold text-white truncate">{name.split(' ')[0]}</p>
                    <p className="text-xs text-orange-400 font-bold">R$ {(gm.pricePerHour ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/h</p>
                    {gm.isChancelado && <span className="text-xs text-yellow-400">Chancelado</span>}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Assistente IA ── */}
      <Link
        href="/menu/assistente"
        className="block mb-8 border border-amber-500/30 hover:border-amber-500/60 rounded-2xl p-5 bg-gradient-to-r from-amber-950/20 to-gray-900 transition-all hover:-translate-y-0.5 group"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-xl shadow-md shadow-orange-500/20">
            🤖
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-bold text-white text-sm">Assistente de IA</p>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-500 text-black font-bold">NOVO</span>
            </div>
            <p className="text-gray-500 text-xs truncate">
              Planejamento inteligente de carnes, quantidades e acompanhamentos
            </p>
          </div>
          <span className="text-gray-600 group-hover:text-orange-400 transition-colors shrink-0">→</span>
        </div>
      </Link>

      {/* ── Pontos ── */}
      {points !== null && (
        <Link
          href="/perfil/pontos"
          className="block glass-card-orange p-5 mb-8 transition-all hover:-translate-y-0.5 hover:border-orange-500/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Seus Pontos</p>
              <p className="text-2xl font-bold text-orange-400">{points} pts</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {points >= 100
                  ? `Resgate R$ ${Math.floor(points / 100) * 10},00 em desconto`
                  : `Faltam ${100 - (points % 100)} pts para o proximo resgate`}
              </p>
            </div>
            <div className="text-3xl">🏆</div>
          </div>
        </Link>
      )}

      {/* ── Pedidos recentes ── */}
      {recentOrders.length > 0 && (
        <div ref={ordersRef} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Pedidos Recentes</h3>
            <Link href="/orders" className="text-xs text-orange-400 hover:text-orange-300">
              Ver todos
            </Link>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order, i) => (
              <Link
                key={order.id}
                href={'/orders/' + order.id}
                className="block bg-gray-900 border border-gray-800 hover:border-orange-500/30 rounded-xl p-4 transition-all hover:-translate-y-0.5 animate-slideInFromRight"
                style={ordersVisible ? { animationDelay: `${i * 0.1}s`, opacity: 0 } : { opacity: 0 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`text-xs text-white px-2.5 py-1 rounded-full font-medium shrink-0 ${STATUS_COLOR[order.status] || 'bg-gray-500'} ${order.status === 'PENDING' ? 'animate-flamePulse' : ''}`}
                    >
                      {STATUS_LABEL[order.status] || order.status}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {order.grillmaster?.user?.name || 'Grillmaster'}
                        {order.boutique && (
                          <span className="text-gray-500 font-normal"> &middot; {order.boutique.name}</span>
                        )}
                      </p>
                      {order.eventDate && (
                        <p className="text-xs text-gray-500">
                          {new Date(order.eventDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-orange-400 font-bold text-lg shrink-0 ml-4">
                    R$ {(order.totalPrice ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Indique e ganhe */}
      {user && (
        <div className="mb-8 bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="font-bold text-white text-sm mb-1">🎁 Indique e seus amigos ganham 10% OFF</p>
              <p className="text-xs text-gray-400">Cada amigo que usar seu link ganha desconto no primeiro churrasco.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const link = `https://www.techchurras.com.br/convite/${user.id}`
                navigator.clipboard?.writeText(link)
                const msg = `🔥 Usa meu link e ganha 10% OFF no primeiro churrasco pela Tech Churras!\n\n${link}`
                window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold py-2.5 rounded-xl transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.9 2C6.458 2 2.015 6.443 2.015 11.885c0 1.778.468 3.51 1.36 5.034L2 22l5.225-1.372a9.86 9.86 0 004.675 1.187C17.342 21.815 22 17.385 22 11.9 22 6.458 17.342 2 11.9 2z"/></svg>
              WhatsApp
            </button>
            <button
              onClick={async () => {
                const link = `https://www.techchurras.com.br/convite/${user.id}`
                await navigator.clipboard?.writeText(link)
              }}
              className="flex-1 text-xs bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2.5 rounded-xl transition-colors"
            >
              Copiar link
            </button>
          </div>
        </div>
      )}

      {/* Trust row */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-500">
        <span>&#10003; Profissionais chancelados por Jota Grillmaster</span>
        <span>&#10003; Sem surpresas — preço fechado antes do evento</span>
        <span>&#10003; Grillmaster retira os insumos no açougue para você</span>
        <span>&#10003; Suporte durante todo o evento</span>
      </div>
    </div>
  )
}
