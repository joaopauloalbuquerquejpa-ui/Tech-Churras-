'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

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
  available: boolean
}

interface Boutique {
  id: string
  name: string
  city: string
  state: string
  approved: boolean
  open: boolean
  products: Product[]
}

const CATEGORIES: Record<string, string> = {
  CARNE: 'Carne',
  SAL_TEMPERO: 'Sal e Tempero',
  CARVAO: 'Carvao',
  ACOMPANHAMENTO: 'Acompanhamento',
  BEBIDA: 'Bebida',
  OUTRO: 'Outro',
}

const emptyForm = { name: '', description: '', price: 0, unit: 'kg', category: 'CARNE', available: true }

export default function BoutiqueDashboardPage() {
  const [boutique, setBoutique] = useState<Boutique | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchBoutique() }, [])

  async function fetchBoutique() {
    try {
      const res = await fetch(BASE + '/boutiques/my', {
        headers: { Authorization: 'Bearer ' + getToken() },
      })
      if (!res.ok) { setNotFound(true); return }
      setBoutique(await res.json())
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  async function toggleOpen() {
    if (!boutique) return
    const res = await fetch(BASE + '/boutiques', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
      body: JSON.stringify({ open: !boutique.open }),
    })
    if (res.ok) setBoutique(prev => prev ? { ...prev, open: !prev.open } : null)
  }

  async function submitProduct() {
    if (!form.name || form.price <= 0) { alert('Preencha nome e preco'); return }
    setSubmitting(true)
    try {
      if (editingId) {
        const res = await fetch(BASE + '/boutiques/products/' + editingId, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
          body: JSON.stringify(form),
        })
        if (res.ok) {
          const updated = await res.json()
          setBoutique(prev => prev ? { ...prev, products: prev.products.map(p => p.id === updated.id ? updated : p) } : null)
        }
      } else {
        const res = await fetch(BASE + '/boutiques/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
          body: JSON.stringify(form),
        })
        if (res.ok) {
          const created = await res.json()
          setBoutique(prev => prev ? { ...prev, products: [...prev.products, created] } : null)
        }
      }
      cancelForm()
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleProduct(id: string) {
    const res = await fetch(BASE + '/boutiques/products/' + id + '/toggle', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + getToken() },
    })
    if (res.ok) {
      const updated = await res.json()
      setBoutique(prev => prev ? { ...prev, products: prev.products.map(p => p.id === id ? updated : p) } : null)
    }
  }

  async function removeProduct(id: string) {
    if (!confirm('Remover produto?')) return
    const res = await fetch(BASE + '/boutiques/products/' + id, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + getToken() },
    })
    if (res.ok) {
      setBoutique(prev => prev ? { ...prev, products: prev.products.filter(p => p.id !== id) } : null)
    }
  }

  function startEdit(p: Product) {
    setEditingId(p.id)
    setForm({ name: p.name, description: p.description || '', price: p.price, unit: p.unit, category: p.category, available: p.available })
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  if (loading) return <p className="text-gray-400 p-6">Carregando...</p>

  if (notFound) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <div className="bg-gray-900 rounded-xl p-8 text-center">
          <p className="text-gray-400 mb-4">Voce nao tem um acougue cadastrado.</p>
          <Link href="/boutiques/new" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg inline-block font-medium">
            Cadastrar acougue
          </Link>
        </div>
      </div>
    )
  }

  if (!boutique) return null

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{boutique.name}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{boutique.city}, {boutique.state}</p>
          <span className={"text-xs px-2 py-0.5 rounded-full mt-2 inline-block " + (boutique.approved ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400')}>
            {boutique.approved ? 'Aprovado' : 'Aguardando aprovacao'}
          </span>
        </div>
        <button
          onClick={toggleOpen}
          className={"px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors " + (boutique.open ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300')}
        >
          {boutique.open ? 'Loja aberta — fechar' : 'Loja fechada — abrir'}
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Produtos ({boutique.products.length})</h2>
        <button
          onClick={() => { cancelForm(); setShowForm(true) }}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Adicionar produto
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 rounded-xl p-5 mb-4 border border-orange-500/30">
          <h3 className="font-semibold mb-4">{editingId ? 'Editar produto' : 'Novo produto'}</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Nome *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Descricao</label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Preco (R$) *</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={e => setForm({ ...form, price: +e.target.value })}
                className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Unidade</label>
              <input
                type="text"
                value={form.unit}
                onChange={e => setForm({ ...form, unit: e.target.value })}
                className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Categoria</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white"
              >
                {Object.entries(CATEGORIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="prod-avail"
                checked={form.available}
                onChange={e => setForm({ ...form, available: e.target.checked })}
                className="accent-orange-500 w-4 h-4"
              />
              <label htmlFor="prod-avail" className="text-sm text-gray-300">Disponivel</label>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={submitProduct}
              disabled={submitting}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              {submitting ? 'Salvando...' : (editingId ? 'Salvar' : 'Adicionar')}
            </button>
            <button
              onClick={cancelForm}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {boutique.products.length === 0 && !showForm && (
        <div className="bg-gray-900 rounded-xl p-8 text-center text-gray-400">
          <p>Nenhum produto cadastrado ainda.</p>
        </div>
      )}

      <div className="space-y-2">
        {boutique.products.map(p => (
          <div key={p.id} className="bg-gray-900 rounded-xl px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <span className={"w-2 h-2 rounded-full shrink-0 " + (p.available ? 'bg-green-400' : 'bg-gray-500')} />
              <div className="min-w-0">
                <p className="font-medium truncate">{p.name}</p>
                <p className="text-xs text-gray-400">{CATEGORIES[p.category] || p.category} &middot; {p.unit}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-4">
              <span className="text-orange-400 font-semibold">R$ {p.price.toFixed(2)}</span>
              <button
                onClick={() => toggleProduct(p.id)}
                className="text-xs text-gray-400 hover:text-white border border-gray-700 px-2 py-1 rounded"
              >
                {p.available ? 'Desativar' : 'Ativar'}
              </button>
              <button
                onClick={() => startEdit(p)}
                className="text-xs text-blue-400 hover:text-blue-300 border border-blue-900 px-2 py-1 rounded"
              >
                Editar
              </button>
              <button
                onClick={() => removeProduct(p.id)}
                className="text-xs text-red-400 hover:text-red-300 border border-red-900 px-2 py-1 rounded"
              >
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
