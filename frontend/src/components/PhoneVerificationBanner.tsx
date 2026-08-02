'use client'
import { useState } from 'react'
import { API_URL } from '@/lib/api'

function getToken() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
}

export default function PhoneVerificationBanner({ verified, onVerified }: { verified: boolean; onVerified: () => void }) {
  const [step, setStep] = useState<'idle' | 'sent'>('idle')
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const [sentTo, setSentTo] = useState('')

  if (verified) return null

  async function handleSend() {
    setSending(true); setError('')
    try {
      const res = await fetch(`${API_URL}/auth/phone-verification/send`, {
        method: 'POST', headers: { Authorization: 'Bearer ' + getToken() },
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error ?? 'Erro ao enviar código'); return }
      if (d.alreadyVerified) { onVerified(); return }
      setSentTo(d.sentTo ?? '')
      setStep('sent')
    } finally { setSending(false) }
  }

  async function handleConfirm() {
    setConfirming(true); setError('')
    try {
      const res = await fetch(`${API_URL}/auth/phone-verification/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
        body: JSON.stringify({ code }),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error ?? 'Código inválido'); return }
      onVerified()
    } finally { setConfirming(false) }
  }

  return (
    <div className="mb-5 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4">
      {step === 'idle' ? (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-bold text-yellow-300">Confirme seu WhatsApp</p>
            <p className="text-xs text-gray-400 mt-0.5">Rapidinho — só pra garantir que conseguimos te avisar de pedidos novos.</p>
          </div>
          <button
            onClick={handleSend}
            disabled={sending}
            className="text-xs bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-bold px-4 py-2 rounded-lg transition-colors shrink-0"
          >
            {sending ? 'Enviando...' : 'Enviar código'}
          </button>
        </div>
      ) : (
        <div>
          <p className="text-sm font-bold text-yellow-300">Digite o código enviado{sentTo ? ` pro WhatsApp ${sentTo}` : ''}</p>
          <div className="flex items-center gap-2 mt-2">
            <input
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white w-28 tracking-widest font-mono focus:outline-none focus:border-yellow-500"
            />
            <button
              onClick={handleConfirm}
              disabled={confirming || code.length !== 6}
              className="text-xs bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-bold px-4 py-2 rounded-lg transition-colors"
            >
              {confirming ? 'Confirmando...' : 'Confirmar'}
            </button>
            <button onClick={handleSend} disabled={sending} className="text-xs text-gray-400 hover:text-white underline">
              Reenviar
            </button>
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  )
}
