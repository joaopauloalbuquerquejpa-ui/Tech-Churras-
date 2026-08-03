'use client'
import { API_URL } from '@/lib/api'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Events } from '@/lib/analytics'
import { CepAddressInput } from '@/components/CepAddressInput'
import { useCartStore } from '@/store/cart'

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

// espelha SIDE_DISH_RATE_ACOUGUE / SIDE_DISH_RATE_GRILLMASTER do backend
const SIDE_DISH_RATE_ACOUGUE = 18.50
const SIDE_DISH_RATE_GRILLMASTER = 25.00

// gramas por convidado (pesquisa de mercado — Rei dos Eventos / Cronoshare / Troppo Artesanal)
const SIDE_DISH_ITEMS = [
  { name: 'Arroz', gramsPerPerson: 120 },
  { name: 'Farofa', gramsPerPerson: 70 },
  { name: 'Vinagrete', gramsPerPerson: 50 },
  { name: 'Maionese', gramsPerPerson: 100 },
  { name: 'Salada', gramsPerPerson: 80 },
  { name: 'Chimichurri', gramsPerPerson: 30 },
]

function sideDishBreakdown(guests: number) {
  if (guests <= 0) return SIDE_DISH_ITEMS.map(i => i.name).join(' · ')
  return SIDE_DISH_ITEMS.map(i => `${i.name} ${((i.gramsPerPerson * guests) / 1000).toFixed(1)}kg`).join(' · ')
}

const STEPS = ['Quando e onde', 'Convidados', 'Churrasqueiro', 'Açougue & Kits']

