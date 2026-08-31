'use client'
import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { API_URL } from '@/lib/api'
import GarantiaSelo from '@/components/GarantiaSelo'
import { CheckIcon, FlameIcon, MeatIcon, StarIcon } from '@/components/icons/Icons'
import { SERVICE_FEE_RATE, SIDE_DISH_RATE_ACOUGUE, SIDE_DISH_RATE_GRILLMASTER, AUXILIAR_GUEST_THRESHOLD, AUXILIAR_HOURLY_RATE, calcAuxiliaresNeeded, calcLaborPriceModifier } from '@/lib/pricing'
import { useCartStore } from '@/store/cart'

interface Boutique { id: string; name: string; city: string; state: string; open: boolean; offersSideDishPrep?: boolean }
interface Product { id: string; name: string; price: number; unit: string; category: string; available: boolean; stockQuantity?: number | null; imageUrl?: string | null; description?: string | null }
interface Grillmaster { id: string; pricePerHour: number; city: string; state: string; rating: number; totalOrders: number; isChancelado: boolean; offersSideDishPrep?: boolean; bringsAuxiliar?: boolean; unlimitedAvailability?: boolean; photoUrl?: string | null; user: { name: string } }
interface KitItem { productName?: string; name?: string; quantity?: number; qty?: number; unit: string }
interface Kit { id: string; name: string; description: string; price: number; discountPrice?: number | null; minGuests: number; maxGuests: number; items: string }
interface RecommendedGm {
  id: string; name: string; rating: number; pricePerHour: number
  photoUrl?: string | null; city?: string; specialties?: string
  experience?: number; reviewCount: number; distanceKm: number | null; reason: string
}

const CATEGORY_LABELS: Record<string, string> = {
  CARNE: 'Bovinos e Suínos', SAL_TEMPERO: 'Sal e Temperos', CARVAO: 'Carvão',
  ACOMPANHAMENTO: 'Acompanhamentos', BEBIDA: 'Bebidas', OUTRO: 'Outros',
}

// Passo de ajuste do +/- depende da unidade — corte vendido por kg aceita
// meio quilo, mas hambúrguer, pão de alho etc. só existem em unidade inteira.
function qtyStep(unit: string): number {
  return unit === 'un' ? 1 : 0.5
}

// Divide a proteína total necessária em partes iguais só entre os cortes por
// kg que o cliente escolheu — item por unidade (hambúrguer, pão de alho) não
// compete pelo mesmo "pote" de kg, ganha 1 unidade por convidado como ponto
// de partida. Nada é pré-selecionado antes disso: cliente escolhe primeiro
// quais itens quer, a quantidade só é sugerida depois, e continua editável
// por item com os botões +/-.
function rebalanceSelected(selectedIds: string[], products: Product[], men: number, women: number, kids: number): Record<string, number> {
  if (selectedIds.length === 0) return {}
  const totalPeople = men + women + kids
  const totalKg = (men * 350 + women * 300 + kids * 200) / 1000
  const unitById = new Map(products.map(p => [p.id, p.unit]))
  const kgIds = selectedIds.filter(id => unitById.get(id) !== 'un')
  const unIds = selectedIds.filter(id => unitById.get(id) === 'un')

  const result: Record<string, number> = {}
  if (kgIds.length > 0) {
    const kgEach = Math.max(0.5, Math.round((totalKg / kgIds.length) * 2) / 2)
    for (const id of kgIds) result[id] = kgEach
  }
  for (const id of unIds) result[id] = Math.max(1, totalPeople || 1)
  return result
}

function renderStars(r: number) {
  return Array.from({ length: 5 }, (_, i) => i < Math.floor(r) ? '★' : '☆').join('')
}

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

const STEPS = ['Seu Evento', 'Escolha os Cortes', 'Churrasqueiro', 'Confirmar']

