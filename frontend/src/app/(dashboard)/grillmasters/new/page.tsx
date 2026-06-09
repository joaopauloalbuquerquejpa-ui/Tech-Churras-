'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function NewGrillmasterPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    bio: '',
    experience: 1,
    pricePerHour: 0,
    city: '',
    state: '',
    specialties: '',
    phone: '',
  })

  async function handleSubmit() {
    if (!form.bio || !form.city || !form.state || form.pricePerHour <= 0) {
      alert('Preencha todos os campos obrigatorios')
      return
    }
    setLoading(true)
    try {
      const raw = localStorage.getItem('auth-storage')
      const t = raw ? JSON.parse(raw)?.state?.token : null
      const res = await fetch('https://tech-churras-production.up.railway.app/grillmasters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSuccess(true)
      } else {
        const err = await res.json()
        alert('Erro: ' + (err.error || 'ao cadastrar'))
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <div className="bg-gray-900 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-green-400 text-2xl font-bold">&#10003;</span>
          </div>
          <h2 className="text-xl font-bold mb-2">Perfil enviado!</h2>
          <p className="text-gray-400 mb-6">
            Seu perfil foi enviado com sucesso. Aguarde a aprovacao do administrador para aparecer na listagem.
          </p>
          <Link href="/grillmasters" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg inline-block font-medium">
            Ver churrasqueiros
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <Link href="/grillmasters" className="text-sm text-gray-400 hover:text-white mb-6 inline-block">
        &larr; Voltar para churrasqueiros
      </Link>
      <h1 className="text-2xl font-bold mb-6">Cadastrar como Churrasqueiro</h1>
      <div className="bg-gray-900 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Bio *</label>
          <textarea
            value={form.bio}
            onChange={e => setForm({ ...form, bio: e.target.value })}
            placeholder="Conte sobre sua experiencia com churrasco..."
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white h-28 resize-none"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Anos de experiencia *</label>
          <input
            type="number"
            min={0}
            value={form.experience}
            onChange={e => setForm({ ...form, experience: +e.target.value })}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Preco por hora (R$) *</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.pricePerHour}
            onChange={e => setForm({ ...form, pricePerHour: +e.target.value })}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white"
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
        <div>
          <label className="block text-sm text-gray-400 mb-1">Especialidades</label>
          <input
            type="text"
            value={form.specialties}
            onChange={e => setForm({ ...form, specialties: e.target.value })}
            placeholder="Picanha, costela, frango..."
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Telefone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            placeholder="(11) 99999-9999"
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 py-3 rounded-lg font-bold"
        >
          {loading ? 'Enviando...' : 'Enviar para aprovacao'}
        </button>
      </div>
    </div>
  )
}
