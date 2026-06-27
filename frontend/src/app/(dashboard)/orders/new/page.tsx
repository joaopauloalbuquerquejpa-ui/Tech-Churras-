'use client'
import { API_URL } from '@/lib/api'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Events } from '@/lib/analytics'
import { CepAddressInput } from '@/components/CepAddressInput'

function getToken() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
}

interface Product {
  id: string; name: string; description?: string
  price: number; unit: string; category: string
}

interface Kit {
  id: string; boutiqueId: string; name: string; description: string
  price: number; discountPrice?: number; minGuests: number; maxGuests: number; items: string
}

function calculateInsumos(homens: number, mulheres: number, criancas: number) {
  const totalCarne = homens * 350 + mulheres * 300 + criancas * 200
  const totalCarvao = Math.ceil(homens / 5)
  const totalPessoas = homens + mulheres + criancas
  return { totalCarne, totalCarvao, totalPessoas }
}

const STEPS = ['Quando e onde', 'Convidados', 'Churrasqueiro', 'Açougue & Kits']

function Counter({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col items-center gap-3 bg-gray-900 border border-gray-800 rounded-2xl p-4">
      <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 text-xl font-bold text-white transition-colors flex items-center justify-center"
        >−</button>
        <span className="text-3xl font-black text-white w-8 text-center">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 text-xl font-bold text-white transition-colors flex items-center justify-center"
        >+</button>
      </div>
    </div>
  )
}

function NewOrderForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(0)
  const [grillmasters, setGrillmasters] = useState<any[]>([])
  const [recommendedGms, setRecommendedGms] = useState<any[]>([])
  const [loadingRecommended, setLoadingRecommended] = useState(false)
  const [boutiques, setBoutiques] = useState<any[]>([])
  const [boutiqueProducts, setBoutiqueProducts] = useState<Product[]>([])
  const [boutiqueKits, setBoutiqueKits] = useState<Kit[]>([])
  const [selectedKitId, setSelectedKitId] = useState<string | null>(null)
  const [selectedQty, setSelectedQty] = useState<Record<string, number>>({})
  const [selectedGmAccomp, setSelectedGmAccomp] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [stepError, setStepError] = useState('')
  const [form, setForm] = useState({
    grillmasterId: '',
    boutiqueId: '',
    eventDate: '',
    eventAddress: '',
    eventHours: 4,
    homens: 5,
    mulheres: 3,
    criancas: 2,
    notes: '',
  })

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const gmId = searchParams.get('grillmasterId')
    const btqId = searchParams.get('boutiqueId')
    if (gmId) { setForm(prev => ({ ...prev, grillmasterId: gmId })); setStep(2) }
    if (btqId) setForm(prev => ({ ...prev, boutiqueId: btqId }))
  }, [searchParams])

  useEffect(() => {
    const h = { Authorization: 'Bearer ' + getToken() }
    fetch(API_URL + '/grillmasters', { headers: h })
      .then(r => r.json()).then(d => setGrillmasters(Array.isArray(d) ? d : d.grillmasters ?? []))
    fetch(API_URL + '/boutiques', { headers: h })
      .then(r => r.json()).then(d => setBoutiques(Array.isArray(d) ? d : d.boutiques ?? []))
  }, [])

  useEffect(() => {
    if (step !== 2) return
    setLoadingRecommended(true)
    const params = new URLSearchParams()
    if (form.eventDate) params.set('eventDate', form.eventDate)
    if (insumos.totalPessoas > 0) params.set('guests', String(insumos.totalPessoas))
    fetch(API_URL + '/grillmasters/recommended?' + params.toString(), {
      headers: { Authorization: 'Bearer ' + getToken() },
    })
      .then(r => r.json())
      .then(d => setRecommendedGms(Array.isArray(d) ? d : []))
      .catch(() => setRecommendedGms([]))
      .finally(() => setLoadingRecommended(false))
  }, [step])

  useEffect(() => {
    if (!form.grillmasterId) return
    const gm = grillmasters.find(g => g.id === form.grillmasterId)
    if (gm?.defaultBoutiqueId) setForm(prev => ({ ...prev, boutiqueId: gm.defaultBoutiqueId }))
  }, [form.grillmasterId, grillmasters])

  useEffect(() => {
    if (!form.boutiqueId) {
      setBoutiqueProducts([]); setBoutiqueKits([]); setSelectedKitId(null); setSelectedQty({})
      return
    }
    const h = { headers: { Authorization: 'Bearer ' + getToken() } }
    fetch(API_URL + '/boutiques/' + form.boutiqueId, h).then(r => r.json()).then(d => setBoutiqueProducts(d.products || []))
    fetch(API_URL + '/boutiques/' + form.boutiqueId + '/kits', h).then(r => r.json()).then(d => setBoutiqueKits(Array.isArray(d) ? d : []))
  }, [form.boutiqueId])

  const insumos = calculateInsumos(form.homens, form.mulheres, form.criancas)
  const selectedGrillmaster = grillmasters.find(g => g.id === form.grillmasterId)
  const grillmasterCost = selectedGrillmaster ? selectedGrillmaster.pricePerHour * form.eventHours : 0
  const itemsTotal = Object.entries(selectedQty).reduce((sum, [pid, qty]) => {
    const p = boutiqueProducts.find(p => p.id === pid)
    return sum + (p ? p.price * qty : 0)
  }, 0)
  const gmAccompList: { name: string; laborPrice: number }[] = selectedGrillmaster?.accompaniments ?? []
  const accompLaborTotal = selectedGmAccomp.reduce((sum, name) => {
    const a = gmAccompList.find(a => a.name === name)
    return sum + (a?.laborPrice ?? 0)
  }, 0)
  const totalEstimate = grillmasterCost + itemsTotal + accompLaborTotal

  const productsCarnes = boutiqueProducts.filter(p => p.category !== 'ACOMPANHAMENTO')
  const productsAcomp = boutiqueProducts.filter(p => p.category === 'ACOMPANHAMENTO')

  const bestKit = boutiqueKits.find(k => insumos.totalPessoas >= k.minGuests && insumos.totalPessoas <= k.maxGuests)
    ?? (boutiqueKits.length > 0
      ? boutiqueKits.reduce((prev, curr) =>
          Math.abs(curr.minGuests - insumos.totalPessoas) < Math.abs(prev.minGuests - insumos.totalPessoas) ? curr : prev)
      : null)

  useEffect(() => {
    if (bestKit && selectedKitId === null) setSelectedKitId(bestKit.id)
  }, [bestKit?.id])

  function validateStep() {
    setStepError('')
    if (step === 0) {
      if (!form.eventDate) return 'Informe a data do evento'
      if (form.eventDate < today) return 'A data do evento não pode ser no passado'
      if (!form.eventAddress.trim()) return 'Informe o endereço do evento'
    }
    if (step === 1) {
      if (insumos.totalPessoas < 1) return 'Adicione pelo menos 1 convidado'
    }
    if (step === 2) {
      if (!form.grillmasterId) return 'Selecione um churrasqueiro'
    }
    return ''
  }

  function nextStep() {
    const err = validateStep()
    if (err) { setStepError(err); return }
    setStep(s => s + 1)
  }

  async function handleSubmit() {
    setStepError('')
    setLoading(true)
    try {
      const items = Object.entries(selectedQty)
        .filter(([, qty]) => qty > 0)
        .map(([productId, quantity]) => {
          const p = boutiqueProducts.find(p => p.id === productId)!
          return { productId, quantity, unitPrice: p.price }
        })
      const gmAccompaniments = selectedGmAccomp
        .map(name => gmAccompList.find(a => a.name === name))
        .filter(Boolean) as { name: string; laborPrice: number }[]

      const res = await fetch(API_URL + '/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
        body: JSON.stringify({
          grillmasterId: form.grillmasterId,
          boutiqueId: form.boutiqueId || undefined,
          eventDate: form.eventDate,
          eventAddress: form.eventAddress,
          eventHours: form.eventHours,
          guestCount: insumos.totalPessoas,
          notes: form.notes || undefined,
          kitId: selectedKitId || undefined,
          items: items.length > 0 ? items : undefined,
          gmAccompaniments: gmAccompaniments.length > 0 ? gmAccompaniments : undefined,
        }),
      })
      if (res.ok) {
        const order = await res.json()
        Events.orderCreated(insumos.totalPessoas, order.totalPrice, !!form.boutiqueId)
        router.push('/orders/' + order.id + '/payment')
      } else {
        const err = await res.json()
        const msg = typeof err.error === 'string' ? err.error : 'Erro ao criar pedido. Tente novamente.'
        setStepError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 pb-10">
      {/* Progress bar */}
      <div className="pt-6 pb-8">
        <div className="flex items-center gap-1 mb-3">
          {STEPS.map((s, i) => (
            <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-gray-800">
              <div
                className="h-full bg-orange-500 transition-all duration-300"
                style={{ width: i <= step ? '100%' : '0%' }}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500">Passo {step + 1} de {STEPS.length} — <span className="text-gray-300">{STEPS[step]}</span></p>
      </div>

      {/* ───── STEP 0: Quando e onde ───── */}
      {step === 0 && (
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-black text-white">Quando é o churrasco?</h1>
            <p className="text-gray-500 text-sm mt-1">Data, local e duração do evento</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Data do evento *</label>
              <input
                type="date"
                value={form.eventDate}
                min={today}
                onChange={e => setForm({ ...form, eventDate: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 focus:border-orange-500 rounded-xl px-4 py-3 text-white outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Endereço do evento *</label>
              <CepAddressInput
                required
                onAddressChange={addr => setForm({ ...form, eventAddress: addr })}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Duração do serviço
                <span className="ml-2 text-orange-400 font-bold">{form.eventHours}h</span>
              </label>
              <input
                type="range"
                min={2}
                max={12}
                step={1}
                value={form.eventHours}
                onChange={e => setForm({ ...form, eventHours: +e.target.value })}
                className="w-full accent-orange-500"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>2h</span><span>6h</span><span>12h</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───── STEP 1: Convidados ───── */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-black text-white">Quantas pessoas?</h1>
            <p className="text-gray-500 text-sm mt-1">A IA calcula os insumos ideais para o seu churrasco</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Counter label="Homens" value={form.homens} onChange={v => setForm({ ...form, homens: v })} />
            <Counter label="Mulheres" value={form.mulheres} onChange={v => setForm({ ...form, mulheres: v })} />
            <Counter label="Crianças" value={form.criancas} onChange={v => setForm({ ...form, criancas: v })} />
          </div>

          {insumos.totalPessoas > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-5 space-y-3">
              <p className="text-sm font-semibold text-orange-300">Estimativa calculada pela IA</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-2xl font-black text-white">{insumos.totalPessoas}</p>
                  <p className="text-xs text-gray-400">pessoas</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{(insumos.totalCarne / 1000).toFixed(1)}kg</p>
                  <p className="text-xs text-gray-400">de proteína</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{insumos.totalCarvao}</p>
                  <p className="text-xs text-gray-400">{insumos.totalCarvao === 1 ? 'saco' : 'sacos'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───── STEP 2: Churrasqueiro ───── */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-black text-white">Escolha o churrasqueiro</h1>
            <p className="text-gray-500 text-sm mt-1">
              {form.eventDate ? new Date(form.eventDate + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) : ''}
              {' · '}{insumos.totalPessoas} pessoas · {form.eventHours}h
            </p>
          </div>

          {/* Recomendados pela IA */}
          {(loadingRecommended || recommendedGms.length > 0) && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider flex items-center gap-1">
                ✨ Recomendados para você
              </p>
              {loadingRecommended ? (
                <div className="text-center py-4 text-gray-500 text-sm">Analisando disponibilidade...</div>
              ) : (
                recommendedGms.map((gm, idx) => {
                  const isSelected = form.grillmasterId === gm.id
                  const cost = gm.pricePerHour * form.eventHours
                  return (
                    <button
                      key={gm.id}
                      type="button"
                      onClick={() => setForm({ ...form, grillmasterId: gm.id })}
                      className={'w-full text-left rounded-2xl p-4 border-2 transition-all ' + (isSelected
                        ? 'border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/30'
                        : 'border-orange-500/30 bg-orange-500/5 hover:border-orange-500/60')}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative shrink-0">
                          <div className="w-12 h-12 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-lg font-black text-orange-400">
                            {gm.name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center">
                            {idx + 1}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold text-white truncate">{gm.name}</p>
                            {isSelected && <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full shrink-0">✓</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                            {gm.rating > 0 && <span className="flex items-center gap-0.5"><span className="text-yellow-400">★</span>{gm.rating.toFixed(1)}</span>}
                            {gm.reviewCount > 0 && <span>{gm.reviewCount} avaliações</span>}
                            {gm.distanceKm && <span>{gm.distanceKm}km</span>}
                          </div>
                          {gm.reason && (
                            <p className="text-xs text-orange-300/80 mt-1 italic">{gm.reason}</p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">R$ {gm.pricePerHour}/hora</span>
                            <span className="text-sm font-bold text-orange-400">R$ {cost.toFixed(2)} total</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          )}

          {/* Todos os churrasqueiros */}
          {grillmasters.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Buscando churrasqueiros...</div>
          ) : (
            <div className="space-y-3">
              {recommendedGms.length > 0 && (
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Todos os churrasqueiros</p>
              )}
              {grillmasters
                .filter(gm => !recommendedGms.some(r => r.id === gm.id))
                .map(gm => {
                  const isSelected = form.grillmasterId === gm.id
                  const cost = gm.pricePerHour * form.eventHours
                  return (
                    <button
                      key={gm.id}
                      type="button"
                      onClick={() => setForm({ ...form, grillmasterId: gm.id })}
                      className={'w-full text-left rounded-2xl p-4 border transition-all ' + (isSelected
                        ? 'border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/30'
                        : 'border-gray-800 bg-gray-900 hover:border-gray-600')}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0 text-lg font-black text-orange-400">
                          {gm.user?.name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold text-white truncate">{gm.user?.name}</p>
                            {isSelected && (
                              <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full shrink-0">✓</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                            {gm.averageRating > 0 && (
                              <span className="flex items-center gap-1">
                                <span className="text-yellow-400">★</span>
                                {gm.averageRating.toFixed(1)}
                              </span>
                            )}
                            {gm.city && <span>{gm.city}{gm.state ? ', ' + gm.state : ''}</span>}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">R$ {gm.pricePerHour}/hora</span>
                            <span className="text-sm font-bold text-orange-400">R$ {cost.toFixed(2)} total</span>
                          </div>
                        </div>
                      </div>
                      {gm.accompaniments?.length > 0 && (
                        <p className="text-xs text-gray-500 mt-2 pl-15">
                          Faz na hora: {gm.accompaniments.map((a: any) => a.name).join(', ')}
                        </p>
                      )}
                    </button>
                  )
                })}
            </div>
          )}
        </div>
      )}

      {/* ───── STEP 3: Açougue + Kit + Confirmação ───── */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-black text-white">Açougue & kits</h1>
            <p className="text-gray-500 text-sm mt-1">O churrasqueiro busca tudo no açougue no dia do evento</p>
          </div>

          {/* Escolha do açougue */}
          <div>
            <p className="text-sm text-gray-400 mb-2">Açougue parceiro <span className="text-gray-600">(opcional)</span></p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, boutiqueId: '' })}
                className={'w-full text-left rounded-xl px-4 py-3 border text-sm transition-all ' + (!form.boutiqueId
                  ? 'border-orange-500 bg-orange-500/10 text-white'
                  : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-500')}
              >
                Sem açougue parceiro
              </button>
              {boutiques.map(b => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setForm({ ...form, boutiqueId: b.id })}
                  className={'w-full text-left rounded-xl px-4 py-3 border transition-all ' + (form.boutiqueId === b.id
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-gray-700 bg-gray-900 hover:border-gray-500')}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">{b.name}</p>
                    <div className="flex items-center gap-2">
                      <span className={'text-xs px-2 py-0.5 rounded-full ' + (b.open ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-500')}>
                        {b.open ? 'Aberto' : 'Fechado'}
                      </span>
                      {form.boutiqueId === b.id && <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">✓</span>}
                    </div>
                  </div>
                  {b.address && <p className="text-xs text-gray-500 mt-0.5">{b.address}</p>}
                </button>
              ))}
            </div>
          </div>

          {/* Kits */}
          {boutiqueKits.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Kit de churrasco</p>
              <div className="space-y-2">
                {boutiqueKits.map(k => {
                  const isSelected = selectedKitId === k.id
                  const isRecommended = k.id === bestKit?.id
                  return (
                    <button
                      key={k.id}
                      type="button"
                      onClick={() => setSelectedKitId(isSelected ? null : k.id)}
                      className={'w-full text-left rounded-xl p-4 border transition-all ' + (isSelected
                        ? 'border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/30'
                        : 'border-gray-700 bg-gray-900 hover:border-gray-600')}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-sm text-white">{k.name}</p>
                        <div className="flex gap-1.5 shrink-0">
                          {isRecommended && <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">Ideal</span>}
                          {isSelected && <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">✓</span>}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mb-2">{k.description}</p>
                      {(() => {
                        try {
                          const kitProducts: { productName: string; quantity: number; unit: string }[] = JSON.parse(k.items || '[]')
                          if (kitProducts.length > 0) return (
                            <ul className="mb-2 space-y-0.5">
                              {kitProducts.map((p, i) => (
                                <li key={i} className="text-xs text-gray-400 flex items-center gap-1.5">
                                  <span className="w-1 h-1 rounded-full bg-orange-500/60 shrink-0" />
                                  {p.productName} — {p.quantity}{p.unit}
                                </li>
                              ))}
                            </ul>
                          )
                        } catch { /* malformed items */ }
                        return null
                      })()}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">{k.minGuests}–{k.maxGuests} pessoas</span>
                        {k.discountPrice ? (
                          <span>
                            <span className="line-through text-gray-600 mr-1">R$ {k.price.toFixed(2)}</span>
                            <span className="text-orange-400 font-bold">R$ {k.discountPrice.toFixed(2)}</span>
                          </span>
                        ) : (
                          <span className="text-orange-400 font-bold">R$ {k.price.toFixed(2)}</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Produtos avulsos */}
          {productsCarnes.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Produtos avulsos</p>
              <div className="space-y-2">
                {productsCarnes.map(p => {
                  const qty = selectedQty[p.id] || 0
                  return (
                    <div key={p.id} className="flex items-center justify-between gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{p.name}</p>
                        <p className="text-xs text-orange-400">R$ {p.price.toFixed(2)}/{p.unit}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={() => setSelectedQty(prev => ({ ...prev, [p.id]: Math.max(0, (prev[p.id] || 0) - 1) }))}
                          className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-bold transition-colors">−</button>
                        <span className="w-6 text-center text-sm font-bold">{qty}</span>
                        <button type="button" onClick={() => setSelectedQty(prev => ({ ...prev, [p.id]: (prev[p.id] || 0) + 1 }))}
                          className="w-8 h-8 bg-orange-500 hover:bg-orange-600 rounded-lg text-sm font-bold transition-colors">+</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Acompanhamentos */}
          {(productsAcomp.length > 0 || gmAccompList.length > 0) && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Acompanhamentos <span className="text-gray-600">(opcional)</span></p>
              <div className="space-y-2">
                {productsAcomp.map(p => {
                  const qty = selectedQty[p.id] || 0
                  return (
                    <div key={p.id} className="flex items-center justify-between gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{p.name}</p>
                        <p className="text-xs text-gray-500">Pronto do açougue · R$ {p.price.toFixed(2)}/{p.unit}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={() => setSelectedQty(prev => ({ ...prev, [p.id]: Math.max(0, (prev[p.id] || 0) - 1) }))}
                          className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-bold transition-colors">−</button>
                        <span className="w-6 text-center text-sm font-bold">{qty}</span>
                        <button type="button" onClick={() => setSelectedQty(prev => ({ ...prev, [p.id]: (prev[p.id] || 0) + 1 }))}
                          className="w-8 h-8 bg-orange-500 hover:bg-orange-600 rounded-lg text-sm font-bold transition-colors">+</button>
                      </div>
                    </div>
                  )
                })}
                {gmAccompList.map(a => {
                  const selected = selectedGmAccomp.includes(a.name)
                  return (
                    <button key={a.name} type="button"
                      onClick={() => setSelectedGmAccomp(prev => selected ? prev.filter(n => n !== a.name) : [...prev, a.name])}
                      className={'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors text-left ' + (selected ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700 bg-gray-900 hover:border-gray-600')}
                    >
                      <div>
                        <span className="text-sm text-white">{a.name}</span>
                        <p className="text-xs text-gray-500">Feito na hora · você traz os ingredientes</p>
                      </div>
                      <span className={'text-xs font-bold shrink-0 ' + (selected ? 'text-orange-400' : 'text-gray-500')}>
                        {a.laborPrice > 0 ? `+R$ ${a.laborPrice.toFixed(2)}` : 'Incluído'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Observações */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Observações <span className="text-gray-600">(opcional)</span></label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Alergias, preferências, pedidos especiais..."
              className="w-full bg-gray-900 border border-gray-700 focus:border-orange-500 rounded-xl px-4 py-3 text-white placeholder-gray-600 h-24 resize-none outline-none transition-colors"
            />
          </div>

          {/* Resumo do pedido */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-300">Resumo do pedido</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>{selectedGrillmaster?.user?.name} ({form.eventHours}h)</span>
                <span>R$ {grillmasterCost.toFixed(2)}</span>
              </div>
              {itemsTotal > 0 && (
                <div className="flex justify-between text-gray-400">
                  <span>Produtos do açougue</span>
                  <span>R$ {itemsTotal.toFixed(2)}</span>
                </div>
              )}
              {accompLaborTotal > 0 && (
                <div className="flex justify-between text-gray-400">
                  <span>Acomp. mão de obra</span>
                  <span>R$ {accompLaborTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                <span className="font-bold text-white">Total</span>
                <span className="text-xl font-black text-orange-400">R$ {totalEstimate.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Erro */}
      {stepError && (
        <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
          {stepError}
        </div>
      )}

      {/* Botões de navegação */}
      <div className="mt-6 flex gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={() => { setStepError(''); setStep(s => s - 1) }}
            className="flex-1 border border-gray-700 hover:border-gray-500 text-gray-300 font-bold py-4 rounded-2xl transition-colors"
          >
            ← Voltar
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={nextStep}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl transition-colors"
          >
            Próximo →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-colors"
          >
            {loading ? 'Criando pedido...' : 'Ir para pagamento →'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="w-8 h-8 rounded-full border-2 border-gray-700 border-t-orange-500 animate-spin" /></div>}>
      <NewOrderForm />
    </Suspense>
  )
}
