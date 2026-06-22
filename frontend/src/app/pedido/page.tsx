'use client'
import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { API_URL } from '@/lib/api'

interface Boutique { id: string; name: string; city: string; state: string; open: boolean }
interface Product { id: string; name: string; price: number; unit: string; category: string; available: boolean; stockQuantity?: number | null }
interface Grillmaster { id: string; pricePerHour: number; city: string; state: string; rating: number; totalOrders: number; isChancelado: boolean; user: { name: string } }

const CATEGORY_LABELS: Record<string, string> = {
  CARNE: 'Bovinos e Suínos', SAL_TEMPERO: 'Sal e Temperos', CARVAO: 'Carvão',
  ACOMPANHAMENTO: 'Acompanhamentos', BEBIDA: 'Bebidas', OUTRO: 'Outros',
}

const MEAT_BREAKDOWN = [
  { label: 'Carne Nobre', cat: 'CARNE', pct: 0.40 },
  { label: 'Porco e Linguiça', cat: 'CARNE', pct: 0.25 },
  { label: 'Frango', cat: 'CARNE', pct: 0.20 },
  { label: 'Acompanhamentos', cat: 'ACOMPANHAMENTO', pct: 0.15 },
]

function buildSuggested(products: Product[], men: number, women: number, kids: number) {
  const totalKg = (men * 400 + women * 300 + kids * 150) / 1000
  const qty: Record<string, number> = {}
  for (const b of MEAT_BREAKDOWN) {
    const prods = products.filter(p => p.category === b.cat && p.available)
    if (!prods.length) continue
    const kgEach = +(totalKg * b.pct / prods.length).toFixed(1)
    for (const p of prods) qty[p.id] = Math.max(0.5, Math.round(kgEach * 2) / 2)
  }
  return qty
}

function renderStars(r: number) {
  return Array.from({ length: 5 }, (_, i) => i < Math.floor(r) ? '★' : '☆').join('')
}

const STEPS = ['Seu Evento', 'Escolha os Cortes', 'Churrasqueiro', 'Confirmar']

