'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'

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

const TIMELINE: Record<string, string[]> = {
  CONFIRMED: ['Pedido confirmado', 'Acougue separando carnes', 'Churrasqueiro a caminho'],
  IN_PROGRESS: ['Churrasqueiro chegou', 'Preparando o churrasco', 'Servindo'],
  COMPLETED: ['Finalizado'],
}

interface PublicOrder {
  id: string
  status: string
  statusDetail?: string | null
  eventDate: string
  eventAddress: string
  guestCount: number
  eventHours: number
  grillmasterLat?: number | null
  grillmasterLng?: number | null
  grillmaster?: {
    city: string
    state: string
    rating: number
    photoUrl?: string | null
    user: { name: string }
  } | null
  boutique?: { name: string } | null
  review?: { grillRating?: number | null; grillComment?: string | null } | null
}

const OrderMap = dynamic(
  () => import('../../(dashboard)/orders/[id]/OrderMap'),
  { ssr: false, loading: () => <div className="h-64 rounded-2xl bg-gray-800 animate-pulse" /> }
)

function Stars({ n }: { n: number }) {
  return (
    <span className="text-yellow-400">
      {Array.from({ length: 5 }, (_, i) => (i < Math.floor(n) ? '★' : '☆')).join('')}
    </span>
  )
}

export default function AcompanharPage() {
  const { token } = useParams<{ token: string }>()
  const [order, setOrder] = useState<PublicOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    fetch(`${BASE}/public/orders/${token}`)
      .then(r => {
        if (!r.ok) throw new Error('Pedido nao encontrado')
        return r.json()
      })
      .then(setOrder)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Carregando...</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-4xl mb-4">🔥</p>
          <p className="text-gray-400">{error || 'Pedido nao encontrado.'}</p>
          <a href="/" className="mt-4 inline-block text-orange-400 hover:text-orange-300 text-sm">
            Conhecer o Tech Churras
          </a>
        </div>
      </div>
    )
  }

  const gmName = order.grillmaster?.user?.name || 'Grillmaster'
  const substates = TIMELINE[order.status] ?? []
  const currentSubIdx = order.statusDetail ? substates.indexOf(order.statusDetail) : -1

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-3">
        <span className="text-xl font-black text-orange-500">Tech Churras</span>
        <span className="text-gray-600 text-sm">/ Acompanhamento</span>
      </nav>

      <main className="max-w-xl mx-auto p-6 space-y-5">
        {/* Status header */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Status do pedido</p>
            <span className={'text-xs text-white px-3 py-1 rounded-full font-medium ' + (STATUS_COLOR[order.status] || 'bg-gray-500')}>
              {STATUS_LABEL[order.status] || order.status}
            </span>
          </div>
          {order.statusDetail && (
            <p className="text-orange-400 font-semibold text-sm">{order.statusDetail}</p>
          )}
          <p className="text-sm text-gray-400 mt-1">
            {new Date(order.eventDate).toLocaleDateString('pt-BR', {
              weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>

        {/* Grillmaster card */}
        {order.grillmaster && (
          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Churrasqueiro</p>
            <div className="flex items-center gap-4">
              {order.grillmaster.photoUrl ? (
                <img
                  src={order.grillmaster.photoUrl}
                  alt={gmName}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-orange-500"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-orange-700 flex items-center justify-center text-white text-xl font-bold ring-2 ring-orange-500">
                  {gmName.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-bold text-white text-lg">{gmName}</p>
                <p className="text-sm text-gray-400">{order.grillmaster.city}, {order.grillmaster.state}</p>
                {order.grillmaster.rating > 0 && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Stars n={order.grillmaster.rating} />
                    <span className="text-xs text-gray-400">{order.grillmaster.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Event details */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Evento</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Convidados</p>
              <p className="font-semibold">{order.guestCount} pessoas</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Duracao</p>
              <p className="font-semibold">{order.eventHours}h</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-500 text-xs">Endereco</p>
              <p className="font-semibold text-sm">{order.eventAddress}</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        {substates.length > 0 && (
          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
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
          </div>
        )}

        {/* Map */}
        {order.statusDetail === 'Churrasqueiro a caminho' && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Rastreamento</p>
            <OrderMap
              eventAddress={order.eventAddress}
              grillmasterLat={order.grillmasterLat}
              grillmasterLng={order.grillmasterLng}
            />
          </div>
        )}

        {/* Review */}
        {order.review?.grillRating != null && (
          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Avaliacao do cliente</p>
            <div className="flex items-center gap-2 mb-1">
              <Stars n={order.review.grillRating} />
              <span className="text-sm text-gray-400">{order.review.grillRating}/5</span>
            </div>
            {order.review.grillComment && (
              <p className="text-sm text-gray-300 italic">"{order.review.grillComment}"</p>
            )}
          </div>
        )}

        {/* Boutique */}
        {order.boutique && (
          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 flex items-center gap-3">
            <span className="text-2xl">🥩</span>
            <div>
              <p className="text-xs text-gray-500">Acougue parceiro</p>
              <p className="font-semibold">{order.boutique.name}</p>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-600 pt-2">
          Powered by{' '}
          <a href="https://www.techchurras.com.br" className="text-orange-500 hover:text-orange-400">
            Tech Churras
          </a>
        </p>
      </main>
    </div>
  )
}
