'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { API_URL } from '@/lib/api'

function RedefinirSenhaForm() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const token        = searchParams.get('token') ?? ''

  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [success, setSuccess]     = useState(false)
  const [error, setError]         = useState('')

  useEffect(() => {
    if (!token) setError('Link inválido. Solicite um novo email de redefinição.')
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 6) return setError('A senha deve ter pelo menos 6 caracteres.')
    if (password !== confirm) return setError('As senhas não coincidem.')

    setLoading(true)
    try {
      const r = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || 'Erro ao redefinir senha')
      setSuccess(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg shadow-orange-500/30">
            🔑
          </div>
          <h1 className="text-2xl font-black text-white">Nova senha</h1>
          <p className="text-gray-500 text-sm mt-1">
            {success ? 'Senha redefinida com sucesso!' : 'Escolha uma nova senha para sua conta'}
          </p>
        </div>

        {success ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center">
            <p className="text-3xl mb-3">✅</p>
            <p className="text-white font-semibold mb-1">Senha atualizada!</p>
            <p className="text-gray-400 text-sm">Redirecionando para o login em instantes...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1.5 block">
                Nova senha
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Mínimo 6 caracteres"
                disabled={!token}
                className="w-full bg-black text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-colors placeholder-gray-600 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1.5 block">
                Confirmar senha
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                placeholder="Repita a nova senha"
                disabled={!token}
                className="w-full bg-black text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-colors placeholder-gray-600 disabled:opacity-50"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !token || !password || !confirm}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors"
            >
              {loading ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/login" className="text-orange-400 hover:text-orange-300 transition-colors">
            ← Voltar para o login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RedefinirSenhaForm />
    </Suspense>
  )
}
