'use client'
import { useEffect, useState } from 'react'
import { API_URL } from '@/lib/api'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import { ArchiveIcon, ClipboardIcon, CloseIcon } from '@/components/icons/Icons'

function getToken() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
}

interface AdminContract {
  id: string
  partnerId: string
  partnerType: string
  partnerName: string
  partnerEmail: string
  partnerDocument: string
  durationMonths: number
  status: string
  acceptedAt: string | null
  generatedAt: string
  contractText: string
  hidden?: boolean
}

export function ContractsTab() {
  const [contracts, setContracts] = useState<AdminContract[]>([])
  const [showHidden, setShowHidden] = useState(false)
  const [viewContract, setViewContract] = useState<AdminContract | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchContracts(includeHidden: boolean) {
    setLoading(true)
    const h = { Authorization: 'Bearer ' + getToken() }
    const res = await fetch(API_URL + '/contracts/all?includeHidden=' + includeHidden, { headers: h })
    if (res.ok) {
      const c = await res.json()
      setContracts(Array.isArray(c) ? c : [])
    }
    setLoading(false)
  }

  useEffect(() => { fetchContracts(showHidden) }, [showHidden])

  async function archiveContract(id: string, hidden: boolean) {
    const res = await fetch(API_URL + '/contracts/' + id + '/archive', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
      body: JSON.stringify({ hidden }),
    })
    if (res.ok) {
      if (hidden && !showHidden) setContracts(prev => prev.filter(c => c.id !== id))
      else setContracts(prev => prev.map(c => c.id === id ? { ...c, hidden } : c))
    }
  }

  async function deleteContract(id: string, name: string) {
    if (!confirm(`Apagar de vez o contrato de ${name}? Essa ação não pode ser desfeita.`)) return
    const res = await fetch(API_URL + '/contracts/' + id, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + getToken() },
    })
    if (res.ok || res.status === 204) {
      setContracts(prev => prev.filter(c => c.id !== id))
    } else {
      const body = await res.json().catch(() => null)
      alert(body?.error || 'Não foi possível apagar esse contrato.')
    }
  }

  if (loading) return <p className="text-gray-500 text-sm">Carregando...</p>

  const grillmasterContracts = contracts.filter(c => c.partnerType !== 'BOUTIQUE')
  const boutiqueContracts = contracts.filter(c => c.partnerType === 'BOUTIQUE')

  const contractCard = (c: AdminContract) => (
    <div key={c.id} className={`bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start justify-between gap-4 ${c.hidden ? 'opacity-50' : ''}`}>
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{c.partnerName}</span>
          <Badge tone={c.status === 'ACCEPTED' ? 'green' : 'yellow'}>{c.status === 'ACCEPTED' ? 'Aceito' : 'Pendente'}</Badge>
          {c.hidden && <Badge tone="neutral">Arquivado</Badge>}
        </div>
        <p className="text-xs text-gray-500">{c.partnerEmail} · {c.partnerDocument}</p>
        <p className="text-xs text-gray-600">
          Vigência: {c.durationMonths} meses · Gerado: {new Date(c.generatedAt).toLocaleDateString('pt-BR')}
          {c.acceptedAt && ` · Aceito: ${new Date(c.acceptedAt).toLocaleDateString('pt-BR')}`}
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button onClick={() => setViewContract(c)} className="text-xs text-orange-400 hover:text-orange-300 border border-orange-900 px-3 py-1.5 rounded-lg">
          Ver
        </button>
        <button onClick={() => archiveContract(c.id, !c.hidden)} className="text-xs text-gray-400 hover:text-white border border-gray-700 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5">
          <ArchiveIcon size={12} /> {c.hidden ? 'Restaurar' : 'Arquivar'}
        </button>
        <button onClick={() => deleteContract(c.id, c.partnerName)} className="text-xs text-red-400 hover:text-red-300 border border-red-900 px-3 py-1.5 rounded-lg">
          Apagar
        </button>
      </div>
    </div>
  )

  return (
    <div>
      <label className="flex items-center gap-2 mb-4 cursor-pointer w-fit">
        <input type="checkbox" checked={showHidden} onChange={e => setShowHidden(e.target.checked)} className="accent-orange-500 w-4 h-4" />
        <span className="text-sm text-gray-300">Mostrar arquivados</span>
      </label>

      {contracts.length === 0 ? (
        <EmptyState icon={<ClipboardIcon size={22} />} message="Nenhum contrato gerado até o momento." />
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-3">Churrasqueiros ({grillmasterContracts.length})</h2>
            {grillmasterContracts.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhum contrato de churrasqueiro.</p>
            ) : (
              <div className="space-y-3">{grillmasterContracts.map(contractCard)}</div>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-3">Açougues ({boutiqueContracts.length})</h2>
            {boutiqueContracts.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhum contrato de açougue.</p>
            ) : (
              <div className="space-y-3">{boutiqueContracts.map(contractCard)}</div>
            )}
          </div>
        </div>
      )}

      {viewContract && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <span className="font-bold text-orange-400">{viewContract.partnerName}</span>
                <Badge tone="green">v1.0 — Aprovado</Badge>
              </div>
              <button onClick={() => setViewContract(null)} className="text-gray-500 hover:text-white">
                <CloseIcon size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <pre className="font-mono text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{viewContract.contractText}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
