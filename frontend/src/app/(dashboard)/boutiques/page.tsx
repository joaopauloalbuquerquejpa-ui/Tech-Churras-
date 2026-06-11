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

export default function BoutiquesPage() {
  const [boutiques, setBoutiques] = useState<Boutique[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const raw = localStorage.getItem('auth-storage')
    const t = raw ? JSON.parse(raw)?.state?.token : null
    fetch('https://tech-churras-production.up.railway.app/boutiques', {
      headers: { Authorization: 'Bearer ' + t }
    })
      .then(r => r.json())
      .then(data => setBoutiques(Array.isArray(data) ? data : data.boutiques || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = boutiques.filter(b =>
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.city?.toLowerCase().includes(search.toLowerCase())
  )

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

      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar por nome ou cidade..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
        />
      </div>

      {loading && <p className="text-gray-400">Carregando...</p>}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">Nenhuma boutique encontrada.</p>
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
