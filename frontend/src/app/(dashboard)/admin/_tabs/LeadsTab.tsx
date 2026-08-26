'use client'
import { useEffect, useState } from 'react'
import { API_URL } from '@/lib/api'
import { PhoneIcon, ArchiveIcon, TargetIcon } from '@/components/icons/Icons'
import { Badge, LEAD_STATUS_TONE, LEAD_STATUS_LABEL } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'

function getToken() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
}

interface Lead {
  id: string
  phone: string
  name: string | null
  boutique: string | null
  neighborhood: string | null
  status: string
  source: string
  notes: string | null
  followUpSent: boolean
  followUpAt?: string | null
  hidden?: boolean
  createdAt: string
}

const STATUS_OPTIONS = ['new', 'qualified', 'contacted', 'converted', 'dead'] as const

export function LeadsTab() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [includeHidden, setIncludeHidden] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const h = { Authorization: 'Bearer ' + getToken() }
    fetch(`${API_URL}/admin/leads${includeHidden ? '?includeHidden=true' : ''}`, { headers: h })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (!cancelled) setLeads(Array.isArray(data) ? data : []) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [includeHidden])

  async function patchLead(id: string, body: { status?: string; hidden?: boolean }) {
    const r = await fetch(API_URL + '/admin/leads/' + id + '/status', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + getToken(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!r.ok) return
    const updated = await r.json()
    if (updated.hidden && !includeHidden) {
      setLeads(prev => prev.filter(l => l.id !== id))
    } else {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updated } : l))
    }
  }

  async function runTrialMigration() {
    if (!confirm('Rodar migração trialEndsAt para boutiques aprovadas sem trial?')) return
    const h = { Authorization: 'Bearer ' + getToken(), 'Content-Type': 'application/json' }
    const r = await fetch(API_URL + '/admin/migrate/trial-ends-at', { method: 'POST', headers: h })
    const d = await r.json()
    alert(`Migração OK: ${d.updated} boutiques atualizadas`)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h2 className="font-bold text-lg">Leads WhatsApp</h2>
          <p className="text-xs text-gray-500 mt-0.5">Captados pelo bot de captação de açougues</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer select-none">
            <input type="checkbox" checked={includeHidden} onChange={e => setIncludeHidden(e.target.checked)} />
            Mostrar arquivados
          </label>
          <button
            onClick={runTrialMigration}
            className="text-xs text-gray-500 hover:text-gray-300 border border-gray-700 px-3 py-1.5 rounded-lg"
          >
            Migrar trialEndsAt
          </button>
        </div>
      </div>

      {loading && <p className="text-gray-500 text-sm">Carregando...</p>}

      {!loading && leads.length === 0 && (
        <EmptyState icon={<TargetIcon size={22} />} message="Nenhum lead captado ainda. O bot vai popular aqui automaticamente." />
      )}

      <div className="space-y-2">
        {leads.map(lead => {
          const expanded = expandedId === lead.id
          return (
          <div key={lead.id} className={`bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 ${lead.hidden ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between gap-4">
              <button type="button" onClick={() => setExpandedId(expanded ? null : lead.id)} className="space-y-1 min-w-0 text-left flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{lead.name || 'Sem nome'}</span>
                  {lead.boutique && <span className="text-orange-400 text-xs">{lead.boutique}</span>}
                  {lead.neighborhood && <span className="text-gray-500 text-xs">{lead.neighborhood}</span>}
                  <Badge tone={LEAD_STATUS_TONE[lead.status] || 'neutral'}>
                    {LEAD_STATUS_LABEL[lead.status] || lead.status}
                  </Badge>
                  {lead.followUpSent && <span className="text-xs text-blue-400">follow-up enviado</span>}
                  {lead.hidden && <span className="text-xs text-gray-600">arquivado</span>}
                </div>
                <p className="text-xs text-gray-500">
                  {lead.phone} · {new Date(lead.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  {lead.notes && !expanded && <span className="text-gray-600"> · {lead.notes}</span>}
                </p>
              </button>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`https://wa.me/55${lead.phone.replace(/\D/g, '')}`}
                  target="_blank" rel="noreferrer"
                  className="text-xs text-green-400 hover:text-green-300 border border-green-900 px-2 py-1.5 rounded-lg inline-flex items-center gap-1"
                >
                  <PhoneIcon size={13} /> WhatsApp
                </a>
                <select
                  value={lead.status}
                  onChange={e => patchLead(lead.id, { status: e.target.value })}
                  className="bg-gray-800 text-white text-xs rounded-lg px-2 py-1.5 border border-gray-700"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{LEAD_STATUS_LABEL[s]}</option>
                  ))}
                  {!STATUS_OPTIONS.includes(lead.status as any) && (
                    <option value={lead.status}>{lead.status}</option>
                  )}
                </select>
                <button
                  onClick={() => patchLead(lead.id, { hidden: !lead.hidden })}
                  title={lead.hidden ? 'Desarquivar' : 'Arquivar'}
                  className="text-xs text-gray-400 hover:text-white border border-gray-700 px-2 py-1.5 rounded-lg inline-flex items-center gap-1"
                >
                  <ArchiveIcon size={13} /> {lead.hidden ? 'Restaurar' : 'Arquivar'}
                </button>
              </div>
            </div>
            {expanded && (
              <div className="mt-3 pt-3 border-t border-gray-800 grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                <div><span className="text-gray-500">Telefone completo:</span> <span className="text-gray-300">{lead.phone}</span></div>
                <div><span className="text-gray-500">Origem:</span> <span className="text-gray-300">{lead.source}</span></div>
                <div className="sm:col-span-2"><span className="text-gray-500">Detalhes:</span> <span className="text-gray-300">{lead.notes || '—'}</span></div>
                {lead.followUpAt && (
                  <div className="sm:col-span-2">
                    <span className="text-gray-500">Próximo follow-up automático:</span>{' '}
                    <span className="text-gray-300">{new Date(lead.followUpAt).toLocaleString('pt-BR')}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          )
        })}
      </div>
    </div>
  )
}
