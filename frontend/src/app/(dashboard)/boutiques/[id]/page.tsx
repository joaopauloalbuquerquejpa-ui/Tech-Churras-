'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useFavoritesStore } from '@/store/favorites'

const BASE = 'https://tech-churras-production.up.railway.app'

function getToken() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
}

interface Boutique {
  id: string
  name: string
  description?: string
  city: string
  state: string
  phone?: string
  address?: string
  rating: number
  open: boolean
  logoUrl?: string
  facadeUrl?: string
  galleryUrls?: string[]
  instagram?: string
  openingHours?: string
  deliveryOrPickup?: string
  products?: Product[]
}

interface Product {
  id: string
  name: string
  description?: string
  price: number
  unit: string
  category: string
  available: boolean
  stockQuantity?: number
  imageUrl?: string
}

interface Review {
  id: string
  boutiqueRating: number
  boutiqueComment?: string
  photos?: string[]
  createdAt: string
  customer: { name: string }
}

const CATEGORY_LABELS: Record<string, string> = {
  CARNE: 'Bovinos e Suinos',
  SAL_TEMPERO: 'Sal e Temperos',
  CARVAO: 'Carvao e Acessorios',
  ACOMPANHAMENTO: 'Acompanhamentos',
  BEBIDA: 'Bebidas',
  OUTRO: 'Outros',
}

