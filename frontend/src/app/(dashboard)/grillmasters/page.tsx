'use client'
import { API_URL } from '@/lib/api'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useFavoritesStore } from '@/store/favorites'

interface Grillmaster {
  id: string
  bio: string
  experience: number
  pricePerHour: number
  available: boolean
  city: string
  state: string
  rating: number
  totalOrders: number
  approved: boolean
  isChancelado: boolean
  specialties: string
  photoUrl: string | null
  churrascoStyle: string | null
  user: {
    name: string
    email: string
  }
}

function HeartButton({ targetType, targetId }: { targetType: string; targetId: string }) {
  const isFavorited = useFavoritesStore((s) => s.isFavorited(targetType, targetId))
  const toggle = useFavoritesStore((s) => s.toggle)
  return (
    <button
      onClick={(e) => { e.stopPropagation(); toggle(targetType, targetId) }}
      className="p-1.5 rounded-full hover:bg-gray-700 transition-colors shrink-0"
      aria-label={isFavorited ? 'Remover favorito' : 'Adicionar favorito'}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
        fill={isFavorited ? '#c23616' : 'none'}
        stroke={isFavorited ? '#c23616' : '#6b7280'}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  )
}

export default function GrillmastersPage() {
  const router = useRouter()
  const [grillmasters, setGrillmasters] = useState<Grillmaster[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [availableOnly, setAvailableOnly] = useState(false)
  const [sortBy, setSortBy] = useState('rating_desc')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minRating, setMinRating] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => { fetchGrillmasters() }, [page, availableOnly, sortBy])

  async function fetchGrillmasters() {
    setLoading(true)
    setError('')
    try {
      const raw = localStorage.getItem('auth-storage')
      const t = raw ? JSON.parse(raw)?.state?.token : null
      const params = new URLSearchParams({ page: String(page), limit: '9', sortBy })
      if (availableOnly) params.set('available', 'true')
      if (cityFilter.trim()) params.set('city', cityFilter.trim())
      if (minPrice) params.set('minPrice', minPrice)
      if (maxPrice) params.set('maxPrice', maxPrice)
      if (minRating) params.set('minRating', minRating)
      if (specialty.trim()) params.set('specialty', specialty.trim())
      const res = await fetch(`${API_URL}/grillmasters?${params}`, {
        headers: { Authorization: 'Bearer ' + t }
      })
      const data = await res.json()
      setGrillmasters(Array.isArray(data) ? data : data.grillmasters ?? [])
      setTotalPages(data.totalPages ?? 1)
      setTotal(data.total ?? (Array.isArray(data) ? data.length : (data.grillmasters ?? []).length))
    } catch {
      setError('Nao foi possivel carregar os churrasqueiros. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = grillmasters.filter(g => {
    const name = g.user?.name?.toLowerCase() ?? ''
    const bio = g.bio?.toLowerCase() ?? ''
    const q = search.toLowerCase()
    return name.includes(q) || bio.includes(q)
  })

  function renderStars(rating: number) {
    const full = Math.floor(rating)
    return Array.from({ length: 5 }, (_, i) => (i < full ? '★' : '☆')).join('')
  }

  function getInitials(name: string) {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  }

  const avatarColors = ['#C23B22', '#D4572B', '#B8340C', '#8B2500', '#A0360A', '#E06030', '#CC4515', '#9B2D0E']

  function getAvatarColor(name: string) {
    let hash = 0
    for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) % avatarColors.length
    return avatarColors[hash]
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Churrasqueiros</h1>
          <p className="text-sm text-gray-400 mt-1">Mestres da brasa disponiveis para seu evento</p>
        </div>
        <Link href="/grillmasters/new" className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium text-sm">
          Cadastrar-se
        </Link>
      </div>

      <div className="bg-gray-900 rounded-xl p-4 mb-6 space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-xs text-gray-400 mb-1">Buscar por nome</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nome..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
              />
              <button
                onClick={() => { setPage(1); fetchGrillmasters() }}
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-3 py-2 text-sm"
              >
                Buscar
              </button>
            </div>
          </div>
          <div className="min-w-36">
            <label className="block text-xs text-gray-400 mb-1">Cidade</label>
            <input
              type="text"
              placeholder="Sao Paulo..."
              value={cityFilter}
              onChange={e => setCityFilter(e.target.value)}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
            />
          </div>
          <div className="min-w-36">
            <label className="block text-xs text-gray-400 mb-1">Especialidade</label>
            <input
              type="text"
              placeholder="Carne, peixe..."
              value={specialty}
              onChange={e => setSpecialty(e.target.value)}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="min-w-28">
            <label className="block text-xs text-gray-400 mb-1">Preco min (R$/h)</label>
            <input
              type="number"
              placeholder="0"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              min={0}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
            />
          </div>
          <div className="min-w-28">
            <label className="block text-xs text-gray-400 mb-1">Preco max (R$/h)</label>
            <input
              type="number"
              placeholder="Sem limite"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              min={0}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
            />
          </div>
          <div className="min-w-36">
            <label className="block text-xs text-gray-400 mb-1">Avaliacao minima</label>
            <select
              value={minRating}
              onChange={e => setMinRating(e.target.value)}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="">Qualquer</option>
              <option value="4">4+ estrelas</option>
              <option value="3">3+ estrelas</option>
              <option value="2">2+ estrelas</option>
            </select>
          </div>
          <div className="min-w-40">
            <label className="block text-xs text-gray-400 mb-1">Ordenar por</label>
            <select
              value={sortBy}
              onChange={e => { setSortBy(e.target.value); setPage(1) }}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="rating_desc">Melhor avaliacao</option>
              <option value="price_asc">Menor preco</option>
              <option value="price_desc">Maior preco</option>
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer pb-1">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={e => { setAvailableOnly(e.target.checked); setPage(1) }}
              className="accent-orange-500 w-4 h-4"
            />
            <span className="text-sm text-gray-300">Apenas disponiveis</span>
          </label>
          <div className="flex gap-2 pb-0.5">
            <button
              onClick={() => { setPage(1); fetchGrillmasters() }}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-4 py-2 text-sm font-medium"
            >
              Aplicar
            </button>
            <button
              onClick={() => {
                setSearch(''); setCityFilter(''); setSpecialty(''); setMinPrice(''); setMaxPrice('')
                setMinRating(''); setAvailableOnly(false); setSortBy('rating_desc'); setPage(1)
                setTimeout(fetchGrillmasters, 0)
              }}
              className="border border-gray-600 hover:border-gray-500 text-gray-400 hover:text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              Limpar
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4 mb-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-xl p-5 animate-pulse">
              <div className="flex gap-3 mb-4">
                <div className="w-14 h-14 rounded-full bg-gray-700 shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-700 rounded mb-2 w-3/4" />
                  <div className="h-3 bg-gray-700 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-gray-700 rounded mb-2" />
              <div className="h-3 bg-gray-700 rounded w-4/5" />
            </div>
          ))}
        </div>
      )}

      {!loading && !error && (
        <p className="text-xs text-gray-500 mb-4">
          {total} churrasqueiro{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
        </p>
      )}

      {!loading && filtered.length === 0 && !error && (
        <div className="text-center py-16 bg-gray-900 rounded-xl text-gray-400">
          <p className="text-lg mb-4">Nenhum churrasqueiro encontrado.</p>
          <button
            onClick={() => {
              setSearch(''); setCityFilter(''); setSpecialty(''); setMinPrice(''); setMaxPrice('')
              setMinRating(''); setAvailableOnly(false); setSortBy('rating_desc'); setPage(1)
              setTimeout(fetchGrillmasters, 0)
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm"
          >
            Limpar filtros
          </button>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(g => {
            const name = g.user?.name ?? 'Churrasqueiro'
            const avatarBg = getAvatarColor(name)
            const isFounder = ['jota', 'albuquerque', 'joao paulo', 'joão paulo'].some(k => name.toLowerCase().includes(k))
            const hasPhoto = g.photoUrl || isFounder
            return (
              <div key={g.id} className="bg-gray-900 rounded-xl overflow-hidden hover:scale-[1.02] hover:border-orange-500/30 border border-transparent hover:shadow-lg transition-all duration-200">
                {/* Photo area */}
                <div className="relative h-36 overflow-hidden">
                  {hasPhoto ? (
                    <img
                      src={isFounder ? '/jota.jpg' : g.photoUrl!}
                      alt={name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${avatarBg}66, #111827)` }}>
                      <span className="text-4xl font-black text-white/40">{getInitials(name)}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
                  {/* Badges overlay */}
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    {g.isChancelado && (
                      <span className="bg-yellow-500/90 text-black text-xs font-bold px-2 py-0.5 rounded-full">Chancelado</span>
                    )}
                    {g.churrascoStyle && (
                      <span className="bg-orange-500/80 text-white text-xs px-2 py-0.5 rounded-full">{g.churrascoStyle}</span>
                    )}
                  </div>
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <HeartButton targetType="GRILLMASTER" targetId={g.id} />
                    <span className={'text-xs px-2 py-0.5 rounded-full font-medium ' + (g.available ? 'bg-green-500/80 text-white' : 'bg-gray-700/80 text-gray-400')}>
                      {g.available ? 'Disponivel' : 'Ocupado'}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <Link href={'/grillmasters/' + g.id} className="font-bold text-white leading-tight hover:text-orange-400 transition-colors">
                      {name}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-400 text-sm">{renderStars(g.rating ?? 0)}</span>
                    <span className="text-xs text-gray-400">{(g.rating ?? 0).toFixed(1)} ({g.totalOrders ?? 0} pedidos)</span>
                  </div>

                  <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                    {g.bio || 'Especialista em grelhados e churrasco artesanal.'}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-3 text-xs">
                    <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded-full">{g.city}, {g.state}</span>
                    <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded-full">{g.experience} {g.experience === 1 ? 'ano' : 'anos'} exp.</span>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-700/50 pt-3">
                    <div>
                      <span className="text-xs text-gray-500 block">por hora</span>
                      <span className="text-lg font-bold text-orange-400">
                        R$ {(g.pricePerHour ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <button
                      disabled={!g.available}
                      onClick={() => router.push('/pedido?grillmasterId=' + g.id)}
                      className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      {g.available ? 'Contratar' : 'Indisponivel'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg border border-gray-700 text-sm disabled:opacity-40 hover:bg-gray-800 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={'px-3 py-2 rounded-lg text-sm font-medium ' + (page === i + 1 ? 'bg-orange-500 text-white' : 'border border-gray-700 hover:bg-gray-800')}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-lg border border-gray-700 text-sm disabled:opacity-40 hover:bg-gray-800 disabled:cursor-not-allowed"
          >
            Proxima
          </button>
        </div>
      )}
    </div>
  )
}