// Faixa de convidados de cada tier de kit do /menu — sem isso o parâmetro
// ?kit= era só decorativo e o cliente caía num formulário zerado.
const KIT_GUEST_DEFAULTS: Record<string, { men: number; women: number; kids: number }> = {
  essential: { men: 8, women: 5, kids: 2 }, // ~15 pessoas
  prime: { men: 16, women: 10, kids: 4 }, // ~30 pessoas
}

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
              }>{done ? <CheckIcon size={16} /> : n}</div>
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
  const cart = useCartStore()
  const boutiqueId = params.get('boutiqueId') ?? ''
  const preselectGmId = params.get('grillmasterId') ?? ''
  // Veio do Kit Perfeito ou do Assistente IA — carrinho já tem açougue/GM/
  // itens prontos. Sem isso, o cliente montava o kit com a IA, clicava em
  // "Montar este churrasco" e caía num wizard zerado — o bug mais caro
  // possível, porque acontece exatamente no clique que fecha a venda.
  const cameFromAi = !!(cart.grillmasterId || cart.boutiqueId || Object.keys(cart.selectedQty).length > 0)

  const [boutique, setBoutique] = useState<Boutique | null>(null)
  const [allBoutiques, setAllBoutiques] = useState<Boutique[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [kits, setKits] = useState<Kit[]>([])
  const [selectedKit, setSelectedKit] = useState<string | null>(null)
  const [kitApplyError, setKitApplyError] = useState('')
  const [grillmasters, setGrillmasters] = useState<Grillmaster[]>([])
  const [recommendedGms, setRecommendedGms] = useState<RecommendedGm[]>([])
  const [loadingRecommended, setLoadingRecommended] = useState(false)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // Step 1 — evento
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('12:00')
  const [eventAddress, setEventAddress] = useState('')
  const [eventComplement, setEventComplement] = useState('')
  const [eventCep, setEventCep] = useState('')
  const [eventHours, setEventHours] = useState(4)
  const [men, setMen] = useState(5)
  const [women, setWomen] = useState(3)
  const [kids, setKids] = useState(2)
  const [guestDetailMode, setGuestDetailMode] = useState(false)

  // Distribui um total único em homens/mulheres/crianças (proporção do
  // padrão 5/3/2) — usado pelo campo simples "Total de convidados", pra
  // não obrigar todo mundo a preencher 3 contadores separados de cara.
  // Quem quer precisão por perfil ainda pode abrir "Ajustar por perfil".
  function setTotalGuests(total: number) {
    const t = Math.max(0, total)
    const kidsN = Math.round(t * 0.2)
    const womenN = Math.round(t * 0.3)
    const menN = Math.max(0, t - kidsN - womenN)
    setMen(menN); setWomen(womenN); setKids(kidsN)
  }

  // Step 2 — carnes
  const [qty, setQty] = useState<Record<string, number>>({})

  // Step 3 — churrasqueiro
  const [selectedGm, setSelectedGm] = useState('')
  const [gmChoiceMode, setGmChoiceMode] = useState<'manual' | 'auto'>('manual')
  const [sideDishChoice, setSideDishChoice] = useState<'' | 'ACOUGUE' | 'GRILLMASTER'>('')

  // Step 4 — guest
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')

  const totalPeople = men + women + kids
  const totalKgNum = (men * 350 + women * 300 + kids * 200) / 1000
  const totalKg = totalKgNum.toFixed(1)
  const selectedCarneKg = products
    .filter(p => p.category === 'CARNE' && p.unit === 'kg')
    .reduce((s, p) => s + (qty[p.id] || 0), 0)
  const productsCost = products.reduce((s, p) => s + (qty[p.id] || 0) * p.price, 0)
  const gm = grillmasters.find(g => g.id === selectedGm)
  const auxiliaresNeeded = calcAuxiliaresNeeded(totalPeople)
  const gmBlocked = (g: Grillmaster) => auxiliaresNeeded > 0 && !g.bringsAuxiliar && !g.unlimitedAvailability
  // Filtra em vez de mostrar desabilitado — cliente só vê churrasqueiro que ele
  // pode escolher de verdade pra esse número de convidados, sem investir 3
  // passos e só então descobrir que a opção não estava disponível.
  const availableGrillmasters = grillmasters.filter(g => !gmBlocked(g))
  const availableRecommendedGms = recommendedGms.filter(rg => {
    const full = grillmasters.find(g => g.id === rg.id)
    return !full || !gmBlocked(full)
  })
  // "Deixa a Tech Churras decidir" cobra pela mediana de mercado (não média —
  // um único perfil-âncora de preço premium distorceria pra cima), mesmo
  // cálculo que o backend usa pra cobrar de verdade — sem isso o resumo
  // mostraria um total menor do que o cliente realmente paga.
  const estimatedHourlyRate = (() => {
    if (grillmasters.length === 0) return 100
    const sorted = [...grillmasters.map(g => g.pricePerHour)].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
  })()
  const showingAuto = gmChoiceMode === 'auto'
  const auxiliarCost = auxiliaresNeeded > 0 && (gm ? !gm.unlimitedAvailability : showingAuto)
    ? auxiliaresNeeded * AUXILIAR_HOURLY_RATE * eventHours
    : 0
  // Sobretaxa de fim de semana / desconto por antecedência — mesma regra do
  // backend (que cobra de verdade), só sobre a mão de obra do Grillmaster.
  const laborModifier = eventDate ? calcLaborPriceModifier(new Date(`${eventDate}T${eventTime || '12:00'}`)) : { rate: 0, label: null }
  const baseHourlyRate = gm ? gm.pricePerHour : estimatedHourlyRate
  const gmCost = (gm || showingAuto)
    ? baseHourlyRate * eventHours * (1 + laborModifier.rate) + auxiliarCost
    : 0
  const sideDishFee = sideDishChoice === 'ACOUGUE' ? +(SIDE_DISH_RATE_ACOUGUE * totalPeople).toFixed(2)
    : sideDishChoice === 'GRILLMASTER' ? +(SIDE_DISH_RATE_GRILLMASTER * totalPeople).toFixed(2)
    : 0
  const serviceFee = +((productsCost + gmCost + sideDishFee) * SERVICE_FEE_RATE).toFixed(2)
  const total = productsCost + gmCost + sideDishFee + serviceFee
  const categorias = [...new Set(products.map(p => p.category))]

  useEffect(() => {
    if (!boutiqueId) {
      // Passo 0: sem açougue na URL, carrega a lista para o visitante escolher (funil guest da home)
      fetch(`${API_URL}/boutiques`)
        .then(r => r.ok ? r.json() : [])
        .then((bs) => setAllBoutiques((Array.isArray(bs) ? bs : []).filter((b: Boutique & { approved?: boolean }) => b.approved !== false)))
        .catch(() => {})
        .finally(() => setLoading(false))
      return
    }
    Promise.all([
      fetch(`${API_URL}/boutiques/${boutiqueId}`).then(r => r.ok ? r.json() : null),
      fetch(`${API_URL}/boutiques/${boutiqueId}/products`).then(r => r.json()),
      // limit alto de propósito: o backend usa TODOS os GMs aprovados+disponíveis
      // pra calcular a mediana de preço real cobrada (orders.service.ts) — sem
      // isso, o resumo do passo 4 mostrava a mediana só dos 9 primeiros (default
      // da paginação pública), divergindo silenciosamente do valor real cobrado
      // assim que o catálogo passar de 9 churrasqueiros.
      fetch(`${API_URL}/grillmasters?limit=200&available=true`).then(r => r.json()),
      fetch(`${API_URL}/boutiques/${boutiqueId}/kits`).then(r => r.ok ? r.json() : []),
    ]).then(([b, prods, gms, k]) => {
      setBoutique(b)
      const available = (Array.isArray(prods) ? prods : []).filter((p: Product) => p.available)
      setProducts(available)
      setGrillmasters(Array.isArray(gms) ? gms : gms.grillmasters ?? [])
      setKits(Array.isArray(k) ? k : [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [boutiqueId])

  // Refiltra a lista de churrasqueiros assim que a data do evento é definida
  // no passo 1 — sem isso, o cliente só descobria que o GM escolhido no passo
  // 3 já tinha evento marcado naquele dia no clique final de "Confirmar".
  useEffect(() => {
    if (!boutiqueId || !eventDate) return
    fetch(`${API_URL}/grillmasters?limit=200&available=true&eventDate=${eventDate}`)
      .then(r => r.json())
      .then(gms => setGrillmasters(Array.isArray(gms) ? gms : gms.grillmasters ?? []))
      .catch(() => {})
  }, [boutiqueId, eventDate])

  // Cliente veio do Kit Perfeito/Assistente sem boutiqueId na URL ainda —
  // redireciona já com o açougue (e GM, se a IA também tiver escolhido) que
  // o carrinho guardou, pra cair direto no wizard certo em vez da tela de
  // "escolha seu açougue" às cegas.
  useEffect(() => {
    if (boutiqueId || !cart.boutiqueId) return
    const qs = new URLSearchParams({ boutiqueId: cart.boutiqueId })
    if (cart.grillmasterId) qs.set('grillmasterId', cart.grillmasterId)
    router.replace(`/pedido?${qs.toString()}`)
  }, [boutiqueId, cart.boutiqueId, cart.grillmasterId])

  // Convidado chegou de um perfil de churrasqueiro específico (ex: "Contratar"
  // na listagem) sem açougue escolhido ainda — busca o açougue padrão desse
  // GM pra já entrar no fluxo certo, em vez de cair numa lista de açougues às
  // cegas sem nenhum contexto do que o cliente já tinha decidido.
  useEffect(() => {
    if (!preselectGmId || boutiqueId) return
    fetch(`${API_URL}/grillmasters/${preselectGmId}`)
      .then(r => r.ok ? r.json() : null)
      .then((gm: { defaultBoutiqueId?: string } | null) => {
        if (gm?.defaultBoutiqueId) {
          router.replace(`/pedido?boutiqueId=${gm.defaultBoutiqueId}&grillmasterId=${preselectGmId}`)
        }
      })
      .catch(() => {})
  }, [preselectGmId, boutiqueId])

  // Assim que a lista de churrasqueiros carregar (junto com o açougue), marca
  // o GM que o cliente já tinha escolhido no perfil/listagem como selecionado.
  useEffect(() => {
    if (!preselectGmId || grillmasters.length === 0) return
    if (grillmasters.some(g => g.id === preselectGmId)) setSelectedGm(preselectGmId)
  }, [preselectGmId, grillmasters])

  // Kit escolhido no /menu (?kit=essential|prime) — prefila a faixa de
  // convidados correspondente em vez de deixar o parâmetro decorativo.
  useEffect(() => {
    const kitDefaults = KIT_GUEST_DEFAULTS[params.get('kit') ?? '']
    if (kitDefaults) { setMen(kitDefaults.men); setWomen(kitDefaults.women); setKids(kitDefaults.kids) }
  }, [])

  // Recomendação de GM por IA — endpoint público, não precisa de login.
  useEffect(() => {
    if (step !== 3) return
    setLoadingRecommended(true)
    const p = new URLSearchParams()
    if (eventDate) p.set('eventDate', eventDate)
    if (totalPeople > 0) p.set('guests', String(totalPeople))
    fetch(`${API_URL}/grillmasters/recommended?${p.toString()}`)
      .then(r => r.json())
      .then(d => setRecommendedGms(Array.isArray(d) ? d : []))
      .catch(() => setRecommendedGms([]))
      .finally(() => setLoadingRecommended(false))
  }, [step])

  // Só o kit pronto (produto real, montado pelo próprio açougue) é sugerido
  // automaticamente ao carregar — é uma recomendação legítima do parceiro,
  // não o sistema adivinhando o que o cliente quer. A montagem manual de
  // cortes começa vazia: o cliente escolhe o que quer primeiro, a
  // quantidade só é sugerida depois de cada corte selecionado.
  useEffect(() => {
    if (selectedKit !== null || products.length === 0) return
    if (Object.values(qty).some(q => q > 0)) return
    if (cameFromAi) return // a IA (Kit Perfeito/Assistente) já escolheu os itens — não sobrescreve
    const kit = kits.find(k => totalPeople >= k.minGuests && totalPeople <= k.maxGuests)
      ?? (kits.length > 0
        ? kits.reduce((prev, curr) => Math.abs(curr.minGuests - totalPeople) < Math.abs(prev.minGuests - totalPeople) ? curr : prev)
        : null)
    if (kit) applyKit(kit)
  }, [products, kits])

  // Prefila o restante do formulário com o que veio do Kit Perfeito/Assistente
  // (endereço, duração, convidados e os cortes já escolhidos), assim que o
  // catálogo do açougue carregar.
  useEffect(() => {
    if (!cameFromAi || products.length === 0) return
    if (cart.eventData.address) setEventAddress(cart.eventData.address)
    if (cart.eventData.hours) setEventHours(cart.eventData.hours)
    if (cart.eventData.homens) setMen(cart.eventData.homens)
    if (cart.eventData.mulheres != null) setWomen(cart.eventData.mulheres)
    if (cart.eventData.criancas != null) setKids(cart.eventData.criancas)
    if (Object.keys(cart.selectedQty).length > 0 && Object.keys(qty).length === 0) {
      setQty(cart.selectedQty)
      setSelectedKit('__from_ai__')
    }
  }, [products])

  async function fetchCep(cep: string) {
    if (cep.length !== 8) return
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const d = await r.json()
      if (!d.erro) setEventAddress([d.logradouro, d.bairro, `${d.localidade} - ${d.uf}`].filter(Boolean).join(', '))
    } catch {}
  }

  function scrollToCategory(cat: string) {
    document.getElementById(`cat-${cat}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Reequilibra em partes iguais só os cortes que já estão selecionados —
  // útil se o cliente mexeu manualmente num item e quer voltar pro sugerido.
  function resetSelectedToEvenSplit() {
    const selectedIds = Object.keys(qty).filter(id => (qty[id] || 0) > 0)
    setQty(rebalanceSelected(selectedIds, products, men, women, kids))
  }

  // Alterna um corte selecionado/não-selecionado e reequilibra a quantidade
  // sugerida entre os cortes atualmente escolhidos — ajuste manual por item
  // continua disponível depois, via +/-.
  function toggleProductSelection(productId: string) {
    setSelectedKit(null)
    setQty(prev => {
      const isSelected = (prev[productId] || 0) > 0
      const nextIds = isSelected
        ? Object.keys(prev).filter(id => id !== productId && (prev[id] || 0) > 0)
        : [...Object.keys(prev).filter(id => (prev[id] || 0) > 0), productId]
      return rebalanceSelected(nextIds, products, men, women, kids)
    })
  }

  function applyKit(kit: Kit) {
    setKitApplyError('')
    let items: KitItem[]
    try {
      const parsed = JSON.parse(kit.items)
      if (!Array.isArray(parsed)) throw new Error('formato inesperado')
      items = parsed
    } catch {
      // Dado corrompido (ex: descrição em texto livre em vez de JSON) — não
      // dá pra aplicar automaticamente. Isso já causou pedido pago sem carne
      // nenhuma indo pro açougue, então avisa em vez de seguir em silêncio.
      setKitApplyError('Não conseguimos calcular as quantidades desse kit automaticamente. Selecione os cortes manualmente abaixo, ou escolha outro kit.')
      setSelectedKit(kit.id)
      return
    }

    // Itens do kit sao calibrados pro teto da faixa (maxGuests) — escala pra
    // quantidade real de convidados informada, senao um evento de 15 pessoas
    // recebe a mesma carne calculada pra 30.
    const scale = totalPeople > 0 ? totalPeople / kit.maxGuests : 1
    const newQty: Record<string, number> = {}
    let unmatchedCount = 0
    for (const item of items) {
      const itemName = item.productName ?? item.name ?? ''
      const itemQty = item.quantity ?? item.qty ?? 0
      if (!itemName) { unmatchedCount++; continue }
      const match = products.find(p =>
        p.name.toLowerCase().includes(itemName.toLowerCase()) ||
        itemName.toLowerCase().includes(p.name.toLowerCase())
      )
      if (match) {
        const scaledQty = item.unit === 'kg' ? Math.round(itemQty * scale * 10) / 10 : Math.max(1, Math.round(itemQty * scale))
        newQty[match.id] = scaledQty
      } else {
        unmatchedCount++
      }
    }
    setQty(newQty)
    setSelectedKit(kit.id)
    if (Object.keys(newQty).length === 0) {
      setKitApplyError('Não conseguimos identificar os cortes desse kit no catálogo do açougue. Selecione os cortes manualmente abaixo, ou escolha outro kit.')
    } else if (unmatchedCount > 0) {
      setKitApplyError(`${unmatchedCount} item(ns) do kit não foram encontrados no catálogo e ficaram de fora — confira as quantidades abaixo antes de continuar.`)
    }
  }

  // Se o cliente voltar e mudar o numero de convidados com um kit ja aplicado,
  // reescala as quantidades em vez de deixar o kit "preso" no headcount anterior.
  useEffect(() => {
    if (!selectedKit) return
    const kit = kits.find(k => k.id === selectedKit)
    if (kit) applyKit(kit)
  }, [totalPeople])

  function next() {
    if (step === 1 && (!eventDate || !eventAddress.trim())) { setFormError('Preencha a data e o endereço do evento'); return }
    if (step === 3 && gmChoiceMode === 'manual' && !selectedGm) { setFormError('Selecione um churrasqueiro'); return }
    if (step === 3 && gm && gmBlocked(gm)) { setFormError(`Este Grillmaster atende sozinho até ${AUXILIAR_GUEST_THRESHOLD} convidados. Escolha um Grillmaster com auxiliar, ou reduza o número de convidados.`); return }
    setFormError('')
    setStep(s => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleConfirm() {
    if (!guestName.trim() || guestName.trim().length < 2) { setFormError('Digite seu nome completo'); return }
    const phone = guestPhone.replace(/\D/g, '')
    if (phone.length < 10) { setFormError('Digite um WhatsApp válido com DDD'); return }
    // Trava de segurança: já aconteceu de kit com dado corrompido resultar em
    // pedido pago sem NENHUM item de carne indo pro açougue, em silêncio. Se
    // tem catálogo disponível mas nada foi selecionado, não deixa prosseguir.
    if (products.length > 0 && Object.values(qty).every(q => !q)) {
      setFormError('Você ainda não selecionou nenhum corte de carne. Escolha um kit ou selecione manualmente antes de continuar.')
      return
    }
    setFormError('')
    setSubmitting(true)
    try {
      // 1. Reaproveita sessão logada se existir; senão cria conta guest
      let token: string | null = null
      try { token = JSON.parse(localStorage.getItem('auth-storage') || 'null')?.state?.token ?? null } catch {}
      if (!token) {
        const authRes = await fetch(`${API_URL}/auth/guest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: guestName.trim(), phone }),
        })
        if (!authRes.ok) throw new Error((await authRes.json()).error)
        const guest = await authRes.json()
        token = guest.token
        // 2. Persiste para o layout do dashboard reconhecer a sessão — e os cookies
        // que o middleware confere, senão o guest é barrado no /orders/:id/payment
        localStorage.setItem('auth-storage', JSON.stringify({ state: { user: guest.user, token }, version: 0 }))
        document.cookie = 'tc-auth=1; path=/; max-age=2592000; SameSite=Lax'
        document.cookie = 'tc-role=CUSTOMER; path=/; max-age=2592000; SameSite=Lax'
      }

      // 3. Create order
      const orderItems = products.filter(p => (qty[p.id] || 0) > 0).map(p => ({ productId: p.id, quantity: qty[p.id] }))
      const orderRes = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          grillmasterId: gmChoiceMode === 'manual' ? selectedGm : undefined,
          boutiqueId: boutiqueId || undefined,
          eventDate: new Date(`${eventDate}T${eventTime}`).toISOString(),
          eventAddress: eventComplement.trim() ? `${eventAddress}, ${eventComplement.trim()}` : eventAddress,
          eventHours,
          guestCount: totalPeople || 1,
          items: orderItems.length > 0 ? orderItems : undefined,
          sideDishPreparedBy: sideDishChoice || undefined,
        }),
      })
      if (!orderRes.ok) throw new Error((await orderRes.json()).error)
      const order = await orderRes.json()
      cart.clearCart()
      router.push(`/orders/${order.id}/payment`)
    } catch (err: any) {
      setFormError('Erro: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#1c1714] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Carregando cardápio...</p>
      </div>
    </div>
  )

  // Passo 0 — visitante chega sem açougue: escolhe aqui, sem precisar de conta
  if (!boutiqueId) return (
    <div className="min-h-screen bg-[#1c1714] text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <span className="font-black text-lg">Tech <span className="text-orange-500">Churras</span></span>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="font-display text-2xl font-black mb-1">Escolha seu açougue parceiro</h1>
        <p className="text-gray-400 text-sm mb-6">Os cortes do seu churrasco vêm de um açougue real, selecionado pela Tech Churras. Sem cadastro — você só cria sua conta na hora de confirmar.</p>
        {allBoutiques.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center text-gray-400 text-sm">
            Nenhum açougue disponível agora. Tente novamente em instantes.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {allBoutiques.map(b => (
              <button key={b.id} onClick={() => router.replace(`/pedido?boutiqueId=${b.id}` + (preselectGmId ? `&grillmasterId=${preselectGmId}` : ''))}
                className="text-left bg-gray-900 hover:bg-gray-800 active:scale-[0.98] border border-gray-800 hover:border-orange-500/60 rounded-2xl p-5 transition-all">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-lg">{b.name}</span>
                  <span className={'text-xs font-bold px-2 py-0.5 rounded-full ' + (b.open ? 'bg-green-500/15 text-green-400' : 'bg-gray-700 text-gray-400')}>
                    {b.open ? 'Aberto' : 'Fechado'}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-1">{b.city}{b.state ? ` — ${b.state}` : ''}</p>
                <p className="text-orange-400 text-sm font-medium mt-2">Montar meu churrasco aqui →</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#1c1714] text-white">
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
          <h1 className="font-display text-xl font-black">Monte seu Churrasco</h1>
          <p className="text-sm text-gray-500">Sem cadastro, sem fila. Paga e aproveita. 🔥</p>
        </div>

        <div className="mt-6">
          <StepBar step={step} />
        </div>

        {/* Total visível desde o passo 2 — antes disso a taxa de serviço só
            aparecia no resumo final (passo 4), fazendo o cliente descobrir o
            custo na hora de pagar. Mostrar cedo evita essa surpresa. */}
        {step >= 2 && total > 0 && (
          <div className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 mb-4 text-sm">
            <span className="text-gray-400">Total até agora</span>
            <span className="font-bold text-orange-400">
              R$ {total.toFixed(2)}
              <span className="text-gray-600 font-normal text-xs ml-1">(já com taxa de serviço de 6%)</span>
            </span>
          </div>
        )}

        {/* ── STEP 1: EVENTO ── */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
              <h2 className="font-bold text-base">Quando e onde?</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ev-date" className="text-xs text-gray-400 mb-1 block">Data *</label>
                  <input id="ev-date" type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
                    className="w-full bg-gray-800 rounded-xl px-3 py-2.5 text-white text-sm" />
                </div>
                <div>
                  <label htmlFor="ev-time" className="text-xs text-gray-400 mb-1 block">Horário</label>
                  <input id="ev-time" type="time" value={eventTime} onChange={e => setEventTime(e.target.value)}
                    className="w-full bg-gray-800 rounded-xl px-3 py-2.5 text-white text-sm" />
                </div>
              </div>
              <div>
                <label htmlFor="ev-cep" className="text-xs text-gray-400 mb-1 block">CEP (auto-preenche)</label>
                <input id="ev-cep" type="text" placeholder="00000000" value={eventCep} maxLength={8}
                  onChange={e => { const v = e.target.value.replace(/\D/g, ''); setEventCep(v); if (v.length === 8) fetchCep(v) }}
                  className="w-full bg-gray-800 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600" />
              </div>
              <div>
                <label htmlFor="ev-address" className="text-xs text-gray-400 mb-1 block">Endereço *</label>
                <input id="ev-address" type="text" value={eventAddress} onChange={e => setEventAddress(e.target.value)}
                  placeholder="Rua, número, bairro, cidade"
                  className="w-full bg-gray-800 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600" />
              </div>
              <div>
                <label htmlFor="ev-complement" className="text-xs text-gray-400 mb-1 block">Número, complemento e ponto de referência</label>
                <input id="ev-complement" type="text" value={eventComplement} onChange={e => setEventComplement(e.target.value)}
                  placeholder="Nº 123, apto 45, portão azul, perto do mercado..."
                  className="w-full bg-gray-800 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600" />
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
              <h2 className="font-bold text-base">Quantos convidados?</h2>

              {!guestDetailMode ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Total de convidados</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setTotalGuests(totalPeople - 1)} aria-label="Diminuir convidados"
                      className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 active:scale-90 transition-transform font-bold text-lg flex items-center justify-center">−</button>
                    <span className="w-8 text-center font-bold" aria-live="polite">{totalPeople}</span>
                    <button onClick={() => setTotalGuests(totalPeople + 1)} aria-label="Aumentar convidados"
                      className="w-9 h-9 rounded-full bg-orange-500 hover:bg-orange-600 active:scale-90 transition-transform font-bold text-lg flex items-center justify-center">+</button>
                  </div>
                </div>
              ) : (
                [
                  { label: 'Homens', value: men, set: setMen },
                  { label: 'Mulheres', value: women, set: setWomen },
                  { label: 'Crianças', value: kids, set: setKids },
                ].map(({ label, value, set }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">{label}</span>
                    <div className="flex items-center gap-3">
                      <button onClick={() => set(Math.max(0, value - 1))} aria-label={`Diminuir ${label}`}
                        className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 active:scale-90 transition-transform font-bold text-lg flex items-center justify-center">−</button>
                      <span className="w-8 text-center font-bold" aria-live="polite">{value}</span>
                      <button onClick={() => set(value + 1)} aria-label={`Aumentar ${label}`}
                        className="w-9 h-9 rounded-full bg-orange-500 hover:bg-orange-600 active:scale-90 transition-transform font-bold text-lg flex items-center justify-center">+</button>
                    </div>
                  </div>
                ))
              )}

              <button type="button" onClick={() => setGuestDetailMode(v => !v)}
                className="text-xs text-orange-400/80 hover:text-orange-300 font-medium">
                {guestDetailMode ? '← Voltar pro total simples' : 'Ajustar por perfil (homens/mulheres/crianças) →'}
              </button>

              {totalPeople > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-orange-300">{totalPeople} pessoas → <span className="font-bold">{totalKg} kg de proteína</span></span>
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
              {Object.values(qty).some(q => q > 0) && (
                <button onClick={resetSelectedToEvenSplit}
                  className="text-xs bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold px-3 py-2 rounded-xl transition-all whitespace-nowrap inline-flex items-center gap-1">
                  <StarIcon size={12} /> Reequilibrar quantidades
                </button>
              )}
            </div>

            {kits.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Kits prontos do açougue</p>
                <div className="grid grid-cols-1 gap-2">
                  {kits.map(kit => {
                    const sel = selectedKit === kit.id
                    const displayPrice = kit.discountPrice && kit.discountPrice < kit.price ? kit.discountPrice : kit.price
                    return (
                      <button key={kit.id} onClick={() => applyKit(kit)}
                        className={'w-full text-left rounded-2xl p-4 border-2 transition-all active:scale-[0.98] ' +
                          (sel ? 'border-orange-500 bg-orange-500/10' : 'border-gray-800 bg-gray-900 hover:border-orange-500/40')}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-white text-sm">{kit.name}</p>
                              {sel && <span className="text-xs text-green-400 font-medium inline-flex items-center gap-1"><CheckIcon size={11} /> Selecionado</span>}
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">{kit.description}</p>
                          </div>
                          <div className="text-right shrink-0">
                            {kit.discountPrice && kit.discountPrice < kit.price && (
                              <p className="text-xs text-gray-500 line-through">R$ {kit.price.toFixed(0)}</p>
                            )}
                            <p className="text-orange-400 font-bold text-sm">R$ {displayPrice.toFixed(0)}</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
                {kitApplyError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
                    <p className="text-xs text-red-300">{kitApplyError}</p>
                  </div>
                )}
                <p className="text-xs text-gray-600 text-center">Ou monte manualmente abaixo ↓</p>
              </div>
            )}

            {products.length === 0 ? (
              <div className="bg-gray-900 border border-yellow-500/30 rounded-2xl p-6 text-center">
                <p className="text-yellow-400 font-medium">Açougue atualizando o cardápio</p>
                <p className="text-sm text-gray-400 mt-1">Tente novamente em alguns minutos.</p>
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-5">
                <p className="text-xs text-gray-500 -mt-1">Toque num corte pra escolher — a quantidade é sugerida pra {totalPeople || '0'} convidados assim que você seleciona, mas dá pra ajustar depois.</p>

                {totalKgNum > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-gray-400">Proteína selecionada</span>
                      <span className={selectedCarneKg >= totalKgNum ? 'text-green-400 font-bold' : 'text-orange-400 font-bold'}>
                        {selectedCarneKg.toFixed(1)}kg de {totalKg}kg recomendados
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className={'h-full rounded-full transition-all duration-300 ' + (selectedCarneKg >= totalKgNum ? 'bg-green-500' : 'bg-orange-500')}
                        style={{ width: `${Math.min(100, (selectedCarneKg / totalKgNum) * 100)}%` }} />
                    </div>
                  </div>
                )}

                {categorias.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1 sticky top-0 bg-gray-900 z-10">
                    {categorias.map(cat => (
                      <button key={cat} type="button" onClick={() => scrollToCategory(cat)}
                        className="shrink-0 text-xs font-medium bg-gray-800 hover:bg-gray-700 active:scale-95 text-gray-300 px-3 py-1.5 rounded-full whitespace-nowrap transition-all">
                        {CATEGORY_LABELS[cat] || cat}
                      </button>
                    ))}
                  </div>
                )}

                {categorias.map(cat => (
                  <div key={cat} id={`cat-${cat}`} className="scroll-mt-14">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">{CATEGORY_LABELS[cat] || cat}</p>
                    <div className="grid grid-cols-2 gap-3">
                      {products.filter(p => p.category === cat).map(p => {
                        const q = qty[p.id] || 0
                        const selected = q > 0
                        return (
                          <div key={p.id} className={'rounded-2xl border-2 overflow-hidden transition-all ' + (selected ? 'border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/30' : 'border-gray-800 bg-gray-800/40 hover:border-orange-500/40')}>
                            <button type="button" onClick={() => toggleProductSelection(p.id)} className="w-full text-left active:scale-[0.97] transition-transform" aria-pressed={selected}>
                              <div className="relative aspect-square bg-gray-800">
                                {p.imageUrl ? (
                                  <img src={p.imageUrl} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-600"><MeatIcon size={32} /></div>
                                )}
                                {selected && (
                                  <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg shrink-0">
                                    <CheckIcon size={14} />
                                  </span>
                                )}
                              </div>
                              <div className="p-2.5 pb-2">
                                <p className="text-sm font-medium text-white truncate">{p.name}</p>
                                {p.description && <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">{p.description}</p>}
                                <p className="text-xs text-orange-400 mt-0.5">R$ {p.price.toFixed(2)}/{p.unit}</p>
                              </div>
                            </button>
                            {selected && (
                              <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5 animate-revealIn">
                                <div className="flex items-center gap-1.5">
                                  <button onClick={() => setQty(prev => { const step = qtyStep(p.unit); return { ...prev, [p.id]: Math.max(step, +((prev[p.id] || 0) - step).toFixed(1)) } })}
                                    aria-label={`Diminuir ${p.name}`}
                                    className="w-7 h-7 bg-gray-800 hover:bg-gray-700 active:scale-90 transition-transform rounded-full font-bold text-sm">−</button>
                                  <span className="w-9 text-center text-sm font-bold">{q}{p.unit}</span>
                                  <button onClick={() => setQty(prev => { const step = qtyStep(p.unit); return { ...prev, [p.id]: +((prev[p.id] || 0) + step).toFixed(1) } })}
                                    aria-label={`Aumentar ${p.name}`}
                                    className="w-7 h-7 bg-orange-500 hover:bg-orange-600 active:scale-90 transition-transform rounded-full font-bold text-sm">+</button>
                                </div>
                                <span className="text-xs text-orange-400 font-medium">R${(q * p.price).toFixed(0)}</span>
                              </div>
                            )}
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

            {/* Acompanhamentos do açougue — não depende de qual Grillmaster
                for escolhido, então fica aqui junto do resto da oferta do
                açougue, não lá no passo do Grillmaster. Só aparece se o
                próprio açougue optou por oferecer isso no perfil dele. */}
            {boutique?.offersSideDishPrep && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-sm">Quer acompanhamentos prontos?</h3>
                  <p className="text-xs text-gray-500">Arroz, farofa, vinagrete, maionese, salada, chimichurri — opcional, pelo açougue</p>
                </div>
                <div className="space-y-2">
                  <button onClick={() => setSideDishChoice(c => c === 'ACOUGUE' ? '' : 'ACOUGUE')}
                    className={'w-full text-left rounded-xl p-3 border-2 transition-all active:scale-[0.98] flex items-center justify-between gap-3 ' +
                      (sideDishChoice === 'ACOUGUE' ? 'border-orange-500 bg-orange-500/10' : 'border-gray-800 hover:border-orange-500/40')}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{boutique?.name ?? 'Açougue'} prepara pronto</p>
                      <p className="text-xs text-gray-500">Pronto pra retirar no evento</p>
                      <p className="text-xs text-gray-600 mt-0.5">{sideDishBreakdown(totalPeople)}</p>
                    </div>
                    <span className="text-orange-400 font-bold text-sm shrink-0">R$ {SIDE_DISH_RATE_ACOUGUE.toFixed(2)}/pessoa</span>
                  </button>
                  <button onClick={() => setSideDishChoice('')}
                    className="w-full text-left rounded-xl p-3 border-2 transition-all active:scale-[0.98] border-gray-800 hover:border-orange-500/40">
                    <p className="text-sm font-medium text-white">Não, decido depois / eu levo por conta</p>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: CHURRASQUEIRO ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-bold text-base">Escolha o Churrasqueiro</h2>
              <p className="text-xs text-gray-500">Profissionais certificados pela Chancela Jota Albuquerque</p>
            </div>

            {/* Escolher um específico vs. deixar a Tech Churras notificar todos
                os disponíveis na região — backend já sabe achar e despachar
                (dispatch.service.ts), só faltava essa escolha existir na tela. */}
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setGmChoiceMode('manual')}
                className={'text-left rounded-xl p-3 border-2 transition-all active:scale-[0.98] ' +
                  (gmChoiceMode === 'manual' ? 'border-orange-500 bg-orange-500/10' : 'border-gray-800 hover:border-orange-500/40')}>
                <p className="text-sm font-semibold text-white">Escolher eu mesmo</p>
                <p className="text-xs text-gray-500 mt-0.5">Veja avaliações e especialidades</p>
              </button>
              <button type="button" onClick={() => { setGmChoiceMode('auto'); setSelectedGm('') }}
                className={'text-left rounded-xl p-3 border-2 transition-all active:scale-[0.98] ' +
                  (gmChoiceMode === 'auto' ? 'border-orange-500 bg-orange-500/10' : 'border-gray-800 hover:border-orange-500/40')}>
                <p className="text-sm font-semibold text-white">Deixa com a Tech Churras</p>
                <p className="text-xs text-gray-500 mt-0.5">Notificamos os disponíveis na região</p>
              </button>
            </div>

            {gmChoiceMode === 'auto' && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-sm text-gray-300">
                Vamos notificar todos os churrasqueiros aprovados e disponíveis na sua região e data — o primeiro que aceitar fica com o seu evento. Você recebe a confirmação assim que alguém aceitar.
              </div>
            )}

            {gmChoiceMode === 'manual' && selectedGm && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-sm text-gray-300">
                {grillmasters.find(g => g.id === selectedGm)?.user.name ?? 'O churrasqueiro'} tem até 2h depois do pagamento pra confirmar presença. Você recebe um aviso assim que ele confirmar.
              </div>
            )}

            {gmChoiceMode === 'manual' && grillmasters.length === 0 && (
              <p className="text-gray-500 text-center py-10">Nenhum churrasqueiro disponível no momento.</p>
            )}
            {gmChoiceMode === 'manual' && grillmasters.length > 0 && availableGrillmasters.length === 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-sm text-gray-300 text-center">
                Nenhum churrasqueiro atende sozinho {totalPeople} convidados (acima de {AUXILIAR_GUEST_THRESHOLD}, precisa de auxiliar).
                Deixa com a Tech Churras pra notificar quem tem auxiliar na região, ou reduza o número de convidados.
              </div>
            )}

            {/* Recomendados pela IA */}
            {gmChoiceMode === 'manual' && (loadingRecommended || availableRecommendedGms.length > 0) && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider flex items-center gap-1">
                  <StarIcon size={12} /> Recomendados para você
                </p>
                {loadingRecommended ? (
                  <div className="text-center py-4 text-gray-500 text-sm">Analisando disponibilidade...</div>
                ) : (
                  availableRecommendedGms.map((rg, idx) => {
                    const sel = selectedGm === rg.id
                    const cost = rg.pricePerHour * eventHours * (1 + laborModifier.rate)
                    return (
                      <button key={rg.id} type="button"
                        onClick={() => setSelectedGm(rg.id)}
                        aria-pressed={sel}
                        className={'w-full text-left rounded-2xl p-4 border-2 transition-all cursor-pointer active:scale-[0.98] ' +
                          (sel ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/20' : 'border-orange-500/30 bg-orange-500/5 hover:border-orange-500/60')}>
                        <div className="flex items-start gap-3">
                          <div className="relative shrink-0">
                            {rg.photoUrl ? (
                              <img src={rg.photoUrl} alt={rg.name} className="w-12 h-12 rounded-full object-cover border border-orange-500/40" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-lg font-black text-orange-400">
                                {rg.name?.[0]?.toUpperCase() ?? '?'}
                              </div>
                            )}
                            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center">
                              {idx + 1}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-bold text-white truncate">{rg.name}</p>
                              {sel && <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full shrink-0">✓</span>}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                              {rg.rating > 0 && <span className="flex items-center gap-0.5"><span className="text-yellow-400">★</span>{rg.rating.toFixed(1)}</span>}
                              {rg.reviewCount > 0 && <span>{rg.reviewCount} avaliações</span>}
                              {rg.distanceKm != null && <span>{rg.distanceKm}km</span>}
                            </div>
                            {rg.reason && <p className="text-xs text-orange-300/80 mt-1 italic">{rg.reason}</p>}
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500">R$ {rg.pricePerHour}/hora</span>
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
            {gmChoiceMode === 'manual' && availableRecommendedGms.length > 0 && availableGrillmasters.length > 0 && (
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Todos os churrasqueiros</p>
            )}

            {gmChoiceMode === 'manual' && (
            <div className="space-y-3">
              {availableGrillmasters.filter(g => !availableRecommendedGms.some(r => r.id === g.id)).map(g => {
                const sel = selectedGm === g.id
                return (
                  <button key={g.id} type="button"
                    onClick={() => { setSelectedGm(g.id); if (sideDishChoice === 'GRILLMASTER' && !g.offersSideDishPrep) setSideDishChoice('') }}
                    aria-pressed={sel}
                    className={'w-full text-left bg-gray-900 rounded-2xl p-4 border-2 transition-all cursor-pointer active:scale-[0.98] ' +
                      (sel ? 'border-orange-500 shadow-lg shadow-orange-500/20' : 'border-gray-800 hover:border-orange-500/40')}>
                    <div className="flex items-center gap-3">
                      {g.photoUrl ? (
                        <img src={g.photoUrl} alt={g.user.name} loading="lazy" className="w-12 h-12 rounded-full object-cover border-2 border-orange-500/30 shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-800 border-2 border-orange-500/30 flex items-center justify-center font-bold text-orange-400 shrink-0">
                          {g.user.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-white text-sm">{g.user.name}</p>
                          {g.isChancelado && (
                            <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full">Chancelado</span>
                          )}
                          {g.bringsAuxiliar && auxiliaresNeeded > 0 && (
                            <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded-full">+ auxiliar</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{g.city}, {g.state}</p>
                        {g.totalOrders > 0 ? (
                          <p className="text-xs text-yellow-400">{renderStars(g.rating ?? 0)} <span className="text-gray-500">({g.totalOrders} eventos)</span></p>
                        ) : (
                          <p className="text-xs text-blue-400">Novo na plataforma</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-orange-400 font-bold">R$ {g.pricePerHour.toFixed(0)}</p>
                        <p className="text-gray-600 text-xs">/hora</p>
                      </div>
                    </div>
                    {sel && (
                      <p className="text-xs text-green-400 mt-2 font-medium inline-flex items-center gap-1"><CheckIcon size={11} /> Selecionado · {eventHours}h = R$ {(g.pricePerHour * eventHours * (1 + laborModifier.rate)).toFixed(2)}{auxiliarCost > 0 ? ` + R$ ${auxiliarCost.toFixed(2)} auxiliar` : ''}</p>
                    )}
                  </button>
                )
              })}
            </div>
            )}

            {/* Opção do açougue já foi decidida no passo 2 (se ele oferece).
                Aqui só entra a alternativa do Grillmaster, quando ele
                oferece — não repete o que já foi perguntado antes. */}
            {gm && gm.offersSideDishPrep && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-sm">
                    {sideDishChoice === 'ACOUGUE' ? 'Prefere que o Grillmaster prepare no local?' : 'Quer acompanhamentos com o Grillmaster?'}
                  </h3>
                  <p className="text-xs text-gray-500">Arroz, farofa, vinagrete, maionese, salada, chimichurri — opcional</p>
                </div>
                <div className="space-y-2">
                  <button onClick={() => setSideDishChoice(c => c === 'GRILLMASTER' ? '' : 'GRILLMASTER')}
                    className={'w-full text-left rounded-xl p-3 border-2 transition-all active:scale-[0.98] flex items-center justify-between gap-3 ' +
                      (sideDishChoice === 'GRILLMASTER' ? 'border-orange-500 bg-orange-500/10' : 'border-gray-800 hover:border-orange-500/40')}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{gm.user.name} prepara no local</p>
                      <p className="text-xs text-gray-500">Fresco, feito na hora do evento</p>
                      <p className="text-xs text-gray-600 mt-0.5">{sideDishBreakdown(totalPeople)}</p>
                    </div>
                    <span className="text-orange-400 font-bold text-sm shrink-0">R$ {SIDE_DISH_RATE_GRILLMASTER.toFixed(2)}/pessoa</span>
                  </button>

                  <button onClick={() => setSideDishChoice(c => c === 'GRILLMASTER' ? '' : c)}
                    className="w-full text-left rounded-xl p-3 border-2 transition-all active:scale-[0.98] border-gray-800 hover:border-orange-500/40">
                    <p className="text-sm font-medium text-white">
                      {sideDishChoice === 'ACOUGUE' ? 'Não, mantém com o açougue' : 'Não, eu levo por conta'}
                    </p>
                  </button>
                </div>
              </div>
            )}
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
                <label htmlFor="guest-name" className="text-sm text-gray-400 mb-1 block">Seu nome *</label>
                <input id="guest-name" type="text" value={guestName} onChange={e => setGuestName(e.target.value)}
                  placeholder="Nome completo"
                  className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600" />
              </div>
              <div>
                <label htmlFor="guest-phone" className="text-sm text-gray-400 mb-1 block">WhatsApp com DDD *</label>
                <input id="guest-phone" type="tel" value={guestPhone} onChange={e => setGuestPhone(e.target.value)}
                  placeholder="11 99999-9999"
                  className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600" />
              </div>
            </div>

            {/* Resumo */}
            <div className="bg-gray-900 border border-orange-500/20 rounded-2xl p-5 space-y-3 text-sm">
              <p className="font-bold text-white">Resumo do pedido</p>
              {boutique && <div className="flex justify-between text-gray-400"><span>Açougue</span><span className="text-white">{boutique.name}</span></div>}
              {(gm || (!gm && showingAuto)) && (
                <div className="flex justify-between text-gray-400 gap-4">
                  <span className="shrink-0 inline-flex items-center gap-1.5">
                    Churrasqueiro
                    <button type="button" onClick={() => { setStep(3); window.scrollTo({ top: 0 }) }} className="text-orange-400 hover:text-orange-300 text-[11px] underline">editar</button>
                  </span>
                  <span className="text-white text-right text-xs">{gm ? gm.user.name : 'A definir — notificamos os disponíveis na região'}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-400">
                <span className="inline-flex items-center gap-1.5">
                  Evento
                  <button type="button" onClick={() => { setStep(1); window.scrollTo({ top: 0 }) }} className="text-orange-400 hover:text-orange-300 text-[11px] underline">editar</button>
                </span>
                <span className="text-white">{eventDate ? new Date(eventDate + 'T12:00').toLocaleDateString('pt-BR') : '—'} às {eventTime}</span>
              </div>
              {eventAddress && (
                <div className="flex justify-between text-gray-400 gap-4">
                  <span className="shrink-0">Endereço</span>
                  <span className="text-white text-right text-xs">{eventComplement.trim() ? `${eventAddress}, ${eventComplement.trim()}` : eventAddress}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-400"><span>Convidados</span><span className="text-white">{totalPeople} pessoas</span></div>
              {productsCost > 0 && (
                <div className="flex justify-between text-gray-400">
                  <span className="inline-flex items-center gap-1.5">
                    Cortes
                    <button type="button" onClick={() => { setStep(2); window.scrollTo({ top: 0 }) }} className="text-orange-400 hover:text-orange-300 text-[11px] underline">editar</button>
                  </span>
                  <span className="text-orange-400">R$ {productsCost.toFixed(2)}</span>
                </div>
              )}
              {gmCost > 0 && <div className="flex justify-between text-gray-400"><span>Churrasqueiro ({eventHours}h){showingAuto && !gm ? ' — estimado' : ''}</span><span className="text-orange-400">R$ {(gmCost - auxiliarCost).toFixed(2)}</span></div>}
              {gmCost > 0 && laborModifier.label && (
                <div className="flex justify-between text-gray-500 text-xs -mt-2">
                  <span>{laborModifier.label}</span>
                  <span className={laborModifier.rate > 0 ? 'text-red-400' : 'text-green-400'}>
                    {laborModifier.rate > 0 ? '+' : ''}{(laborModifier.rate * 100).toFixed(0)}%
                  </span>
                </div>
              )}
              {auxiliarCost > 0 && <div className="flex justify-between text-gray-400"><span>Auxiliar ({auxiliaresNeeded}x, {eventHours}h)</span><span className="text-orange-400">R$ {auxiliarCost.toFixed(2)}</span></div>}
              {sideDishFee > 0 && (
                <div className="flex justify-between text-gray-400">
                  <span>Acompanhamentos ({sideDishChoice === 'ACOUGUE' ? 'açougue' : 'churrasqueiro'})</span>
                  <span className="text-orange-400">R$ {sideDishFee.toFixed(2)}</span>
                </div>
              )}
              {serviceFee > 0 && <div className="flex justify-between text-gray-400"><span>Taxa de serviço</span><span className="text-orange-400">R$ {serviceFee.toFixed(2)}</span></div>}
              <div className="border-t border-gray-700 pt-3 flex justify-between items-center">
                <span className="font-bold text-white">Total</span>
                <span className="text-2xl font-black text-orange-400">R$ {total.toFixed(2)}</span>
              </div>
            </div>

            <GarantiaSelo compact />

            <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-xs text-gray-400 space-y-1">
              <p className="font-semibold text-gray-300">Cancelamento</p>
              <p>Grátis até 48h antes do evento. Entre 24h e 48h antes, 30% de multa. Menos de 24h antes, 50%.</p>
            </div>

            <p className="text-xs text-gray-600 text-center">
              Ao confirmar, criamos seu perfil automaticamente. Este é o valor que você paga — o churrasqueiro só confirma disponibilidade, o preço não muda.
            </p>
          </div>
        )}

        {formError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 mt-6">
            <p className="text-xs text-red-300">{formError}</p>
          </div>
        )}

        {/* ── NAVEGAÇÃO ── */}
        {/* sticky: em telas longas (passo 2-3, lista de produtos/churrasqueiros)
            os botões ficavam fora da vista, obrigando rolar até o fim pra avançar. */}
        <div className="sticky bottom-0 -mx-4 px-4 py-3 mt-8 bg-[#1c1714]/95 backdrop-blur border-t border-gray-800 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button onClick={() => { setFormError(''); setStep(s => s - 1); window.scrollTo({ top: 0 }) }}
              className="px-5 py-3 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 active:scale-95 font-medium transition-all shrink-0">
              ← Voltar
            </button>
          ) : <div />}
          {step >= 2 && step < 4 && total > 0 && (
            <span className="text-sm text-gray-400 ml-auto mr-1 hidden sm:inline">Total: <span className="text-orange-400 font-bold">R$ {total.toFixed(2)}</span></span>
          )}
          {step < 4 ? (
            <button onClick={next}
              className="px-8 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold transition-all hover:shadow-lg hover:shadow-orange-500/20 shrink-0">
              Próximo →
            </button>
          ) : (
            <button onClick={handleConfirm} disabled={submitting}
              className="px-8 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 disabled:opacity-50 disabled:active:scale-100 text-white font-bold transition-all hover:shadow-lg hover:shadow-orange-500/20">
              {submitting ? 'Criando pedido...' : (<span className="inline-flex items-center gap-2"><FlameIcon size={18} /> Confirmar Churrasco</span>)}
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
      <div className="min-h-screen bg-[#1c1714] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PedidoForm />
    </Suspense>
  )
}
