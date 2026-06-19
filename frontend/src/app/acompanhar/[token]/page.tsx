'use client'
import { API_URL } from '@/lib/api'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'


const OrderMap = dynamic(
  () => import('../../(dashboard)/orders/[id]/OrderMap'),
  { ssr: false, loading: () => <div className="h-52 rounded-xl bg-gray-800 animate-pulse" /> }
)

const STATUS_STEPS = [
  { key: 'CONFIRMED',   detail: null,                        label: 'Pedido confirmado',             icon: '✅' },
  { key: 'CONFIRMED',   detail: 'Acougue separando carnes',  label: 'Açougue preparando os cortes',  icon: '🥩' },
  { key: 'CONFIRMED',   detail: 'Churrasqueiro a caminho',   label: 'Churrasqueiro a caminho!',       icon: '🚗' },
  { key: 'IN_PROGRESS', detail: 'Churrasqueiro chegou',      label: 'Churrasqueiro chegou!',          icon: '👨‍🍳' },
  { key: 'IN_PROGRESS', detail: 'Preparando o churrasco',    label: 'Preparando o churrasco',        icon: '🔥' },
  { key: 'IN_PROGRESS', detail: 'Servindo',                  label: 'Servindo!',                     icon: '🍖' },
  { key: 'COMPLETED',   detail: null,                        label: 'Churrasco finalizado! 🏆',       icon: '🎉' },
]

interface OrderPublic {
  status: string
  statusDetail?: string | null
  eventDate: string
  eventAddress: string
  eventCity: string
  guestCount: number
  grillmasterFirstName?: string | null
  grillmasterPhotoUrl?: string | null
  boutiqueName?: string | null
  grillmasterLat?: number | null
  grillmasterLng?: number | null
  grillmasterLastUpdate?: string | null
}

