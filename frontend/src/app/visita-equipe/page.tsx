'use client'

import { useState } from 'react'
import { API_URL } from '@/lib/api'

export const metadata = undefined // client component, sem metadata estático

const RESULTADOS = [
  { value: 'fechou',          label: '🔥 Fechou!',           desc: 'Assinou ou comprometeu-se a assinar' },
  { value: 'interessado',     label: '👀 Interessado',        desc: 'Quer saber mais, pediu retorno' },
  { value: 'retornar',        label: '🔁 Retornar amanhã',   desc: 'Dono ausente ou pediu para voltar' },
  { value: 'nao_interessado', label: '❌ Não interessado',   desc: 'Recusou ou fora do perfil' },
]

const COMISSOES = {
  acougue:       { fechou: 'R$150 agora + R$150 no 1º pag.',   interessado: 'Potencial R$300' },
  churrasqueiro: { fechou: 'R$50 após 30 dias ativo',          interessado: 'Potencial R$50' },
}

export default function VisitaEquipePage() {
  const [form, setForm] = useState({
    vendedor: '', tipo: 'acougue', nomeNegocio: '', nomeDono: '',
    telefone: '', bairro: '', resultado: '', observacoes: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [count, setCount] = useState(0)

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.resultado) return
    setStatus('loading')
    try {
      const res = await fetch(`${API_URL}/public/visita-equipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
      setCount(c => c + 1)
      // Mantém vendedor e tipo, limpa o resto para próxima visita
      setForm(f => ({ ...f, nomeNegocio: '', nomeDono: '', telefone: '', bairro: '', resultado: '', observacoes: '' }))
      setTimeout(() => setStatus('idle'), 3000)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  const comissaoHint = form.tipo && form.resultado && form.resultado !== 'nao_interessado' && form.resultado !== 'retornar'
    ? (COMISSOES as any)[form.tipo]?.[form.resultado]
    : null

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-1">Tech Churras — Equipe SP</p>
        <h1 className="text-2xl font-black">Registrar Visita</h1>
        {count > 0 && (
          <p className="text-sm text-gray-400 mt-1">
            {count} visita{count > 1 ? 's' : ''} registrada{count > 1 ? 's' : ''} hoje
          </p>
        )}
      </div>

      {/* Success */}
      {status === 'success' && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl px-5 py-4 mb-6 text-green-400 font-semibold text-sm">
          ✅ Visita registrada! Pode registrar a próxima.
        </div>
      )}
      {status === 'error' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl px-5 py-4 mb-6 text-red-400 font-semibold text-sm">
          Erro ao enviar. Verifique a conexão e tente novamente.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Vendedor */}
        <div>
          <label className="block text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1.5">Seu nome</label>
          <input
            value={form.vendedor}
            onChange={e => set('vendedor', e.target.value)}
            placeholder="Ex: Carlos Silva"
            required minLength={2}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-orange-500 focus:outline-none"
          />
        </div>

        {/* Tipo */}
        <div>
          <label className="block text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Tipo de visita</label>
          <div className="grid grid-cols-2 gap-3">
            {(['acougue', 'churrasqueiro'] as const).map(t => (
              <button
                key={t} type="button"
                onClick={() => set('tipo', t)}
                className={`rounded-xl px-4 py-3 text-sm font-bold border transition-all ${
                  form.tipo === t
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                {t === 'acougue' ? '🥩 Açougue' : '👨‍🍳 Churrasqueiro'}
              </button>
            ))}
          </div>
        </div>

        {/* Nome do negócio */}
        <div>
          <label className="block text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1.5">
            {form.tipo === 'acougue' ? 'Nome do açougue' : 'Nome do churrasqueiro'}
          </label>
          <input
            value={form.nomeNegocio}
            onChange={e => set('nomeNegocio', e.target.value)}
            placeholder={form.tipo === 'acougue' ? 'Ex: Açougue São Jorge' : 'Ex: Marcos Churrasqueiro'}
            required minLength={2}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-orange-500 focus:outline-none"
          />
        </div>

        {/* Nome do dono + Telefone */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1.5">Nome do dono</label>
            <input
              value={form.nomeDono}
              onChange={e => set('nomeDono', e.target.value)}
              placeholder="Ex: João"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1.5">Telefone</label>
            <input
              value={form.telefone}
              onChange={e => set('telefone', e.target.value)}
              placeholder="11 9 9999-9999"
              type="tel" required minLength={8}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Bairro */}
        <div>
          <label className="block text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1.5">Bairro em SP</label>
          <input
            value={form.bairro}
            onChange={e => set('bairro', e.target.value)}
            placeholder="Ex: Vila Mariana"
            required minLength={2}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-orange-500 focus:outline-none"
          />
        </div>

        {/* Resultado */}
        <div>
          <label className="block text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Resultado da visita</label>
          <div className="space-y-2">
            {RESULTADOS.map(r => (
              <button
                key={r.value} type="button"
                onClick={() => set('resultado', r.value)}
                className={`w-full text-left rounded-xl px-4 py-3 border transition-all ${
                  form.resultado === r.value
                    ? 'bg-orange-500/10 border-orange-500 text-white'
                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                <span className="font-bold text-sm">{r.label}</span>
                <span className="block text-xs text-gray-500 mt-0.5">{r.desc}</span>
              </button>
            ))}
          </div>

          {/* Comissão hint */}
          {comissaoHint && (
            <div className="mt-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-green-400 text-sm font-semibold">
              💰 Sua comissão: {comissaoHint}
            </div>
          )}
        </div>

        {/* Observações */}
        <div>
          <label className="block text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1.5">
            Observações <span className="text-gray-600 font-normal normal-case">(opcional)</span>
          </label>
          <textarea
            value={form.observacoes}
            onChange={e => set('observacoes', e.target.value)}
            placeholder="Ex: Dono pediu para voltar quinta às 10h. Tem 2 funcionários..."
            rows={3} maxLength={500}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-orange-500 focus:outline-none resize-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!form.resultado || status === 'loading'}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-black py-4 rounded-xl text-base transition-all"
        >
          {status === 'loading' ? 'Salvando...' : 'Registrar Visita'}
        </button>
      </form>

      {/* Tabela de comissões */}
      <div className="mt-10 bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="text-sm font-bold text-gray-300 mb-4 uppercase tracking-wide">Suas comissões</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">🥩 Açougue fechado</span>
            <span className="text-white font-bold">R$ 300</span>
          </div>
          <div className="text-xs text-gray-600 -mt-2 pl-1">R$150 na assinatura + R$150 no 1º pagamento</div>
          <div className="flex justify-between pt-1">
            <span className="text-gray-400">👨‍🍳 Churrasqueiro ativo 30d</span>
            <span className="text-white font-bold">R$ 50</span>
          </div>
        </div>
      </div>
    </div>
  )
}
