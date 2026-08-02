'use client'
import { API_URL } from '@/lib/api'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart'
import { CepAddressInput } from '@/components/CepAddressInput'


function getAuthData(): { name: string; token: string } {
  try {
    const raw = localStorage.getItem('auth-storage')
    const state = JSON.parse(raw ?? '{}')?.state ?? {}
    return { name: state.user?.name ?? '', token: state.token ?? '' }
  } catch { return { name: '', token: '' } }
}

function getCustomerName(): string { return getAuthData().name }

const OCCASIONS = [
  { value: 'churrasco em familia', label: 'Churrasco em Família' },
  { value: 'aniversario', label: 'Aniversário' },
  { value: 'confraternizacao empresarial', label: 'Confraternização' },
  { value: 'casamento', label: 'Casamento/Noivado' },
  { value: 'evento corporativo', label: 'Evento Corporativo' },
  { value: 'outro', label: 'Outro' },
]

interface KitItem {
  productId: string
  productName: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
  category?: string
  imageUrl?: string | null
}

function ItemThumb({ item }: { item: KitItem }) {
  const fallback = item.category === 'CARNE' ? '🥩' : item.category === 'ACOMPANHAMENTO' ? '🌿' : '🫙'
  if (item.imageUrl) {
    return (
      <img
        src={item.imageUrl}
        alt={item.productName}
        className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-700"
        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
    )
  }
  return (
    <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center shrink-0 text-lg border border-gray-700">
      {fallback}
    </div>
  )
}

interface KitResult {
  kit: {
    items: KitItem[]
    grillmasterHours: number
    summary: string
    totalProducts: number
    totalGrillmaster: number
    totalKit: number
  }
  boutique: { id: string; name: string; distanceKm: number; logoUrl?: string }
  grillmaster: { id: string; name: string; rating: number; distanceKm: number; photoUrl?: string; pricePerHour: number }
  eventCoords: { lat: number; lng: number }
}

