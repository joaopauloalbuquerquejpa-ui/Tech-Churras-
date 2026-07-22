'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { login } from '@/lib/auth'
import { useAuthStore } from '@/store/authStore'

const TRUST_BADGES = [
  'Fundado por um churrasqueiro profissional certificado',
  'Churrasqueiros certificados e avaliados pela comunidade',
  'Carne entregue pelo próprio churrasqueiro no dia do evento',
]

const PAYMENT_METHODS = ['Mercado Pago', 'Pix', 'Cartão de crédito']

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser, setToken } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await login(email, password)
      setUser(data.user)
      setToken(data.token)
      const next = searchParams.get('redirect')
      const role = data.user?.role
      if (next) router.push(next)
      else if (role === 'GRILLMASTER') router.push('/grillmasters/dashboard')
      else if (role === 'BOUTIQUE') router.push('/boutiques/dashboard')
      else if (role === 'ADMIN') router.push('/admin')
      else router.push('/dashboard')
    } catch {
      setError('Email ou senha incorretos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">

      {/* ── Lado esquerdo: vídeo + conteúdo (apenas md+) ── */}
      <div className="hidden md:flex md:w-1/2 relative flex-col items-center justify-between overflow-hidden py-12 px-10">

        {/* Overlay escuro */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.85) 100%)', zIndex: 1 }}
        />

        {/* Overlay laranja radial */}
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 50% 80%, rgba(249,115,22,0.22) 0%, transparent 65%)', zIndex: 2 }}
        />

        {/* Logo */}
        <div className="relative w-full text-center" style={{ zIndex: 3 }}>
          <div className="animate-fadeInUp" style={{ animationDelay: '0.2s', opacity: 0 }}>
            <span className="text-3xl font-black text-white tracking-tight">
              Tech <span className="text-orange-500">Churras</span>
            </span>
          </div>
        </div>

        {/* Headline + subtítulo */}
        <div className="relative text-center px-4" style={{ zIndex: 3 }}>
          <h2
            className="text-4xl font-black text-white mb-4 leading-tight animate-fadeInUp"
            style={{ animationDelay: '0.4s', opacity: 0 }}
          >
            O churrasco perfeito<br />
            <span className="text-orange-400">começa em 3 cliques</span>
          </h2>
          <p
            className="text-gray-300 text-base leading-relaxed animate-fadeInUp"
            style={{ animationDelay: '0.6s', opacity: 0 }}
          >
            Contrate churrasqueiros certificados e compre carnes selecionadas — tudo em um lugar.
          </p>
        </div>

        {/* Trust badges + urgência + pagamentos */}
        <div
          className="relative w-full flex flex-col gap-2 animate-fadeInUp"
          style={{ zIndex: 3, animationDelay: '0.8s', opacity: 0 }}
        >
          {TRUST_BADGES.map((badge, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-black/40 backdrop-blur-sm border border-orange-500/20 rounded-xl px-4 py-2.5 text-sm text-white"
              style={{ animation: 'slideInFromBottom 0.5s ease forwards', animationDelay: `${0.9 + i * 0.15}s`, opacity: 0 }}
            >
              <span className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold shrink-0">
                ✓
              </span>
              {badge}
            </div>
          ))}

          {/* Urgência */}
          <div
            className="flex items-center gap-2 px-4 py-2 text-xs text-orange-300/80"
            style={{ animation: 'slideInFromBottom 0.5s ease forwards', animationDelay: '1.35s', opacity: 0 }}
          >
            <span>🔥</span>
            <span>BBQ Master certificado, em parceria com o Governo de Zanzibar</span>
          </div>

          {/* Métodos de pagamento */}
          <div
            className="flex items-center gap-2 px-4 pt-1 pb-0"
            style={{ animation: 'slideInFromBottom 0.5s ease forwards', animationDelay: '1.5s', opacity: 0 }}
          >
            <span className="text-gray-600 text-xs">Aceito por:</span>
            {PAYMENT_METHODS.map((m, i) => (
              <span key={i} className="text-xs text-gray-400 bg-white/5 border border-white/10 rounded-md px-2 py-0.5">
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Lado direito: formulário ── */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-12 bg-[#0a0a0a]">
        <div
          className="w-full max-w-sm animate-fadeInUp"
          style={{ animationDelay: '0.3s', opacity: 0 }}
        >
          {/* Logo mobile */}
          <div className="md:hidden text-center mb-6">
            <span className="text-2xl font-black text-white">
              Tech <span className="text-orange-500">Churras</span>
            </span>
          </div>

          {/* Trust strip — só mobile */}
          <div className="md:hidden flex flex-col gap-1.5 mb-6">
            {TRUST_BADGES.map((badge, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                <span className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-[10px] shrink-0">✓</span>
                {badge}
              </div>
            ))}
            <p className="text-xs text-orange-400/70 mt-1 flex items-center gap-1">
              <span>🔥</span> BBQ Master certificado, em parceria com o Governo de Zanzibar
            </p>
          </div>

          {/* Header do form */}
          <h1 className="text-3xl font-black text-white mb-1">
            Entre e peça seu churrasco
          </h1>
          <p className="text-gray-500 mb-8 text-sm">
            Ou crie sua conta em 1 minuto — é grátis
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1.5 block">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-gray-900 text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-colors placeholder-gray-600"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1.5 block">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-gray-900 text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-colors placeholder-gray-600"
                placeholder="••••••••"
                required
              />
              <div className="text-right mt-1.5">
                <a href="/esqueci-senha" className="text-xs text-gray-500 hover:text-orange-400 transition-colors">
                  Esqueci minha senha
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full text-white font-bold py-3.5 rounded-xl text-base transition-all overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: loading
                  ? 'rgb(249,115,22)'
                  : 'linear-gradient(135deg, rgb(249,115,22) 0%, rgb(234,88,12) 100%)',
                boxShadow: loading ? 'none' : '0 4px 24px rgba(249,115,22,0.40)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    style={{ animation: 'spin 0.7s linear infinite' }}
                  />
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>

            {/* Badge de segurança */}
            <p className="text-center text-xs text-gray-600 pt-1">
              🔒 Pagamento 100% seguro via Pix ou cartão
            </p>
          </form>

          {/* CTA de criação de conta */}
          <div className="mt-6 text-center">
            <a
              href="/register"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors group"
            >
              Primeira vez? Crie sua conta grátis
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </a>
          </div>

          {/* Pagamentos — mobile */}
          <div className="md:hidden mt-6 flex items-center justify-center gap-2 flex-wrap">
            <span className="text-gray-600 text-xs">Aceito por:</span>
            {PAYMENT_METHODS.map((m, i) => (
              <span key={i} className="text-xs text-gray-400 bg-white/5 border border-white/10 rounded-md px-2 py-0.5">
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
