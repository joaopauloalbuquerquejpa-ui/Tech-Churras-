'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const BASE = 'https://tech-churras-production.up.railway.app'

function getToken() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
}

interface Product {
  id: string
  name: string
  description?: string
  price: number
  unit: string
  category: string
}

function NewOrderForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [grillmasters, setGrillmasters] = useState<any[]>([])
  const [boutiques, setBoutiques] = useState<any[]>([])
  const [boutiqueProducts, setBoutiqueProducts] = useState<Product[]>([])
  const [selectedQty, setSelectedQty] = useState<Record<string, number>>({})
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
    const id = searchParams.get('grillmasterId')
    if (id) setForm(prev => ({ ...prev, grillmasterId: id }))
  }, [searchParams])

  useEffect(() => {
    const h = { Authorization: 'Bearer ' + getToken() }
    fetch(BASE + '/grillmasters', { headers: h })
      .then(r => r.json()).then(d => setGrillmasters(Array.isArray(d) ? d : d.grillmasters ?? []))
    fetch(BASE + '/boutiques', { headers: h })
      .then(r => r.json()).then(d => setBoutiques(Array.isArray(d) ? d : d.boutiques ?? []))
  }, [])

  useEffect(() => {
    if (!form.boutiqueId) { setBoutiqueProducts([]); setSelectedQty({}); return }
    fetch(BASE + '/boutiques/' + form.boutiqueId, {
      headers: { Authorization: 'Bearer ' + getToken() },
    })
      .then(r => r.json())
      .then(d => setBoutiqueProducts(d.products || []))
      .catch(() => setBoutiqueProducts([]))
  }, [form.boutiqueId])

  const selectedGrillmaster = grillmasters.find(g => g.id === form.grillmasterId)
  const grillmasterCost = selectedGrillmaster ? selectedGrillmaster.pricePerHour * form.eventHours : 0
  const itemsTotal = Object.entries(selectedQty).reduce((sum, [pid, qty]) => {
    const p = boutiqueProducts.find(p => p.id === pid)
    return sum + (p ? p.price * qty : 0)
  }, 0)
  const totalEstimate = grillmasterCost + itemsTotal

  async function handleSubmit() {
    if (!form.grillmasterId || !form.eventDate || !form.eventAddress) {
      alert('Preencha churrasqueiro, data e endereco do evento')
      return
    }
    setLoading(true)
    try {
      const items = Object.entries(selectedQty)
        .filter(([, qty]) => qty > 0)
        .map(([productId, quantity]) => {
          const p = boutiqueProducts.find(p => p.id === productId)!
          return { productId, quantity, unitPrice: p.price }
        })

      const res = await fetch(BASE + '/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
        body: JSON.stringify({ ...form, items: items.length > 0 ? items : undefined }),
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
          <select
            value={form.grillmasterId}
            onChange={e => setForm({ ...form, grillmasterId: e.target.value })}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white"
          >
            <option value="">Selecione...</option>
            {grillmasters.map(g => (
              <option key={g.id} value={g.id}>{g.user?.name} - R$ {g.pricePerHour}/hora</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Acougue (opcional)</label>
          <select
            value={form.boutiqueId}
            onChange={e => setForm({ ...form, boutiqueId: e.target.value })}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white"
          >
            <option value="">Nenhum</option>
            {boutiques.map(b => (
              <option key={b.id} value={b.id}>{b.name} — {b.open ? 'Aberto' : 'Fechado'}</option>
            ))}
          </select>
        </div>

        {boutiqueProducts.length > 0 && (
          <div className="border border-gray-700 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-300 mb-3">Produtos do acougue</p>
            <div className="space-y-3">
              {boutiqueProducts.map(p => {
                const qty = selectedQty[p.id] || 0
                return (
                  <div key={p.id} className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-orange-400">R$ {p.price.toFixed(2)}/{p.unit}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSelectedQty(prev => ({ ...prev, [p.id]: Math.max(0, (prev[p.id] || 0) - 1) }))}
                        className="w-7 h-7 bg-gray-700 hover:bg-gray-600 rounded text-sm font-bold"
                      >-</button>
                      <span className="w-6 text-center text-sm">{qty}</span>
                      <button
                        onClick={() => setSelectedQty(prev => ({ ...prev, [p.id]: (prev[p.id] || 0) + 1 }))}
                        className="w-7 h-7 bg-gray-700 hover:bg-gray-600 rounded text-sm font-bold"
                      >+</button>
                      {qty > 0 && (
                        <span className="text-xs text-orange-400 w-16 text-right">
                          R$ {(p.price * qty).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm text-gray-400 mb-1">Data do Evento *</label>
          <input
            type="date"
            value={form.eventDate}
            onChange={e => setForm({ ...form, eventDate: e.target.value })}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Endereco do Evento *</label>
          <input
            type="text"
            value={form.eventAddress}
            onChange={e => setForm({ ...form, eventAddress: e.target.value })}
            placeholder="Rua, numero, bairro, cidade"
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Horas de Servico</label>
          <input
            type="number"
            value={form.eventHours}
            onChange={e => setForm({ ...form, eventHours: +e.target.value })}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Numero de Pessoas</label>
          <input
            type="number"
            value={form.guestCount}
            onChange={e => setForm({ ...form, guestCount: +e.target.value })}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Observacoes</label>
          <textarea
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white h-24 resize-none"
          />
        </div>

        {totalEstimate > 0 && (
          <div className="bg-gray-800 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-400">Estimativa total</span>
            <span className="text-orange-400 font-bold text-lg">R$ {totalEstimate.toFixed(2)}</span>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 py-3 rounded-lg font-bold"
        >
          {loading ? 'Criando...' : 'Confirmar Pedido'}
        </button>
      </div>
    </div>
  )
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NewOrderForm />
    </Suspense>
  )
}
