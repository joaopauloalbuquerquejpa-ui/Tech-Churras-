'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useFavoritesStore } from '@/store/favorites'

interface Boutique {
  id: string
  name: string
  description: string
  city: string
  state: string
  phone: string
  rating: number
  open: boolean
}

function HeartButton({ targetType, targetId }: { targetType: string; targetId: string }) {
  const isFavorited = useFavoritesStore((s) => s.isFavorited(targetType, targetId))
  const toggle = useFavoritesStore((s) => s.toggle)
  return (
    <button
      onClick={(e) => { e.stopPropagation(); toggle(targetType, targetId) }}
      className="p-1.5 rounded-full hover:bg-gray-700 transition-colors"
      aria-label={isFavorited ? 'Remover favorito' : 'Adicionar favorito'}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
        fill={isFavorited ? '#f97316' : 'none'}
        stroke={isFavorited ? '#f97316' : '#6b7280'}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  )
}

const BASE = 'https://tech-churras-production.up.railway.app'

export default function BoutiquesPage() {
  const [boutiques, setBoutiques] = useState<Boutique[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [minRating, setMinRating] = useState('')
  const [sortBy, setSortBy] = useState('rating_desc')

  useEffect(() => { fetchBoutiques() }, [])

  async function fetchBoutiques() {
    setLoading(true)
    try {
      const raw = localStorage.getItem('auth-storage')
      const t = raw ? JSON.parse(raw)?.state?.token : null
      const params = new URLSearchParams({ sortBy })
      if (cityFilter.trim()) params.set('city', cityFilter.trim())
      if (minRating) params.set('minRating', minRating)
      const res = await fetch(`${BASE}/boutiques?${params}`, {
        headers: { Authorization: 'Bearer ' + t },
      })
      const data = await res.json()
      setBoutiques(Array.isArray(data) ? data : data.boutiques || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const filtered = boutiques.filter(b =>
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.city?.toLowerCase().includes(search.toLowerCase())
  )

  function clearFilters() {
    setCityFilter(''); setMinRating(''); setSortBy('rating_desc'); setSearch('')
    setTimeout(fetchBoutiques, 0)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Boutiques de Carne</h1>
          <p className="text-sm text-gray-400 mt-1">Acougues premium para o seu churrasco</p>
        </div>
        <Link href="/boutiques/new" className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium text-sm">
          Cadastrar acougue
        </Link>
      </div>

      <div className="bg-gray-900 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-40">
          <label className="block text-xs text-gray-400 mb-1">Buscar por nome</label>
          <input
            type="text"
            placeholder="Nome do acougue..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
          />
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
            onChange={e => setSortBy(e.target.value)}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="rating_desc">Melhor avaliacao</option>
          </select>
        </div>
        <div className="flex gap-2 pb-0.5">
          <button
            onClick={() => fetchBoutiques()}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-4 py-2 text-sm font-medium"
          >
            Aplicar
          </button>
          <button
            onClick={clearFilters}
            className="border border-gray-600 hover:border-gray-500 text-gray-400 hover:text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            Limpar
          </button>
        </div>
      </div>

      {loading && <p className="text-gray-400">Carregando...</p>}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">Nenhuma boutique encontrada.</p>
          <button onClick={clearFilters} className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm">
            Limpar filtros
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(boutique => (
          <div key={boutique.id} className="bg-gray-900 rounded-xl p-5 hover:bg-gray-800 transition">
            <div className="flex items-start justify-between mb-3">
              <h2 className="font-bold text-lg leading-tight">{boutique.name}</h2>
              <div className="flex items-center gap-1 shrink-0">
                <HeartButton targetType="BOUTIQUE" targetId={boutique.id} />
                <span className={"text-xs px-2 py-1 rounded-full font-medium " + (boutique.open ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')}>
                  {boutique.open ? 'Aberto' : 'Fechado'}
                </span>
              </div>
            </div>
            {boutique.description && <p className="text-gray-400 text-sm mb-3">{boutique.description}</p>}
            <div className="text-sm text-gray-400 space-y-1">
              {boutique.city && <p>{boutique.city}{boutique.state ? ', ' + boutique.state : ''}</p>}
              {boutique.phone && <p>{boutique.phone}</p>}
              {boutique.rating > 0 && <p>Avaliacao: {boutique.rating.toFixed(1)}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