// Faixa de convidados de cada tier de kit do /menu — antes o parâmetro
// ?kit= era só decorativo, o cliente escolhia "Kit Prime" e caía no mesmo
// formulário zerado dos outros, sem nenhum traço da escolha.
const KIT_GUEST_DEFAULTS: Record<string, { homens: number; mulheres: number; criancas: number }> = {
  essential: { homens: 8, mulheres: 5, criancas: 2 }, // ~15 pessoas
  prime: { homens: 16, mulheres: 10, criancas: 4 }, // ~30 pessoas
}

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
  const cart = useCartStore()
  const [step, setStep] = useState(0)
  const [grillmasters, setGrillmasters] = useState<any[]>([])
  const [recommendedGms, setRecommendedGms] = useState<any[]>([])
  const [loadingRecommended, setLoadingRecommended] = useState(false)
  const [boutiques, setBoutiques] = useState<any[]>([])
  const [boutiqueProducts, setBoutiqueProducts] = useState<Product[]>([])
  const [boutiqueKits, setBoutiqueKits] = useState<Kit[]>([])
  const [selectedKitId, setSelectedKitId] = useState<string | null>(null)
  const [selectedQty, setSelectedQty] = useState<Record<string, number>>({})
  const [kitApplyError, setKitApplyError] = useState('')
  const [sideDishChoice, setSideDishChoice] = useState<'' | 'ACOUGUE' | 'GRILLMASTER'>('')
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

  const [today, setToday] = useState('')
  useEffect(() => { setToday(new Date().toISOString().split('T')[0]) }, [])

  useEffect(() => {
    const gmId = searchParams.get('grillmasterId')
    const btqId = searchParams.get('boutiqueId')
    if (gmId) { setForm(prev => ({ ...prev, grillmasterId: gmId })); setStep(2) }
    if (btqId) setForm(prev => ({ ...prev, boutiqueId: btqId }))

    // Preenche com o que já foi montado no Kit Perfeito ou no Assistente IA
    // (guardado no cart store) — sem isso, o cliente clicava em "Montar este
    // churrasco" e caía num wizard zerado, perdendo tudo que a IA já calculou.
    const cameFromAi = cart.grillmasterId || cart.boutiqueId || Object.keys(cart.selectedQty).length > 0
    if (!cameFromAi) {
      const kitDefaults = KIT_GUEST_DEFAULTS[searchParams.get('kit') ?? '']
      if (kitDefaults) setForm(prev => ({ ...prev, ...kitDefaults }))
    }
    if (cameFromAi) {
      setForm(prev => ({
        ...prev,
        grillmasterId: gmId || cart.grillmasterId || prev.grillmasterId,
        boutiqueId: btqId || cart.boutiqueId || prev.boutiqueId,
        eventAddress: cart.eventData.address || prev.eventAddress,
        eventHours: cart.eventData.hours || prev.eventHours,
        homens: cart.eventData.homens || prev.homens,
        mulheres: cart.eventData.mulheres ?? prev.mulheres,
        criancas: cart.eventData.criancas ?? prev.criancas,
      }))
      if (Object.keys(cart.selectedQty).length > 0) {
        setSelectedQty(cart.selectedQty)
        // sentinela: impede o auto-apply do "melhor kit" de sobrescrever a
        // seleção item-a-item que a IA já fez
        setSelectedKitId('__from_ai__')
      }
      if (!gmId && cart.grillmasterId) setStep(s => Math.max(s, 2))
    }
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
    if (gm && !gm.offersSideDishPrep) setSideDishChoice(c => c === 'GRILLMASTER' ? '' : c)
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
  const sideDishFee = sideDishChoice === 'ACOUGUE' ? +(SIDE_DISH_RATE_ACOUGUE * insumos.totalPessoas).toFixed(2)
    : sideDishChoice === 'GRILLMASTER' ? +(SIDE_DISH_RATE_GRILLMASTER * insumos.totalPessoas).toFixed(2)
    : 0
  const serviceFeeEstimate = +((grillmasterCost + itemsTotal + sideDishFee) * 0.06).toFixed(2) // espelha SERVICE_FEE_RATE do backend
  const totalEstimate = grillmasterCost + itemsTotal + sideDishFee + serviceFeeEstimate

  const productsCarnes = boutiqueProducts.filter(p => p.category !== 'ACOMPANHAMENTO')
  const productsAcomp = boutiqueProducts.filter(p => p.category === 'ACOMPANHAMENTO')

  const bestKit = boutiqueKits.find(k => insumos.totalPessoas >= k.minGuests && insumos.totalPessoas <= k.maxGuests)
    ?? (boutiqueKits.length > 0
      ? boutiqueKits.reduce((prev, curr) =>
          Math.abs(curr.minGuests - insumos.totalPessoas) < Math.abs(prev.minGuests - insumos.totalPessoas) ? curr : prev)
      : null)

  // Itens do kit sao calibrados pro teto da faixa (maxGuests) — escala pra
  // quantidade real de convidados, senao a carne fica fixa independente do
  // numero de pessoas do evento.
  function applyKit(kit: Kit) {
    setKitApplyError('')
    let items: { productName?: string; name?: string; quantity?: number; qty?: number; unit: string }[]
    try {
      const parsed = JSON.parse(kit.items)
      if (!Array.isArray(parsed)) throw new Error('formato inesperado')
      items = parsed
    } catch {
      // Dado corrompido (ex: descrição em texto livre em vez de JSON) — avisa
      // em vez de deixar o pedido seguir sem nenhum item de carne em silêncio.
      setKitApplyError('Não conseguimos calcular as quantidades desse kit automaticamente. Selecione os cortes manualmente, ou escolha outro kit.')
      setSelectedKitId(kit.id)
      return
    }
    const scale = insumos.totalPessoas > 0 ? insumos.totalPessoas / kit.maxGuests : 1
    const newQty: Record<string, number> = {}
    let unmatchedCount = 0
    for (const item of items) {
      const itemName = item.productName ?? item.name ?? ''
      const itemQty = item.quantity ?? item.qty ?? 0
      if (!itemName) { unmatchedCount++; continue }
      const match = boutiqueProducts.find(p =>
        p.name.toLowerCase().includes(itemName.toLowerCase()) ||
        itemName.toLowerCase().includes(p.name.toLowerCase())
      )
      if (match) {
        newQty[match.id] = item.unit === 'kg'
          ? Math.round(itemQty * scale * 10) / 10
          : Math.max(1, Math.round(itemQty * scale))
      } else {
        unmatchedCount++
      }
    }
    setSelectedQty(newQty)
    setSelectedKitId(kit.id)
    if (Object.keys(newQty).length === 0) {
      setKitApplyError('Não conseguimos identificar os cortes desse kit no catálogo do açougue. Selecione os cortes manualmente, ou escolha outro kit.')
    } else if (unmatchedCount > 0) {
      setKitApplyError(`${unmatchedCount} item(ns) do kit não foram encontrados no catálogo e ficaram de fora — confira as quantidades antes de continuar.`)
    }
  }

  useEffect(() => {
    if (bestKit && selectedKitId === null) applyKit(bestKit)
  }, [bestKit?.id])

  // Recalcula se o cliente mudar o numero de convidados com um kit ja aplicado
  useEffect(() => {
    if (!selectedKitId) return
    const kit = boutiqueKits.find(k => k.id === selectedKitId)
    if (kit) applyKit(kit)
  }, [insumos.totalPessoas])

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
    // Trava de segurança: já aconteceu de kit com dado corrompido resultar em
    // pedido pago sem NENHUM item de carne indo pro açougue, em silêncio.
    if (boutiqueProducts.length > 0 && Object.values(selectedQty).every(q => !q)) {
      setStepError('Você ainda não selecionou nenhum corte de carne. Escolha um kit ou selecione manualmente antes de continuar.')
      return
    }
    setLoading(true)
    try {
      const items = Object.entries(selectedQty)
        .filter(([, qty]) => qty > 0)
        .map(([productId, quantity]) => {
          const p = boutiqueProducts.find(p => p.id === productId)!
          return { productId, quantity, unitPrice: p.price }
        })
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
          sideDishPreparedBy: sideDishChoice || undefined,
        }),
      })
      if (res.ok) {
        const order = await res.json()
        Events.orderCreated(insumos.totalPessoas, order.totalPrice, !!form.boutiqueId)
        cart.clearCart()
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

      {/* Running total — aparece assim que há custo estimado */}
      {totalEstimate > 0 && (
        <div className="sticky top-16 z-10 -mx-4 px-4 py-2.5 mb-4 bg-gray-950/95 backdrop-blur-sm border-b border-orange-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500 overflow-hidden">
            {grillmasterCost > 0 && <span className="shrink-0">GM R${grillmasterCost.toFixed(0)}</span>}
            {itemsTotal > 0 && <span className="shrink-0">· Carnes R${itemsTotal.toFixed(0)}</span>}
            {sideDishFee > 0 && <span className="shrink-0">· Acomp. R${sideDishFee.toFixed(0)}</span>}
            {serviceFeeEstimate > 0 && <span className="shrink-0">· Taxa R${serviceFeeEstimate.toFixed(0)}</span>}
          </div>
          <span className="text-lg font-black text-orange-400 shrink-0 ml-2">R$ {totalEstimate.toFixed(2)}</span>
        </div>
      )}

      {/* ───── STEP 0: Quando e onde ───── */}
      {step === 0 && (
        <div className="space-y-5">
          <div>
            <h1 className="font-display text-2xl font-black text-white">Quando é o churrasco?</h1>
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
            <h1 className="font-display text-2xl font-black text-white">Quantas pessoas?</h1>
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
            <h1 className="font-display text-2xl font-black text-white">Escolha o churrasqueiro</h1>
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
                          {itemsTotal > 0 && (
                            <p className="text-xs text-gray-600 text-right mt-0.5">
                              {Math.round(cost / itemsTotal * 100)}% do valor das carnes
                            </p>
                          )}
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
                          {itemsTotal > 0 && (
                            <p className="text-xs text-gray-600 text-right mt-0.5">
                              {Math.round(cost / itemsTotal * 100)}% do valor das carnes
                            </p>
                          )}
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
            <h1 className="font-display text-2xl font-black text-white">Açougue & kits</h1>
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
                      onClick={() => {
                        if (isSelected) { setSelectedKitId(null); setSelectedQty({}) }
                        else applyKit(k)
                      }}
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
                          const parsed = JSON.parse(k.items || '[]')
                          const kitProducts: { productName?: string; name?: string; quantity?: number; qty?: number; unit: string }[] = Array.isArray(parsed) ? parsed : []
                          if (kitProducts.length > 0) return (
                            <ul className="mb-2 space-y-0.5">
                              {kitProducts.map((p, i) => (
                                <li key={i} className="text-xs text-gray-400 flex items-center gap-1.5">
                                  <span className="w-1 h-1 rounded-full bg-orange-500/60 shrink-0" />
                                  {p.productName ?? p.name} — {p.quantity ?? p.qty}{p.unit}
                                </li>
                              ))}
                            </ul>
                          )
                        } catch { /* malformed items — o botao ainda mostra o aviso ao selecionar */ }
                        return null
                      })()}
                      {isSelected && kitApplyError && (
                        <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-2 py-1.5 mb-2">{kitApplyError}</p>
                      )}
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

          {/* Acompanhamentos avulsos do açougue (produtos prontos, ex: pão de alho, queijo coalho) */}
          {productsAcomp.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Acompanhamentos do cardápio <span className="text-gray-600">(opcional)</span></p>
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
              </div>
            </div>
          )}

          {/* Quem prepara farofa, arroz, vinagrete, maionese */}
          <div>
            <p className="text-sm text-gray-400 mb-2">Quem prepara os acompanhamentos completos? <span className="text-gray-600">(arroz, farofa, vinagrete, maionese, salada, chimichurri — opcional)</span></p>
            <div className="space-y-2">
              <button type="button" onClick={() => setSideDishChoice(c => c === 'ACOUGUE' ? '' : 'ACOUGUE')}
                className={'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors text-left ' + (sideDishChoice === 'ACOUGUE' ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700 bg-gray-900 hover:border-gray-600')}>
                <div className="min-w-0">
                  <span className="text-sm text-white">Açougue prepara pronto</span>
                  <p className="text-xs text-gray-500">Pronto pra retirar no evento</p>
                  <p className="text-xs text-gray-600 mt-0.5">{sideDishBreakdown(insumos.totalPessoas)}</p>
                </div>
                <span className={'text-xs font-bold shrink-0 ' + (sideDishChoice === 'ACOUGUE' ? 'text-orange-400' : 'text-gray-500')}>R$ {SIDE_DISH_RATE_ACOUGUE.toFixed(2)}/pessoa</span>
              </button>

              {selectedGrillmaster?.offersSideDishPrep && (
                <button type="button" onClick={() => setSideDishChoice(c => c === 'GRILLMASTER' ? '' : 'GRILLMASTER')}
                  className={'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors text-left ' + (sideDishChoice === 'GRILLMASTER' ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700 bg-gray-900 hover:border-gray-600')}>
                  <div className="min-w-0">
                    <span className="text-sm text-white">{selectedGrillmaster.user?.name} prepara no local</span>
                    <p className="text-xs text-gray-500">Fresco, feito na hora do evento</p>
                    <p className="text-xs text-gray-600 mt-0.5">{sideDishBreakdown(insumos.totalPessoas)}</p>
                  </div>
                  <span className={'text-xs font-bold shrink-0 ' + (sideDishChoice === 'GRILLMASTER' ? 'text-orange-400' : 'text-gray-500')}>R$ {SIDE_DISH_RATE_GRILLMASTER.toFixed(2)}/pessoa</span>
                </button>
              )}

              <button type="button" onClick={() => setSideDishChoice('')}
                className={'w-full px-4 py-3 rounded-xl border transition-colors text-left text-sm text-white ' + (sideDishChoice === '' ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700 bg-gray-900 hover:border-gray-600')}>
                Não, eu levo por conta
              </button>
            </div>
          </div>

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
              {sideDishFee > 0 && (
                <div className="flex justify-between text-gray-400">
                  <span>Acompanhamentos ({sideDishChoice === 'ACOUGUE' ? 'açougue' : 'churrasqueiro'})</span>
                  <span>R$ {sideDishFee.toFixed(2)}</span>
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
