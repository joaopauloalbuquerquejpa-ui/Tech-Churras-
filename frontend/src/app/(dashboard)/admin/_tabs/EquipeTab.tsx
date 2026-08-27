'use client'
import { useEffect, useState } from 'react'
import { API_URL } from '@/lib/api'
import { Badge } from '@/components/admin/ui/Badge'
import { EditIcon, ClockIcon, StarIcon, ChevronRightIcon } from '@/components/icons/Icons'

function getToken() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
}

const TEAM_JOTA_CERT = 'TC-FUNDADOR-001'
const OWN_PROFILE_CERTS = [
  { cert: 'TC-FUNDADOR-001', label: 'Team Jota' },
  { cert: 'TC-CEO-000001', label: 'Jota Albuquerque (CEO)' },
]

interface TeamJota {
  id: string
  bio: string
  experience: number
  pricePerHour: number
  city: string
  state: string
  specialties: string
  available: boolean
  photoUrl: string
  churrascoStyle: string
  bringsEquipment: boolean
  minGuests: number
  maxGuests: number
  instagram: string
  rating: number
  totalOrders: number
  certificationCode: string
  user: { name: string; email: string }
}

interface ScheduleDay {
  id: string
  date: string
  available: boolean
}

export function EquipeTab() {
  const [ownProfiles, setOwnProfiles] = useState<TeamJota[]>([])
  const [selectedOwnCert, setSelectedOwnCert] = useState<string>(TEAM_JOTA_CERT)
  const [teamJota, setTeamJota] = useState<TeamJota | null>(null)
  const [tjSchedule, setTjSchedule] = useState<ScheduleDay[]>([])
  const [tjForm, setTjForm] = useState<Partial<TeamJota>>({})
  const [tjSaving, setTjSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tjScheduleMonth, setTjScheduleMonth] = useState(() => {
    const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }
  })
  const [tjTogglingDay, setTjTogglingDay] = useState<string | null>(null)

  function selectOwnProfile(profile: TeamJota) {
    setTeamJota(profile)
    setSelectedOwnCert(profile.certificationCode)
    setTjForm({
      bio: profile.bio, experience: profile.experience, pricePerHour: profile.pricePerHour,
      specialties: profile.specialties, churrascoStyle: profile.churrascoStyle,
      bringsEquipment: profile.bringsEquipment, minGuests: profile.minGuests, maxGuests: profile.maxGuests,
      instagram: profile.instagram, available: profile.available,
    })
    const h = { Authorization: 'Bearer ' + getToken() }
    fetch(API_URL + '/admin/grillmasters/' + profile.id + '/schedule', { headers: h })
      .then(r => r.ok ? r.json() : [])
      .then(sc => setTjSchedule(Array.isArray(sc) ? sc : []))
      .catch(() => {})
  }

  useEffect(() => {
    const h = { Authorization: 'Bearer ' + getToken() }
    fetch(API_URL + '/admin/grillmasters', { headers: h })
      .then(r => r.ok ? r.json() : [])
      .then(allGms => {
        const gmList = Array.isArray(allGms) ? allGms : (allGms?.data ?? [])
        const own = gmList.filter((g: any) => OWN_PROFILE_CERTS.some(p => p.cert === g.certificationCode))
        setOwnProfiles(own)
        if (own.length > 0) selectOwnProfile(own[0])
      })
      .finally(() => setLoading(false))
  }, [])

  async function saveTjProfile() {
    if (!teamJota) return
    setTjSaving(true)
    try {
      const res = await fetch(API_URL + '/admin/grillmasters/' + teamJota.id + '/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
        body: JSON.stringify(tjForm),
      })
      if (res.ok) {
        const updated = await res.json()
        setTeamJota(prev => prev ? { ...prev, ...updated } : prev)
      }
    } finally { setTjSaving(false) }
  }

  async function toggleTjDay(dateStr: string) {
    if (!teamJota || tjTogglingDay) return
    setTjTogglingDay(dateStr)
    try {
      const res = await fetch(API_URL + '/admin/grillmasters/' + teamJota.id + '/schedule/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
        body: JSON.stringify({ date: dateStr }),
      })
      if (res.ok) {
        const result = await res.json()
        if (result.deleted) {
          setTjSchedule(prev => prev.filter(d => d.date.startsWith(dateStr)))
        } else {
          setTjSchedule(prev => {
            const filtered = prev.filter(d => !d.date.startsWith(dateStr))
            return [...filtered, result]
          })
        }
        const h = { Authorization: 'Bearer ' + getToken() }
        fetch(API_URL + '/admin/grillmasters/' + teamJota.id + '/schedule', { headers: h })
          .then(r => r.ok ? r.json() : [])
          .then(sc => setTjSchedule(Array.isArray(sc) ? sc : []))
      }
    } finally { setTjTogglingDay(null) }
  }

  async function toggleTjAvailable() {
    if (!teamJota) return
    const newVal = !teamJota.available
    const res = await fetch(API_URL + '/admin/grillmasters/' + teamJota.id + '/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
      body: JSON.stringify({ available: newVal }),
    })
    if (res.ok) {
      setTeamJota(prev => prev ? { ...prev, available: newVal } : prev)
      setTjForm(prev => ({ ...prev, available: newVal }))
    }
  }

  if (loading) return <p className="text-gray-500 text-sm">Carregando...</p>

  return (
    <div className="space-y-6">
      {ownProfiles.length > 1 && (
        <div className="flex gap-2">
          {ownProfiles.map(p => (
            <button
              key={p.id}
              onClick={() => selectOwnProfile(p)}
              className={'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ' + (teamJota?.id === p.id ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700')}
            >
              {OWN_PROFILE_CERTS.find(c => c.cert === p.certificationCode)?.label ?? p.user?.name}
            </button>
          ))}
        </div>
      )}
      {!teamJota ? (
        <p className="text-gray-400">Nenhum perfil próprio encontrado (Team Jota / Jota CEO).</p>
      ) : (
        <>
          <div className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <img src={teamJota.photoUrl} alt="Team Jota" className="w-16 h-16 rounded-full object-cover border-2 border-orange-500" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-white text-lg">{teamJota.user?.name}</h2>
                <Badge tone="orange">{teamJota.certificationCode}</Badge>
                <span className="text-xs text-yellow-400 inline-flex items-center gap-1"><StarIcon size={11} filled /> {teamJota.rating.toFixed(1)}</span>
              </div>
              <p className="text-xs text-gray-400">{teamJota.user?.email}</p>
              <p className="text-xs text-gray-500 mt-0.5">{teamJota.city}, {teamJota.state} · {teamJota.totalOrders} pedidos</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={toggleTjAvailable}
                className={'px-4 py-2 rounded-xl font-bold text-sm transition-colors ' + (teamJota.available ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300')}
              >
                {teamJota.available ? 'Online — aceita pedidos' : 'Offline — fora do ar'}
              </button>
              <p className="text-xs text-gray-600">{teamJota.available ? 'Aparece nas buscas' : 'Não aparece nas buscas'}</p>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white inline-flex items-center gap-1.5"><ClockIcon size={15} /> Agenda — dias disponíveis</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTjScheduleMonth(prev => {
                    let m = prev.month - 1; let y = prev.year
                    if (m < 0) { m = 11; y-- }
                    return { year: y, month: m }
                  })}
                  className="text-gray-400 hover:text-white px-2 py-1.5 rounded-lg bg-gray-800 inline-flex items-center"
                ><ChevronRightIcon size={14} className="rotate-180" /></button>
                <span className="text-sm text-gray-300 font-medium w-28 text-center">
                  {new Date(tjScheduleMonth.year, tjScheduleMonth.month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => setTjScheduleMonth(prev => {
                    let m = prev.month + 1; let y = prev.year
                    if (m > 11) { m = 0; y++ }
                    return { year: y, month: m }
                  })}
                  className="text-gray-400 hover:text-white px-2 py-1.5 rounded-lg bg-gray-800 inline-flex items-center"
                ><ChevronRightIcon size={14} /></button>
              </div>
            </div>

            <p className="text-xs text-gray-500 mb-3">Clique em um dia para marcar/desmarcar como disponível. Dias verdes = disponíveis para pedidos.</p>

            {(() => {
              const { year, month } = tjScheduleMonth
              const firstDay = new Date(year, month, 1).getDay()
              const daysInMonth = new Date(year, month + 1, 0).getDate()
              const today = new Date(); today.setHours(0, 0, 0, 0)

              const availableDates = new Set(
                tjSchedule.filter(s => s.available).map(s => s.date.slice(0, 10))
              )

              const cells: (number | null)[] = [
                ...Array(firstDay).fill(null),
                ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
              ]

              return (
                <div>
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                      <div key={d} className="text-center text-xs text-gray-500 font-medium py-1">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {cells.map((day, i) => {
                      if (!day) return <div key={i} />
                      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                      const cellDate = new Date(year, month, day)
                      const isPast = cellDate < today
                      const isAvailable = availableDates.has(dateStr)
                      const isToggling = tjTogglingDay === dateStr

                      return (
                        <button
                          key={i}
                          disabled={isPast || !!tjTogglingDay}
                          onClick={() => toggleTjDay(dateStr)}
                          className={[
                            'rounded-lg py-2 text-sm font-medium transition-all',
                            isPast ? 'text-gray-700 cursor-default' :
                            isToggling ? 'bg-orange-500/40 text-white animate-pulse' :
                            isAvailable ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-900/30' :
                            'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white',
                          ].join(' ')}
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> Disponível</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-800 inline-block" /> Sem dados</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-700 opacity-40 inline-block" /> Passado</span>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="font-semibold text-white mb-4 inline-flex items-center gap-1.5"><EditIcon size={15} /> Editar perfil</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Bio</label>
                <textarea
                  rows={4}
                  value={tjForm.bio ?? ''}
                  onChange={e => setTjForm(p => ({ ...p, bio: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm resize-none focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Especialidades (separadas por vírgula)</label>
                <input
                  value={tjForm.specialties ?? ''}
                  onChange={e => setTjForm(p => ({ ...p, specialties: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Estilo de churrasco</label>
                <input
                  value={tjForm.churrascoStyle ?? ''}
                  onChange={e => setTjForm(p => ({ ...p, churrascoStyle: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Preço/hora (R$)</label>
                  <input type="number" value={tjForm.pricePerHour ?? 0}
                    onChange={e => setTjForm(p => ({ ...p, pricePerHour: +e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Mín. convidados</label>
                  <input type="number" value={tjForm.minGuests ?? 0}
                    onChange={e => setTjForm(p => ({ ...p, minGuests: +e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Máx. convidados</label>
                  <input type="number" value={tjForm.maxGuests ?? 0}
                    onChange={e => setTjForm(p => ({ ...p, maxGuests: +e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Anos de exp.</label>
                  <input type="number" value={tjForm.experience ?? 0}
                    onChange={e => setTjForm(p => ({ ...p, experience: +e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Instagram</label>
                  <input
                    value={tjForm.instagram ?? ''}
                    onChange={e => setTjForm(p => ({ ...p, instagram: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                    placeholder="@techchurras"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2">
                    <input type="checkbox"
                      checked={tjForm.bringsEquipment ?? false}
                      onChange={e => setTjForm(p => ({ ...p, bringsEquipment: e.target.checked }))}
                      className="accent-orange-500 w-4 h-4"
                    />
                    <span className="text-sm text-gray-300">Leva equipamento</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={saveTjProfile}
                  disabled={tjSaving}
                  className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
                >
                  {tjSaving ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
