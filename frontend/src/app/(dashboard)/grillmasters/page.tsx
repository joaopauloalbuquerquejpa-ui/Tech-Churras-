'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

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
  user: {
    name: string
    email: string
  }
}

export default function GrillmastersPage() {
  const router = useRouter()
  const [grillmasters, setGrillmasters] = useState<Grillmaster[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [availableOnly, setAvailableOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'rating' | 'pricePerHour' | 'experience'>('rating')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

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
      const res = await fetch(`https://tech-churras-production.up.railway.app/grillmasters?${params}`, {
        headers: { Authorization: 'Bearer ' + t }
      })
      const data = await res.json()
      setGrillmasters(Array.isArray(data) ? data : data.grillmasters ?? [])
      setTotalPages(data.totalPages ?? 1)
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

      <div className="bg-gray-900 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <label className="block text-xs text-gray-400 mb-1">Buscar</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nome ou bio..."
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
            onChange={e => { setCityFilter(e.target.value); setPage(1) }}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
          />
        </div>
        <div className="min-w-40">
          <label className="block text-xs text-gray-400 mb-1">Ordenar por</label>
          <select
            value={sortBy}
            onChange={e => { setSortBy(e.target.value as typeof sortBy); setPage(1) }}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="rating">Melhor avaliacao</option>
            <option value="pricePerHour">Menor preco</option>
            <option value="experience">Mais experiente</option>
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
          {filtered.length} churrasqueiro{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
        </p>
      )}

      {!loading && filtered.length === 0 && !error && (
        <div className="text-center py-16 bg-gray-900 rounded-xl text-gray-400">
          <p className="text-lg mb-4">Nenhum churrasqueiro encontrado.</p>
          <button
            onClick={() => { setSearch(''); setCityFilter(''); setAvailableOnly(false); setPage(1); fetchGrillmasters() }}
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
            return (
              <div key={g.id} className="bg-gray-900 rounded-xl overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-150">
                <div className={'h-1.5 ' + (g.available ? 'bg-orange-500' : 'bg-gray-600')} />
                <div className="p-5">
                  <div className="flex gap-3 mb-3">
                    <div
                      className="w-14 h-14 rounded-full shrink-0 overflow-hidden flex items-center justify-center text-white font-bold text-lg"
                      style={isFounder ? undefined : { background: avatarBg }}
                    >
                      {isFounder
                        ? <Image src="/jota.jpg" alt={name} width={56} height={56} className="object-cover w-full h-full" />
                        : getInitials(name)
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={'/grillmasters/' + g.id} className="font-bold text-white leading-tight hover:text-orange-400 transition-colors">
                        {name}
                      </Link>
                        <span className={'text-xs px-2 py-0.5 rounded-full shrink-0 font-medium ' + (g.available ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400')}>
                          {g.available ? 'Disponivel' : 'Ocupado'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-yellow-400 text-sm">{renderStars(g.rating ?? 0)}</span>
                        <span className="text-xs text-gray-400">{(g.rating ?? 0).toFixed(1)} ({g.totalOrders ?? 0})</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                    {g.bio || 'Especialista em grelhados e churrasco artesanal.'}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4 text-xs">
                    <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded-full">
                      {g.city}, {g.state}
                    </span>
                    <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded-full">
                      {g.experience} {g.experience === 1 ? 'ano' : 'anos'} exp.
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-700 pt-3">
                    <div>
                      <span className="text-xs text-gray-500 block">por hora</span>
                      <span className="text-lg font-bold text-orange-400">
                        R$ {(g.pricePerHour ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <button
                      disabled={!g.available}
                      onClick={() => router.push('/menu/novo?grillmasterId=' + g.id)}
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
