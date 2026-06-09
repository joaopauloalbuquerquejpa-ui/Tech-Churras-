'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewBoutiquePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    city: '',
    state: '',
  })

  async function handleSubmit() {
    if (!form.name || !form.city || !form.state) {
      alert('Preencha todos os campos obrigatorios')
      return
    }
    setLoading(true)
    try {
      const raw = localStorage.getItem('auth-storage')
      const t = raw ? JSON.parse(raw)?.state?.token : null
      const res = await fetch('https://tech-churras-production.up.railway.app/boutiques', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        router.push('/boutiques')
      } else {
        const err = await res.json()
        alert('Erro: ' + (err.error || 'ao cadastrar'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <Link href="/boutiques" className="text-sm text-gray-400 hover:text-white mb-6 inline-block">
        &larr; Voltar para boutiques
      </Link>
      <h1 className="text-2xl font-bold mb-6">Cadastrar Acougue</h1>
      <div className="bg-gray-900 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Nome do acougue *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Descricao</label>
          <textarea
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Conte sobre o acougue..."
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white h-24 resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Cidade *</label>
            <input
              type="text"
              value={form.city}
              onChange={e => setForm({ ...form, city: e.target.value })}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Estado *</label>
            <input
              type="text"
              maxLength={2}
              placeholder="SP"
              value={form.state}
              onChange={e => setForm({ ...form, state: e.target.value.toUpperCase() })}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white"
            />
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 py-3 rounded-lg font-bold"
        >
          {loading ? 'Cadastrando...' : 'Cadastrar'}
        </button>
      </div>
    </div>
  )
}
