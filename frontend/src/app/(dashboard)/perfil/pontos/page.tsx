'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const BASE = 'https://tech-churras-production.up.railway.app'

function getToken() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
}

interface Balance {
  points: number
  valueInReais: number
}

interface Redemption {
  id: string
  pointsUsed: number
  discountValue: number
  couponCode: string
  used: boolean
  createdAt: string
}

export default function PontosPage() {
  const [balance, setBalance] = useState<Balance | null>(null)
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState(false)
  const [newCoupon, setNewCoupon] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function load() {
    const h = { Authorization: 'Bearer ' + getToken() }
    const [balRes, redRes] = await Promise.all([
      fetch(BASE + '/points/balance', { headers: h }),
      fetch(BASE + '/points/redemptions', { headers: h }),
    ])
    if (balRes.ok) setBalance(await balRes.json())
    if (redRes.ok) setRedemptions(await redRes.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleRedeem() {
    if (redeeming) return
    setRedeeming(true)
    setError('')
    setNewCoupon('')
    try {
      const res = await fetch(BASE + '/points/redeem', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + getToken() },
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao resgatar'); return }
      setNewCoupon(data.couponCode)
      load()
    } finally {
      setRedeeming(false)
    }
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="text-gray-400 text-center py-16">Carregando...</div>

  const canRedeem = (balance?.points ?? 0) >= 100
  const blocksAvailable = balance ? Math.floor(balance.points / 100) : 0

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">&#8592;</Link>
        <h1 className="text-2xl font-bold">Programa de Pontos</h1>
      </div>

      {/* Balance card */}
      <div className="bg-gradient-to-br from-orange-500/20 to-orange-900/10 rounded-2xl p-6 border border-orange-500/20 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-orange-300/70 uppercase tracking-wide mb-1">Seus pontos</p>
            <p className="text-5xl font-black text-white">{balance?.points ?? 0}</p>
            <p className="text-sm text-orange-300 mt-1">
              {balance && balance.valueInReais > 0
                ? `Vale R$ ${balance.valueInReais.toFixed(2).replace('.', ',')} em desconto`
                : 'Acumule 100 pts para resgatar R$ 10'}
            </p>
          </div>
          <div className="text-5xl">🏆</div>
        </div>

        <div className="bg-black/20 rounded-xl p-3 text-xs text-orange-200/70 space-y-1">
          <p>&#10003; A cada R$ 10 gastos em pedidos, voce ganha 1 ponto</p>
          <p>&#10003; 100 pontos = R$ 10 de desconto</p>
          <p>&#10003; O desconto e aplicado como cupom de uso unico</p>
        </div>
      </div>

      {/* Redeem section */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6">
        <h2 className="font-semibold text-white mb-2">Resgatar pontos</h2>
        <p className="text-sm text-gray-500 mb-4">
          Voce tem <span className="text-white font-semibold">{balance?.points ?? 0} pts</span>
          {blocksAvailable > 0
            ? ` — pode resgatar R$ ${(blocksAvailable * 10).toFixed(2).replace('.', ',')} agora`
            : `. Faltam ${100 - ((balance?.points ?? 0) % 100)} pts para o proximo resgate.`}
        </p>

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        {newCoupon ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <p className="text-green-400 font-semibold text-sm mb-2">Cupom gerado com sucesso!</p>
            <div className="flex items-center gap-2">
              <span className="flex-1 font-mono text-white font-bold text-lg tracking-wider">{newCoupon}</span>
              <button
                onClick={() => copyCode(newCoupon)}
                className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Use este cupom no proximo pedido</p>
          </div>
        ) : (
          <button
            onClick={handleRedeem}
            disabled={!canRedeem || redeeming}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
          >
            {redeeming
              ? 'Gerando cupom...'
              : canRedeem
              ? `Resgatar ${blocksAvailable * 100} pts por R$ ${(blocksAvailable * 10).toFixed(2).replace('.', ',')} de desconto`
              : `Faltam ${100 - ((balance?.points ?? 0) % 100)} pts`}
          </button>
        )}
      </div>

      {/* History */}
      {redemptions.length > 0 && (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800">
            <p className="text-sm font-semibold text-white">Historico de resgates</p>
          </div>
          <div className="divide-y divide-gray-800">
            {redemptions.map(r => (
              <div key={r.id} className="px-5 py-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-sm text-white font-semibold">{r.couponCode}</span>
                  <span className={r.used ? 'text-xs text-gray-500' : 'text-xs text-green-400'}>
                    {r.used ? 'Utilizado' : 'Disponivel'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{r.pointsUsed} pts &rarr; R$ {r.discountValue.toFixed(2).replace('.', ',')}</span>
                  <span className="text-xs text-gray-600">
                    {new Date(r.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
