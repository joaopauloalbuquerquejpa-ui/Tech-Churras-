'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'

const BASE = 'https://tech-churras-production.up.railway.app'

function getToken() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
}

interface Profile {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  points: number
  averageRating: number | null
  createdAt: string
}

export default function PerfilPage() {
  const router = useRouter()
  const { user, setUser } = useAuthStore()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const token = getToken()
    if (!token) { router.push('/login'); return }
    fetch(`${BASE}/auth/me`, { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json())
      .then(d => {
        setProfile(d)
        setForm({ name: d.name ?? '', phone: d.phone ?? '' })
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false))
  }, [router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Nome não pode estar vazio.'); return }
    setError('')
    setSaving(true)
    const token = getToken()
    try {
      const res = await fetch(`${BASE}/auth/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ name: form.name.trim(), phone: form.phone.trim() || null }),
      })
      if (res.ok) {
        const updated = await res.json()
        setProfile(prev => prev ? { ...prev, ...updated } : null)
        if (user) setUser({ ...user, name: updated.name })
        setMsg('Perfil atualizado com sucesso!')
        setTimeout(() => setMsg(''), 3000)
      } else {
        const d = await res.json()
        setError(d.error ?? 'Erro ao salvar.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="text-4xl animate-bounce">🔥</div>
      </div>
    )
  }

  if (!profile) return null

  const memberSince = new Date(profile.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-white">Meu Perfil</h1>
      </div>

      {/* Avatar / stats */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center text-2xl font-black text-orange-400 shrink-0">
          {profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-white font-bold text-lg">{profile.name}</p>
          <p className="text-gray-400 text-sm">{profile.email}</p>
          <p className="text-gray-500 text-xs mt-0.5">Membro desde {memberSince}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <Link href="/perfil/pontos" className="bg-gray-900 border border-gray-800 hover:border-orange-500/30 rounded-xl p-4 text-center transition-colors">
          <p className="text-2xl font-black text-orange-400">{profile.points ?? 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">Pontos acumulados</p>
        </Link>
        <Link href="/orders" className="bg-gray-900 border border-gray-800 hover:border-orange-500/30 rounded-xl p-4 text-center transition-colors">
          <p className="text-2xl font-black text-orange-400">📋</p>
          <p className="text-xs text-gray-500 mt-0.5">Meus pedidos</p>
        </Link>
      </div>

      {/* Edit form */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Editar dados</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Nome completo</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 focus:border-orange-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors"
              placeholder="Seu nome"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">
              Celular (com DDD)
              <span className="text-orange-400 ml-1">— necessário para receber confirmações pelo WhatsApp</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 focus:border-orange-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors"
              placeholder="(11) 99999-9999"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-xl px-4 py-2.5">{error}</p>
          )}
          {msg && (
            <p className="text-green-400 text-sm bg-green-900/20 border border-green-800 rounded-xl px-4 py-2.5">{msg}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>
      </div>

      {/* Quick links */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl divide-y divide-gray-800">
        <Link href="/perfil/enderecos" className="flex items-center justify-between px-5 py-4 hover:bg-gray-800/30 transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-lg">📍</span>
            <span className="text-sm font-medium text-white">Meus endereços</span>
          </div>
          <span className="text-gray-600 text-sm">→</span>
        </Link>
        <Link href="/perfil/pontos" className="flex items-center justify-between px-5 py-4 hover:bg-gray-800/30 transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-lg">🏆</span>
            <span className="text-sm font-medium text-white">Programa de pontos</span>
          </div>
          <span className="text-gray-600 text-sm">→</span>
        </Link>
        <Link href="/favoritos" className="flex items-center justify-between px-5 py-4 hover:bg-gray-800/30 transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-lg">❤️</span>
            <span className="text-sm font-medium text-white">Churrasqueiros favoritos</span>
          </div>
          <span className="text-gray-600 text-sm">→</span>
        </Link>
        <Link href="/ajuda" className="flex items-center justify-between px-5 py-4 hover:bg-gray-800/30 transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-lg">💬</span>
            <span className="text-sm font-medium text-white">Ajuda e suporte</span>
          </div>
          <span className="text-gray-600 text-sm">→</span>
        </Link>
      </div>

      {!profile.phone && (
        <div className="mt-5 bg-orange-900/20 border border-orange-500/30 rounded-xl p-4">
          <p className="text-orange-400 text-sm font-semibold mb-1">⚠️ Adicione seu celular</p>
          <p className="text-gray-400 text-xs">
            Sem um número cadastrado, você não receberá confirmações pelo WhatsApp quando o churrasqueiro confirmar seu pedido.
          </p>
        </div>
      )}
    </div>
  )
}
