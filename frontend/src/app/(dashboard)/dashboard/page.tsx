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
      })
      .catch(() => {})
    fetch(BASE + '/grillmasters', { headers: h })
      .then(r => r.json())
      .then(d => {
        const arr = Array.isArray(d) ? d : d.grillmasters ?? []
        setRawStats(prev => ({ ...prev, grillmasters: arr.length }))
      })
      .catch(() => {})
    fetch(BASE + '/boutiques', { headers: h })
      .then(r => r.json())
      .then(d => {
        const arr = Array.isArray(d) ? d : d.boutiques ?? []
        setRawStats(prev => ({ ...prev, boutiques: arr.length }))
      })
      .catch(() => {})
  }, [])

  const firstName = user?.name?.split(' ')[0] || 'seja bem-vindo'

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
          <Link
            href="/menu"
            className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-xl text-base transition-all hover:-translate-y-0.5 shadow-lg shadow-orange-500/30 whitespace-nowrap animate-flamePulse animate-fadeInUp"
            style={{ animationDelay: '0.3s', opacity: 0 }}
          >
            Montar Meu Churrasco
          </Link>
        </div>
      </section>

      {/* ── Stats com counter ── */}
      <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { href: '/orders',      label: 'Meus Pedidos',   value: ordersCount    },
          { href: '/grillmasters', label: 'Churrasqueiros', value: gmCount        },
          { href: '/boutiques',   label: 'Açougues',        value: boutiquesCount },
        ].map((s, i) => (
          <Link
            key={s.href}
            href={s.href}
            className="bg-gray-900 p-6 rounded-xl border border-gray-800 hover:border-orange-500/30 transition-all group hover:-translate-y-0.5 animate-slideInFromRight"
            style={{ animationDelay: `${i * 0.12}s`, opacity: 0 }}
          >
            <p className="text-gray-500 text-sm">{s.label}</p>
            <p className="text-3xl font-bold text-orange-500 mt-1 transition-transform group-hover:scale-105 origin-left">
              {s.value}
            </p>
          </Link>
        ))}
      </div>

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
