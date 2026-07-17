'use client'
import { API_URL } from '@/lib/api'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useFavoritesStore } from '@/store/favorites'
import { useCartStore } from '@/store/cart'

const ALL_CATEGORIES = 'TODOS' as const


function getToken() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
}

interface Boutique {
  id: string; name: string; description?: string; city: string; state: string
  phone?: string; address?: string; rating: number; open: boolean
  logoUrl?: string; facadeUrl?: string; galleryUrls?: string[]
  instagram?: string; openingHours?: string; deliveryOrPickup?: string
  products?: Product[]
}

interface Product {
  id: string; name: string; description?: string; price: number; unit: string
  category: string; available: boolean; stockQuantity?: number
  imageUrl?: string; discountPercent?: number | null; discountValidUntil?: string | null
}

interface Kit {
  id: string; name: string; description: string; price: number
  discountPrice?: number | null; coverImageUrl?: string | null
  minGuests: number; maxGuests: number; items: string
}

interface Review {
  id: string; boutiqueRating: number; boutiqueComment?: string
  photos?: string[]; createdAt: string; customer: { name: string }
}

const CATEGORY_LABELS: Record<string, string> = {
  CARNE: 'Carnes',
  SAL_TEMPERO: 'Temperos',
  CARVAO: 'Carvão',
  ACOMPANHAMENTO: 'Acompanhamentos',
  BEBIDA: 'Bebidas',
  OUTRO: 'Outros',
}

const CATEGORY_EMOJI: Record<string, string> = {
  CARNE: '🥩', SAL_TEMPERO: '🧂', CARVAO: '🔥', ACOMPANHAMENTO: '🥗', BEBIDA: '🍺', OUTRO: '📦',
}

function isDiscountActive(p: Product) {
  if (!p.discountPercent) return false
  if (p.discountValidUntil && new Date(p.discountValidUntil) < new Date()) return false
  return true
}

