'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Grillmaster { id: string; name: string; pricePerDay: number }
interface Boutique { id: string; name: string }

export default function NewOrderPage() {
  const router = useRouter()
  const [grillmasters, setGrillmasters] = useState<Grillmaster[]>([])
  const [boutiques, setBoutiques] = useState<Boutique[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    grillmasterId: '',
    boutiqueId: '',
    eventDate: '',
    numberOfPeople: 10,
    notes: '',
  })

  useEffect(() => {
    const raw = localStorage.getItem('auth-storage')
    const t = raw ? JSON.parse(raw)?.state?.token : null
    const h = { Authorization: 'Bearer ' + t }
    fetch('https://tech-churras-production.up.railway.app/grillmasters', { headers: h })
      .then(r => r.json()).then(d => setGrillmasters(d.grillmasters || d))
    fetch('https://tech-churras-production.up.railway.app/boutiques', { headers: h })
      .then(r => r.json()).then(d => setBoutiques(d.boutiques || d))
  }, [])

  async function handleSubmit() {
    setLoading(true)
    try {
      const raw = localStorage.getItem('auth-storage')
      const t = raw ? JSON.parse(raw)?.state?.token : null
      const res = await fetch('https://tech-churras-production.up.railway.app/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t },
        body: JSON.stringify(form)
      })
      if (res.ok) router.push('/orders')
      else alert('Erro ao criar pedido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='max-w-xl mx-auto'>
      <h1 className='text-2xl font-bold mb-6'>Novo Pedido</h1>
      <div className='bg-gray-900 rounded-xl p-6 space-y-4'>
        <div>
          <label className='block text-sm text-gray-400 mb-1'>Churrasqueiro</label>
          <select value={form.grillmasterId} onChange={e => setForm({...form, grillmasterId: e.target.value})}
            className='w-full bg-gray-800 rounded-lg px-3 py-2 text-white'>
            <option value=''>Selecione...</option>
            {grillmasters.map(g => <option key={g.id} value={g.id}>{g.name} - R$ {g.pricePerDay}/dia</option>)}
          </select>
        </div>
        <div>
          <label className='block text-sm text-gray-400 mb-1'>Acougue (opcional)</label>
          <select value={form.boutiqueId} onChange={e => setForm({...form, boutiqueId: e.target.value})}
            className='w-full bg-gray-800 rounded-lg px-3 py-2 text-white'>
            <option value=''>Nenhum</option>
            {boutiques.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className='block text-sm text-gray-400 mb-1'>Data do Evento</label>
          <input type='date' value={form.eventDate} onChange={e => setForm({...form, eventDate: e.target.value})}
            className='w-full bg-gray-800 rounded-lg px-3 py-2 text-white' />
        </div>
        <div>
          <label className='block text-sm text-gray-400 mb-1'>Numero de Pessoas</label>
          <input type='number' value={form.numberOfPeople} onChange={e => setForm({...form, numberOfPeople: +e.target.value})}
            className='w-full bg-gray-800 rounded-lg px-3 py-2 text-white' />
        </div>
        <div>
          <label className='block text-sm text-gray-400 mb-1'>Observacoes</label>
          <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
            className='w-full bg-gray-800 rounded-lg px-3 py-2 text-white h-24 resize-none' />
        </div>
        <button onClick={handleSubmit} disabled={loading || !form.grillmasterId || !form.eventDate}
          className='w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3 rounded-lg font-bold'>
          {loading ? 'Criando...' : 'Confirmar Pedido'}
        </button>
      </div>
    </div>
  )
}
