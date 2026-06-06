'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewOrderPage() {
  const router = useRouter()
  const [grillmasters, setGrillmasters] = useState<any[]>([])
  const [boutiques, setBoutiques] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    grillmasterId: '',
    boutiqueId: '',
    eventDate: '',
    eventAddress: '',
    eventHours: 4,
    guestCount: 10,
    notes: '',
  })

  useEffect(() => {
    const raw = localStorage.getItem('auth-storage')
    const t = raw ? JSON.parse(raw)?.state?.token : null
    const h = { Authorization: 'Bearer ' + t }
    fetch('https://tech-churras-production.up.railway.app/grillmasters', { headers: h })
      .then(r => r.json()).then(d => setGrillmasters(Array.isArray(d) ? d : d.grillmasters ?? []))
    fetch('https://tech-churras-production.up.railway.app/boutiques', { headers: h })
      .then(r => r.json()).then(d => setBoutiques(Array.isArray(d) ? d : d.boutiques ?? []))
  }, [])

  async function handleSubmit() {
    if (!form.grillmasterId || !form.eventDate || !form.eventAddress) {
      alert('Preencha churrasqueiro, data e endereco do evento')
      return
    }
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
      else {
        const err = await res.json()
        alert('Erro: ' + (err.error || 'ao criar pedido'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Novo Pedido</h1>
      <div className="bg-gray-900 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Churrasqueiro *</label>
          <select value={form.grillmasterId} onChange={e => setForm({...form, grillmasterId: e.target.value})} className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white">
            <option value="">Selecione...</option>
            {grillmasters.map(g => <option key={g.id} value={g.id}>{g.user?.name} - R$ {g.pricePerHour}/hora</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Acougue (opcional)</label>
          <select value={form.boutiqueId} onChange={e => setForm({...form, boutiqueId: e.target.value})} className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white">
            <option value="">Nenhum</option>
            {boutiques.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Data do Evento *</label>
          <input type="date" value={form.eventDate} onChange={e => setForm({...form, eventDate: e.target.value})} className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Endereco do Evento *</label>
          <input type="text" value={form.eventAddress} onChange={e => setForm({...form, eventAddress: e.target.value})} placeholder="Rua, numero, bairro, cidade" className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Horas de Servico</label>
          <input type="number" value={form.eventHours} onChange={e => setForm({...form, eventHours: +e.target.value})} className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Numero de Pessoas</label>
          <input type="number" value={form.guestCount} onChange={e => setForm({...form, guestCount: +e.target.value})} className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Observacoes</label>
          <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white h-24 resize-none" />
        </div>
        <button onClick={handleSubmit} disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 py-3 rounded-lg font-bold">
          {loading ? 'Criando...' : 'Confirmar Pedido'}
        </button>
      </div>
    </div>
  )
}