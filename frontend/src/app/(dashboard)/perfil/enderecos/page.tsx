'use client'
import { useEffect, useState } from 'react'

const BASE = 'https://tech-churras-production.up.railway.app'

function getToken() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
}

interface Address {
  id: string
  label: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  isDefault: boolean
}

const EMPTY_FORM = {
  label: '', street: '', number: '', complement: '',
  neighborhood: '', city: '', state: '', zipCode: '',
}

export default function EnderecosPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [cepLoading, setCepLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`${BASE}/addresses`, {
        headers: { Authorization: 'Bearer ' + getToken() },
      })
      setAddresses(await res.json())
    } catch { setError('Erro ao carregar enderecos.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function fetchCep(cep: string) {
    if (cep.length !== 8) return
    setCepLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const d = await res.json()
      if (!d.erro) {
        setForm(f => ({
          ...f,
          street: d.logradouro || f.street,
          neighborhood: d.bairro || f.neighborhood,
          city: d.localidade || f.city,
          state: d.uf || f.state,
        }))
      }
    } catch {} finally { setCepLoading(false) }
  }

  function openNew() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(addr: Address) {
    setEditingId(addr.id)
    setForm({
      label: addr.label,
      street: addr.street,
      number: addr.number,
      complement: addr.complement || '',
      neighborhood: addr.neighborhood,
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode,
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.label || !form.street || !form.number || !form.city) {
      setError('Preencha os campos obrigatorios.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const url = editingId ? `${BASE}/addresses/${editingId}` : `${BASE}/addresses`
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
        body: JSON.stringify(form),
      })
      if (!res.ok) { const e = await res.json(); setError(e.error); return }
      setShowForm(false)
      load()
    } catch { setError('Erro ao salvar.') }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este endereço?')) return
    await fetch(`${BASE}/addresses/${id}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + getToken() },
    })
    load()
  }

  async function handleSetDefault(id: string) {
    await fetch(`${BASE}/addresses/${id}/default`, {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + getToken() },
    })
    load()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Meus Endereços</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie seus endereços para facilitar futuros pedidos</p>
        </div>
        <button
          onClick={openNew}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          + Adicionar
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {/* Form */}
      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6 space-y-4">
          <h2 className="font-bold text-lg">{editingId ? 'Editar Endereço' : 'Novo Endereço'}</h2>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Rótulo *</label>
            <input
              value={form.label}
              onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              placeholder="Ex: Casa, Trabalho, Sítio..."
              className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              CEP {cepLoading && <span className="text-orange-400 text-xs ml-1">buscando...</span>}
            </label>
            <input
              value={form.zipCode}
              maxLength={8}
              onChange={e => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 8)
                setForm(f => ({ ...f, zipCode: v }))
                if (v.length === 8) fetchCep(v)
              }}
              placeholder="00000000"
              className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm text-gray-400 mb-1 block">Rua *</label>
              <input
                value={form.street}
                onChange={e => setForm(f => ({ ...f, street: e.target.value }))}
                placeholder="Nome da rua"
                className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Número *</label>
              <input
                value={form.number}
                onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
                placeholder="123"
                className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Complemento</label>
            <input
              value={form.complement}
              onChange={e => setForm(f => ({ ...f, complement: e.target.value }))}
              placeholder="Apto, bloco, casa..."
              className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Bairro</label>
              <input
                value={form.neighborhood}
                onChange={e => setForm(f => ({ ...f, neighborhood: e.target.value }))}
                className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Cidade *</label>
              <input
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Estado</label>
              <input
                value={form.state}
                maxLength={2}
                onChange={e => setForm(f => ({ ...f, state: e.target.value.toUpperCase() }))}
                placeholder="SP"
                className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors"
            >
              {saving ? 'Salvando...' : 'Salvar Endereço'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-gray-500">Carregando...</div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">📍</p>
          <p className="text-gray-400 font-medium">Nenhum endereço salvo ainda</p>
          <p className="text-sm text-gray-600 mt-1">Adicione um endereço para agilizar seus pedidos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map(addr => (
            <div
              key={addr.id}
              className={
                'bg-gray-900 rounded-2xl p-5 border-2 transition-colors ' +
                (addr.isDefault ? 'border-orange-500/40' : 'border-gray-800')
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white">{addr.label}</span>
                    {addr.isDefault && (
                      <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full font-medium">
                        Padrão
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-300">
                    {addr.street}, {addr.number}{addr.complement ? `, ${addr.complement}` : ''}
                  </p>
                  <p className="text-sm text-gray-500">
                    {addr.neighborhood && `${addr.neighborhood} · `}{addr.city} - {addr.state}
                    {addr.zipCode && ` · CEP ${addr.zipCode}`}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                  >
                    Definir como padrão
                  </button>
                )}
                <button
                  onClick={() => openEdit(addr)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
