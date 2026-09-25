'use client'
import { useState, useMemo } from 'react'
import { API_URL } from '@/lib/api'

// Antes era uma lista fixa (Agosto...Dezembro) que virava mes passado sozinha
// com o tempo - gera os proximos 6 meses a partir de hoje, sempre atual.
function nextMonthOptions() {
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    return label.charAt(0).toUpperCase() + label.slice(1)
  })
  return [...months, 'Ainda não sei']
}

export default function CorporateLeadForm() {
  const monthOptions = useMemo(nextMonthOptions, [])
  const [empresa, setEmpresa] = useState('')
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [pessoas, setPessoas] = useState('')
  const [mesEvento, setMesEvento] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'sending') return
    setStatus('sending')
    try {
      const res = await fetch(`${API_URL}/public/corporate-lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa: empresa.trim(),
          nome: nome.trim(),
          telefone: telefone.trim(),
          pessoas: pessoas ? Number(pessoas) : undefined,
          mesEvento: mesEvento || undefined,
        }),
      })
      setStatus(res.ok ? 'ok' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'ok') return (
    <div className="bg-green-500/10 border border-green-500/40 rounded-2xl p-6 text-center">
      <div className="text-3xl mb-2">🔥</div>
      <p className="font-bold text-green-400">Recebido! Proposta a caminho.</p>
      <p className="text-gray-400 text-sm mt-1">Nossa equipe responde no seu WhatsApp em até 24h úteis.</p>
    </div>
  )

  const inputCls = 'w-full bg-gray-900 border border-gray-700 focus:border-orange-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors'

  return (
    <form onSubmit={submit} className="space-y-3">
      <input required minLength={2} className={inputCls} placeholder="Nome da empresa" value={empresa} onChange={e => setEmpresa(e.target.value)} />
      <input required minLength={2} className={inputCls} placeholder="Seu nome" value={nome} onChange={e => setNome(e.target.value)} />
      <input required minLength={10} type="tel" className={inputCls} placeholder="WhatsApp com DDD (11 99999-9999)" value={telefone} onChange={e => setTelefone(e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <input type="number" min={1} max={5000} className={inputCls} placeholder="Nº de pessoas" value={pessoas} onChange={e => setPessoas(e.target.value)} />
        <select className={inputCls} value={mesEvento} onChange={e => setMesEvento(e.target.value)}>
          <option value="">Mês do evento</option>
          {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <button type="submit" disabled={status === 'sending'}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-4 rounded-xl text-lg transition-colors">
        {status === 'sending' ? 'Enviando...' : 'Quero a proposta →'}
      </button>
      {status === 'error' && (
        <p className="text-red-400 text-sm text-center">
          Não foi possível enviar agora. Tenta de novo em instantes, ou{' '}
          <a
            href={`https://wa.me/5511970593650?text=${encodeURIComponent(`Olá! Quero um orçamento de churrasco corporativo. Empresa: ${empresa || '(preencher)'}, ${pessoas ? pessoas + ' pessoas' : ''}`)}`}
            target="_blank" rel="noopener noreferrer"
            className="underline text-orange-400 hover:text-orange-300"
          >
            fala direto no WhatsApp
          </a>.
        </p>
      )}
    </form>
  )
}