function discountedPrice(price: number, pct: number) {
  return price * (1 - pct / 100)
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
  const [kits, setKits] = useState<Kit[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORIES)
  const [search, setSearch] = useState('')

  const { selectedQty, setSelectedQty, setBoutiqueId, boutiqueId: cartBoutiqueId } = useCartStore()

  useEffect(() => {
    if (!id) return
    const token = getToken()
    const h = token ? { Authorization: 'Bearer ' + token } : {} as Record<string, string>
    setLoading(true)
    Promise.all([
      fetch(`${API_URL}/boutiques/${id}`, { headers: h }).then(r => {
        if (!r.ok) throw new Error('Nao encontrado')
        return r.json()
      }),
      fetch(`${API_URL}/reviews/boutique/${id}`).then(r => r.ok ? r.json() : []),
      fetch(`${API_URL}/boutiques/${id}/kits`).then(r => r.ok ? r.json() : []),
    ])
      .then(([bData, revData, kitsData]) => {
        setBoutique(bData)
        setReviews(Array.isArray(revData) ? revData : [])
        setKits(Array.isArray(kitsData) ? kitsData : [])
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
  const allProducts = (boutique.products ?? []).filter(p => p.available)

  const availableCategories = [...new Set(allProducts.map(p => p.category))]

  const filteredProducts = allProducts.filter(p => {
    const matchCat = activeCategory === ALL_CATEGORIES || p.category === activeCategory
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const isMyBoutique = boutique != null && cartBoutiqueId === boutique.id

  function addToCart(productId: string) {
    if (!boutique) return
    if (cartBoutiqueId && cartBoutiqueId !== boutique.id) {
      setBoutiqueId(boutique.id)
      setSelectedQty({ [productId]: 1 })
    } else {
      setBoutiqueId(boutique.id)
      setSelectedQty({ ...selectedQty, [productId]: (selectedQty[productId] || 0) + 1 })
    }
  }

  function removeFromCart(productId: string) {
    const curr = selectedQty[productId] || 0
    if (curr <= 1) {
      const next = { ...selectedQty }
      delete next[productId]
      setSelectedQty(next)
    } else {
      setSelectedQty({ ...selectedQty, [productId]: curr - 1 })
    }
  }

  const cartCount = isMyBoutique
    ? Object.values(selectedQty).reduce((s, v) => s + v, 0)
    : 0

  const cartTotal = isMyBoutique
    ? allProducts.reduce((sum, p) => {
        const qty = selectedQty[p.id] || 0
        if (!qty) return sum
        const active = isDiscountActive(p)
        const price = active ? discountedPrice(p.price, p.discountPercent!) : p.price
        return sum + price * qty
      }, 0)
    : 0

  const productsByCategory = filteredProducts.reduce<Record<string, Product[]>>((acc, p) => {
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
        <div className="absolute top-4 right-4"><HeartButton id={boutique.id} /></div>
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

      {/* ── PACOTES DE CHURRASCO ─────────────────────────────────────────── */}
      {kits.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Pacotes de Churrasco</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
            {kits.map(k => {
              const saving = k.discountPrice && k.discountPrice < k.price ? k.price - k.discountPrice : 0
              const finalPrice = k.discountPrice && k.discountPrice < k.price ? k.discountPrice : k.price
              let kitItems: { productName: string; quantity: number; unit: string }[] = []
              try { kitItems = JSON.parse(k.items) || [] } catch { kitItems = [] }
              return (
                <div key={k.id} className="bg-gray-900 border border-orange-500/30 rounded-2xl overflow-hidden shrink-0 w-72">
                  {k.coverImageUrl ? (
                    <div className="h-32 overflow-hidden">
                      <img src={k.coverImageUrl} alt={k.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-32 bg-gradient-to-br from-orange-900/30 to-gray-900 flex items-center justify-center text-5xl">🍖</div>
                  )}
                  <div className="p-4">
                    {saving > 0 && (
                      <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full font-bold mb-2 inline-block">
                        PACOTE — Economize R$ {saving.toFixed(2)}
                      </span>
                    )}
                    <h3 className="font-bold text-white">{k.name}</h3>
                    <p className="text-xs text-gray-400 mb-1">{k.minGuests}–{k.maxGuests} pessoas</p>
                    {k.description && <p className="text-xs text-gray-500 mb-2">{k.description}</p>}
                    {kitItems.length > 0 && (
                      <div className="mb-3 space-y-0.5">
                        {kitItems.map((item, i) => (
                          <p key={i} className="text-xs text-gray-500">• {item.productName} — {item.quantity}{item.unit}</p>
                        ))}
                      </div>
                    )}
                    <div className="flex items-end justify-between mt-3">
                      <div>
                        {saving > 0 && <p className="text-xs text-gray-500 line-through">R$ {k.price.toFixed(2)}</p>}
                        <p className="text-lg font-black text-orange-400">R$ {finalPrice.toFixed(2)}</p>
                      </div>
                      <button
                        onClick={() => { setBoutiqueId(boutique.id); router.push('/pedido?boutiqueId=' + boutique.id) }}
                        className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                      >
                        Pedir
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── PRODUTOS ─────────────────────────────────────────────────────── */}
      {allProducts.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Produtos</h2>

          {/* Search */}
          <div className="relative mb-3">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar produto..."
              className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Category filter */}
          {availableCategories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
              <button
                onClick={() => setActiveCategory(ALL_CATEGORIES)}
                className={'shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ' + (activeCategory === ALL_CATEGORIES ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700')}
              >
                Todos
              </button>
              {availableCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={'shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ' + (activeCategory === cat ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700')}
                >
                  <span>{CATEGORY_EMOJI[cat] || '🛒'}</span>
                  {CATEGORY_LABELS[cat] || cat}
                </button>
              ))}
            </div>
          )}

          {/* Grid de produtos */}
          {Object.keys(productsByCategory).length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">Nenhum produto encontrado</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(productsByCategory).map(([cat, items]) => (
                <div key={cat}>
                  {activeCategory === ALL_CATEGORIES && (
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <span>{CATEGORY_EMOJI[cat] || '🛒'}</span>
                      {CATEGORY_LABELS[cat] || cat}
                    </h3>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {items.map(p => {
                      const active = isDiscountActive(p)
                      const finalPrice = active ? discountedPrice(p.price, p.discountPercent!) : p.price
                      const lowStock = p.stockQuantity != null && p.stockQuantity <= 5
                      return (
                        <div key={p.id} className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-orange-500/40 transition-colors">
                          {/* Foto */}
                          <div className="relative aspect-square bg-gray-800">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-gray-800 to-gray-900">
                                {CATEGORY_EMOJI[p.category] || '🥩'}
                              </div>
                            )}
                            {/* Badges */}
                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                              {active && (
                                <span className="bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                                  {p.discountPercent}% OFF
                                </span>
                              )}
                              {lowStock && (
                                <span className="bg-red-500/90 text-white text-xs px-1.5 py-0.5 rounded-full">
                                  {p.stockQuantity === 0 ? 'Esgotado' : `Últimas ${p.stockQuantity}`}
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Info */}
                          <div className="p-3">
                            <p className="text-sm font-semibold text-white leading-snug mb-0.5 line-clamp-2">{p.name}</p>
                            <p className="text-xs text-gray-500 mb-2">/{p.unit}</p>
                            <div className="flex items-end justify-between gap-1">
                              <div>
                                {active && (
                                  <p className="text-xs text-gray-500 line-through leading-none">
                                    R$ {p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                )}
                                <p className="text-base font-black text-orange-400 leading-tight">
                                  R$ {finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                              {p.stockQuantity !== 0 && (
                                isMyBoutique && (selectedQty[p.id] || 0) > 0 ? (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      onClick={() => removeFromCart(p.id)}
                                      className="bg-gray-700 hover:bg-gray-600 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-base transition-colors"
                                    >−</button>
                                    <span className="text-white font-bold text-sm w-5 text-center">{selectedQty[p.id]}</span>
                                    <button
                                      onClick={() => addToCart(p.id)}
                                      className="bg-orange-500 hover:bg-orange-600 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold transition-colors"
                                    >+</button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => addToCart(p.id)}
                                    className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors"
                                  >
                                    +
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
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
          onClick={() => { setBoutiqueId(boutique.id); router.push('/pedido?boutiqueId=' + boutique.id) }}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-xl transition-colors whitespace-nowrap shrink-0"
        >
          {cartCount > 0 ? 'Ver carrinho' : 'Montar pedido'}
        </button>
      </div>

      {/* Floating cart bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-orange-500 rounded-2xl px-6 py-3.5 flex items-center gap-6 shadow-2xl shadow-orange-500/30 min-w-72">
          <div>
            <p className="text-white font-bold text-sm">{cartCount} {cartCount === 1 ? 'item' : 'itens'}</p>
            <p className="text-orange-200 text-xs">R$ {cartTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <button
            onClick={() => router.push('/menu/novo')}
            className="ml-auto bg-white text-orange-600 font-bold px-5 py-2 rounded-xl text-sm whitespace-nowrap"
          >
            Ver carrinho →
          </button>
        </div>
      )}
    </div>
  )
}