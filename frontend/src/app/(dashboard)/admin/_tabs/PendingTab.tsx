'use client'
import { useEffect, useState } from 'react'
import { API_URL } from '@/lib/api'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import { PhoneIcon, PinIcon, CameraIcon, ClockIcon, CarIcon, CashIcon, CheckIcon, ChefIcon } from '@/components/icons/Icons'

function getToken() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
}

interface PendingGrillmaster {
  id: string
  bio: string
  pricePerHour: number
  city: string
  state: string
  experience: number
  isChancelado: boolean
  uniformSent: boolean
  uniformSentAt?: string
  certifiedAt?: string
  trainingModules: number[]
  photoUrl?: string
  galleryUrls?: string[]
  instagram?: string
  churrascoStyle?: string
  specialties?: string
  serviceRegions?: string[]
  approved?: boolean
  rejected?: boolean
  pixKey?: string
  cpfCnpj?: string
  pixOwnership?: 'match' | 'mismatch' | 'not_verifiable'
  user: { name: string; email: string; phone?: string; phoneVerified?: boolean }
}

interface PendingBoutique {
  id: string
  name: string
  description?: string
  city: string
  state: string
  address?: string
  phone?: string
  instagram?: string
  openingHours?: string
  deliveryOrPickup?: string
  approved?: boolean
  rejected?: boolean
  pixKey?: string
  cpfCnpj?: string
  pixOwnership?: 'match' | 'mismatch' | 'not_verifiable'
  logoUrl?: string
  facadeUrl?: string
  galleryUrls?: string[]
  user: { name: string; email: string; phone?: string; phoneVerified?: boolean }
}

interface GmApproveState {
  pricePerHour: number
}

