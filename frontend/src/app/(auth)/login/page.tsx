'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/auth'
import { useAuthStore } from '@/store/authStore'

const VIDEO_FOGO = 'https://videos.pexels.com/video-files/4763824/4763824-uhd_2560_1440_25fps.mp4'

const TRUST_BADGES = [
  '+500 eventos realizados',
  'Churrasqueiros Chancelados',
  'Preço fechado sem surpresas',
]

export default function LoginPage() {
  const router = useRouter()
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
      const role = data.user?.role
      if (role === 'GRILLMASTER') router.push('/grillmasters/dashboard')
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

      {/* ── Lado esquerdo: vídeo (apenas md+) ── */}
      <div className="hidden md:flex md:w-1/2 relative flex-col items-center justify-between overflow-hidden py-12 px-10">
        {/* Vídeo */}
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 0 }}
        >
          <source src={VIDEO_FOGO} type="video/mp4" />
        </video>

        {/* Overlay escuro */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.80) 100%)', zIndex: 1 }}
        />

        {/* Overlay laranja radial */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 50% 80%, rgba(249,115,22,0.18) 0%, transparent 65%)',
            zIndex: 2,
          }}
        />

        {/* Conteúdo */}
        <div className="relative w-full text-center" style={{ zIndex: 3 }}>
          <div
            className="animate-fadeInUp"
            style={{ animationDelay: '0.2s', opacity: 0 }}
          >
            <span className="text-3xl font-black text-white tracking-tight">
              Tech <span className="text-orange-500">Churras</span>
            </span>
          </div>
        </div>

        <div className="relative text-center px-4" style={{ zIndex: 3 }}>
          <h2
            className="text-3xl md:text-4xl font-black text-white mb-3 leading-snug animate-fadeInUp"
            style={{ animationDelay: '0.4s', opacity: 0 }}
          >
            A revolução do churrasco<br />começa aqui
          </h2>
          <p
            className="text-gray-300 text-base animate-fadeInUp"
            style={{ animationDelay: '0.6s', opacity: 0 }}
          >
            Grillmasters chancelados. Cortes premium. Experiência completa.
          </p>
        </div>

        <div
          className="relative w-full flex flex-col gap-2 animate-fadeInUp"
          style={{ zIndex: 3, animationDelay: '0.8s', opacity: 0 }}
        >
          {TRUST_BADGES.map((badge, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-black/40 backdrop-blur-sm border border-orange-500/20 rounded-xl px-4 py-2.5 text-sm text-white"
              style={{ animation: `slideInFromBottom 0.5s ease forwards`, animationDelay: `${0.9 + i * 0.15}s`, opacity: 0 }}
            >
              <span className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold shrink-0">
                &#10003;
              </span>
              {badge}
            </div>
          ))}
        </div>
      </div>

      {/* ── Lado direito: formulário ── */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-12 bg-[#0a0a0a]">
        <div
          className="w-full max-w-sm animate-fadeInUp"
          style={{ animationDelay: '0.3s', opacity: 0 }}
        >
          {/* Logo mobile */}
          <div className="md:hidden text-center mb-8">
            <span className="text-2xl font-black text-white">
              Tech <span className="text-orange-500">Churras</span>
            </span>
          </div>

          <h1 className="text-3xl font-black text-white mb-1">
            Bem-vindo de volta
          </h1>
          <p className="text-gray-500 mb-8 text-sm">Entre na sua conta para continuar</p>

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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full text-white font-bold py-3.5 rounded-xl text-base transition-all overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: loading
                  ? 'rgb(249,115,22)'
                  : 'linear-gradient(135deg, rgb(249,115,22) 0%, rgb(234,88,12) 100%)',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(249,115,22,0.35)',
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
          </form>

          <p className="text-gray-500 text-sm text-center mt-6">
            Não tem conta?{' '}
            <a
              href="/register"
              className="text-orange-500 font-medium relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-orange-500 hover:after:w-full after:transition-all"
            >
              Criar conta
            </a>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
