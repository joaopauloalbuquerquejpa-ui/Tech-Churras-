'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { useCartStore } from '@/store/cart'

const BASE = 'https://tech-churras-production.up.railway.app'

function getToken() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
}

interface Grillmaster {
  id: string
  bio: string
  experience: number
  pricePerHour: number
  available: boolean
  city: string
  state: string
  rating: number
  totalOrders: number
  approved: boolean
  isChancelado: boolean
  specialties?: string
  user: { name: string; email: string }
}

interface Boutique {
  id: string
  name: string
  city: string
  state: string
  open: boolean
  rating: number
  description?: string
}

interface Product {
  id: string
  name: string
  description?: string
  price: number
  unit: string
  category: string
  available: boolean
  stockQuantity?: number | null
}

interface CouponResult {
  valid: boolean
  reason?: string
  discountAmount?: number
  coupon?: { code: string; discountType: string; discountValue: number }
}

const STEPS = ['Grillmaster', 'Seu Evento', 'Açougue', 'Carnes', 'Confirmar']

const CATEGORY_LABELS: Record<string, string> = {
  CARNE: 'Bovinos e Suínos',
  SAL_TEMPERO: 'Sal e Temperos',
  CARVAO: 'Carvão',
  ACOMPANHAMENTO: 'Acompanhamentos',
  BEBIDA: 'Bebidas',
  OUTRO: 'Outros',
}

function calculateInsumos(homens: number, mulheres: number, criancas: number) {
  const totalCarne = homens * 400 + mulheres * 300 + criancas * 150
  const totalCarvao = Math.ceil(homens / 5) || 0
  const totalPessoas = homens + mulheres + criancas
  return { totalCarne, totalCarvao, totalPessoas }
}

const MEAT_BREAKDOWN = [
  { label: 'Carne Bovina Nobre', productCategory: 'CARNE', pct: 0.40, color: 'text-orange-400' },
  { label: 'Porco e Linguiça',   productCategory: 'CARNE', pct: 0.25, color: 'text-red-400' },
  { label: 'Frango',             productCategory: 'CARNE', pct: 0.20, color: 'text-yellow-400' },
  { label: 'Acompanhamentos',    productCategory: 'ACOMPANHAMENTO', pct: 0.15, color: 'text-green-400' },
]

function calcMeatBreakdown(men: number, women: number, children: number) {
  const totalKg = (men * 400 + women * 300 + children * 150) / 1000
  return {
    totalKg: +totalKg.toFixed(2),
    items: MEAT_BREAKDOWN.map(b => ({ ...b, kg: +(totalKg * b.pct).toFixed(2) })),
  }
}

function buildSuggestedQty(products: Product[], men: number, women: number, children: number): Record<string, number> {
  const totalKg = (men * 400 + women * 300 + children * 150) / 1000
  const qty: Record<string, number> = {}

  for (const b of MEAT_BREAKDOWN) {
    const catProducts = products.filter(p => p.category === b.productCategory && p.available)
    if (catProducts.length === 0) continue
    const kgPerProduct = +(totalKg * b.pct / catProducts.length).toFixed(1)
    for (const p of catProducts) {
      qty[p.id] = Math.max(0.5, Math.round(kgPerProduct * 2) / 2)
    }
  }
  return qty
}

function renderStars(rating: number) {
  const full = Math.floor(rating)
  return Array.from({ length: 5 }, (_, i) => (i < full ? '★' : '☆')).join('')
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        {STEPS.map((s, i) => {
          const n = i + 1
          const done = step > n
          const active = step === n
          return (
            <div key={n} className="flex flex-col items-center gap-1 flex-1">
              <div
                className={
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ' +
                  (done
                    ? 'bg-green-500 text-white'
                    : active
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-gray-800 text-gray-500')
                }
              >
                {done ? '✓' : n}
              </div>
              <span
                className={
                  'text-xs hidden md:block ' +
                  (active ? 'text-orange-400 font-medium' : done ? 'text-green-400' : 'text-gray-600')
                }
              >
                {s}
              </span>
            </div>
          )
        })}
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-orange-500 transition-all duration-500 rounded-full"
          style={{ width: `${((step - 1) / 4) * 100}%` }}
        />
      </div>
    </div>
  )
}

function Counter({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 text-white font-bold text-xl transition-colors flex items-center justify-center"
      >
        −
      </button>
      <span className="w-10 text-center text-xl font-bold text-white">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xl transition-colors flex items-center justify-center"
      >
        +
      </button>
    </div>
  )
}

function GuidedOrderForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const cart = useCartStore()
  const cartLoaded = useRef(false)

  const [step, setStep] = useState(1)
  const [grillmasters, setGrillmasters] = useState<Grillmaster[]>([])
  const [boutiques, setBoutiques] = useState<Boutique[]>([])
  const [boutiqueProducts, setBoutiqueProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(false)

  // Step 1
  const [selectedGrillmasterId, setSelectedGrillmasterId] = useState('')
  const [citySearch, setCitySearch] = useState('')

  // Step 2
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('12:00')
  const [eventAddress, setEventAddress] = useState('')
  const [eventCep, setEventCep] = useState('')
  const [eventHours, setEventHours] = useState(4)
  const [homens, setHomens] = useState(5)
  const [mulheres, setMulheres] = useState(3)
  const [criancas, setCriancas] = useState(2)
  const [savedAddresses, setSavedAddresses] = useState<{
    id: string; label: string; street: string; number: string
    complement?: string; neighborhood: string; city: string; state: string; zipCode: string; isDefault: boolean
  }[]>([])
  const [saveNewAddress, setSaveNewAddress] = useState(false)
  const [newAddressLabel, setNewAddressLabel] = useState('Casa')

  // Step 3
  const [selectedBoutiqueId, setSelectedBoutiqueId] = useState('')

  // Step 4
  const [selectedQty, setSelectedQty] = useState<Record<string, number>>({})
  const [acompanhamentos, setAcompanhamentos] = useState(false)
  const [acompanhamentosText, setAcompanhamentosText] = useState('')

  // Step 5
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [couponResult, setCouponResult] = useState<CouponResult | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)

  // Load from cart on mount (one-time)
  useEffect(() => {
    const c = useCartStore.getState()
    const urlGm = searchParams.get('grillmasterId')
    if (!urlGm && c.grillmasterId) setSelectedGrillmasterId(c.grillmasterId)
    if (c.boutiqueId) setSelectedBoutiqueId(c.boutiqueId)
    if (Object.keys(c.selectedQty).length > 0) setSelectedQty(c.selectedQty)
    if (c.eventData.date) {
      setEventDate(c.eventData.date)
      setEventTime(c.eventData.time || '12:00')
      setEventAddress(c.eventData.address || '')
      setEventCep(c.eventData.cep || '')
      setEventHours(c.eventData.hours || 4)
      setHomens(c.eventData.homens || 5)
      setMulheres(c.eventData.mulheres || 3)
      setCriancas(c.eventData.criancas || 2)
      setAcompanhamentos(c.eventData.acompanhamentos || false)
      setAcompanhamentosText(c.eventData.acompanhamentosText || '')
    }
    if (c.couponCode) setCouponInput(c.couponCode)
    const initialStep = parseInt(searchParams.get('step') || '1', 10)
    if (initialStep > 1 && initialStep <= 5) setStep(initialStep)
    cartLoaded.current = true
  }, [])

  // URL param takes precedence over cart
  useEffect(() => {
    const paramId = searchParams.get('grillmasterId')
    if (paramId) setSelectedGrillmasterId(paramId)
    const urlBoutique = searchParams.get('boutiqueId')
    if (urlBoutique) setSelectedBoutiqueId(urlBoutique)
  }, [searchParams])

  // Auto-skip step 3 when boutique pre-selected via QR balcao URL
  useEffect(() => {
    const urlBoutique = searchParams.get('boutiqueId')
    if (step === 3 && urlBoutique && selectedBoutiqueId === urlBoutique) {
      setStep(4)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [step, selectedBoutiqueId, searchParams])

  // Fetch grillmasters and boutiques
  useEffect(() => {
    const h = { Authorization: 'Bearer ' + getToken() }
    fetch(BASE + '/grillmasters', { headers: h })
      .then(r => r.json())
      .then(d => setGrillmasters(Array.isArray(d) ? d : d.grillmasters ?? []))
      .catch(() => {})
    fetch(BASE + '/boutiques', { headers: h })
      .then(r => r.json())
      .then(d => setBoutiques(Array.isArray(d) ? d : d.boutiques ?? []))
      .catch(() => {})
    fetch(BASE + '/addresses', { headers: h })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setSavedAddresses(d) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedBoutiqueId) { setBoutiqueProducts([]); return }
    setProductsLoading(true)
    setBoutiqueProducts([])
    fetch(BASE + '/boutiques/' + selectedBoutiqueId + '/products')
      .then(r => r.json())
      .then(d => setBoutiqueProducts(Array.isArray(d) ? d : []))
      .catch(() => setBoutiqueProducts([]))
      .finally(() => setProductsLoading(false))
  }, [selectedBoutiqueId])

  function syncToCart() {
    if (!cartLoaded.current) return
    cart.setGrillmasterId(selectedGrillmasterId)
    cart.setBoutiqueId(selectedBoutiqueId)
    cart.setSelectedQty(selectedQty)
    cart.setEventData({
      date: eventDate,
      time: eventTime,
      address: eventAddress,
      cep: eventCep,
      hours: eventHours,
      homens,
      mulheres,
      criancas,
      acompanhamentos,
      acompanhamentosText,
    })
    cart.setCouponCode(couponInput)
  }

  async function fetchCep(cep: string) {
    if (cep.length !== 8) return
    try {
      const res = await fetch('https://viacep.com.br/ws/' + cep + '/json/')
      if (!res.ok) return
      const data = await res.json()
      if (data.erro) return
      setEventAddress(
        [data.logradouro, data.bairro, data.localidade + ' - ' + data.uf]
          .filter(Boolean)
          .join(', ')
      )
    } catch {}
  }

  function applyAddress(id: string) {
    if (id === '') return
    const addr = savedAddresses.find(a => a.id === id)
    if (!addr) return
    const parts = [addr.street + ', ' + addr.number]
    if (addr.complement) parts[0] += ', ' + addr.complement
    if (addr.neighborhood) parts.push(addr.neighborhood)
    parts.push(addr.city + ' - ' + addr.state)
    setEventAddress(parts.join(', '))
    setEventCep(addr.zipCode)
  }

  async function maybeSaveAddress() {
    if (!saveNewAddress || !eventAddress.trim() || !newAddressLabel.trim()) return
    try {
      const parts = eventAddress.split(',').map(s => s.trim())
      await fetch(BASE + '/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
        body: JSON.stringify({
          label: newAddressLabel,
          street: parts[0] || eventAddress,
          number: parts[1] || 's/n',
          complement: parts[2] || '',
          neighborhood: parts[3] || '',
          city: parts[4]?.split('-')[0]?.trim() || '',
          state: parts[4]?.split('-')[1]?.trim() || '',
          zipCode: eventCep,
        }),
      })
    } catch {}
  }

  async function applyCoupon() {
    if (!couponInput.trim()) return
    setCouponLoading(true)
    setCouponResult(null)
    try {
      const res = await fetch(BASE + '/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim(), orderValue: totalEstimate }),
      })
      const data = await res.json()
      setCouponResult(data)
      if (data.valid) cart.setCouponCode(couponInput.trim().toUpperCase())
    } catch {
      setCouponResult({ valid: false, reason: 'Erro ao validar cupom.' })
    } finally {
      setCouponLoading(false)
    }
  }

  function clearCoupon() {
    setCouponInput('')
    setCouponResult(null)
    cart.setCouponCode('')
  }

  function handleClearCart() {
    if (!confirm('Limpar carrinho? Todas as selecoes serao perdidas.')) return
    cart.clearCart()
    setSelectedGrillmasterId('')
    setSelectedBoutiqueId('')
    setSelectedQty({})
    setEventDate('')
    setEventTime('12:00')
    setEventAddress('')
    setEventCep('')
    setEventHours(4)
    setHomens(5)
    setMulheres(3)
    setCriancas(2)
    setAcompanhamentos(false)
    setAcompanhamentosText('')
    setCouponInput('')
    setCouponResult(null)
    setTermsAccepted(false)
    setStep(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const insumos = calculateInsumos(homens, mulheres, criancas)
  const selectedGm = grillmasters.find(g => g.id === selectedGrillmasterId)
  const selectedBoutique = boutiques.find(b => b.id === selectedBoutiqueId)
  const grillmasterCost = selectedGm ? selectedGm.pricePerHour * eventHours : 0

  const productsCost = boutiqueProducts.reduce((sum, p) => {
    return sum + (selectedQty[p.id] || 0) * p.price
  }, 0)

  const totalEstimate = grillmasterCost + productsCost
  const discountAmount = couponResult?.valid ? (couponResult.discountAmount ?? 0) : 0
  const totalWithDiscount = Math.max(0, totalEstimate - discountAmount)

  const filteredGrillmasters = grillmasters.filter(
    g => !citySearch || g.city.toLowerCase().includes(citySearch.toLowerCase())
  )

  const categorias = [...new Set(boutiqueProducts.map(p => p.category))]

  function validate(): boolean {
    if (step === 1 && !selectedGrillmasterId) {
      alert('Selecione um churrasqueiro para continuar')
      return false
    }
    if (step === 2 && (!eventDate || !eventAddress.trim())) {
      alert('Preencha a data e o endereço do evento')
      return false
    }
    if (step === 5 && !termsAccepted) {
      alert('Aceite os termos para confirmar o pedido')
      return false
    }
    return true
  }

  function nextStep() {
    if (!validate()) return
    if (step === 5) { handleSubmit(); return }
    syncToCart()
    setStep(s => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function prevStep() {
    syncToCart()
    setStep(s => s - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function buildNotes() {
    const parts: string[] = []
    const items = boutiqueProducts
      .filter(p => (selectedQty[p.id] || 0) > 0)
      .map(p => p.name + ' ' + selectedQty[p.id] + p.unit)
    if (items.length > 0) parts.push('CORTES: ' + items.join(', '))
    if (acompanhamentos && acompanhamentosText.trim()) {
      parts.push('ACOMPANHAMENTOS: ' + acompanhamentosText.trim())
    }
    return parts.join('\n') || undefined
  }

  async function handleSubmit() {
    setSubmitting(true)
    await maybeSaveAddress()
    try {
      const orderItems = boutiqueProducts
        .filter(p => (selectedQty[p.id] || 0) > 0)
        .map(p => ({ productId: p.id, quantity: selectedQty[p.id] }))

      const body: Record<string, unknown> = {
        grillmasterId: selectedGrillmasterId,
        boutiqueId: selectedBoutiqueId || undefined,
        eventDate: new Date(eventDate + 'T' + (eventTime || '12:00')).toISOString(),
        eventAddress,
        eventHours,
        guestCount: insumos.totalPessoas || 1,
        notes: buildNotes(),
        items: orderItems.length > 0 ? orderItems : undefined,
      }
      if (couponResult?.valid && couponInput) body.couponCode = couponInput.trim().toUpperCase()

      const res = await fetch(BASE + '/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const order = await res.json()
        cart.clearCart()
        router.push('/orders/' + order.id + '/payment')
      } else {
        const err = await res.json()
        alert('Erro: ' + (err.error || 'ao criar pedido'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Monte Seu Churrasco</h1>
        <p className="text-sm text-gray-500 mt-1">Siga os passos para criar o evento perfeito</p>
      </div>

      <StepIndicator step={step} />

      {/* ── STEP 1: GRILLMASTER ── */}
      {step === 1 && (
        <div>
          <h2 className="text-lg font-bold mb-1">Escolha seu Grillmaster</h2>
          <p className="text-sm text-gray-500 mb-4">Profissionais certificados pela Chancela Jota</p>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Filtrar por cidade..."
              value={citySearch}
              onChange={e => setCitySearch(e.target.value)}
              className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm"
            />
          </div>

          {filteredGrillmasters.length === 0 && (
            <p className="text-gray-500 text-center py-10">
              Nenhum churrasqueiro disponível no momento.
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGrillmasters.map(g => {
              const name = g.user?.name ?? 'Churrasqueiro'
              const selected = selectedGrillmasterId === g.id
              const isFounder = ['jota', 'albuquerque', 'joao paulo', 'joão paulo'].some(k =>
                name.toLowerCase().includes(k)
              )
              const specialties = g.specialties
                ? g.specialties.split(',').map(s => s.trim()).filter(Boolean)
                : []

              return (
                <div
                  key={g.id}
                  onClick={() => setSelectedGrillmasterId(g.id)}
                  className={
                    'bg-gray-900 rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-0.5 border-2 ' +
                    (selected
                      ? 'border-orange-500 shadow-lg shadow-orange-500/20'
                      : 'border-gray-800 hover:border-orange-500/40')
                  }
                >
                  <div className="flex gap-3 mb-3">
                    <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-orange-500/30 flex items-center justify-center bg-gray-800">
                      {isFounder ? (
                        <Image
                          src="/jota.jpg"
                          alt={name}
                          width={56}
                          height={56}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <span className="font-bold text-orange-400">{getInitials(name)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-white">{name}</p>
                        {g.isChancelado && (
                          <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                            Chancelado
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {g.city}, {g.state}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-yellow-400 text-xs">{renderStars(g.rating ?? 0)}</span>
                        <span className="text-xs text-gray-500">({g.totalOrders ?? 0})</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-orange-400 font-bold text-lg">
                        R$ {(g.pricePerHour ?? 0).toFixed(0)}
                      </p>
                      <p className="text-gray-600 text-xs">/hora</p>
                    </div>
                  </div>

                  {specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {specialties.slice(0, 3).map(s => (
                        <span
                          key={s}
                          className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{g.bio}</p>

                  <button
                    className={
                      'w-full py-2 rounded-xl text-sm font-bold transition-colors ' +
                      (selected ? 'bg-green-500 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white')
                    }
                  >
                    {selected ? '✓ Selecionado' : 'Selecionar'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── STEP 2: SEU EVENTO ── */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold mb-1">Detalhes do Evento</h2>
            <p className="text-sm text-gray-500">Preencha os dados do seu churrasco</p>
          </div>

          <div className="bg-gray-900 rounded-2xl p-6 space-y-4 border border-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Data do Evento *</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={e => setEventDate(e.target.value)}
                  className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Horário de Início</label>
                <input
                  type="time"
                  value={eventTime}
                  onChange={e => setEventTime(e.target.value)}
                  className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white"
                />
              </div>
            </div>

            {savedAddresses.length > 0 && (
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Usar endereço salvo</label>
                <select
                  defaultValue=""
                  onChange={e => applyAddress(e.target.value)}
                  className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white text-sm"
                >
                  <option value="">— Novo endereço —</option>
                  {savedAddresses.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.label} — {a.street}, {a.number}, {a.city}
                      {a.isDefault ? ' (Padrão)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-sm text-gray-400 mb-1 block">
                CEP (auto-preenche o endereço)
              </label>
              <input
                type="text"
                placeholder="00000000"
                value={eventCep}
                maxLength={8}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 8)
                  setEventCep(v)
                  if (v.length === 8) fetchCep(v)
                }}
                className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Endereço Completo *</label>
              <input
                type="text"
                value={eventAddress}
                onChange={e => setEventAddress(e.target.value)}
                placeholder="Rua, número, bairro, cidade"
                className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500"
              />
            </div>

            {savedAddresses.length === 0 && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveNewAddress}
                    onChange={e => setSaveNewAddress(e.target.checked)}
                    className="w-4 h-4 accent-orange-500"
                  />
                  <span className="text-sm text-gray-400">Salvar este endereço para próximas vezes</span>
                </label>
                {saveNewAddress && (
                  <input
                    value={newAddressLabel}
                    onChange={e => setNewAddressLabel(e.target.value)}
                    placeholder="Rótulo: Casa, Trabalho, Sítio..."
                    className="w-full bg-gray-800 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm"
                  />
                )}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-400">Duração do Evento</label>
                <div className="text-right">
                  <span className="text-orange-400 font-bold text-lg">{eventHours}h</span>
                  {selectedGm && (
                    <p className="text-xs text-gray-500">
                      Grillmaster: R$ {grillmasterCost.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
              <input
                type="range"
                min={2}
                max={12}
                value={eventHours}
                onChange={e => setEventHours(+e.target.value)}
                className="w-full accent-orange-500"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>2h</span>
                <span>6h</span>
                <span>12h</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h3 className="font-bold mb-4">Convidados</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Homens', value: homens, set: setHomens },
                { label: 'Mulheres', value: mulheres, set: setMulheres },
                { label: 'Crianças', value: criancas, set: setCriancas },
              ].map(({ label, value, set }) => (
                <div key={label} className="text-center">
                  <p className="text-sm text-gray-400 mb-3">{label}</p>
                  <Counter value={value} onChange={set} />
                </div>
              ))}
            </div>

            {insumos.totalPessoas > 0 && (() => {
              const breakdown = calcMeatBreakdown(homens, mulheres, criancas)
              return (
                <div className="bg-gray-800 border border-orange-500/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold text-white">Sugestão de quantidade de carne</p>
                    <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-medium">
                      {insumos.totalPessoas} convidados · {breakdown.totalKg} kg total
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Baseado em médias de mercado para churrasco brasileiro</p>
                  <div className="grid grid-cols-2 gap-2">
                    {breakdown.items.map(item => (
                      <div key={item.label} className="bg-gray-900/60 rounded-lg px-3 py-2">
                        <p className="text-xs text-gray-400">{item.label}</p>
                        <p className={'text-sm font-bold ' + item.color}>{item.kg} kg</p>
                        <div className="mt-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500/50 rounded-full" style={{ width: (item.pct * 100) + '%' }} />
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">{Math.round(item.pct * 100)}%</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-700">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Carvão</p>
                      <p className="font-bold text-white text-sm">{insumos.totalCarvao} {insumos.totalCarvao === 1 ? 'saco' : 'sacos'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Total pessoas</p>
                      <p className="font-bold text-orange-400 text-sm">{insumos.totalPessoas}</p>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* ── STEP 3: AÇOUGUE ── */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold mb-1">Escolha o Açougue</h2>
            <p className="text-sm text-gray-500">
              O Grillmaster retirará os insumos neste açougue. Você verá os preços reais dos
              produtos na próxima etapa.
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedBoutiqueId('')
              setStep(4)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="text-xs text-gray-500 hover:text-gray-300 underline underline-offset-2"
          >
            Continuar sem açougue parceiro
          </button>

          {boutiques.length === 0 && (
            <p className="text-gray-500 text-center py-10">
              Nenhum açougue disponível no momento.
            </p>
          )}

          <div className="space-y-3">
            {boutiques.map(b => {
              const selected = selectedBoutiqueId === b.id
              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBoutiqueId(b.id)}
                  className={
                    'bg-gray-900 rounded-2xl p-5 cursor-pointer transition-all border-2 ' +
                    (selected
                      ? 'border-orange-500 shadow-lg shadow-orange-500/10'
                      : 'border-gray-800 hover:border-orange-500/40')
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-white">{b.name}</p>
                        <span
                          className={
                            'text-xs px-2 py-0.5 rounded-full font-medium ' +
                            (b.open
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400')
                          }
                        >
                          {b.open ? 'Aberto' : 'Fechado'}
                        </span>
                        {selected && (
                          <span className="text-xs text-green-400 font-medium">✓ Selecionado</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {b.city}, {b.state}
                      </p>
                      {b.description && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{b.description}</p>
                      )}
                    </div>
                    {b.rating > 0 && (
                      <div className="text-right shrink-0">
                        <p className="text-yellow-400 text-sm">{renderStars(b.rating)}</p>
                        <p className="text-xs text-gray-500">{b.rating.toFixed(1)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── STEP 4: CARNES ── */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold mb-1">Escolha os Cortes</h2>
            <p className="text-sm text-gray-500">
              {selectedBoutique
                ? 'Preços reais do ' + selectedBoutique.name
                : 'Nenhum açougue selecionado — você pode voltar e escolher'}
            </p>
          </div>

          {productsLoading && (
            <p className="text-gray-400 text-center py-10">Carregando produtos do açougue...</p>
          )}

          {!productsLoading && selectedBoutiqueId && boutiqueProducts.length === 0 && (
            <div className="bg-gray-900 border border-yellow-500/30 rounded-2xl p-6 text-center">
              <p className="text-yellow-400 font-medium mb-1">
                Açougue sem produtos cadastrados
              </p>
              <p className="text-sm text-gray-400">
                Este açougue ainda está cadastrando seus produtos. Escolha outro ou entre em
                contato.
              </p>
              <button
                onClick={() => {
                  setStep(3)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="mt-4 text-sm text-orange-400 hover:text-orange-300 underline"
              >
                Voltar e escolher outro açougue
              </button>
            </div>
          )}

          {!productsLoading && !selectedBoutiqueId && (
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 text-center">
              <p className="text-gray-400 mb-3">
                Você optou por não vincular um açougue a este pedido.
              </p>
              <button
                onClick={() => {
                  setStep(3)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="text-sm text-orange-400 hover:text-orange-300 underline"
              >
                Selecionar açougue
              </button>
            </div>
          )}

          {!productsLoading && boutiqueProducts.length > 0 && insumos.totalPessoas > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-orange-300">Calculadora de carne</p>
                <p className="text-xs text-orange-400/70">
                  Para {insumos.totalPessoas} convidados sugerimos {calcMeatBreakdown(homens, mulheres, criancas).totalKg} kg no total
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQty(buildSuggestedQty(boutiqueProducts, homens, mulheres, criancas))}
                className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
              >
                Aplicar sugestão
              </button>
            </div>
          )}

          {!productsLoading && boutiqueProducts.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-6">
              {categorias.map(cat => (
                <div key={cat}>
                  <p className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wide">
                    {CATEGORY_LABELS[cat] || cat}
                  </p>
                  <div className="space-y-3">
                    {boutiqueProducts
                      .filter(p => p.category === cat)
                      .map(p => {
                        const qty = selectedQty[p.id] || 0
                        return (
                          <div
                            key={p.id}
                            className="flex items-center justify-between gap-3"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-medium text-white">{p.name}</p>
                                {p.stockQuantity === 0 && (
                                  <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-medium">
                                    Esgotado
                                  </span>
                                )}
                                {p.stockQuantity != null && p.stockQuantity > 0 && p.stockQuantity <= 5 && (
                                  <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full font-medium">
                                    Ultimas unidades
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-orange-400">
                                R$ {p.price.toFixed(2)}/{p.unit}
                                <span className="text-gray-500 ml-1">
                                  ({selectedBoutique?.name})
                                </span>
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedQty(prev => ({
                                    ...prev,
                                    [p.id]: Math.max(0, +((prev[p.id] || 0) - 0.5).toFixed(1)),
                                  }))
                                }
                                className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-full text-white font-bold"
                              >
                                −
                              </button>
                              <span className="w-10 text-center text-sm font-bold">
                                {qty || '0'}
                              </span>
                              <button
                                type="button"
                                disabled={p.stockQuantity === 0}
                                onClick={() =>
                                  setSelectedQty(prev => ({
                                    ...prev,
                                    [p.id]: +((prev[p.id] || 0) + 0.5).toFixed(1),
                                  }))
                                }
                                className="w-8 h-8 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-full text-white font-bold"
                              >
                                +
                              </button>
                              {qty > 0 && (
                                <span className="text-xs text-orange-400 w-16 text-right">
                                  R$ {(qty * p.price).toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              ))}

              {productsCost > 0 && (
                <div className="border-t border-gray-700 pt-4 flex justify-between items-center">
                  <span className="text-sm text-gray-400">Subtotal cortes</span>
                  <span className="font-bold text-orange-400">R$ {productsCost.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Acompanhamentos toggle */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setAcompanhamentos(v => !v)}
                className={
                  'relative w-12 h-6 rounded-full transition-colors shrink-0 ' +
                  (acompanhamentos ? 'bg-orange-500' : 'bg-gray-700')
                }
              >
                <span
                  className={
                    'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ' +
                    (acompanhamentos ? 'translate-x-6' : 'translate-x-0')
                  }
                />
              </button>
              <div>
                <p className="text-sm font-medium text-white">
                  Grillmaster prepara acompanhamentos no local?
                </p>
                <p className="text-xs text-gray-500">
                  Liste os ingredientes que você vai providenciar
                </p>
              </div>
            </div>
            {acompanhamentos && (
              <textarea
                value={acompanhamentosText}
                onChange={e => setAcompanhamentosText(e.target.value)}
                placeholder="Ex: vinagrete pronto, pão de alho congelado, farofa..."
                className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white h-24 resize-none mt-4 text-sm placeholder-gray-600"
              />
            )}
          </div>
        </div>
      )}

      {/* ── STEP 5: CONFIRMAR ── */}
      {step === 5 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold mb-1">Confirme seu Pedido</h2>
              <p className="text-sm text-gray-500">Revise os detalhes antes de finalizar</p>
            </div>
            <button
              onClick={handleClearCart}
              className="text-xs text-gray-500 hover:text-red-400 border border-gray-700 hover:border-red-500/40 px-3 py-1.5 rounded-lg transition-colors"
            >
              Limpar carrinho
            </button>
          </div>

          <div className="space-y-3">
            {selectedGm && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-orange-500/30 flex items-center justify-center bg-gray-800">
                  {['jota', 'albuquerque'].some(k =>
                    (selectedGm.user?.name || '').toLowerCase().includes(k)
                  ) ? (
                    <Image
                      src="/jota.jpg"
                      alt={selectedGm.user.name}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="font-bold text-orange-400 text-sm">
                      {getInitials(selectedGm.user.name)}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">{selectedGm.user.name}</p>
                  <p className="text-xs text-gray-400">
                    {selectedGm.city} &middot; {eventHours}h de serviço
                  </p>
                </div>
                <p className="text-orange-400 font-bold">R$ {grillmasterCost.toFixed(2)}</p>
              </div>
            )}

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">
                Evento
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500">Data</p>
                  <p className="text-white">
                    {eventDate
                      ? new Date(eventDate + 'T12:00').toLocaleDateString('pt-BR')
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Horário</p>
                  <p className="text-white">{eventTime || '—'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Endereço</p>
                  <p className="text-white">{eventAddress || '—'}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">
                Convidados
              </p>
              <div className="flex gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Homens</p>
                  <p className="text-white font-bold">{homens}</p>
                </div>
                <div>
                  <p className="text-gray-500">Mulheres</p>
                  <p className="text-white font-bold">{mulheres}</p>
                </div>
                <div>
                  <p className="text-gray-500">Crianças</p>
                  <p className="text-white font-bold">{criancas}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total</p>
                  <p className="text-orange-400 font-bold">{insumos.totalPessoas}</p>
                </div>
              </div>
            </div>

            {selectedBoutique && boutiqueProducts.some(p => (selectedQty[p.id] || 0) > 0) && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">
                  Cortes — {selectedBoutique.name}
                </p>
                <div className="space-y-2">
                  {boutiqueProducts
                    .filter(p => (selectedQty[p.id] || 0) > 0)
                    .map(p => (
                      <div key={p.id} className="flex justify-between text-sm">
                        <span className="text-gray-300">
                          {p.name} &times; {selectedQty[p.id]}{p.unit}
                        </span>
                        <span className="text-orange-400">
                          R$ {(selectedQty[p.id] * p.price).toFixed(2)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {selectedBoutique && !boutiqueProducts.some(p => (selectedQty[p.id] || 0) > 0) && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Açougue Parceiro</p>
                  <p className="text-white font-semibold">{selectedBoutique.name}</p>
                  <p className="text-xs text-gray-400">{selectedBoutique.city}</p>
                </div>
              </div>
            )}

            {/* Cupom */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">
                Cupom de Desconto
              </p>
              {couponResult?.valid ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-orange-400">{couponResult.coupon?.code ?? couponInput.toUpperCase()}</span>
                    <span className="text-xs text-green-400">
                      — {couponResult.coupon?.discountType === 'PERCENT'
                        ? `${couponResult.coupon.discountValue}% de desconto`
                        : `R$ ${couponResult.coupon?.discountValue?.toFixed(2)} de desconto`}
                    </span>
                  </div>
                  <button onClick={clearCoupon} className="text-xs text-gray-500 hover:text-red-400 transition-colors">
                    Remover
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponResult(null) }}
                      placeholder="BEMVINDO10"
                      className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 font-mono uppercase"
                    />
                    <button
                      onClick={applyCoupon}
                      disabled={couponLoading || !couponInput.trim()}
                      className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      {couponLoading ? '...' : 'Aplicar'}
                    </button>
                  </div>
                  {couponResult && !couponResult.valid && (
                    <p className="text-xs text-red-400">{couponResult.reason}</p>
                  )}
                </div>
              )}
            </div>

            {/* Total */}
            <div className="bg-gray-900 border border-orange-500/20 rounded-2xl p-5">
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Mão de obra (Grillmaster {eventHours}h)</span>
                  <span>R$ {grillmasterCost.toFixed(2)}</span>
                </div>
                {productsCost > 0 && (
                  <div className="flex justify-between text-gray-400">
                    <span>
                      Insumos
                      {selectedBoutique ? ' — ' + selectedBoutique.name : ''}
                    </span>
                    <span>R$ {productsCost.toFixed(2)}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Desconto ({couponResult?.coupon?.code ?? couponInput.toUpperCase()})</span>
                    <span>− R$ {discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-gray-700 pt-2 flex justify-between items-center">
                  <span className="font-bold text-white">Total estimado</span>
                  <div className="text-right">
                    {discountAmount > 0 && (
                      <p className="text-xs text-gray-500 line-through">R$ {totalEstimate.toFixed(2)}</p>
                    )}
                    <span className="text-2xl font-black text-orange-400">
                      R$ {totalWithDiscount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-3 text-xs text-gray-500 space-y-1">
                <p>✓ Preço final confirmado após contato com o Grillmaster</p>
                <p>✓ Sem custos ocultos — você aprova antes de pagar</p>
                {selectedBoutique && (
                  <p>
                    ✓ Preços dos insumos fornecidos pelo {selectedBoutique.name}
                  </p>
                )}
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer bg-gray-900 border border-gray-800 rounded-xl p-4">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={e => setTermsAccepted(e.target.checked)}
                className="accent-orange-500 w-4 h-4 mt-0.5 shrink-0"
              />
              <span className="text-sm text-gray-400">
                Li e aceito os{' '}
                <span className="text-orange-400">termos do serviço</span> e entendo que o
                preço final será confirmado pelo Grillmaster antes do evento.
              </span>
            </label>
          </div>
        </div>
      )}

      {/* ── NAVEGAÇÃO ── */}
      <div className="flex justify-between mt-8 pt-6 border-t border-gray-800">
        {step > 1 ? (
          <button
            onClick={prevStep}
            className="px-6 py-3 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 font-medium transition-colors"
          >
            Voltar e Editar
          </button>
        ) : (
          <div />
        )}
        <button
          onClick={nextStep}
          disabled={submitting}
          className="px-8 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold transition-all hover:shadow-lg hover:shadow-orange-500/20"
        >
          {submitting ? 'Enviando...' : step === 5 ? 'Confirmar Meu Churrasco' : 'Próximo →'}
        </button>
      </div>
    </div>
  )
}

export default function MenuNovoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-64 text-gray-400">
          Carregando...
        </div>
      }
    >
      <GuidedOrderForm />
    </Suspense>
  )
}
