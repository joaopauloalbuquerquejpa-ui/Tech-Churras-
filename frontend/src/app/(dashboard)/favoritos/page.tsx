'use client'
import { API_URL } from '@/lib/api'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  pricePerHour: number
  available: boolean
  city: string
  state: string
  rating: number
  totalOrders: number
  isChancelado: boolean
  user: { name: string }
}

interface Boutique {
  id: string
  name: string
  description?: string
  city: string
  state: string
  open: boolean
  rating: number
}

function HeartButton({ targetType, targetId }: { targetType: string; targetId: string }) {
  const toggle = useFavoritesStore((s) => s.toggle)
  return (
    <button
      onClick={(e) => { e.stopPropagation(); toggle(targetType, targetId) }}
      className="p-1.5 rounded-full hover:bg-gray-700 transition-colors"
      title="Remover favorito"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
        fill="#c23616" stroke="#c23616"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  )
}

export default function FavoritosPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'grillmasters' | 'boutiques'>('grillmasters')
  const [grillmasters, setGrillmasters] = useState<Grillmaster[]>([])
  const [boutiques, setBoutiques] = useState<Boutique[]>([])
  const [loading, setLoading] = useState(true)
  const entries = useFavoritesStore((s) => s.entries)
  const load = useFavoritesStore((s) => s.load)

  useEffect(() => {
    const token = getToken()
    if (!token) { router.push('/login'); return }
    setLoading(true)
    fetch(`${API_URL}/favorites`, { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json())
      .then(data => {
        setGrillmasters(data.grillmasters ?? [])
        setBoutiques(data.boutiques ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Refresh when entries change (after a toggle)
  useEffect(() => {
    if (!loading) {
      const token = getToken()
      if (!token) return
      fetch(`${API_URL}/favorites`, { headers: { Authorization: 'Bearer ' + token } })
        .then(r => r.json())
        .then(data => {
          setGrillmasters(data.grillmasters ?? [])
          setBoutiques(data.boutiques ?? [])
        })
        .catch(() => {})
    }
  }, [entries])

  function renderStars(rating: number) {
    return Array.from({ length: 5 }, (_, i) => (i < Math.floor(rating) ? '★' : '☆')).join('')
  }

  function getInitials(name: string) {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Meus Favoritos</h1>
        <p className="text-sm text-gray-400 mt-1">
          {grillmasters.length + boutiques.length} item{grillmasters.length + boutiques.length !== 1 ? 's' : ''} favoritado{grillmasters.length + boutiques.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex gap-1 bg-gray-900 rounded-xl p-1 mb-6 w-fit">
        <button
          onClick={() => setTab('grillmasters')}
          className={'px-5 py-2 rounded-lg text-sm font-medium transition-colors ' +
            (tab === 'grillmasters' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white')}
        >
          Churrasqueiros ({grillmasters.length})
        </button>
        <button
          onClick={() => setTab('boutiques')}
          className={'px-5 py-2 rounded-lg text-sm font-medium transition-colors ' +
            (tab === 'boutiques' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white')}
        >
          Acougues ({boutiques.length})
        </button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-900 rounded-xl p-5 animate-pulse h-28" />
          ))}
        </div>
      )}

      {!loading && tab === 'grillmasters' && (
        <>
          {grillmasters.length === 0 ? (
            <div className="text-center py-16 bg-gray-900 rounded-xl">
              <p className="text-gray-400 mb-4">Nenhum churrasqueiro favoritado ainda.</p>
              <Link href="/grillmasters" className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm">
                Explorar churrasqueiros
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {grillmasters.map(g => {
                const name = g.user?.name ?? 'Churrasqueiro'
                const isFounder = ['jota', 'albuquerque'].some(k => name.toLowerCase().includes(k))
                return (
                  <div key={g.id} className="bg-gray-900 rounded-xl p-5 hover:bg-gray-800 transition">
                    <div className="flex gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-orange-700 flex items-center justify-center text-white font-bold">
                        {isFounder
                          ? <Image src="/jota.jpg" alt={name} width={48} height={48} className="object-cover w-full h-full" />
                          : getInitials(name)
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <Link href={'/grillmasters/' + g.id} className="font-bold text-white hover:text-orange-400 transition-colors">
                            {name}
                          </Link>
                          <HeartButton targetType="GRILLMASTER" targetId={g.id} />
                        </div>
                        <p className="text-xs text-gray-400">{g.city}, {g.state}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-yellow-400 text-xs">{renderStars(g.rating ?? 0)}</span>
                          <span className="text-xs text-gray-500">({g.totalOrders ?? 0})</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-700 pt-3">
                      <span className="text-orange-400 font-bold">
                        R$ {(g.pricePerHour ?? 0).toFixed(0)}<span className="text-xs text-gray-500 font-normal">/h</span>
                      </span>
                      <button
                        disabled={!g.available}
                        onClick={() => router.push('/pedido?grillmasterId=' + g.id)}
                        className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {g.available ? 'Contratar' : 'Indisponivel'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {!loading && tab === 'boutiques' && (
        <>
          {boutiques.length === 0 ? (
            <div className="text-center py-16 bg-gray-900 rounded-xl">
              <p className="text-gray-400 mb-4">Nenhum acougue favoritado ainda.</p>
              <Link href="/boutiques" className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm">
                Explorar acougues
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {boutiques.map(b => (
                <div key={b.id} className="bg-gray-900 rounded-xl p-5 hover:bg-gray-800 transition">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white">{b.name}</p>
                      <p className="text-xs text-gray-400">{b.city}, {b.state}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <HeartButton targetType="BOUTIQUE" targetId={b.id} />
                      <span className={'text-xs px-2 py-0.5 rounded-full font-medium ' +
                        (b.open ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')}>
                        {b.open ? 'Aberto' : 'Fechado'}
                      </span>
                    </div>
                  </div>
                  {b.description && (
                    <p className="text-sm text-gray-400 line-clamp-2">{b.description}</p>
                  )}
                  {b.rating > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      <span className="text-yellow-400">{renderStars(b.rating)}</span> {b.rating.toFixed(1)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