export function PendingTab() {
  const [pendingGrillmasters, setPendingGrillmasters] = useState<PendingGrillmaster[]>([])
  const [awaitingCertification, setAwaitingCertification] = useState<PendingGrillmaster[]>([])
  const [certifyingId, setCertifyingId] = useState<string | null>(null)
  const [pendingBoutiques, setPendingBoutiques] = useState<PendingBoutique[]>([])
  const [allGrillmasters, setAllGrillmasters] = useState<PendingGrillmaster[]>([])
  const [allBoutiques, setAllBoutiques] = useState<PendingBoutique[]>([])
  const [showAllPartners, setShowAllPartners] = useState(false)
  const [gmApproveState, setGmApproveState] = useState<Record<string, GmApproveState>>({})
  const [loading, setLoading] = useState(true)

  async function fetchAll() {
    const h = { Authorization: 'Bearer ' + getToken() }
    const [pg, awaitCert, pb, allGms, allBts] = await Promise.all([
      fetch(API_URL + '/admin/grillmasters/pending', { headers: h }).then(r => r.json()),
      fetch(API_URL + '/admin/grillmasters/awaiting-certification', { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(API_URL + '/admin/boutiques/pending', { headers: h }).then(r => r.json()),
      fetch(API_URL + '/admin/grillmasters', { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(API_URL + '/admin/boutiques', { headers: h }).then(r => r.ok ? r.json() : []),
    ])
    const gms: PendingGrillmaster[] = Array.isArray(pg) ? pg : []
    setPendingGrillmasters(gms)
    const init: Record<string, GmApproveState> = {}
    gms.forEach(g => { init[g.id] = { pricePerHour: g.pricePerHour } })
    setGmApproveState(prev => ({ ...init, ...prev }))
    setAwaitingCertification(Array.isArray(awaitCert) ? awaitCert : [])
    setPendingBoutiques(Array.isArray(pb) ? pb : [])
    setAllGrillmasters(Array.isArray(allGms) ? allGms : (allGms?.data ?? []))
    setAllBoutiques(Array.isArray(allBts) ? allBts : (allBts?.data ?? []))
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  async function approveGrillmaster(id: string) {
    const state = gmApproveState[id] || { pricePerHour: 0 }
    const res = await fetch(API_URL + '/admin/grillmasters/' + id + '/approve', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
      body: JSON.stringify({ pricePerHour: state.pricePerHour }),
    })
    if (res.ok) { setPendingGrillmasters(prev => prev.filter(g => g.id !== id)); fetchAll() }
  }

  async function certifyGrillmaster(id: string) {
    setCertifyingId(id)
    try {
      const res = await fetch(API_URL + '/admin/grillmasters/' + id + '/certify', { method: 'POST', headers: { Authorization: 'Bearer ' + getToken() } })
      if (res.ok) setAwaitingCertification(prev => prev.filter(g => g.id !== id))
    } finally { setCertifyingId(null) }
  }

  async function rejectGrillmaster(id: string) {
    const res = await fetch(API_URL + '/admin/grillmasters/' + id + '/reject', { method: 'PATCH', headers: { Authorization: 'Bearer ' + getToken() } })
    if (res.ok) { setPendingGrillmasters(prev => prev.filter(g => g.id !== id)); fetchAll() }
  }

  async function markUniformSent(grillmasterId: string) {
    const res = await fetch(API_URL + '/admin/grillmasters/' + grillmasterId + '/uniform', { method: 'PATCH', headers: { Authorization: 'Bearer ' + getToken() } })
    if (res.ok) {
      setPendingGrillmasters(prev => prev.map(g => g.id === grillmasterId ? { ...g, uniformSent: true, uniformSentAt: new Date().toISOString() } : g))
    }
  }

  async function approveBoutique(id: string) {
    const res = await fetch(API_URL + '/admin/boutiques/' + id + '/approve', { method: 'PATCH', headers: { Authorization: 'Bearer ' + getToken() } })
    if (res.ok) { setPendingBoutiques(prev => prev.filter(b => b.id !== id)); fetchAll() }
  }

  async function rejectBoutique(id: string) {
    const res = await fetch(API_URL + '/admin/boutiques/' + id + '/reject', { method: 'PATCH', headers: { Authorization: 'Bearer ' + getToken() } })
    if (res.ok) { setPendingBoutiques(prev => prev.filter(b => b.id !== id)); fetchAll() }
  }

  function setGmField(id: string, field: keyof GmApproveState, value: number) {
    setGmApproveState(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  if (loading) return <p className="text-gray-500 text-sm">Carregando...</p>

  const displayedGrillmasters = showAllPartners ? allGrillmasters : pendingGrillmasters
  const displayedBoutiques = showAllPartners ? allBoutiques : pendingBoutiques

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button
          onClick={() => setShowAllPartners(false)}
          className={'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ' + (!showAllPartners ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700')}
        >
          Pendentes
        </button>
        <button
          onClick={() => setShowAllPartners(true)}
          className={'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ' + (showAllPartners ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700')}
        >
          Todos — inclui aprovados e reprovados
        </button>
      </div>

      {/* Churrasqueiros */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Churrasqueiros ({displayedGrillmasters.length})</h2>
        {displayedGrillmasters.length === 0 && (
          <EmptyState icon={<ChefIcon size={22} />} message={showAllPartners ? 'Nenhum churrasqueiro cadastrado.' : 'Nenhum churrasqueiro aguardando aprovação.'} />
        )}
        <div className="space-y-3">
          {displayedGrillmasters.map(g => {
            const gmState = gmApproveState[g.id] || { pricePerHour: g.pricePerHour }
            return (
              <div key={g.id} className="bg-gray-900 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{g.user.name}</p>
                      {showAllPartners && (
                        g.rejected ? <Badge tone="red">Reprovado</Badge>
                        : g.approved ? <Badge tone="green">Aprovado</Badge>
                        : <Badge tone="yellow">Pendente</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mb-0.5">{g.user.email}</p>
                    {g.user.phone && <p className="text-xs text-gray-400 mb-1 inline-flex items-center gap-1"><PhoneIcon size={11} /> {g.user.phone}</p>}
                    <div className="flex gap-1.5 mb-1 flex-wrap">
                      <Badge tone={g.user.phoneVerified ? 'green' : 'neutral'}>{g.user.phoneVerified ? '✓ WhatsApp verificado' : 'WhatsApp não verificado'}</Badge>
                      {g.pixOwnership === 'mismatch' && <Badge tone="red">⚠ Chave PIX não bate com CPF/CNPJ</Badge>}
                      {g.pixOwnership === 'match' && <Badge tone="green">✓ PIX confere com CPF/CNPJ</Badge>}
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-2">{g.bio}</p>
                    <div className="flex gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                      <span>{g.city}, {g.state}</span>
                      <span>{g.experience} anos exp.</span>
                      {g.churrascoStyle && <span className="text-orange-400">{g.churrascoStyle}</span>}
                      {g.instagram && <span className="text-pink-400">@{g.instagram}</span>}
                    </div>
                    {g.specialties && (
                      <p className="text-xs text-gray-400 mt-1 inline-flex items-center gap-1"><ChefIcon size={11} /> <span className="text-gray-300">{g.specialties}</span></p>
                    )}
                    {g.serviceRegions && g.serviceRegions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {g.serviceRegions.map(r => (
                          <span key={r} className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-400 inline-flex items-center gap-1"><PinIcon size={9} /> {r}</span>
                        ))}
                      </div>
                    )}
                    {(g.photoUrl || (g.galleryUrls && g.galleryUrls.length > 0)) && (
                      <div className="flex gap-1.5 mt-2">
                        {g.photoUrl && (
                          <a href={g.photoUrl} target="_blank" rel="noopener noreferrer">
                            <img src={g.photoUrl} alt="foto" className="w-10 h-10 rounded-lg object-cover border border-gray-700 hover:opacity-80" />
                          </a>
                        )}
                        {(g.galleryUrls ?? []).slice(0, 4).map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                            <img src={url} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-700 hover:opacity-80" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {!g.approved && (
                      <button onClick={() => approveGrillmaster(g.id)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                        Aprovar
                      </button>
                    )}
                    {!g.rejected && (
                      <button onClick={() => rejectGrillmaster(g.id)} className="bg-red-700 hover:bg-red-800 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                        Reprovar
                      </button>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-800 pt-3 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-400 whitespace-nowrap">Valor por hora (R$)</label>
                    <input
                      type="number" min={0} step={0.01}
                      value={gmState.pricePerHour}
                      onChange={e => setGmField(g.id, 'pricePerHour', +e.target.value)}
                      className="bg-gray-800 rounded-lg px-3 py-1.5 text-white text-sm w-28"
                    />
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    {g.trainingModules?.length === 4 && (
                      <span className="text-xs text-green-400 font-medium inline-flex items-center gap-1"><CheckIcon size={11} /> Onboarding</span>
                    )}
                    <button
                      onClick={() => markUniformSent(g.id)}
                      disabled={g.uniformSent}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${g.uniformSent ? 'bg-green-500/20 text-green-400 cursor-default' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                    >
                      {g.uniformSent ? (<span className="inline-flex items-center gap-1"><CheckIcon size={11} /> Uniforme enviado</span>) : 'Marcar uniforme enviado'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Aguardando Chancela */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Aguardando Chancela ({awaitingCertification.length})</h2>
        {awaitingCertification.length === 0 && (
          <p className="text-gray-400 text-sm">Nenhum churrasqueiro aprovado aguardando entrevista.</p>
        )}
        <div className="space-y-3">
          {awaitingCertification.map(g => (
            <div key={g.id} className="bg-gray-900 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold">{g.user.name}</p>
                  {g.trainingModules?.length === 4 ? (
                    <Badge tone="green">✓ Onboarding</Badge>
                  ) : (
                    <Badge tone="neutral">Onboarding {g.trainingModules?.length ?? 0}/4</Badge>
                  )}
                </div>
                <p className="text-xs text-gray-400 mb-0.5">{g.user.email}</p>
                {g.user.phone && <p className="text-xs text-gray-400 inline-flex items-center gap-1"><PhoneIcon size={11} /> {g.user.phone}</p>}
              </div>
              <button
                onClick={() => certifyGrillmaster(g.id)}
                disabled={certifyingId === g.id}
                className="shrink-0 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                {certifyingId === g.id ? 'Certificando...' : 'Certificar (pós-entrevista)'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Açougues */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Açougues ({displayedBoutiques.length})</h2>
        {displayedBoutiques.length === 0 && (
          <EmptyState icon={<CashIcon size={22} />} message={showAllPartners ? 'Nenhum açougue cadastrado.' : 'Nenhum açougue aguardando aprovação.'} />
        )}
        <div className="space-y-3">
          {displayedBoutiques.map(b => (
            <div key={b.id} className="bg-gray-900 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-lg">{b.name}</p>
                    {showAllPartners && (
                      b.rejected ? <Badge tone="red">Reprovado</Badge>
                      : b.approved ? <Badge tone="green">Aprovado</Badge>
                      : <Badge tone="yellow">Pendente</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{b.user.name} &middot; {b.user.email}</p>
                  {(b.user.phone || b.phone) && (
                    <p className="text-xs text-gray-400 inline-flex items-center gap-1"><PhoneIcon size={11} /> {b.phone || b.user.phone}</p>
                  )}
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    <Badge tone={b.user.phoneVerified ? 'green' : 'neutral'}>{b.user.phoneVerified ? '✓ WhatsApp verificado' : 'WhatsApp não verificado'}</Badge>
                    {b.pixOwnership === 'mismatch' && <Badge tone="red">⚠ Chave PIX não bate com CPF/CNPJ</Badge>}
                    {b.pixOwnership === 'match' && <Badge tone="green">✓ PIX confere com CPF/CNPJ</Badge>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!b.approved && (
                    <button onClick={() => approveBoutique(b.id)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                      Aprovar
                    </button>
                  )}
                  {!b.rejected && (
                    <button onClick={() => rejectBoutique(b.id)} className="bg-red-700 hover:bg-red-800 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                      Reprovar
                    </button>
                  )}
                </div>
              </div>

              {b.description && <p className="text-sm text-gray-300 mb-2">{b.description}</p>}

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-400 mb-2">
                <span className="inline-flex items-center gap-1"><PinIcon size={11} /> {b.address ? `${b.address}, ` : ''}{b.city}, {b.state}</span>
                {b.instagram && <span className="text-pink-400 inline-flex items-center gap-1"><CameraIcon size={11} /> @{b.instagram}</span>}
                {b.openingHours && <span className="inline-flex items-center gap-1"><ClockIcon size={11} /> {b.openingHours}</span>}
                {b.deliveryOrPickup && <span className="inline-flex items-center gap-1"><CarIcon size={11} /> {b.deliveryOrPickup}</span>}
                {b.pixKey && <span className="inline-flex items-center gap-1"><CashIcon size={11} /> Pix: {b.pixKey}</span>}
              </div>

              {(b.logoUrl || b.facadeUrl || (b.galleryUrls && b.galleryUrls.length > 0)) && (
                <div className="flex gap-1.5 flex-wrap">
                  {b.logoUrl && (
                    <a href={b.logoUrl} target="_blank" rel="noopener noreferrer" title="Logo">
                      <img src={b.logoUrl} alt="logo" className="w-16 h-16 rounded-lg object-cover border border-gray-700 hover:opacity-80" />
                    </a>
                  )}
                  {b.facadeUrl && (
                    <a href={b.facadeUrl} target="_blank" rel="noopener noreferrer" title="Fachada">
                      <img src={b.facadeUrl} alt="fachada" className="w-24 h-16 rounded-lg object-cover border border-gray-700 hover:opacity-80" />
                    </a>
                  )}
                  {(b.galleryUrls ?? []).map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} alt="" className="w-16 h-16 rounded-lg object-cover border border-gray-700 hover:opacity-80" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
