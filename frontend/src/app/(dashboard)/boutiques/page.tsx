'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

interface Boutique {
  id: string
  name: string
  description: string
  city: string
  state: string
  phone: string
  rating: number
  isOpen: boolean
}

export default function BoutiquesPage() {
  const router = useRouter()
  const { token } = useAuthStore()
  const [boutiques, setBoutiques] = useState<Boutique[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchBoutiques()
  }, [])

  async function fetchBoutiques() {
    try {
      const raw = localStorage.getItem('auth-storage')
      const t = raw ? JSON.parse(raw)?.state?.token : null
      const res = await fetch('https://tech-churras-production.up.railway.app/boutiques', {
        headers: { Authorization: 'Bearer ' + t }
      })
      const data = await res.json()
      setBoutiques(Array.isArray(data) ? data : data.boutiques || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = boutiques.filter(b =>
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.city?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold'>Boutiques de Carne</h1>
        <p className='text-gray-400 mt-1'>Acougues premium para o seu churrasco</p>
      </div>

      <div className='mb-6'>
        <input
          type='text'
          placeholder='Buscar por nome ou cidade...'
          value={search}
          onChange={e => setSearch(e.target.value)}
          className='w-full max-w-md bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500'
        />
      </div>

      {loading && <p className='text-gray-400'>Carregando...</p>}

      {!loading && filtered.length === 0 && (
        <div className='text-center py-16 text-gray-400'>
          <p className='text-4xl mb-4'>🥩</p>
          <p className='text-lg'>Nenhuma boutique encontrada.</p>
        </div>
      )}

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {filtered.map(boutique => (
          <div key={boutique.id} className='bg-gray-900 rounded-xl p-5 hover:bg-gray-800 transition'>
            <div className='flex items-start justify-between mb-3'>
              <h2 className='font-bold text-lg'>{boutique.name}</h2>
              <span className={'text-xs px-2 py-1 rounded-full font-medium ' + (boutique.isOpen ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')}>
                {boutique.isOpen ? 'Aberto' : 'Fechado'}
              </span>
            </div>
            {boutique.description && <p className='text-gray-400 text-sm mb-3'>{boutique.description}</p>}
            <div className='text-sm text-gray-400 space-y-1'>
              {boutique.city && <p>📍 {boutique.city}{boutique.state ? ', ' + boutique.state : ''}</p>}
              {boutique.phone && <p>📞 {boutique.phone}</p>}
              {boutique.rating > 0 && <p>⭐ {boutique.rating.toFixed(1)}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}