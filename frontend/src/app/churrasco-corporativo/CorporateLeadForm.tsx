'use client'
import { useState } from 'react'
import { API_URL } from '@/lib/api'

export default function CorporateLeadForm() {
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
          {['Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro', 'Ainda não sei'].map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <button type="submit" disabled={status === 'sending'}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-4 rounded-xl text-lg transition-colors">
        {status === 'sending' ? 'Enviando...' : 'Quero a proposta →'}
      </button>
      {status === 'error' && <p className="text-red-400 text-sm text-center">Não foi possível enviar. Confere o WhatsApp digitado e tenta de novo.</p>}
    </form>
  )
}
