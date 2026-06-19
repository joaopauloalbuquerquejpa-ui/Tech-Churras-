'use client'
import { API_URL } from '@/lib/api'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'


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

interface Kit {
  id: string
  boutiqueId: string
  name: string
  description: string
  price: number
  minGuests: number
  maxGuests: number
  items: string
}

function calculateInsumos(homens: number, mulheres: number, criancas: number) {
  const totalCarne = homens * 400 + mulheres * 300 + criancas * 150
  const totalCarvao = Math.ceil(homens / 5)
  const totalPessoas = homens + mulheres + criancas
  return { totalCarne, totalCarvao, totalPessoas }
}

function NewOrderForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [grillmasters, setGrillmasters] = useState<any[]>([])
  const [boutiques, setBoutiques] = useState<any[]>([])
  const [boutiqueProducts, setBoutiqueProducts] = useState<Product[]>([])
  const [boutiqueKits, setBoutiqueKits] = useState<Kit[]>([])
  const [selectedQty, setSelectedQty] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [acompanhamentos, setAcompanhamentos] = useState(false)
  const [acompanhamentosText, setAcompanhamentosText] = useState('')
  const [form, setForm] = useState({
    grillmasterId: '',
    boutiqueId: '',
    eventDate: '',
    eventAddress: '',
    eventHours: 4,
    homens: 5,
    mulheres: 3,
    criancas: 2,
    notes: '',
  })

  useEffect(() => {
    const id = searchParams.get('grillmasterId')
    if (id) setForm(prev => ({ ...prev, grillmasterId: id }))
  }, [searchParams])

  useEffect(() => {
    const h = { Authorization: 'Bearer ' + getToken() }
    fetch(API_URL + '/grillmasters', { headers: h })
      .then(r => r.json()).then(d => setGrillmasters(Array.isArray(d) ? d : d.grillmasters ?? []))
    fetch(API_URL + '/boutiques', { headers: h })
      .then(r => r.json()).then(d => setBoutiques(Array.isArray(d) ? d : d.boutiques ?? []))
  }, [])

  useEffect(() => {
    if (!form.boutiqueId) {
      setBoutiqueProducts([])
      setBoutiqueKits([])
      setSelectedQty({})
      return
    }
    const h = { headers: { Authorization: 'Bearer ' + getToken() } }
    fetch(API_URL + '/boutiques/' + form.boutiqueId, h)
      .then(r => r.json())
      .then(d => setBoutiqueProducts(d.products || []))
      .catch(() => setBoutiqueProducts([]))
    fetch(API_URL + '/boutiques/' + form.boutiqueId + '/kits', h)
      .then(r => r.json())
      .then(d => setBoutiqueKits(Array.isArray(d) ? d : []))
      .catch(() => setBoutiqueKits([]))
  }, [form.boutiqueId])

  const insumos = calculateInsumos(form.homens, form.mulheres, form.criancas)
  const selectedGrillmaster = grillmasters.find(g => g.id === form.grillmasterId)
  const grillmasterCost = selectedGrillmaster ? selectedGrillmaster.pricePerHour * form.eventHours : 0
  const itemsTotal = Object.entries(selectedQty).reduce((sum, [pid, qty]) => {
    const p = boutiqueProducts.find(p => p.id === pid)
    return sum + (p ? p.price * qty : 0)
  }, 0)
  const totalEstimate = grillmasterCost + itemsTotal

  const bestKit = boutiqueKits.find(k => insumos.totalPessoas >= k.minGuests && insumos.totalPessoas <= k.maxGuests)
    ?? (boutiqueKits.length > 0
      ? boutiqueKits.reduce((prev, curr) =>
          Math.abs(curr.minGuests - insumos.totalPessoas) < Math.abs(prev.minGuests - insumos.totalPessoas) ? curr : prev
        )
      : null)

  const today = new Date().toISOString().split('T')[0]

  async function handleSubmit() {
    setFormError('')
    if (!form.grillmasterId) { setFormError('Selecione um churrasqueiro'); return }
    if (!form.eventDate) { setFormError('Informe a data do evento'); return }
    if (form.eventDate < today) { setFormError('A data do evento não pode ser no passado'); return }
    if (!form.eventAddress.trim()) { setFormError('Informe o endereço do evento'); return }
    if (form.eventHours < 1) { setFormError('Mínimo de 1 hora de serviço'); return }
    setLoading(true)
    try {
      const items = Object.entries(selectedQty)
        .filter(([, qty]) => qty > 0)
        .map(([productId, quantity]) => {
          const p = boutiqueProducts.find(p => p.id === productId)!
          return { productId, quantity, unitPrice: p.price }
        })

      let notes = form.notes
      if (acompanhamentos && acompanhamentosText.trim()) {
        notes = 'ACOMPANHAMENTOS: ' + acompanhamentosText.trim() + (notes ? '\n' + notes : '')
      }

      const res = await fetch(API_URL + '/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
        body: JSON.stringify({
          grillmasterId: form.grillmasterId,
          boutiqueId: form.boutiqueId || undefined,
          eventDate: form.eventDate,
          eventAddress: form.eventAddress,
          eventHours: form.eventHours,
          guestCount: insumos.totalPessoas,
          notes: notes || undefined,
          items: items.length > 0 ? items : undefined,
        }),
      })
      if (res.ok) {
        const order = await res.json()
        router.push('/orders/' + order.id + '/payment')
      } else {
        const err = await res.json()
        setFormError(err.error || 'Erro ao criar pedido. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Novo Pedido</h1>
      <div className="bg-gray-900 rounded-xl p-6 space-y-4">

        {/* Churrasqueiro */}
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

        {/* Açougue */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Açougue (opcional)</label>
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

        {/* Produtos do açougue */}
        {boutiqueProducts.length > 0 && (
          <div className="border border-gray-700 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-300 mb-3">Produtos do açougue</p>
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

        {/* Kits do açougue */}
        {boutiqueKits.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-300 mb-2">Kits disponíveis</p>
            <div className="grid grid-cols-1 gap-3">
              {boutiqueKits.map(k => {
                const isMatch = k === bestKit
                return (
                  <div
                    key={k.id}
                    className={'rounded-xl p-4 border transition-colors ' + (isMatch
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-gray-700 bg-gray-800')}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-sm text-white">{k.name}</p>
                      {isMatch && (
                        <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full shrink-0">
                          Recomendado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{k.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{k.minGuests}–{k.maxGuests} pessoas</span>
                      <span className="text-orange-400 font-bold text-sm">R$ {k.price.toFixed(2)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Data */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Data do Evento *</label>
          <input
            type="date"
            value={form.eventDate}
            min={today}
            onChange={e => setForm({ ...form, eventDate: e.target.value })}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white"
          />
        </div>

        {/* Endereço */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Endereço do Evento *</label>
          <input
            type="text"
            value={form.eventAddress}
            onChange={e => setForm({ ...form, eventAddress: e.target.value })}
            placeholder="Rua, número, bairro, cidade"
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white"
          />
        </div>

        {/* Horas */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Horas de Serviço</label>
          <input
            type="number"
            min={1}
            max={12}
            value={form.eventHours}
            onChange={e => setForm({ ...form, eventHours: Math.max(1, +e.target.value) })}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white"
          />
        </div>

        {/* Convidados — 3 inputs */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Convidados</label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Homens</label>
              <input
                type="number"
                min={0}
                value={form.homens}
                onChange={e => setForm({ ...form, homens: Math.max(0, +e.target.value) })}
                className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white text-center"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mulheres</label>
              <input
                type="number"
                min={0}
                value={form.mulheres}
                onChange={e => setForm({ ...form, mulheres: Math.max(0, +e.target.value) })}
                className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white text-center"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Crianças</label>
              <input
                type="number"
                min={0}
                value={form.criancas}
                onChange={e => setForm({ ...form, criancas: Math.max(0, +e.target.value) })}
                className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white text-center"
              />
            </div>
          </div>
        </div>

        {/* Estimativa de insumos */}
        {insumos.totalPessoas > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm space-y-1">
            <p className="text-gray-300 font-medium mb-1">Estimativa de Insumos</p>
            <p className="text-gray-400">
              Carne estimada: <span className="text-white font-semibold">{(insumos.totalCarne / 1000).toFixed(1)} kg</span>
            </p>
            <p className="text-gray-400">
              Carvão estimado: <span className="text-white font-semibold">{insumos.totalCarvao} {insumos.totalCarvao === 1 ? 'saco' : 'sacos'}</span>
            </p>
            <p className="text-gray-400">
              Total de pessoas: <span className="text-white font-semibold">{insumos.totalPessoas}</span>
            </p>
          </div>
        )}

        {/* Acompanhamentos toggle */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <button
              type="button"
              onClick={() => setAcompanhamentos(v => !v)}
              className={'relative w-11 h-6 rounded-full transition-colors ' + (acompanhamentos ? 'bg-orange-500' : 'bg-gray-700')}
            >
              <span className={'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ' + (acompanhamentos ? 'translate-x-5' : 'translate-x-0')} />
            </button>
            <span className="text-sm text-gray-300">Deseja que o Grillmaster prepare acompanhamentos no local?</span>
          </label>
          {acompanhamentos && (
            <textarea
              value={acompanhamentosText}
              onChange={e => setAcompanhamentosText(e.target.value)}
              placeholder="Liste os ingredientes que você vai providenciar..."
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white h-24 resize-none mt-2 text-sm"
            />
          )}
        </div>

        {/* Observações */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Observações</label>
          <textarea
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white h-24 resize-none"
          />
        </div>

        {/* Estimativa financeira */}
        {totalEstimate > 0 && (
          <div className="bg-gray-800 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-400">Estimativa total</span>
            <span className="text-orange-400 font-bold text-lg">R$ {totalEstimate.toFixed(2)}</span>
          </div>
        )}

        {formError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
            {formError}
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