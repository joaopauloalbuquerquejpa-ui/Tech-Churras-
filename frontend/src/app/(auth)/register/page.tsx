'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { register } from '@/lib/auth'
import { useAuthStore } from '@/store/authStore'
import { Events } from '@/lib/analytics'

const ROLE_OPTIONS = [
  {
    role: 'CUSTOMER',
    icon: '🔥',
    titulo: 'Quero fazer um churrasco',
    desc: 'Contrato o Grillmaster e compro as carnes no açougue parceiro — tudo em um só lugar, sem stress',
    cor: 'border-orange-500/40 hover:border-orange-500 bg-orange-500/5',
    badge: 'Clientes · festas e eventos',
  },
  {
    role: 'GRILLMASTER',
    icon: '👨‍🍳',
    titulo: 'Sou churrasqueiro',
    desc: 'Quero receber pedidos, aumentar minha renda e ter a chancela Jota Albuquerque',
    cor: 'border-yellow-500/30 hover:border-yellow-400 bg-yellow-500/5',
    badge: 'Grillmaster parceiro',
  },
  {
    role: 'BOUTIQUE',
    icon: '🥩',
    titulo: 'Tenho açougue',
    desc: 'Quero ser açougue parceiro e aumentar minhas vendas',
    cor: 'border-red-500/30 hover:border-red-400 bg-red-500/5',
    badge: 'Açougue parceiro',
  },
]

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser, setToken } = useAuthStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [conviteId, setConviteId] = useState<string | null>(null)
  const [roleParam, setRoleParam] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) setReferralCode(ref.toUpperCase())
    const convite = searchParams.get('convite')
    if (convite) setConviteId(convite)
    const role = searchParams.get('role')
    if (role) {
      setRoleParam(role.toUpperCase())
      setSelectedRole(role.toUpperCase())
    }
    const nomeParam = searchParams.get('nome')
    if (nomeParam) setName(decodeURIComponent(nomeParam))
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!acceptedTerms) {
      setError('Voce precisa aceitar os Termos de Uso e a Politica de Privacidade para continuar.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const effectiveRole = selectedRole ?? roleParam ?? undefined
      const data = await register(name, email, password, acceptedTerms, referralCode ?? undefined, effectiveRole, phone.trim() || undefined, conviteId ?? undefined)
      setUser(data.user)
      setToken(data.token)
      const role = data.user?.role
      Events.signUp(role ?? 'CUSTOMER')
      const next = searchParams.get('redirect')
      if (next) router.push(next)
      else if (role === 'GRILLMASTER') router.push('/grillmasters/dashboard')
      else if (role === 'BOUTIQUE') router.push('/boutiques/dashboard')
      else if (role === 'ADMIN') router.push('/admin')
      else router.push('/dashboard')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const showRolePicker = !selectedRole && !conviteId && !referralCode

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="h-10 overflow-hidden relative w-11">
            <img src="/logo-flame.png" alt="" role="presentation" className="absolute bottom-0 h-16 w-auto" />
          </div>
          <h1 className="text-3xl font-bold text-white leading-none">Tech <span className="text-orange-500">Churras</span></h1>
        </div>

        {/* Role picker */}
        {showRolePicker ? (
          <div className="bg-gray-900 p-8 rounded-2xl shadow-xl">
            <h2 className="text-xl font-black text-white mb-1 text-center">Qual é o seu perfil?</h2>
            <p className="text-gray-500 text-sm text-center mb-6">Escolha para criar a conta certa</p>
            <div className="space-y-3">
              {ROLE_OPTIONS.map(opt => (
                <button
                  key={opt.role}
                  onClick={() => setSelectedRole(opt.role)}
                  className={`w-full text-left border ${opt.cor} rounded-xl p-4 transition-all flex items-start gap-4 group`}
                >
                  <span className="text-3xl shrink-0 mt-0.5">{opt.icon}</span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-0.5">{opt.badge}</span>
                    <p className="font-bold text-white text-base">{opt.titulo}</p>
                    <p className="text-gray-400 text-sm mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-gray-500 text-center text-sm mt-6">
              Já tem conta?{' '}
              <Link href="/login" className="text-orange-400 hover:underline">Entrar</Link>
            </p>
          </div>
        ) : (
          /* Registration form */
          <div className="bg-gray-900 p-8 rounded-2xl shadow-xl">
            {/* Back button when role was picked manually */}
            {!roleParam && !conviteId && !referralCode && selectedRole && (
              <button
                onClick={() => setSelectedRole(null)}
                className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm mb-5 transition-colors"
              >
                ← Voltar
              </button>
            )}

            {/* Context badge */}
            {selectedRole === 'BOUTIQUE' ? (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-5">
                <p className="text-red-300 font-semibold text-sm">🥩 Cadastro de Açougue Parceiro</p>
                <p className="text-red-400/80 text-xs mt-0.5">Sua conta já será criada como parceiro açougue.</p>
              </div>
            ) : selectedRole === 'GRILLMASTER' ? (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 mb-5">
                <p className="text-yellow-300 font-semibold text-sm">👨‍🍳 Cadastro de Churrasqueiro Parceiro</p>
                <p className="text-yellow-400/80 text-xs mt-0.5">Sua conta já será criada como Grillmaster parceiro.</p>
              </div>
            ) : conviteId ? (
              <div className="bg-orange-500/15 border border-orange-500/40 rounded-xl px-4 py-3 mb-5">
                <p className="text-orange-300 font-semibold text-sm">🎁 Você foi convidado!</p>
                <p className="text-orange-400/80 text-xs mt-0.5">10% de desconto no primeiro churrasco já garantido.</p>
              </div>
            ) : referralCode ? (
              <div className="bg-orange-500/15 border border-orange-500/40 rounded-xl px-4 py-3 mb-5">
                <p className="text-orange-300 font-semibold text-sm">🎉 Você foi indicado!</p>
                <p className="text-orange-400/80 text-xs mt-0.5">15% de desconto no primeiro churrasco já aplicado.</p>
              </div>
            ) : (
              <p className="text-gray-400 mb-6 font-semibold">🎉 Criar conta de cliente</p>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="reg-name" className="text-gray-300 text-sm mb-1 block">Nome</label>
                <input
                  id="reg-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
                  placeholder="Seu nome"
                  required
                />
              </div>
              <div>
                <label htmlFor="reg-email" className="text-gray-300 text-sm mb-1 block">Email</label>
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <div>
                <label htmlFor="reg-phone" className="text-gray-300 text-sm mb-1 block">
                  Celular{' '}
                  <span className="text-gray-500 font-normal">(opcional — para confirmações pelo WhatsApp)</span>
                </label>
                <input
                  id="reg-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <label htmlFor="reg-password" className="text-gray-300 text-sm mb-1 block">Senha</label>
                <input
                  id="reg-password"
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
        )}
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
