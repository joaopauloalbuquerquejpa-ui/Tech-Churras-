'use client'
import { API_URL } from '@/lib/api'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useFavoritesStore } from '@/store/favorites'


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
  galleryUrls?: string[]
  instagram?: string
  churrascoStyle?: string
  bringsEquipment?: boolean
  minGuests?: number
  maxGuests?: number
  certificationCode?: string | null
  certifiedAt?: string | null
  user: { name: string; email: string }
}

interface Review {
  id: string
  grillRating: number
  grillComment?: string
  photos?: string[]
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

function HeartButton({ id }: { id: string }) {
  const isFavorited = useFavoritesStore((s) => s.isFavorited('GRILLMASTER', id))
  const toggle = useFavoritesStore((s) => s.toggle)
  return (
    <button
      onClick={() => toggle('GRILLMASTER', id)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors text-sm"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
        fill={isFavorited ? '#f97316' : 'none'}
        stroke={isFavorited ? '#f97316' : '#9ca3af'}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <span className={isFavorited ? 'text-orange-400' : 'text-gray-400'}>
        {isFavorited ? 'Favoritado' : 'Favoritar'}
      </span>
    </button>
  )
}

export default function GrillmasterProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [gm, setGm] = useState<Grillmaster | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  useEffect(() => {
    if (!id) return
    const token = getToken()
    const h = token ? { Authorization: 'Bearer ' + token } : {} as Record<string, string>
    setLoading(true)
    Promise.all([
      fetch(`${API_URL}/grillmasters/${id}`, { headers: h }).then(r => {
        if (!r.ok) throw new Error('Nao encontrado')
        return r.json()
      }),
      fetch(`${API_URL}/reviews/grillmaster/${id}`).then(r => r.ok ? r.json() : []),
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
  const heroPhoto = isFounder ? '/jota.jpg' : (gm.photoUrl ?? null)
  const specialties = gm.specialties
    ? gm.specialties.split(',').map(s => s.trim()).filter(Boolean)
    : []
  const specColors = [
    'bg-orange-500/15 text-orange-400 border border-orange-500/30',
    'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    'bg-red-500/15 text-red-400 border border-red-500/30',
    'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  ]
  const gallery = gm.galleryUrls ?? []

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-5">
        <Link href="/grillmasters" className="hover:text-gray-300 transition-colors">Churrasqueiros</Link>
        <span>/</span>
        <span className="text-gray-300">{name}</span>
      </div>

      {/* Hero — full-width photo with overlay */}
      <div className="relative rounded-2xl overflow-hidden mb-5 h-64 sm:h-80">
        {heroPhoto ? (
          <img src={heroPhoto} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-900/50 to-gray-900 flex items-center justify-center">
            <span className="text-8xl font-black text-white/20">{name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {gm.certifiedAt && (
            <span className="bg-yellow-400 text-black text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1">
              ✓ Certificado Tech Churras
            </span>
          )}
          {gm.isChancelado && !gm.certifiedAt && (
            <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">CHANCELADO</span>
          )}
          {gm.churrascoStyle && (
            <span className="bg-orange-500/80 text-white text-xs px-2 py-0.5 rounded-full">{gm.churrascoStyle}</span>
          )}
        </div>
        <div className="absolute top-4 right-4">
          <HeartButton id={gm.id} />
        </div>

        {/* Bottom info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">{name}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <Stars n={gm.rating ?? 0} size="text-sm" />
                <span className="text-sm text-gray-300">{(gm.rating ?? 0).toFixed(1)} ({gm.totalOrders ?? 0} eventos)</span>
                <span className="text-xs text-gray-400">{gm.city}, {gm.state}</span>
                <span className={'text-xs px-2 py-0.5 rounded-full font-medium ' + (gm.available ? 'bg-green-500/80 text-white' : 'bg-gray-700/80 text-gray-400')}>
                  {gm.available ? 'Disponivel' : 'Ocupado'}
                </span>
              </div>
            </div>
            <div className="shrink-0 sm:text-right">
              <p className="text-xs text-gray-400">por hora</p>
              <p className="text-2xl font-bold text-orange-400">R$ {(gm.pricePerHour ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
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
          {/* Extra badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            {gm.bringsEquipment && (
              <span className="bg-blue-500/15 text-blue-400 border border-blue-500/30 text-xs px-2 py-1 rounded-full">Leva equipamento</span>
            )}
            {gm.minGuests != null && gm.maxGuests != null && (
              <span className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded-full">{gm.minGuests}–{gm.maxGuests} convidados</span>
            )}
            {gm.instagram && (
              <a href={`https://instagram.com/${gm.instagram}`} target="_blank" rel="noopener noreferrer"
                className="bg-pink-500/15 text-pink-400 border border-pink-500/30 text-xs px-2 py-1 rounded-full hover:bg-pink-500/25 transition-colors">
                @{gm.instagram}
              </a>
            )}
          </div>
        </div>
        <div className="bg-gray-900 rounded-xl p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Dados</h2>
          <div className="space-y-2.5">
            {[
              ['Experiencia', `${gm.experience} ${gm.experience === 1 ? 'ano' : 'anos'}`],
              ['Eventos', String(gm.totalOrders ?? 0)],
              ['Avaliacao', `${(gm.rating ?? 0).toFixed(1)} / 5`],
              ['Cidade', gm.city],
              ...(gm.certificationCode ? [['Certificado', gm.certificationCode]] : []),
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
              <span key={i} className={'text-xs font-medium px-3 py-1 rounded-full ' + specColors[i % 4]}>
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Gallery */}
      {gallery.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-5 mb-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Portfolio</h2>
          <div className="grid grid-cols-3 gap-2">
            {gallery.map((url, i) => (
              <div key={i} onClick={() => setLightboxIdx(i)} className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightboxIdx(null)}>
          <button className="absolute top-4 right-4 text-white text-2xl hover:text-orange-400" onClick={() => setLightboxIdx(null)}>&#215;</button>
          <button className="absolute left-4 text-white text-3xl hover:text-orange-400 disabled:opacity-30"
            disabled={lightboxIdx === 0}
            onClick={e => { e.stopPropagation(); setLightboxIdx(i => i! - 1) }}>&#8249;</button>
          <img src={gallery[lightboxIdx]} alt="" className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain" onClick={e => e.stopPropagation()} />
          <button className="absolute right-4 text-white text-3xl hover:text-orange-400 disabled:opacity-30"
            disabled={lightboxIdx === gallery.length - 1}
            onClick={e => { e.stopPropagation(); setLightboxIdx(i => i! + 1) }}>&#8250;</button>
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
                {r.photos && r.photos.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {r.photos.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt="" className="w-16 h-16 rounded-lg object-cover hover:opacity-80 transition-opacity" />
                      </a>
                    ))}
                  </div>
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
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              const url = `https://www.techchurras.com.br/grillmasters/${gm.id}`
              const msg = `🔥 Olha esse churrasqueiro incrível que achei na Tech Churras!\n\n👨‍🍳 ${name}\n⭐ ${gm.rating.toFixed(1)} — ${gm.totalOrders} eventos\n📍 ${gm.city}, ${gm.state}\n\nVeja o perfil completo:\n${url}`
              window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
            }}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm whitespace-nowrap"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Compartilhar
          </button>
          <button
            disabled={!gm.available}
            onClick={() => router.push('/menu/novo?grillmasterId=' + gm.id)}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold px-8 py-3 rounded-xl transition-colors whitespace-nowrap shrink-0"
          >
            {gm.available ? 'Contratar para meu evento' : 'Indisponivel no momento'}
          </button>
        </div>
      </div>
    </div>
  )
}