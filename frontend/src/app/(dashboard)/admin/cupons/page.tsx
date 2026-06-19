'use client'
import { API_URL } from '@/lib/api'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'


function getToken() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
}

interface Coupon {
  id: string
  code: string
  discountType: string
  discountValue: number
  minOrderValue: number | null
  maxUses: number | null
  usedCount: number
  validUntil: string | null
  active: boolean
  createdAt: string
}

const EMPTY_FORM = {
  code: '',
  discountType: 'PERCENT',
  discountValue: '',
  minOrderValue: '',
  maxUses: '',
  validUntil: '',
}

export default function AdminCuponsPage() {
  const router = useRouter()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchCoupons()
  }, [])

  async function fetchCoupons() {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/admin/coupons`, {
        headers: { Authorization: 'Bearer ' + getToken() },
      })
      if (res.status === 403) { router.push('/dashboard'); return }
      const data = await res.json()
      setCoupons(Array.isArray(data) ? data : [])
    } catch {
      setError('Erro ao carregar cupons.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!form.code.trim() || !form.discountValue) {
      setError('Codigo e desconto sao obrigatorios.')
      return
    }
    setCreating(true)
    try {
      const body: Record<string, unknown> = {
        code: form.code.trim().toUpperCase(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
      }
      if (form.minOrderValue) body.minOrderValue = Number(form.minOrderValue)
      if (form.maxUses) body.maxUses = Number(form.maxUses)
      if (form.validUntil) body.validUntil = form.validUntil

      const res = await fetch(`${API_URL}/admin/coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'Erro ao criar cupom.')
        return
      }
      setSuccess('Cupom criado com sucesso!')
      setForm(EMPTY_FORM)
      fetchCoupons()
    } catch {
      setError('Erro ao criar cupom.')
    } finally {
      setCreating(false)
    }
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`${API_URL}/admin/coupons/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
      body: JSON.stringify({ active }),
    })
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, active } : c))
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Cupons de Desconto</h1>
        <p className="text-sm text-gray-400 mt-1">Crie e gerencie cupons para os clientes</p>
      </div>

      {/* Form */}
      <div className="bg-gray-900 rounded-xl p-6 mb-8 border border-gray-800">
        <h2 className="font-bold mb-4">Criar Novo Cupom</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Codigo *</label>
            <input
              type="text"
              value={form.code}
              onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="BEMVINDO10"
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 uppercase"
              required
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Tipo de Desconto *</label>
            <select
              value={form.discountType}
              onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="PERCENT">Percentual (%)</option>
              <option value="FIXED">Valor fixo (R$)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">
              Valor do Desconto * {form.discountType === 'PERCENT' ? '(%)' : '(R$)'}
            </label>
            <input
              type="number"
              value={form.discountValue}
              onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
              placeholder={form.discountType === 'PERCENT' ? '10' : '50'}
              min="0"
              step={form.discountType === 'PERCENT' ? '1' : '0.01'}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white"
              required
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Pedido Minimo (R$)</label>
            <input
              type="number"
              value={form.minOrderValue}
              onChange={e => setForm(f => ({ ...f, minOrderValue: e.target.value }))}
              placeholder="0 = sem minimo"
              min="0"
              step="0.01"
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Limite de Usos</label>
            <input
              type="number"
              value={form.maxUses}
              onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
              placeholder="Sem limite"
              min="1"
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Valido ate</label>
            <input
              type="date"
              value={form.validUntil}
              onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>
          <div className="md:col-span-2 lg:col-span-3 flex items-center gap-4">
            <button
              type="submit"
              disabled={creating}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold px-6 py-2 rounded-lg text-sm transition-colors"
            >
              {creating ? 'Criando...' : 'Criar Cupom'}
            </button>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {success && <p className="text-green-400 text-sm">{success}</p>}
          </div>
        </form>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-900 rounded-xl animate-pulse" />)}
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-12 bg-gray-900 rounded-xl text-gray-400">
          Nenhum cupom criado ainda.
        </div>
      ) : (
        <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-xs text-gray-400 uppercase tracking-wide">
                <th className="text-left px-4 py-3">Codigo</th>
                <th className="text-left px-4 py-3">Desconto</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Min. Pedido</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Usos</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Expira</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Acao</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-mono font-bold text-orange-400">{c.code}</td>
                  <td className="px-4 py-3 text-white">
                    {c.discountType === 'PERCENT'
                      ? `${c.discountValue}%`
                      : `R$ ${c.discountValue.toFixed(2)}`}
                  </td>
                  <td className="px-4 py-3 text-gray-400 hidden md:table-cell">
                    {c.minOrderValue ? `R$ ${c.minOrderValue.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 hidden md:table-cell">
                    {c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ''}
                  </td>
                  <td className="px-4 py-3 text-gray-400 hidden lg:table-cell">
                    {c.validUntil
                      ? new Date(c.validUntil).toLocaleDateString('pt-BR')
                      : 'Sem expiração'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={'text-xs px-2 py-1 rounded-full font-medium ' +
                      (c.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400')}>
                      {c.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(c.id, !c.active)}
                      className={'text-xs px-3 py-1 rounded-lg font-medium transition-colors ' +
                        (c.active
                          ? 'bg-gray-800 hover:bg-red-900/30 text-gray-400 hover:text-red-400'
                          : 'bg-gray-800 hover:bg-green-900/30 text-gray-400 hover:text-green-400')}
                    >
                      {c.active ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