export default function KitPerfeitoPage() {
  const router = useRouter()
  const { setGrillmasterId, setBoutiqueId, setSelectedQty, setEventData } = useCartStore()

  const [form, setForm] = useState({
    eventAddress: '',
    guests: 10,
    occasion: 'churrasco em familia',
    budget: '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<KitResult | null>(null)
  const [error, setError] = useState('')
  const [added, setAdded] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const { token } = getAuthData()
      const res = await fetch(`${API_URL}/ai/kit-perfeito`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
        body: JSON.stringify({
          eventAddress: form.eventAddress,
          guests: Number(form.guests),
          occasion: form.occasion,
          budget: form.budget ? Number(form.budget) : undefined,
          customerName: getCustomerName(),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao montar kit')
      }

      const data: KitResult = await res.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function addToCart() {
    if (!result) return
    setBoutiqueId(result.boutique.id)
    setGrillmasterId(result.grillmaster.id)
    const qty: Record<string, number> = {}
    for (const item of result.kit.items) {
      qty[item.productId] = item.quantity
    }
    setSelectedQty(qty)
    setEventData({
      address: form.eventAddress,
      hours: result.kit.grillmasterHours,
      homens: Math.round(form.guests * 0.5),
      mulheres: Math.round(form.guests * 0.3),
      criancas: Math.round(form.guests * 0.2),
    })
    setAdded(true)
    setTimeout(() => router.push('/menu/novo'), 800)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">✨</div>
        <h1 className="text-3xl font-black text-white mb-2">Kit Perfeito</h1>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Nossa IA monta o churrasco ideal com açougues e churrasqueiros próximos ao seu evento — em segundos.
        </p>
      </div>

      {/* Form — fica montado mesmo durante loading pra CepAddressInput nao perder
          o CEP ja digitado se a chamada da IA falhar (só escondemos com CSS). */}
      {!result && (
        <form onSubmit={handleSubmit} className={'bg-gray-900 rounded-2xl p-6 space-y-5' + (loading ? ' hidden' : '')}>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Endereço do evento
            </label>
            <CepAddressInput
              required
              onAddressChange={addr => setForm({ ...form, eventAddress: addr })}
            />
            <p className="text-xs text-gray-600 mt-1.5">
              Usamos o endereço para encontrar açougues e churrasqueiros próximos.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Convidados</label>
              <input
                type="number"
                value={form.guests}
                onChange={e => setForm({ ...form, guests: Number(e.target.value) })}
                min={1}
                max={500}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Ocasião</label>
              <select
                value={form.occasion}
                onChange={e => setForm({ ...form, occasion: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 text-sm"
              >
                {OCCASIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Orçamento máximo <span className="text-gray-600 font-normal">(opcional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
              <input
                type="number"
                value={form.budget}
                onChange={e => setForm({ ...form, budget: e.target.value })}
                placeholder="1000"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-colors text-sm"
          >
            Montar Kit Perfeito com IA
          </button>

          <p className="text-xs text-gray-600 text-center">
            Selecionamos produtos reais do catálogo dos nossos açougues parceiros.
          </p>
        </form>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-16">
          <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
            <div className="absolute inset-0 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
            <span className="text-3xl">🔥</span>
          </div>
          <p className="text-white font-bold mb-2">Montando seu kit perfeito...</p>
          <p className="text-gray-500 text-sm">Verificando açougues e churrasqueiros próximos ao evento</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* AI summary */}
          <div className="bg-gradient-to-r from-orange-500/20 to-red-600/10 border border-orange-500/30 rounded-2xl p-5 flex items-start gap-3">
            <span className="text-2xl shrink-0">✨</span>
            <div>
              <p className="text-xs font-semibold text-orange-400 uppercase tracking-widest mb-1">Kit montado pela IA</p>
              <p className="text-sm text-gray-300">{result.kit.summary}</p>
            </div>
          </div>

          {/* Boutique + products */}
          <div className="bg-gray-900 rounded-2xl p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Açougue selecionado</p>
            <div className="flex items-center gap-3 mb-5">
              {result.boutique.logoUrl ? (
                <img src={result.boutique.logoUrl} alt="" className="w-10 h-10 rounded-xl object-cover border border-gray-700" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-red-900/40 flex items-center justify-center text-xl">🥩</div>
              )}
              <div>
                <p className="font-bold text-white">{result.boutique.name}</p>
                <p className="text-xs text-gray-500">{result.boutique.distanceKm.toFixed(1)} km do evento</p>
              </div>
            </div>

            {/* Carnes */}
            {result.kit.items.filter(i => i.category === 'CARNE').length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-2">🥩 Cortes de Carne</p>
                <div className="space-y-0">
                  {result.kit.items.filter(i => i.category === 'CARNE').map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 py-2.5 border-b border-gray-800 last:border-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ItemThumb item={item} />
                        <div className="min-w-0">
                          <p className="text-sm text-white font-medium truncate">{item.productName}</p>
                          <p className="text-xs text-gray-500">
                            {item.quantity} {item.unit} × R$ {item.unitPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-orange-400 shrink-0">
                        R$ {item.totalPrice.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Acompanhamentos */}
            {result.kit.items.filter(i => i.category === 'ACOMPANHAMENTO').length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-bold text-green-400 uppercase tracking-widest">🌿 Acompanhamentos</p>
                  <span className="text-xs bg-green-500/15 text-green-400 border border-green-500/25 px-2 py-0.5 rounded-full font-medium">
                    prontos pelo açougue
                  </span>
                </div>
                <div className="bg-green-500/5 border border-green-500/20 rounded-xl overflow-hidden">
                  {result.kit.items.filter(i => i.category === 'ACOMPANHAMENTO').map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 px-3 py-2.5 border-b border-green-500/10 last:border-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ItemThumb item={item} />
                        <div className="min-w-0">
                          <p className="text-sm text-white font-medium truncate">{item.productName}</p>
                          <p className="text-xs text-gray-500">
                            {item.quantity} {item.unit} × R$ {item.unitPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-green-400 shrink-0">
                        R$ {item.totalPrice.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-green-500/70 mt-1.5 pl-1">
                  Churrasqueiro retira tudo em uma visita — zero trabalho extra
                </p>
              </div>
            )}

            {/* Outros (sal, carvão etc) */}
            {result.kit.items.filter(i => i.category !== 'CARNE' && i.category !== 'ACOMPANHAMENTO').length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Outros itens</p>
                <div className="space-y-0">
                  {result.kit.items.filter(i => i.category !== 'CARNE' && i.category !== 'ACOMPANHAMENTO').map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 py-2.5 border-b border-gray-800 last:border-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ItemThumb item={item} />
                        <div className="min-w-0">
                          <p className="text-sm text-white font-medium truncate">{item.productName}</p>
                          <p className="text-xs text-gray-500">
                            {item.quantity} {item.unit} × R$ {item.unitPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-orange-400 shrink-0">
                        R$ {item.totalPrice.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-gray-800">
              <p className="text-sm font-bold text-white">Subtotal produtos</p>
              <p className="text-sm font-bold text-white">
                R$ {result.kit.totalProducts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Grillmaster */}
          <div className="bg-gray-900 rounded-2xl p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Churrasqueiro selecionado</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {result.grillmaster.photoUrl ? (
                  <img src={result.grillmaster.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-orange-900/40 flex items-center justify-center text-xl">👨‍🍳</div>
                )}
                <div>
                  <p className="font-bold text-white">{result.grillmaster.name}</p>
                  <p className="text-xs text-gray-500">
                    ⭐ {result.grillmaster.rating.toFixed(1)} · {result.grillmaster.distanceKm.toFixed(1)} km do evento
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="text-xs text-gray-500">
                  {result.kit.grillmasterHours}h × R$ {result.grillmaster.pricePerHour}
                </p>
                <p className="text-sm font-bold text-orange-400">
                  R$ {result.kit.totalGrillmaster.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="bg-gray-900 rounded-2xl p-5">
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">Produtos</p>
                <p className="text-sm text-white">
                  R$ {result.kit.totalProducts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">Churrasqueiro</p>
                <p className="text-sm text-white">
                  R$ {result.kit.totalGrillmaster.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-gray-800 pt-3">
              <p className="font-bold text-white">Total estimado</p>
              <p className="text-2xl font-black text-orange-400">
                R$ {result.kit.totalKit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <p className="text-xs text-gray-600 mt-2 text-center">
              Valores aproximados baseados no catálogo atual
            </p>
          </div>

          {/* CTA */}
          <div className="flex gap-3">
            <button
              onClick={() => { setResult(null); setError(''); setAdded(false) }}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-3.5 rounded-xl transition-colors text-sm"
            >
              Refazer
            </button>
            <button
              onClick={addToCart}
              disabled={added}
              className={
                'flex-1 font-bold py-3.5 rounded-xl transition-colors text-sm ' +
                (added
                  ? 'bg-green-600 text-white cursor-default'
                  : 'bg-orange-500 hover:bg-orange-600 text-white')
              }
            >
              {added ? '✓ Adicionado! Redirecionando...' : 'Montar este churrasco →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
