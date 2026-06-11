'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { register } from '@/lib/auth'
import { useAuthStore } from '@/store/authStore'

export default function RegisterPage() {
  const router = useRouter()
  const { setUser, setToken } = useAuthStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!acceptedTerms) {
      setError('Voce precisa aceitar os Termos de Uso e a Politica de Privacidade para continuar.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await register(name, email, password)
      setUser(data.user)
      setToken(data.token)
      router.push('/dashboard')
    } catch (err: any) {
      setError('Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-orange-500 mb-2">🔥 Tech Churras</h1>
        <p className="text-gray-400 mb-6">Crie sua conta</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
              placeholder="Seu nome"
              required
            />
          </div>
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
              placeholder="seu@email.com"
              required
            />
          </div>
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
              placeholder="••••••••"
              required
            />
          </div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={e => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-orange-500 shrink-0"
            />
            <span className="text-gray-400 text-sm leading-relaxed">
              Li e aceito os{' '}
              <Link href="/termos-de-uso" target="_blank" className="text-orange-400 hover:underline">
                Termos de Uso
              </Link>{' '}
              e a{' '}
              <Link href="/politica-de-privacidade" target="_blank" className="text-orange-400 hover:underline">
                Politica de Privacidade
              </Link>{' '}
              da Tech Churras.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || !acceptedTerms}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="text-gray-400 text-center mt-4">
          Já tem conta?{' '}
          <a href="/login" className="text-orange-500 hover:underline">
            Entrar
          </a>
        </p>
      </div>
    </div>
  )
}