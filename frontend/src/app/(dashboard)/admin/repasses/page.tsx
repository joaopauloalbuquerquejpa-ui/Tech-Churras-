'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const BASE = 'https://tech-churras-production.up.railway.app'

function getToken() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
}

interface Payout {
  id: string
  type: string
  recipientId: string
  recipientName: string
  orderId?: string
  amount: number
  commission: number
  grossAmount: number
  status: string
  weekStart: string
  weekEnd: string
  paidAt?: string
  pixKey?: string
  notes?: string
  createdAt: string
}

interface Summary {
  weekStart: string
  weekEnd: string
  totalPending: number
  totalPaid: number
  totalCommission: number
  count: { pending: number; paid: number; total: number }
}

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export default function RepassesPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generateMsg, setGenerateMsg] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [markingId, setMarkingId] = useState<string | null>(null)

  const h = () => ({ Authorization: 'Bearer ' + getToken() })

  async function loadData() {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (typeFilter) params.set('type', typeFilter)

    const [p, s] = await Promise.all([
      fetch(`${BASE}/admin/payouts?${params}`, { headers: h() }).then(r => r.json()),
      fetch(`${BASE}/admin/payouts/summary`, { headers: h() }).then(r => r.json()),
    ]).catch(() => [[], null])

    setPayouts(Array.isArray(p) ? p : [])
    setSummary(s && typeof s === 'object' && 'totalPending' in s ? s : null)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [statusFilter, typeFilter])

  async function handleGenerate() {
    setGenerating(true)
    setGenerateMsg('')
    try {
      const res = await fetch(`${BASE}/admin/payouts/generate`, {
        method: 'POST',
        headers: h(),
      })
      const data = await res.json()
      setGenerateMsg(data.message ?? 'Concluido.')
      await loadData()
    } catch {
      setGenerateMsg('Erro ao gerar repasses.')
    } finally {
      setGenerating(false)
    }
  }

  async function markPaid(id: string) {
    setMarkingId(id)
    try {
      await fetch(`${BASE}/admin/payouts/${id}/mark-paid`, {
        method: 'PATCH',
        headers: h(),
      })
      setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: 'PAID', paidAt: new Date().toISOString() } : p))
      setSummary(prev => {
        if (!prev) return prev
        const payout = payouts.find(p => p.id === id)
        if (!payout) return prev
        return {
          ...prev,
          totalPending: +(prev.totalPending - payout.amount).toFixed(2),
          totalPaid: +(prev.totalPaid + payout.amount).toFixed(2),
          count: { ...prev.count, pending: prev.count.pending - 1, paid: prev.count.paid + 1 },
        }
      })
    } finally {
      setMarkingId(null)
    }
  }

  const filtered = payouts

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/admin" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
              Admin
            </Link>
            <span className="text-gray-700">/</span>
            <h1 className="text-2xl font-bold">Repasses Semanais</h1>
          </div>
          <p className="text-sm text-gray-500">Controle de pagamentos para churrasqueiros e acougues</p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            {generating ? 'Gerando...' : 'Gerar Repasses da Semana'}
          </button>
          {generateMsg && (
            <p className="text-xs text-green-400">{generateMsg}</p>
          )}
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">A Repassar</p>
            <p className="text-2xl font-bold text-orange-400">R$ {fmt(summary.totalPending)}</p>
            <p className="text-xs text-gray-500 mt-1">{summary.count.pending} repasse(s) pendente(s)</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Ja Pago</p>
            <p className="text-2xl font-bold text-green-400">R$ {fmt(summary.totalPaid)}</p>
            <p className="text-xs text-gray-500 mt-1">{summary.count.paid} repasse(s) pago(s)</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Comissao da Plataforma (15%)</p>
            <p className="text-2xl font-bold text-blue-400">R$ {fmt(summary.totalCommission)}</p>
            <p className="text-xs text-gray-500 mt-1">
              Semana: {fmtDate(summary.weekStart)} a {fmtDate(summary.weekEnd)}
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-3 mb-4 flex-wrap">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2"
        >
          <option value="">Todos os status</option>
          <option value="PENDING">Pendente</option>
          <option value="PAID">Pago</option>
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2"
        >
          <option value="">Todos os tipos</option>
          <option value="GRILLMASTER">Churrasqueiro</option>
          <option value="BOUTIQUE">Acougue</option>
        </select>
        {(statusFilter || typeFilter) && (
          <button
            onClick={() => { setStatusFilter(''); setTypeFilter('') }}
            className="text-xs text-gray-400 hover:text-white underline"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm py-8 text-center">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
          <p className="text-gray-400 mb-2">Nenhum repasse encontrado.</p>
          <p className="text-sm text-gray-600">
            Clique em "Gerar Repasses da Semana" para processar os pedidos concluidos.
          </p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  <th className="px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Parceiro</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Tipo</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Periodo</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide text-right">Bruto</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide text-right">Comissao</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide text-right">Liquido</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Pix</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Acao</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr
                    key={p.id}
                    className={'border-b border-gray-800/60 hover:bg-gray-800/30 transition-colors ' + (i % 2 === 0 ? '' : 'bg-gray-800/10')}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{p.recipientName}</p>
                      {p.orderId && (
                        <p className="text-xs text-gray-600 font-mono">#{p.orderId.slice(0, 8)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={'text-xs font-medium px-2 py-0.5 rounded-full ' + (p.type === 'GRILLMASTER' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400')}>
                        {p.type === 'GRILLMASTER' ? 'Churrasqueiro' : 'Acougue'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {fmtDate(p.weekStart)} a {fmtDate(p.weekEnd)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300">R$ {fmt(p.grossAmount)}</td>
                    <td className="px-4 py-3 text-right text-red-400">-R$ {fmt(p.grossAmount - p.amount)}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-400">R$ {fmt(p.amount)}</td>
                    <td className="px-4 py-3">
                      {p.pixKey ? (
                        <span className="font-mono text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded border border-gray-700 max-w-[120px] truncate block" title={p.pixKey}>
                          {p.pixKey}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.status === 'PAID' ? (
                        <div>
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">Pago</span>
                          {p.paidAt && (
                            <p className="text-xs text-gray-600 mt-0.5">{fmtDate(p.paidAt)}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-medium">Pendente</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.status === 'PENDING' && (
                        <button
                          onClick={() => markPaid(p.id)}
                          disabled={markingId === p.id}
                          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                        >
                          {markingId === p.id ? '...' : 'Marcar como Pago'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
            <span>{filtered.length} repasse(s) encontrado(s)</span>
            {summary && (
              <span>
                Total liquido a pagar:{' '}
                <span className="text-green-400 font-bold">
                  R$ {fmt(filtered.filter(p => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0))}
                </span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
