'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

const BASE = 'https://tech-churras-production.up.railway.app'

function getToken() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
}

interface Grillmaster {
  id: string
  bio?: string
  experience: number
  pricePerHour: number
  available: boolean
  city: string
  state: string
  rating: number
  totalOrders: number
  isChancelado: boolean
  specialties?: string
  photoUrl?: string
  user: { name: string; email: string }
}

interface Review {
  id: string
  grillRating: number
  grillComment?: string
  createdAt: string
  customer: { name: string }
}

function Stars({ n, size = 'text-base' }: { n: number; size?: string }) {
  return (
    <span className={size + ' text-yellow-400 leading-none'}>
      {Array.from({ length: 5 }, (_, i) => i < Math.floor(n) ? '★' : '☆').join('')}
    </span>
  )
}

export default function GrillmasterProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [gm, setGm] = useState<Grillmaster | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    const token = getToken()
    const h = token ? { Authorization: 'Bearer ' + token } : {} as Record<string, string>
    setLoading(true)
    Promise.all([
      fetch(`${BASE}/grillmasters/${id}`, { headers: h }).then(r => {
        if (!r.ok) throw new Error('Nao encontrado')
        return r.json()
      }),
      fetch(`${BASE}/reviews/grillmaster/${id}`).then(r => r.ok ? r.json() : []),
    ])
      .then(([gmData, revData]) => {
        setGm(gmData)
        setReviews(Array.isArray(revData) ? revData : [])
      })
      .catch(() => setError('Nao foi possivel carregar o perfil.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse space-y-4">
        <div className="h-32 bg-gray-900 rounded-2xl" />
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 h-28 bg-gray-900 rounded-xl" />
          <div className="h-28 bg-gray-900 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !gm) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <p className="text-gray-400 mb-4">{error || 'Churrasqueiro nao encontrado.'}</p>
        <Link href="/grillmasters" className="text-orange-400 hover:underline text-sm">
          Ver todos os churrasqueiros
        </Link>
      </div>
    )
  }

  const name = gm.user?.name ?? 'Churrasqueiro'
  const isFounder = ['jota', 'albuquerque', 'joao paulo', 'joao'].some(k => name.toLowerCase().includes(k))
  const specialties = gm.specialties
    ? gm.specialties.split(',').map(s => s.trim()).filter(Boolean)
    : []
  const specColors = [
    ['bg-orange-500/15 text-orange-400 border border-orange-500/30', ''],
    ['bg-amber-500/15 text-amber-400 border border-amber-500/30', ''],
    ['bg-red-500/15 text-red-400 border border-red-500/30', ''],
    ['bg-yellow-500/15 text-yellow-400 border border-yellow-500/30', ''],
  ]

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-5">
        <Link href="/grillmasters" className="hover:text-gray-300 transition-colors">Churrasqueiros</Link>
        <span>/</span>
        <span className="text-gray-300">{name}</span>
      </div>

      {/* Hero */}
      <div className="bg-gray-900 rounded-2xl overflow-hidden mb-5">
        <div className="h-1.5 bg-orange-500" />
        <div className="p-6 flex flex-col sm:flex-row gap-5">
          <div className="shrink-0">
            {isFounder || gm.photoUrl ? (
              <Image
                src={isFounder ? '/jota.jpg' : gm.photoUrl!}
                alt={name}
                width={96}
                height={96}
                className="w-24 h-24 rounded-full object-cover ring-2 ring-orange-500"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-orange-700 flex items-center justify-center text-white text-3xl font-bold ring-2 ring-orange-500">
                {name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h1 className="text-2xl font-bold text-white">{name}</h1>
              {gm.isChancelado && (
                <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 text-xs font-bold px-2 py-0.5 rounded-full tracking-wide">
                  CHANCELADO
                </span>
              )}
              <span className={
                'text-xs px-2 py-0.5 rounded-full font-medium ' +
                (gm.available ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400')
              }>
                {gm.available ? 'Disponivel' : 'Ocupado'}
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-2">{gm.city}, {gm.state}</p>
            <div className="flex items-center gap-2">
              <Stars n={gm.rating ?? 0} />
              <span className="text-sm text-gray-400">
                {(gm.rating ?? 0).toFixed(1)} — {gm.totalOrders ?? 0} evento{gm.totalOrders !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="shrink-0 sm:text-right">
            <p className="text-xs text-gray-500 mb-0.5">por hora</p>
            <p className="text-3xl font-bold text-orange-400">
              R$ {(gm.pricePerHour ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Bio + Stats */}
      <div className="grid md:grid-cols-3 gap-4 mb-5">
        <div className="md:col-span-2 bg-gray-900 rounded-xl p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Sobre</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            {gm.bio || 'Especialista em grelhados e churrasco artesanal.'}
          </p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Dados</h2>
          <div className="space-y-2.5">
            {[
              ['Experiencia', `${gm.experience} ${gm.experience === 1 ? 'ano' : 'anos'}`],
              ['Eventos', String(gm.totalOrders ?? 0)],
              ['Avaliacao', `${(gm.rating ?? 0).toFixed(1)} / 5`],
              ['Cidade', gm.city],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="text-white font-medium">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Specialties */}
      {specialties.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-5 mb-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Especialidades</h2>
          <div className="flex flex-wrap gap-2">
            {specialties.map((s, i) => (
              <span key={i} className={'text-xs font-medium px-3 py-1 rounded-full ' + specColors[i % 4][0]}>
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="bg-gray-900 rounded-xl p-5 mb-5">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
          Avaliacoes ({reviews.length})
        </h2>
        {reviews.length === 0 ? (
          <p className="text-gray-600 text-sm">Ainda sem avaliacoes.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map(r => (
              <div key={r.id} className="border-b border-gray-800 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Stars n={r.grillRating} size="text-sm" />
                    <span className="text-sm font-medium text-white">
                      {r.customer?.name ?? 'Cliente'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-600">
                    {new Date(r.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </span>
                </div>
                {r.grillComment && (
                  <p className="text-sm text-gray-400 mt-1">{r.grillComment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="bg-gray-900 border border-orange-500/30 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-bold text-white mb-1">Pronto para um churrasco incrivel?</p>
          <p className="text-sm text-gray-400">Contrate {name} para o seu evento.</p>
        </div>
        <button
          disabled={!gm.available}
          onClick={() => router.push('/menu/novo?grillmasterId=' + gm.id)}
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold px-8 py-3 rounded-xl transition-colors whitespace-nowrap shrink-0"
        >
          {gm.available ? 'Contratar para meu evento' : 'Indisponivel no momento'}
        </button>
      </div>
    </div>
  )
}
