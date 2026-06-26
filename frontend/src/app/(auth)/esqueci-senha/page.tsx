'use client'
import { useState } from 'react'
import Link from 'next/link'
import { API_URL } from '@/lib/api'

export default function EsqueciSenhaPage() {
  const [email, setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]     = useState(false)
  const [error, setError]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const r = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        throw new Error(d.error || 'Erro ao enviar email')
      }
      setSent(true)
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
            🔒
          </div>
          <h1 className="text-2xl font-black text-white">Esqueci minha senha</h1>
          <p className="text-gray-500 text-sm mt-1">
            {sent ? 'Verifique seu email' : 'Digite seu email e enviaremos um link de redefinição'}
          </p>
        </div>

        {sent ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center">
            <p className="text-3xl mb-3">📧</p>
            <p className="text-white font-semibold mb-1">Link enviado!</p>
            <p className="text-gray-400 text-sm mb-4">
              Se <strong className="text-white">{email}</strong> estiver cadastrado, você receberá um email com o link para redefinir sua senha. Verifique também a caixa de spam.
            </p>
            <p className="text-xs text-gray-500">O link expira em 30 minutos.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1.5 block">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                className="w-full bg-black text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-colors placeholder-gray-600"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors"
            >
              {loading ? 'Enviando...' : 'Enviar link de redefinição'}
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