function HeartButton({ id }: { id: string }) {
  const isFavorited = useFavoritesStore((s) => s.isFavorited('BOUTIQUE', id))
  const toggle = useFavoritesStore((s) => s.toggle)
  return (
    <button
      onClick={() => toggle('BOUTIQUE', id)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 transition-colors text-sm"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
        fill={isFavorited ? '#f97316' : 'none'}
        stroke={isFavorited ? '#f97316' : '#fff'}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <span className={isFavorited ? 'text-orange-400' : 'text-white'}>{isFavorited ? 'Favoritado' : 'Favoritar'}</span>
    </button>
  )
}

export default function BoutiqueProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [boutique, setBoutique] = useState<Boutique | null>(null)
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
      fetch(`${BASE}/boutiques/${id}`, { headers: h }).then(r => {
        if (!r.ok) throw new Error('Nao encontrado')
        return r.json()
      }),
      fetch(`${BASE}/reviews/boutique/${id}`).then(r => r.ok ? r.json() : []),
    ])
      .then(([bData, revData]) => {
        setBoutique(bData)
        setReviews(Array.isArray(revData) ? revData : [])
      })
      .catch(() => setError('Nao foi possivel carregar o acougue.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse space-y-4">
        <div className="h-64 bg-gray-900 rounded-2xl" />
        <div className="grid md:grid-cols-2 gap-4">
          <div className="h-24 bg-gray-900 rounded-xl" />
          <div className="h-24 bg-gray-900 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !boutique) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <p className="text-gray-400 mb-4">{error || 'Acougue nao encontrado.'}</p>
        <Link href="/boutiques" className="text-orange-400 hover:underline text-sm">Ver todos os acougues</Link>
      </div>
    )
  }

  const gallery = boutique.galleryUrls ?? []
  const products = boutique.products ?? []

  const productsByCategory = products.reduce<Record<string, Product[]>>((acc, p) => {
    const cat = p.category || 'OUTRO'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {})

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-5">
        <Link href="/boutiques" className="hover:text-gray-300 transition-colors">Boutiques</Link>
        <span>/</span>
        <span className="text-gray-300">{boutique.name}</span>
      </div>

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden mb-5 h-56 sm:h-72">
        {boutique.facadeUrl ? (
          <img src={boutique.facadeUrl} alt={boutique.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-900/40 to-gray-900 flex items-center justify-center">
            <span className="text-8xl font-black text-white/20">{boutique.name[0]}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute top-4 right-4">
          <HeartButton id={boutique.id} />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end gap-4">
          {boutique.logoUrl ? (
            <img src={boutique.logoUrl} alt="logo" className="w-14 h-14 rounded-xl object-cover border-2 border-white/20 shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-red-900/60 border-2 border-white/20 flex items-center justify-center shrink-0">
              <span className="text-red-300 font-bold text-xl">{boutique.name[0]}</span>
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{boutique.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {boutique.rating > 0 && (
                <span className="text-yellow-400 text-sm">{'★'.repeat(Math.round(boutique.rating))} {boutique.rating.toFixed(1)}</span>
              )}
              <span className="text-xs text-gray-300">{boutique.city}, {boutique.state}</span>
              <span className={'text-xs px-2 py-0.5 rounded-full ' + (boutique.open ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white')}>
                {boutique.open ? 'Aberto' : 'Fechado'}
              </span>
              {boutique.deliveryOrPickup && (
                <span className="text-xs bg-orange-500/80 text-white px-2 py-0.5 rounded-full">{boutique.deliveryOrPickup}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {boutique.openingHours && (
          <div className="bg-gray-900 rounded-xl p-4 col-span-2">
            <p className="text-xs text-gray-500 mb-1">Horario</p>
            <p className="text-sm text-white font-medium">{boutique.openingHours}</p>
          </div>
        )}
        {boutique.phone && (
          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Telefone</p>
            <p className="text-sm text-white font-medium">{boutique.phone}</p>
          </div>
        )}
        {boutique.instagram && (
          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Instagram</p>
            <a href={`https://instagram.com/${boutique.instagram}`} target="_blank" rel="noopener noreferrer"
              className="text-sm text-pink-400 hover:text-pink-300 font-medium">@{boutique.instagram}</a>
          </div>
        )}
        {boutique.address && (
          <div className="bg-gray-900 rounded-xl p-4 col-span-2">
            <p className="text-xs text-gray-500 mb-1">Endereco</p>
            <p className="text-sm text-white font-medium">{boutique.address}</p>
          </div>
        )}
      </div>

      {/* Gallery */}
      {gallery.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-5 mb-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Galeria</h2>
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
          <button className="absolute top-4 right-4 text-white text-2xl hover:text-orange-400">&#215;</button>
          <button className="absolute left-4 text-white text-3xl hover:text-orange-400 disabled:opacity-30"
            disabled={lightboxIdx === 0}
            onClick={e => { e.stopPropagation(); setLightboxIdx(i => i! - 1) }}>&#8249;</button>
          <img src={gallery[lightboxIdx]} alt="" className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain" onClick={e => e.stopPropagation()} />
          <button className="absolute right-4 text-white text-3xl hover:text-orange-400 disabled:opacity-30"
            disabled={lightboxIdx === gallery.length - 1}
            onClick={e => { e.stopPropagation(); setLightboxIdx(i => i! + 1) }}>&#8250;</button>
        </div>
      )}

      {/* Products by category */}
      {Object.keys(productsByCategory).length > 0 && (
        <div className="mb-5 space-y-4">
          {Object.entries(productsByCategory).map(([cat, items]) => (
            <div key={cat} className="bg-gray-900 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800">
                <h2 className="text-sm font-bold text-white">{CATEGORY_LABELS[cat] ?? cat}</h2>
              </div>
              <div className="divide-y divide-gray-800/50">
                {items.map(p => (
                  <div key={p.id} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {p.imageUrl && (
                        <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{p.name}</p>
                        {p.description && <p className="text-xs text-gray-500 truncate">{p.description}</p>}
                        {p.stockQuantity != null && p.stockQuantity <= 5 && (
                          <span className="text-xs text-orange-400">{p.stockQuantity === 0 ? 'Esgotado' : `Ultimas ${p.stockQuantity} unidades`}</span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-orange-400">R$ {p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <p className="text-xs text-gray-500">/{p.unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reviews */}
      <div className="bg-gray-900 rounded-xl p-5 mb-5">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Avaliacoes ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <p className="text-gray-600 text-sm">Ainda sem avaliacoes.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map(r => (
              <div key={r.id} className="border-b border-gray-800 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400 text-sm">{'★'.repeat(r.boutiqueRating ?? 0)}</span>
                    <span className="text-sm font-medium text-white">{r.customer?.name ?? 'Cliente'}</span>
                  </div>
                  <span className="text-xs text-gray-600">{new Date(r.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
                {r.boutiqueComment && <p className="text-sm text-gray-400 mt-1">{r.boutiqueComment}</p>}
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
          <p className="font-bold text-white mb-1">Monte seu churrasco aqui!</p>
          <p className="text-sm text-gray-400">Escolha produtos de {boutique.name} para o seu evento.</p>
        </div>
        <button
          onClick={() => router.push('/menu/novo?boutiqueId=' + boutique.id)}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-xl transition-colors whitespace-nowrap shrink-0"
        >
          Montar pedido
        </button>
      </div>
    </div>
  )
}
