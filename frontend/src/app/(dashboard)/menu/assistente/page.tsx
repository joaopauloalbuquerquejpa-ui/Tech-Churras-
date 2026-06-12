'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useCartStore } from '@/store/cart'

const BASE = 'https://tech-churras-production.up.railway.app'

function getToken() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
}

interface AIPlan {
  guestBreakdown: { men: number; women: number; children: number }
  suggestedGrillmasterId: string | null
  suggestedBoutiqueId: string | null
  suggestedProducts: { productId: string; quantity: number }[]
  reasoning: string
  // enriched after fetch
  grillmaster?: any
  boutique?: any
  productDetails?: any[]
}

const EXAMPLES = [
  'Aniversário de 30 anos, 20 adultos e 5 crianças, tem 2 vegetarianos, orçamento até R$ 2.000',
  'Churrasco de família no final de semana, 15 pessoas, maioria homens, sem restrições',
  'Confraternização da empresa, 40 pessoas, orçamento generoso, quero o melhor churrasqueiro',
]

export default function AssistentePage() {
  const router = useRouter()
  const cart = useCartStore()
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<AIPlan | null>(null)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!description.trim()) return
    setLoading(true)
    setError('')
    setPlan(null)

    try {
      const res = await fetch(BASE + '/ai/plan-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
        body: JSON.stringify({ description: description.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao processar solicitação')
        return
      }

      // Enrich with details
      const [gmsRes, boutiquesRes] = await Promise.all([
        fetch(BASE + '/grillmasters', { headers: { Authorization: 'Bearer ' + getToken() } }),
        fetch(BASE + '/boutiques', { headers: { Authorization: 'Bearer ' + getToken() } }),
      ])
      const [gmsData, boutiquesData] = await Promise.all([gmsRes.json(), boutiquesRes.json()])
      const gms = Array.isArray(gmsData) ? gmsData : gmsData.grillmasters ?? []
      const boutiques = Array.isArray(boutiquesData) ? boutiquesData : boutiquesData.boutiques ?? []

      const enriched: AIPlan = { ...data }
      if (data.suggestedGrillmasterId) {
        enriched.grillmaster = gms.find((g: any) => g.id === data.suggestedGrillmasterId)
      }
      if (data.suggestedBoutiqueId) {
        enriched.boutique = boutiques.find((b: any) => b.id === data.suggestedBoutiqueId)
        // Fetch products
        try {
          const pRes = await fetch(BASE + '/boutiques/' + data.suggestedBoutiqueId + '/products')
          const prods = await pRes.json()
          enriched.productDetails = Array.isArray(prods) ? prods : []
        } catch {}
      }
      setPlan(enriched)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function applyPlan() {
    if (!plan) return
    cart.setGrillmasterId(plan.suggestedGrillmasterId || '')
    cart.setBoutiqueId(plan.suggestedBoutiqueId || '')
    const qty: Record<string, number> = {}
    for (const sp of plan.suggestedProducts) {
      qty[sp.productId] = sp.quantity
    }
    cart.setSelectedQty(qty)
    cart.setEventData({
      homens: plan.guestBreakdown.men,
      mulheres: plan.guestBreakdown.women,
      criancas: plan.guestBreakdown.children,
    })
    router.push('/menu/novo?step=2')
  }

  const totalGuests = plan
    ? plan.guestBreakdown.men + plan.guestBreakdown.women + plan.guestBreakdown.children
    : 0

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/menu" className="text-xs text-gray-500 hover:text-gray-400 mb-4 inline-block">← Voltar ao Menu</Link>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">✨</span>
          <h1 className="text-2xl font-black">Assistente de Planejamento com IA</h1>
        </div>
        <p className="text-gray-400 text-sm">Descreva seu evento em linguagem natural e nossa IA monta o churrasco ideal para você.</p>
      </div>

      {/* Input form */}
      {!plan && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block font-medium">Descreva seu evento</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Aniversário de 30 anos, 20 adultos e 5 crianças, tem 2 vegetarianos, orçamento até R$ 2.000"
              className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white h-32 resize-none text-sm placeholder-gray-600 border border-gray-700 focus:border-orange-500 focus:outline-none"
              disabled={loading}
            />
          </div>

          {/* Examples */}
          <div className="space-y-1.5">
            <p className="text-xs text-gray-600">Exemplos:</p>
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => setDescription(ex)}
                className="w-full text-left text-xs text-gray-500 hover:text-gray-300 bg-gray-800/50 hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors"
              >
                "{ex}"
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !description.trim()}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analisando seu evento...
              </>
            ) : (
              <>✨ Montar meu churrasco com IA</>
            )}
          </button>
        </div>
      )}

      {/* Results */}
      {plan && (
        <div className="space-y-4">
          {/* Reasoning */}
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5">✨</span>
              <div>
                <p className="text-sm font-bold text-orange-300 mb-1">Análise da IA</p>
                <p className="text-sm text-orange-200/80">{plan.reasoning}</p>
              </div>
            </div>
          </div>

          {/* Guest breakdown */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">Convidados detectados</p>
            <div className="flex gap-4">
              {[
                { label: 'Homens', value: plan.guestBreakdown.men },
                { label: 'Mulheres', value: plan.guestBreakdown.women },
                { label: 'Crianças', value: plan.guestBreakdown.children },
                { label: 'Total', value: totalGuests, accent: true },
              ].map(g => (
                <div key={g.label} className="flex-1 text-center bg-gray-800 rounded-xl py-3">
                  <p className="text-xs text-gray-500 mb-1">{g.label}</p>
                  <p className={'font-bold ' + (g.accent ? 'text-orange-400 text-lg' : 'text-white')}>{g.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Grillmaster */}
          {plan.grillmaster && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">Churrasqueiro sugerido</p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-800 border border-orange-500/30 flex items-center justify-center shrink-0">
                  {plan.grillmaster.photoUrl ? (
                    <Image src={plan.grillmaster.photoUrl} alt={plan.grillmaster.user.name} width={56} height={56} className="object-cover w-full h-full" />
                  ) : (
                    <span className="font-bold text-orange-400 text-sm">
                      {(plan.grillmaster.user?.name || '??').split(' ').slice(0, 2).map((n: string) => n[0]).join('')}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white">{plan.grillmaster.user?.name}</p>
                  <p className="text-xs text-gray-400">{plan.grillmaster.city}, {plan.grillmaster.state}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-yellow-400 text-xs">{'★'.repeat(Math.round(plan.grillmaster.rating || 0))}</span>
                    {plan.grillmaster.isChancelado && (
                      <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full">Chancelado</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-orange-400 font-bold">R$ {(plan.grillmaster.pricePerHour ?? 0).toFixed(0)}/h</p>
                </div>
              </div>
            </div>
          )}

          {/* Boutique */}
          {plan.boutique && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">Açougue sugerido</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center shrink-0">
                  <span className="text-lg">🥩</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">{plan.boutique.name}</p>
                  <p className="text-xs text-gray-400">{plan.boutique.city}, {plan.boutique.state}</p>
                </div>
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                  {plan.boutique.open ? 'Aberto' : 'Fechado'}
                </span>
              </div>
            </div>
          )}

          {/* Products */}
          {plan.suggestedProducts.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">Produtos sugeridos</p>
              <div className="space-y-2">
                {plan.suggestedProducts.map(sp => {
                  const prod = plan.productDetails?.find((p: any) => p.id === sp.productId)
                  if (!prod) return null
                  return (
                    <div key={sp.productId} className="flex items-center justify-between gap-3 py-2 border-b border-gray-800 last:border-0">
                      <p className="text-sm text-gray-200">{prod.name}</p>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-orange-400">{sp.quantity}{prod.unit}</span>
                        <p className="text-xs text-gray-500">R$ {(sp.quantity * prod.price).toFixed(2)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={applyPlan}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-colors"
            >
              Usar esta sugestão →
            </button>
            <button
              onClick={() => { setPlan(null); setError('') }}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3.5 rounded-xl transition-colors"
            >
              Tentar outra descrição
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