function useCountdown(target: string | null) {
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, past: false })
  useEffect(() => {
    if (!target) return
    function tick() {
      const diff = new Date(target!).getTime() - Date.now()
      if (diff <= 0) { setT({ days: 0, hours: 0, minutes: 0, seconds: 0, past: true }); return }
      setT({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        past: false,
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target])
  return t
}

function getStepIndex(status: string, detail: string | null | undefined): number {
  if (status === 'COMPLETED') return STATUS_STEPS.length - 1
  for (let i = STATUS_STEPS.length - 2; i >= 0; i--) {
    const s = STATUS_STEPS[i]
    if (s.key === status) {
      if (!s.detail || s.detail === detail) return i
    }
  }
  return status === 'CONFIRMED' ? 0 : -1
}

export default function AcompanharPage() {
  const { token } = useParams<{ token: string }>()
  const [order, setOrder] = useState<OrderPublic | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const countdown = useCountdown(order?.eventDate ?? null)

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/orders/public/${token}`)
      if (!res.ok) throw new Error('Link expirado ou inválido')
      setOrder(await res.json())
    } catch {
      setError('Este link expirou ou não é válido.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (!token) return
    fetchOrder()
  }, [fetchOrder])

  // polling quando churrasqueiro a caminho
  useEffect(() => {
    if (order?.statusDetail !== 'Churrasqueiro a caminho') return
    const id = setInterval(fetchOrder, 12000)
    return () => clearInterval(id)
  }, [order?.statusDetail, fetchOrder])

  function shareWhatsApp() {
    const url = window.location.href
    const gm = order?.grillmasterFirstName ? `${order.grillmasterFirstName} via ` : ''
    const msg = `🔥 Churrasco confirmado!\n\n👨‍🍳 ${gm}Tech Churras\n📍 ${order?.eventCity ?? ''}\n\nAcompanhe ao vivo:\n${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const stepIndex = order ? getStepIndex(order.status, order.statusDetail) : -1
  const isOnTheWay = order?.statusDetail === 'Churrasqueiro a caminho'
  const isLive = order && !['CANCELLED', 'COMPLETED'].includes(order.status)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-5 py-4 flex items-center justify-between">
        <Link href="/boutiques" className="text-xl font-black text-orange-500">
          Tech Churras
        </Link>
        {isLive && (
          <div className="flex items-center gap-1.5 text-xs text-orange-400 font-medium">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            Ao vivo
          </div>
        )}
      </div>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {loading && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 animate-pulse">🔥</div>
            <p className="text-gray-500 text-sm">Carregando acompanhamento...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔗</div>
            <p className="text-gray-400 mb-6">{error}</p>
            <Link href="/boutiques" className="text-orange-400 hover:underline text-sm">
              Montar meu churrasco
            </Link>
          </div>
        )}

        {order && (
          <>
            {/* Status hero */}
            <div className={[
              'rounded-2xl p-6 text-center border',
              order.status === 'COMPLETED' ? 'bg-green-900/20 border-green-500/30' :
              order.status === 'CANCELLED' ? 'bg-red-900/20 border-red-500/30' :
              isOnTheWay ? 'bg-orange-900/20 border-orange-500/50' :
              'bg-gray-900 border-gray-800',
            ].join(' ')}>
              <div className={['text-5xl mb-3', isOnTheWay ? 'animate-bounce' : ''].join(' ')}>
                {stepIndex >= 0 ? STATUS_STEPS[stepIndex].icon : '🔥'}
              </div>
              <p className="text-lg font-bold text-white mb-1">
                {stepIndex >= 0 ? STATUS_STEPS[stepIndex].label : 'Aguardando confirmação'}
              </p>
              {order.grillmasterFirstName && (
                <p className="text-sm text-gray-400">
                  Churrasqueiro: <span className="text-orange-400 font-semibold">{order.grillmasterFirstName}</span>
                </p>
              )}
              {order.boutiqueName && (
                <p className="text-xs text-gray-500 mt-0.5">Açougue: {order.boutiqueName}</p>
              )}
            </div>

            {/* Countdown */}
            {!countdown.past && !['COMPLETED', 'CANCELLED'].includes(order.status) && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <p className="text-xs text-gray-500 uppercase tracking-widest text-center mb-4">
                  Falta para o churrasco
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { v: countdown.days, l: 'dias' },
                    { v: countdown.hours, l: 'horas' },
                    { v: countdown.minutes, l: 'min' },
                    { v: countdown.seconds, l: 'seg' },
                  ].map(({ v, l }) => (
                    <div key={l} className="text-center bg-gray-800 rounded-xl p-3">
                      <p className="text-2xl font-black text-orange-400 tabular-nums">{String(v).padStart(2, '0')}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{l}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-600 text-center mt-3">
                  {new Date(order.eventDate).toLocaleDateString('pt-BR', {
                    weekday: 'long', day: '2-digit', month: 'long',
                  })}
                  {order.eventCity ? ` · ${order.eventCity}` : ''}
                  {order.guestCount > 0 ? ` · ${order.guestCount} convidados` : ''}
                </p>
              </div>
            )}

            {/* Timeline */}
            {order.status !== 'CANCELLED' && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Progresso</p>
                <div className="space-y-0">
                  {STATUS_STEPS.map((step, i) => {
                    const isDone = i < stepIndex
                    const isCurrent = i === stepIndex
                    return (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={[
                            'w-3 h-3 rounded-full mt-0.5 shrink-0 transition-all duration-300',
                            isDone ? 'bg-orange-500' :
                            isCurrent ? 'bg-orange-500 ring-4 ring-orange-500/25 scale-125' :
                            'bg-gray-700',
                          ].join(' ')} />
                          {i < STATUS_STEPS.length - 1 && (
                            <div className={[
                              'w-0.5 flex-1 min-h-[18px] transition-colors duration-500',
                              isDone ? 'bg-orange-500/40' : 'bg-gray-800',
                            ].join(' ')} />
                          )}
                        </div>
                        <div className="flex items-center gap-2 pb-[18px]">
                          <span className={i > stepIndex ? 'text-base opacity-30' : 'text-base'}>{step.icon}</span>
                          <p className={[
                            'text-sm',
                            isDone ? 'text-gray-600 line-through' :
                            isCurrent ? 'text-white font-semibold' :
                            'text-gray-600',
                          ].join(' ')}>
                            {step.label}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Live map */}
            {isOnTheWay && (
              <div className="bg-gray-900 border border-orange-500/30 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                  <p className="text-sm font-medium text-orange-400">Localização ao vivo</p>
                  {order.grillmasterLastUpdate && (
                    <p className="text-xs text-gray-600 ml-auto">
                      {new Date(order.grillmasterLastUpdate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
                <OrderMap
                  eventAddress={order.eventAddress}
                  grillmasterLat={order.grillmasterLat}
                  grillmasterLng={order.grillmasterLng}
                />
              </div>
            )}

            {/* Grillmaster card */}
            {order.grillmasterFirstName && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-4">
                {order.grillmasterPhotoUrl ? (
                  <img
                    src={order.grillmasterPhotoUrl}
                    alt=""
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-orange-500/40"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-orange-900/40 flex items-center justify-center text-2xl">👨‍🍳</div>
                )}
                <div>
                  <p className="font-bold text-white">{order.grillmasterFirstName}</p>
                  <p className="text-xs text-orange-400">Churrasqueiro Parceiro Tech Churras</p>
                  {order.guestCount > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">{order.guestCount} convidados esperando 🎉</p>
                  )}
                </div>
              </div>
            )}

            {/* WhatsApp share */}
            <button
              onClick={shareWhatsApp}
              className="w-full flex items-center justify-center gap-2 bg-green-600/20 hover:bg-green-600/30 border border-green-600/40 text-green-400 font-medium py-3 rounded-xl text-sm transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              Compartilhar no WhatsApp
            </button>

            {/* CTA */}
            <div className="bg-gradient-to-r from-orange-900/20 to-red-900/10 border border-orange-500/20 rounded-2xl p-5 text-center">
              <p className="text-sm font-bold text-white mb-1">Gostou da experiência? 🔥</p>
              <p className="text-xs text-gray-400 mb-4">
                A Tech Churras conecta você com churrasqueiros certificados e açougues premium.
              </p>
              <Link
                href="/boutiques"
                className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
              >
                Montar meu churrasco →
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  )
}