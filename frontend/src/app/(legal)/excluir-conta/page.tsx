'use client'

import type { Metadata } from 'next'
import Link from 'next/link'
import { useState } from 'react'

export default function ExcluirContaPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [entendido, setEntendido] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!entendido) { setErro('Confirme que entende que a ação é irreversível.'); return }

    setLoading(true)
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'https://tech-churras-production.up.railway.app') + '/auth/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: senha }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir conta')
      setSucesso(true)
    } catch (err: any) {
      setErro(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (sucesso) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <div style={{ fontSize: 52, marginBottom: 20 }}>✓</div>
        <h1 className="text-2xl font-bold text-white mb-3">Conta excluída</h1>
        <p className="text-gray-400 text-sm leading-7 mb-8">
          Seus dados foram removidos da plataforma Tech Churras conforme a LGPD.<br />
          Se tiver dúvidas, escreva para{' '}
          <a href="mailto:techchurras@gmail.com" className="text-orange-400 underline">techchurras@gmail.com</a>.
        </p>
        <Link href="/" className="text-orange-400 font-bold text-sm hover:text-orange-300">← Voltar ao início</Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">Excluir minha conta</h1>
      <p className="text-sm text-gray-500 mb-8">Tech Churras · Solicitação de exclusão de dados (LGPD)</p>

      {/* Aviso */}
      <div className="bg-red-950/40 border border-red-800/40 rounded-xl p-5 mb-8">
        <p className="text-red-300 font-bold text-sm mb-3">⚠️ Esta ação é irreversível</p>
        <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
          <li>Seu perfil e dados pessoais serão removidos</li>
          <li>Seu histórico de pedidos será excluído</li>
          <li>Seus pontos e cupons serão perdidos</li>
          <li>Pedidos em andamento serão cancelados</li>
          <li>A exclusão é processada em até 30 dias (LGPD)</li>
        </ul>
        <p className="text-gray-500 text-xs mt-3 leading-relaxed">
          Conforme a Lei 13.709/2018 (LGPD), dados de transações financeiras podem ser retidos por até 5 anos
          e logs de acesso por até 6 meses (Marco Civil da Internet).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-400 text-sm font-semibold mb-2">E-mail da conta</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="block text-gray-400 text-sm font-semibold mb-2">Senha</label>
          <input
            type="password"
            required
            value={senha}
            onChange={e => setSenha(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500"
          />
        </div>

        <label className={`flex items-start gap-3 cursor-pointer p-4 bg-gray-900 rounded-xl border transition-colors ${entendido ? 'border-red-600/50' : 'border-gray-700'}`}>
          <input
            type="checkbox"
            checked={entendido}
            onChange={e => setEntendido(e.target.checked)}
            className="mt-0.5 w-4 h-4 flex-shrink-0 accent-red-600"
          />
          <span className="text-gray-300 text-sm leading-relaxed">
            Entendo que esta ação é <strong className="text-red-300">irreversível</strong> e que todos os
            meus dados serão excluídos permanentemente da plataforma Tech Churras.
          </span>
        </label>

        {erro && (
          <div className="bg-red-950/40 border border-red-800/40 rounded-lg px-4 py-3 text-red-300 text-sm">
            {erro}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !entendido}
          className={`w-full font-bold text-sm py-4 rounded-xl transition-colors ${
            entendido
              ? 'bg-red-600 hover:bg-red-500 text-white cursor-pointer'
              : 'bg-gray-800 text-gray-600 cursor-not-allowed'
          }`}
        >
          {loading ? 'Excluindo...' : 'Excluir minha conta'}
        </button>
      </form>

      <div className="mt-10 pt-8 border-t border-gray-800 text-sm text-gray-500">
        Dúvidas?{' '}
        <Link href="/politica-de-privacidade" className="text-orange-400 hover:text-orange-300 underline">
          Leia nossa Política de Privacidade
        </Link>
        {' '}ou escreva para{' '}
        <a href="mailto:techchurras@gmail.com" className="text-orange-400 hover:text-orange-300 underline">
          techchurras@gmail.com
        </a>.
      </div>
    </div>
  )
}