function StepBar({ step }: { step: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        {STEPS.map((s, i) => {
          const n = i + 1
          const done = step > n
          const active = step === n
          return (
            <div key={n} className="flex flex-col items-center gap-1 flex-1">
              <div className={
                'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ' +
                (done ? 'bg-green-500 text-white' : active ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-gray-800 text-gray-500')
              }>{done ? '✓' : n}</div>
              <span className={'text-xs hidden sm:block ' + (active ? 'text-orange-400 font-medium' : done ? 'text-green-400' : 'text-gray-600')}>{s}</span>
            </div>
          )
        })}
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full bg-orange-500 transition-all duration-500 rounded-full" style={{ width: `${((step - 1) / 3) * 100}%` }} />
      </div>
    </div>
  )
}

function PedidoForm() {
  const params = useSearchParams()
  const router = useRouter()
  const boutiqueId = params.get('boutiqueId') ?? ''

  const [boutique, setBoutique] = useState<Boutique | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [grillmasters, setGrillmasters] = useState<Grillmaster[]>([])
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Step 1 — evento
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('12:00')
  const [eventAddress, setEventAddress] = useState('')
  const [eventCep, setEventCep] = useState('')
  const [eventHours, setEventHours] = useState(4)
  const [men, setMen] = useState(5)
  const [women, setWomen] = useState(3)
  const [kids, setKids] = useState(2)

  // Step 2 — carnes
  const [qty, setQty] = useState<Record<string, number>>({})

  // Step 3 — churrasqueiro
  const [selectedGm, setSelectedGm] = useState('')

  // Step 4 — guest
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')

  const totalPeople = men + women + kids
  const totalKg = ((men * 400 + women * 300 + kids * 150) / 1000).toFixed(1)
  const productsCost = products.reduce((s, p) => s + (qty[p.id] || 0) * p.price, 0)
  const gm = grillmasters.find(g => g.id === selectedGm)
  const gmCost = gm ? gm.pricePerHour * eventHours : 0
  const total = productsCost + gmCost
  const categorias = [...new Set(products.map(p => p.category))]

  useEffect(() => {
    if (!boutiqueId) { setLoading(false); return }
    Promise.all([
      fetch(`${API_URL}/boutiques/${boutiqueId}`).then(r => r.ok ? r.json() : null),
      fetch(`${API_URL}/boutiques/${boutiqueId}/products`).then(r => r.json()),
      fetch(`${API_URL}/grillmasters`).then(r => r.json()),
    ]).then(([b, prods, gms]) => {
      setBoutique(b)
      const available = (Array.isArray(prods) ? prods : []).filter((p: Product) => p.available)
      setProducts(available)
      setGrillmasters(Array.isArray(gms) ? gms : gms.grillmasters ?? [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [boutiqueId])

  async function fetchCep(cep: string) {
    if (cep.length !== 8) return
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const d = await r.json()
      if (!d.erro) setEventAddress([d.logradouro, d.bairro, `${d.localidade} - ${d.uf}`].filter(Boolean).join(', '))
    } catch {}
  }

  function applySuggested() {
    setQty(buildSuggested(products, men, women, kids))
  }

  function next() {
    if (step === 1 && (!eventDate || !eventAddress.trim())) { alert('Preencha a data e o endereço do evento'); return }
    if (step === 3 && !selectedGm) { alert('Selecione um churrasqueiro'); return }
    setStep(s => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleConfirm() {
    if (!guestName.trim() || guestName.trim().length < 2) { alert('Digite seu nome completo'); return }
    const phone = guestPhone.replace(/\D/g, '')
    if (phone.length < 10) { alert('Digite um WhatsApp válido com DDD'); return }
    setSubmitting(true)
    try {
      // 1. Create guest account
      const authRes = await fetch(`${API_URL}/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: guestName.trim(), phone }),
      })
      if (!authRes.ok) throw new Error((await authRes.json()).error)
      const { user, token } = await authRes.json()

      // 2. Store in localStorage so dashboard layout recognises the session
      localStorage.setItem('auth-storage', JSON.stringify({ state: { user, token }, version: 0 }))

      // 3. Create order
      const orderItems = products.filter(p => (qty[p.id] || 0) > 0).map(p => ({ productId: p.id, quantity: qty[p.id] }))
      const orderRes = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          grillmasterId: selectedGm,
          boutiqueId: boutiqueId || undefined,
          eventDate: new Date(`${eventDate}T${eventTime}`).toISOString(),
          eventAddress,
          eventHours,
          guestCount: totalPeople || 1,
          items: orderItems.length > 0 ? orderItems : undefined,
        }),
      })
      if (!orderRes.ok) throw new Error((await orderRes.json()).error)
      const order = await orderRes.json()
      router.push(`/orders/${order.id}/payment`)
    } catch (err: any) {
      alert('Erro: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!boutiqueId) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <p className="text-gray-400 text-center">QR Code inválido. Peça ao atendente para escanear novamente.</p>
    </div>
  )

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Carregando cardápio...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <span className="font-black text-lg">Tech <span className="text-orange-500">Churras</span></span>
        {boutique && (
          <span className="text-sm text-gray-400">
            · <span className="text-white font-medium">{boutique.name}</span>
          </span>
        )}
      </div>

      <div className="max-w-lg mx-auto p-4 pb-20">
        <div className="mt-6 mb-2">
          <h1 className="text-xl font-black">Monte seu Churrasco</h1>
          <p className="text-sm text-gray-500">Sem cadastro, sem fila. Paga e aproveita. 🔥</p>
        </div>

        <div className="mt-6">
          <StepBar step={step} />
        </div>

        {/* ── STEP 1: EVENTO ── */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
              <h2 className="font-bold text-base">Quando e onde?</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Data *</label>
                  <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
                    className="w-full bg-gray-800 rounded-xl px-3 py-2.5 text-white text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Horário</label>
                  <input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)}
                    className="w-full bg-gray-800 rounded-xl px-3 py-2.5 text-white text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">CEP (auto-preenche)</label>
                <input type="text" placeholder="00000000" value={eventCep} maxLength={8}
                  onChange={e => { const v = e.target.value.replace(/\D/g, ''); setEventCep(v); if (v.length === 8) fetchCep(v) }}
                  className="w-full bg-gray-800 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Endereço *</label>
                <input type="text" value={eventAddress} onChange={e => setEventAddress(e.target.value)}
                  placeholder="Rua, número, bairro, cidade"
                  className="w-full bg-gray-800 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600" />
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
              <h2 className="font-bold text-base">Quantos convidados?</h2>
              {[
                { label: 'Homens', value: men, set: setMen },
                { label: 'Mulheres', value: women, set: setWomen },
                { label: 'Crianças', value: kids, set: setKids },
              ].map(({ label, value, set }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">{label}</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => set(Math.max(0, value - 1))}
                      className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 font-bold text-lg flex items-center justify-center">−</button>
                    <span className="w-8 text-center font-bold">{value}</span>
                    <button onClick={() => set(value + 1)}
                      className="w-9 h-9 rounded-full bg-orange-500 hover:bg-orange-600 font-bold text-lg flex items-center justify-center">+</button>
                  </div>
                </div>
              ))}
              {totalPeople > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-orange-300">{totalPeople} pessoas → <span className="font-bold">{totalKg} kg de carne</span></span>
                  <span className="text-xs text-gray-500">{eventHours}h de evento</span>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-400">Duração</label>
                  <span className="text-orange-400 font-bold">{eventHours}h</span>
                </div>
                <input type="range" min={2} max={10} value={eventHours} onChange={e => setEventHours(+e.target.value)}
                  className="w-full accent-orange-500" />
                <div className="flex justify-between text-xs text-gray-600 mt-1"><span>2h</span><span>6h</span><span>10h</span></div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: CARNES ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-base">Escolha os Cortes</h2>
                <p className="text-xs text-gray-500">Cardápio do {boutique?.name}</p>
              </div>
              <button onClick={applySuggested}
                className="text-xs bg-orange-500 hover:bg-orange-600 text-white font-bold px-3 py-2 rounded-xl transition-colors whitespace-nowrap">
                ✨ Sugerir quantidades
              </button>
            </div>

            {products.length === 0 ? (
              <div className="bg-gray-900 border border-yellow-500/30 rounded-2xl p-6 text-center">
                <p className="text-yellow-400 font-medium">Açougue atualizando o cardápio</p>
                <p className="text-sm text-gray-400 mt-1">Tente novamente em alguns minutos.</p>
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-5">
                {categorias.map(cat => (
                  <div key={cat}>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">{CATEGORY_LABELS[cat] || cat}</p>
                    <div className="space-y-3">
                      {products.filter(p => p.category === cat).map(p => {
                        const q = qty[p.id] || 0
                        return (
                          <div key={p.id} className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{p.name}</p>
                              <p className="text-xs text-orange-400">R$ {p.price.toFixed(2)}/{p.unit}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button onClick={() => setQty(prev => ({ ...prev, [p.id]: Math.max(0, +((prev[p.id] || 0) - 0.5).toFixed(1)) }))}
                                className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-full font-bold">−</button>
                              <span className="w-10 text-center text-sm font-bold">{q || '0'}</span>
                              <button onClick={() => setQty(prev => ({ ...prev, [p.id]: +((prev[p.id] || 0) + 0.5).toFixed(1) }))}
                                className="w-8 h-8 bg-orange-500 hover:bg-orange-600 rounded-full font-bold">+</button>
                              {q > 0 && <span className="text-xs text-orange-400 w-14 text-right">R${(q * p.price).toFixed(0)}</span>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
                {productsCost > 0 && (
                  <div className="border-t border-gray-700 pt-3 flex justify-between">
                    <span className="text-sm text-gray-400">Subtotal cortes</span>
                    <span className="font-bold text-orange-400">R$ {productsCost.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: CHURRASQUEIRO ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-bold text-base">Escolha o Churrasqueiro</h2>
              <p className="text-xs text-gray-500">Profissionais certificados pela Chancela Jota</p>
            </div>
            {grillmasters.length === 0 && (
              <p className="text-gray-500 text-center py-10">Nenhum churrasqueiro disponível no momento.</p>
            )}
            <div className="space-y-3">
              {grillmasters.map(g => {
                const sel = selectedGm === g.id
                return (
                  <div key={g.id} onClick={() => setSelectedGm(g.id)}
                    className={'bg-gray-900 rounded-2xl p-4 cursor-pointer border-2 transition-all ' +
                      (sel ? 'border-orange-500 shadow-lg shadow-orange-500/20' : 'border-gray-800 hover:border-orange-500/40')}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-800 border-2 border-orange-500/30 flex items-center justify-center font-bold text-orange-400 shrink-0">
                        {g.user.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-white text-sm">{g.user.name}</p>
                          {g.isChancelado && (
                            <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full">Chancelado</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{g.city}, {g.state}</p>
                        <p className="text-xs text-yellow-400">{renderStars(g.rating ?? 0)} <span className="text-gray-500">({g.totalOrders ?? 0} eventos)</span></p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-orange-400 font-bold">R$ {g.pricePerHour.toFixed(0)}</p>
                        <p className="text-gray-600 text-xs">/hora</p>
                      </div>
                    </div>
                    {sel && (
                      <p className="text-xs text-green-400 mt-2 font-medium">✓ Selecionado · {eventHours}h = R$ {(g.pricePerHour * eventHours).toFixed(2)}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── STEP 4: CONFIRMAR ── */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-bold text-base">Quase lá! 🔥</h2>
              <p className="text-xs text-gray-500">Só precisamos do seu nome e WhatsApp</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Seu nome *</label>
                <input type="text" value={guestName} onChange={e => setGuestName(e.target.value)}
                  placeholder="Nome completo"
                  className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">WhatsApp com DDD *</label>
                <input type="tel" value={guestPhone} onChange={e => setGuestPhone(e.target.value)}
                  placeholder="11 99999-9999"
                  className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600" />
              </div>
            </div>

            {/* Resumo */}
            <div className="bg-gray-900 border border-orange-500/20 rounded-2xl p-5 space-y-3 text-sm">
              <p className="font-bold text-white">Resumo do pedido</p>
              {boutique && <div className="flex justify-between text-gray-400"><span>Açougue</span><span className="text-white">{boutique.name}</span></div>}
              {gm && <div className="flex justify-between text-gray-400"><span>Churrasqueiro</span><span className="text-white">{gm.user.name}</span></div>}
              <div className="flex justify-between text-gray-400">
                <span>Evento</span>
                <span className="text-white">{eventDate ? new Date(eventDate + 'T12:00').toLocaleDateString('pt-BR') : '—'} às {eventTime}</span>
              </div>
              <div className="flex justify-between text-gray-400"><span>Convidados</span><span className="text-white">{totalPeople} pessoas</span></div>
              {productsCost > 0 && <div className="flex justify-between text-gray-400"><span>Cortes</span><span className="text-orange-400">R$ {productsCost.toFixed(2)}</span></div>}
              {gmCost > 0 && <div className="flex justify-between text-gray-400"><span>Churrasqueiro ({eventHours}h)</span><span className="text-orange-400">R$ {gmCost.toFixed(2)}</span></div>}
              <div className="border-t border-gray-700 pt-3 flex justify-between items-center">
                <span className="font-bold text-white">Total estimado</span>
                <span className="text-2xl font-black text-orange-400">R$ {total.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-xs text-gray-600 text-center">
              Ao confirmar, criamos seu perfil automaticamente. O preço final é confirmado pelo churrasqueiro antes do pagamento.
            </p>
          </div>
        )}

        {/* ── NAVEGAÇÃO ── */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-800">
          {step > 1 ? (
            <button onClick={() => { setStep(s => s - 1); window.scrollTo({ top: 0 }) }}
              className="px-5 py-3 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 font-medium transition-colors">
              ← Voltar
            </button>
          ) : <div />}
          {step < 4 ? (
            <button onClick={next}
              className="px-8 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all hover:shadow-lg hover:shadow-orange-500/20">
              Próximo →
            </button>
          ) : (
            <button onClick={handleConfirm} disabled={submitting}
              className="px-8 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold transition-all hover:shadow-lg hover:shadow-orange-500/20">
              {submitting ? 'Criando pedido...' : '🔥 Confirmar Churrasco'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PedidoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PedidoForm />
    </Suspense>
  )
}
