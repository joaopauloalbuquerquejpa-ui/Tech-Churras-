'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react'

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX = 800
      const scale = Math.min(1, MAX / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(b => resolve(b ?? file), 'image/jpeg', 0.75)
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

const BASE = 'https://tech-churras-production.up.railway.app'
const SITE_URL = 'https://www.techchurras.com.br'

const AreaChart = dynamic(() => import('recharts').then(m => m.AreaChart), { ssr: false })
const Area = dynamic(() => import('recharts').then(m => m.Area), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })

function getToken() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
}

async function uploadImageFile(file: File): Promise<string> {
  const blob = await compressImage(file)
  const fd = new FormData()
  fd.append('file', blob, 'photo.jpg')
  const res = await fetch(BASE + '/upload/image', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + getToken() },
    body: fd,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erro ao fazer upload')
  return data.url as string
}

interface Product {
  id: string; name: string; description?: string; price: number; unit: string
  category: string; available: boolean; stockQuantity?: number | null
  imageUrl?: string | null; discountPercent?: number | null; discountValidUntil?: string | null
}

interface Boutique {
  id: string; name: string; city: string; state: string; approved: boolean
  open: boolean; products: Product[]
}

interface Stats {
  totalRevenue30days: number; totalOrders30days: number; pendingOrdersCount: number
  revenueByDay: { date: string; revenue: number }[]
  recentOrders: { id: string; customerName: string; totalPrice: number; status: string; eventDate: string }[]
  referralCode: string | null; referralCount: number
}

interface DemandItem {
  category: string; totalQuantityNeeded: number; unit: string; eventsCount: number; nextEventDate: string
}

interface KitItem {
  productName: string; quantity: number; unit: string
}

interface Kit {
  id: string; name: string; description: string; price: number
  discountPrice?: number | null; coverImageUrl?: string | null
  minGuests: number; maxGuests: number; items: string
}

const CATEGORIES: Record<string, string> = {
  CARNE: 'Carne', SAL_TEMPERO: 'Sal e Tempero', CARVAO: 'Carvão',
  ACOMPANHAMENTO: 'Acompanhamento', BEBIDA: 'Bebida', OUTRO: 'Outro',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente', CONFIRMED: 'Confirmado', IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluído', CANCELLED: 'Cancelado',
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-500', CONFIRMED: 'bg-blue-500', IN_PROGRESS: 'bg-orange-500',
  COMPLETED: 'bg-green-500', CANCELLED: 'bg-red-500',
}

const emptyForm = {
  name: '', description: '', price: 0, unit: 'kg', category: 'CARNE', available: true,
  stockQuantity: '' as string | number, imageUrl: '',
  discountEnabled: false, discountPercent: 0, discountValidUntil: '',
}

const emptyKitForm = {
  name: '', description: '', minGuests: 10, maxGuests: 20,
  price: 0, discountPrice: 0, coverImageUrl: '',
}

function priceLabel(unit: string) {
  if (unit === 'kg') return 'Preço por kg (R$)'
  if (unit === 'un' || unit === 'unidade') return 'Preço por unidade (R$)'
  return `Preço por ${unit} (R$)`
}

function isDiscountActive(p: Product) {
  if (!p.discountPercent) return false
  if (p.discountValidUntil && new Date(p.discountValidUntil) < new Date()) return false
  return true
}

function discountedPrice(price: number, pct: number) {
  return price * (1 - pct / 100)
}

export default function BoutiqueDashboardPage() {
  const [boutique, setBoutique] = useState<Boutique | null>(null)
  const [kits, setKits] = useState<Kit[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [demand, setDemand] = useState<DemandItem[]>([])
  const [contract, setContract] = useState<{ id: string; status: string; durationMonths: number; acceptedAt: string | null; generatedAt: string } | null>(null)
  const [showContractText, setShowContractText] = useState(false)
  const [contractText, setContractText] = useState('')
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)
  const qrBalcaoRef = useRef<HTMLDivElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const productPhotoRef = useRef<HTMLInputElement>(null)
  const [copiedBalcao, setCopiedBalcao] = useState(false)

  const [photoState, setPhotoState] = useState<'idle' | 'analyzing' | 'done' | 'error'>('idle')
  const [photoError, setPhotoError] = useState('')
  const [photoCount, setPhotoCount] = useState(0)

  const [showKitForm, setShowKitForm] = useState(false)
  const [editingKitId, setEditingKitId] = useState<string | null>(null)
  const [kitForm, setKitForm] = useState(emptyKitForm)
  const [kitItems, setKitItems] = useState<KitItem[]>([])
  const [submittingKit, setSubmittingKit] = useState(false)
  const [uploadingKitPhoto, setUploadingKitPhoto] = useState(false)
  const kitPhotoRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    try {
      const h = { Authorization: 'Bearer ' + getToken() }
      const [bRes, sRes, dRes, cRes] = await Promise.all([
        fetch(BASE + '/boutiques/my', { headers: h }),
        fetch(BASE + '/boutiques/dashboard/stats', { headers: h }),
        fetch(BASE + '/boutiques/dashboard/demand-forecast', { headers: h }),
        fetch(BASE + '/contracts/my', { headers: h }),
      ])
      if (!bRes.ok) { setNotFound(true); return }
      const [b, s, d, contracts] = await Promise.all([
        bRes.json(), sRes.ok ? sRes.json() : null,
        dRes.ok ? dRes.json() : [], cRes.ok ? cRes.json() : [],
      ])
      setBoutique(b)
      if (s) setStats(s)
      if (Array.isArray(d)) setDemand(d)
      if (Array.isArray(contracts) && contracts.length > 0) setContract(contracts[0])
      const kRes = await fetch(BASE + '/boutiques/' + b.id + '/kits')
      if (kRes.ok) setKits(await kRes.json())
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  async function toggleOpen() {
    if (!boutique) return
    const res = await fetch(BASE + '/boutiques', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
      body: JSON.stringify({ open: !boutique.open }),
    })
    if (res.ok) setBoutique(prev => prev ? { ...prev, open: !prev.open } : null)
  }

  async function submitProduct() {
    if (!form.name || form.price <= 0) { alert('Preencha nome e preço'); return }
    setSubmitting(true)
    const payload = {
      name: form.name, description: form.description || undefined, price: form.price,
      unit: form.unit, category: form.category, available: form.available,
      stockQuantity: form.stockQuantity !== '' ? Number(form.stockQuantity) : null,
      imageUrl: form.imageUrl || undefined,
      discountPercent: form.discountEnabled && form.discountPercent > 0 ? form.discountPercent : null,
      discountValidUntil: form.discountEnabled && form.discountValidUntil
        ? new Date(form.discountValidUntil + 'T23:59:59').toISOString() : null,
    }
    try {
      if (editingId) {
        const res = await fetch(BASE + '/boutiques/products/' + editingId, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const updated = await res.json()
          setBoutique(prev => prev ? { ...prev, products: prev.products.map(p => p.id === updated.id ? updated : p) } : null)
        }
      } else {
        const res = await fetch(BASE + '/boutiques/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const created = await res.json()
          setBoutique(prev => prev ? { ...prev, products: [...prev.products, created] } : null)
          if (photoState === 'done') setPhotoCount(c => c + 1)
        }
      }
      setPhotoState('idle')
      cancelForm()
    } finally { setSubmitting(false) }
  }

  async function toggleProduct(id: string) {
    const res = await fetch(BASE + '/boutiques/products/' + id + '/toggle', {
      method: 'PATCH', headers: { Authorization: 'Bearer ' + getToken() },
    })
    if (res.ok) {
      const updated = await res.json()
      setBoutique(prev => prev ? { ...prev, products: prev.products.map(p => p.id === id ? updated : p) } : null)
    }
  }

  async function removeProduct(id: string) {
    if (!confirm('Remover produto?')) return
    const res = await fetch(BASE + '/boutiques/products/' + id, {
      method: 'DELETE', headers: { Authorization: 'Bearer ' + getToken() },
    })
    if (res.ok) setBoutique(prev => prev ? { ...prev, products: prev.products.filter(p => p.id !== id) } : null)
  }

  function startEdit(p: Product) {
    setEditingId(p.id)
    setForm({
      name: p.name, description: p.description || '', price: p.price, unit: p.unit,
      category: p.category, available: p.available, stockQuantity: p.stockQuantity ?? '',
      imageUrl: p.imageUrl || '',
      discountEnabled: !!p.discountPercent,
      discountPercent: p.discountPercent ?? 0,
      discountValidUntil: p.discountValidUntil ? p.discountValidUntil.slice(0, 10) : '',
    })
    setShowForm(true)
  }

  function cancelForm() { setShowForm(false); setEditingId(null); setForm(emptyForm) }

  async function handleAiPhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!photoInputRef.current) return
    photoInputRef.current.value = ''
    if (!file) return

    setPhotoState('analyzing')
    setPhotoError('')
    cancelForm()

    try {
      const compressed = await compressImage(file)
      const fd = new FormData()
      fd.append('file', compressed, 'produto.jpg')

      const res = await fetch(BASE + '/ai/suggest-product', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + getToken() },
        body: fd,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as any).error || 'Erro ao analisar imagem')
      }

      const suggestion = await res.json()

      setForm({
        name: suggestion.name || '',
        description: suggestion.description || '',
        price: 0,
        unit: suggestion.suggestedUnit || 'kg',
        category: suggestion.category || 'CARNE',
        available: true,
        stockQuantity: '',
        imageUrl: suggestion.imageUrl || '',
        discountEnabled: false,
        discountPercent: 0,
        discountValidUntil: '',
      })
      setPhotoState('done')
      setShowForm(true)
      setEditingId(null)
    } catch (err: any) {
      setPhotoState('error')
      setPhotoError(err.message || 'Falha ao analisar imagem')
      setForm(emptyForm)
      setShowForm(true)
    }
  }

  async function handleProductPhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!productPhotoRef.current) return
    productPhotoRef.current.value = ''
    if (!file) return
    setUploadingPhoto(true)
    try {
      const url = await uploadImageFile(file)
      setForm(f => ({ ...f, imageUrl: url }))
    } catch (err: any) {
      alert('Erro ao fazer upload: ' + err.message)
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function handleKitPhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!kitPhotoRef.current) return
    kitPhotoRef.current.value = ''
    if (!file) return
    setUploadingKitPhoto(true)
    try {
      const url = await uploadImageFile(file)
      setKitForm(f => ({ ...f, coverImageUrl: url }))
    } catch (err: any) {
      alert('Erro ao fazer upload: ' + err.message)
    } finally {
      setUploadingKitPhoto(false)
    }
  }

  async function submitKit() {
    if (!kitForm.name || kitForm.price <= 0) { alert('Preencha nome e preço'); return }
    setSubmittingKit(true)
    const payload = {
      name: kitForm.name,
      description: kitForm.description,
      price: kitForm.price,
      discountPrice: kitForm.discountPrice > 0 ? kitForm.discountPrice : null,
      coverImageUrl: kitForm.coverImageUrl || undefined,
      minGuests: kitForm.minGuests,
      maxGuests: kitForm.maxGuests,
      items: JSON.stringify(kitItems.filter(i => i.productName.trim())),
    }
    try {
      if (editingKitId) {
        const res = await fetch(BASE + '/boutiques/kits/' + editingKitId, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const updated = await res.json()
          setKits(prev => prev.map(k => k.id === updated.id ? updated : k))
        }
      } else {
        const res = await fetch(BASE + '/boutiques/kits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const created = await res.json()
          setKits(prev => [...prev, created])
        }
      }
      cancelKitForm()
    } finally { setSubmittingKit(false) }
  }

  async function removeKit(id: string) {
    if (!confirm('Remover pacote?')) return
    const res = await fetch(BASE + '/boutiques/kits/' + id, {
      method: 'DELETE', headers: { Authorization: 'Bearer ' + getToken() },
    })
    if (res.ok) setKits(prev => prev.filter(k => k.id !== id))
  }

  function startEditKit(k: Kit) {
    setEditingKitId(k.id)
    setKitForm({
      name: k.name, description: k.description,
      minGuests: k.minGuests, maxGuests: k.maxGuests,
      price: k.price, discountPrice: k.discountPrice ?? 0, coverImageUrl: k.coverImageUrl ?? '',
    })
    try { setKitItems(JSON.parse(k.items) || []) } catch { setKitItems([]) }
    setShowKitForm(true)
  }

  function cancelKitForm() { setShowKitForm(false); setEditingKitId(null); setKitForm(emptyKitForm); setKitItems([]) }
  function addKitItem() { setKitItems(prev => [...prev, { productName: '', quantity: 1, unit: 'kg' }]) }
  function updateKitItem(idx: number, field: keyof KitItem, value: string | number) {
    setKitItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }
  function removeKitItem(idx: number) { setKitItems(prev => prev.filter((_, i) => i !== idx)) }

  function copyReferralLink() {
    if (!stats?.referralCode) return
    navigator.clipboard.writeText(SITE_URL + '/r/' + stats.referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadQR() {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = 'qrcode-indicacao.png'
    a.click()
  }

  function copyBalcaoLink(url: string) {
    navigator.clipboard.writeText(url)
    setCopiedBalcao(true)
    setTimeout(() => setCopiedBalcao(false), 2000)
  }

  function downloadQRBalcao() {
    const canvas = qrBalcaoRef.current?.querySelector('canvas')
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = 'qrcode-balcao-eventos.png'
    a.click()
  }

  if (loading) return <p className="text-gray-400 p-6">Carregando...</p>

  if (notFound) return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">🥩</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">Cadastre seu açougue!</h1>
        <p className="text-gray-400 text-sm">Venda cortes nobres para clientes que estão organizando churrascos na sua cidade.</p>
      </div>

      <div className="space-y-3 mb-8">
        <div className="bg-gray-900 border border-orange-500/30 rounded-xl p-4 flex items-start gap-4">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">1</div>
          <div>
            <p className="font-semibold text-white">Cadastre seu açougue</p>
            <p className="text-gray-400 text-xs mt-0.5">Nome, endereço, fotos e horário de funcionamento.</p>
          </div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 flex items-start gap-4 opacity-60">
          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-gray-400 font-bold text-sm shrink-0">2</div>
          <div>
            <p className="font-semibold text-gray-300">Aguardar aprovação</p>
            <p className="text-gray-500 text-xs mt-0.5">Nossa equipe verifica em até 24h e avisa no WhatsApp.</p>
          </div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 flex items-start gap-4 opacity-60">
          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-gray-400 font-bold text-sm shrink-0">3</div>
          <div>
            <p className="font-semibold text-gray-300">Vender para festas</p>
            <p className="text-gray-500 text-xs mt-0.5">Adicione seus cortes e comece a receber pedidos automaticamente.</p>
          </div>
        </div>
      </div>

      <Link
        href="/boutiques/new"
        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold text-center block transition-colors"
      >
        Cadastrar meu açougue agora
      </Link>
      <p className="text-center text-xs text-gray-600 mt-3">Gratuito · Sem mensalidade · Comissão só nas vendas</p>
    </div>
  )

  if (!boutique) return null
  const referralUrl = stats?.referralCode ? SITE_URL + '/r/' + stats.referralCode : ''
  const balcaoUrl = SITE_URL + '/menu/novo?boutiqueId=' + boutique.id + '&utm_source=qr_balcao'
  const activeDiscountCount = boutique.products.filter(isDiscountActive).length

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{boutique.name}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{boutique.city}, {boutique.state}</p>
          <span className={'text-xs px-2 py-0.5 rounded-full mt-2 inline-block ' + (boutique.approved ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400')}>
            {boutique.approved ? 'Aprovado' : 'Aguardando aprovação'}
          </span>
        </div>
        <button onClick={toggleOpen} className={'px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors ' + (boutique.open ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300')}>
          {boutique.open ? 'Loja aberta — fechar' : 'Loja fechada — abrir'}
        </button>
      </div>

      {stats && stats.pendingOrdersCount > 0 && (
        <div className="bg-orange-500/15 border border-orange-500/40 rounded-xl px-5 py-3 flex items-center gap-3">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse shrink-0" />
          <p className="text-orange-300 font-semibold text-sm">
            Você tem <span className="font-black">{stats.pendingOrdersCount}</span> {stats.pendingOrdersCount === 1 ? 'pedido' : 'pedidos'} para preparar
          </p>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Faturamento 30 dias', value: 'R$ ' + stats.totalRevenue30days.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), color: 'text-green-400' },
            { label: 'Pedidos 30 dias', value: String(stats.totalOrders30days), color: 'text-blue-400' },
            { label: 'Pedidos pendentes', value: String(stats.pendingOrdersCount), color: 'text-orange-400' },
          ].map(c => (
            <div key={c.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <p className="text-xs text-gray-500 mb-1">{c.label}</p>
              <p className={'text-xl font-black ' + c.color}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-5 py-3">
        <p className="text-xs text-yellow-300">
          ⚠️ <strong>Contratos em revisão jurídica</strong> — os termos de parceria podem ser atualizados antes do lançamento oficial da plataforma.
        </p>
      </div>

      {/* ── ONBOARDING: aparece enquanto não tem produtos ── */}
      {boutique.products.length === 0 && (
        <div className="bg-gradient-to-br from-orange-500/15 to-amber-500/10 border border-orange-500/40 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🚀</span>
            <div>
              <h2 className="font-bold text-white">Primeiros passos — comece a vender hoje</h2>
              <p className="text-xs text-gray-400 mt-0.5">Complete abaixo para aparecer nas buscas e receber seus primeiros pedidos</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {[
              { done: true,  icon: '✅', label: 'Açougue cadastrado', sub: 'Você já está na plataforma!' },
              { done: boutique.approved, icon: boutique.approved ? '✅' : '⏳', label: 'Aprovação da equipe Tech Churras', sub: boutique.approved ? 'Aprovado — seu açougue está ativo' : 'Nossa equipe avisa no WhatsApp em até 24h' },
              { done: false, icon: '📦', label: 'Adicionar pelo menos 5 cortes de carne', sub: 'Abra "Meus Produtos" → "+ Produto" → selecione categoria Carne' },
              { done: false, icon: '🥗', label: 'Adicionar 1 acompanhamento (farofa, vinagrete...)', sub: 'Categoria "Acompanhamento" — churrasqueiros retiram tudo em uma visita' },
              { done: boutique.open, icon: boutique.open ? '✅' : '🔓', label: 'Abrir sua loja', sub: boutique.open ? 'Loja aberta — você já aparece nas buscas!' : 'Clique em "Loja fechada — abrir" no topo desta página' },
              { done: false, icon: '🖨️', label: 'Imprimir a placa do balcão', sub: 'Converta clientes do seu balcão em pedidos digitais — QR code exclusivo' },
            ].map((step, i) => (
              <div key={i} className={`flex items-start gap-3 rounded-xl px-4 py-3 ${step.done ? 'bg-green-500/10 border border-green-500/20' : 'bg-gray-900/60 border border-gray-800'}`}>
                <span className="text-lg shrink-0 mt-0.5">{step.icon}</span>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${step.done ? 'text-green-400 line-through opacity-70' : 'text-white'}`}>{step.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{step.sub}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2 flex-wrap">
            <a
              href="#produtos"
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
              onClick={() => setShowForm(true)}
            >
              + Adicionar produto agora
            </a>
            <a
              href="/boutiques/dashboard/qrcode-eventos"
              className="bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-semibold px-4 py-2 rounded-lg transition-colors border border-gray-700"
            >
              🖨️ Imprimir placa do balcão
            </a>
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm text-gray-300 uppercase tracking-wide">Meu Contrato</h2>
          {contract && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${contract.status === 'ACCEPTED' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              {contract.status === 'ACCEPTED' ? 'Aceito' : 'Pendente de assinatura'}
            </span>
          )}
        </div>
        {contract ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-gray-500 text-xs">Vigência</p><p className="text-white font-medium">{contract.durationMonths} meses</p></div>
              <div><p className="text-gray-500 text-xs">Gerado em</p><p className="text-white font-medium">{new Date(contract.generatedAt).toLocaleDateString('pt-BR')}</p></div>
              {contract.acceptedAt && <div><p className="text-gray-500 text-xs">Aceito em</p><p className="text-white font-medium">{new Date(contract.acceptedAt).toLocaleDateString('pt-BR')}</p></div>}
            </div>
            <button
              onClick={async () => {
                const res = await fetch(BASE + '/contracts/' + contract.id, { headers: { Authorization: 'Bearer ' + getToken() } })
                if (res.ok) { const c = await res.json(); setContractText(c.contractText); setShowContractText(true) }
              }}
              className="mt-2 text-sm text-orange-400 hover:text-orange-300 underline"
            >Visualizar contrato</button>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Nenhum contrato gerado ainda.</p>
        )}
      </div>

      {showContractText && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <div>
                <span className="font-bold text-orange-400">Contrato de Parceria</span>
                <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full">MINUTA — REV. JURÍDICA PENDENTE</span>
              </div>
              <button onClick={() => setShowContractText(false)} className="text-gray-500 hover:text-white text-xl leading-none">&times;</button>
            </div>
            <div className="p-4 bg-yellow-500/10 border-b border-yellow-500/20">
              <p className="text-xs text-yellow-300">Este contrato está em fase de revisão jurídica e pode ser atualizado antes do lançamento oficial.</p>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <pre className="font-mono text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{contractText}</pre>
            </div>
          </div>
        </div>
      )}

      {stats && stats.revenueByDay.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-sm font-semibold text-gray-300 mb-4">Faturamento — últimos 30 dias</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={stats.revenueByDay} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={(v: number) => 'R$' + v} />
              <Tooltip
                contentStyle={{ background: '#111', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                formatter={(v) => ['R$ ' + Number(v).toFixed(2), 'Faturamento']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-white">Previsão de Demanda — Próximos 14 dias</p>
            <p className="text-xs text-gray-500 mt-0.5">Pedidos confirmados e pagos com itens do seu açougue</p>
          </div>
        </div>
        {demand.length === 0 ? (
          <p className="text-gray-600 text-sm py-4 text-center">Nenhuma demanda prevista no momento</p>
        ) : (
          <div className="space-y-3">
            {demand.map(item => {
              const nextDate = new Date(item.nextEventDate)
              const daysUntil = Math.ceil((nextDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              const urgent = daysUntil <= 2
              return (
                <div key={item.category} className={'flex items-center justify-between gap-3 rounded-xl px-4 py-3 border ' + (urgent ? 'bg-orange-500/10 border-orange-500/30' : 'bg-gray-800 border-transparent')}>
                  <div className="flex items-center gap-3 min-w-0">
                    {urgent && <span className="text-orange-400 text-lg shrink-0">⚠️</span>}
                    <div className="min-w-0">
                      <p className={'text-sm font-semibold ' + (urgent ? 'text-orange-300' : 'text-white')}>{CATEGORIES[item.category] || item.category}</p>
                      <p className="text-xs text-gray-500">
                        {item.eventsCount} {item.eventsCount === 1 ? 'evento confirmado' : 'eventos confirmados'} ·
                        próximo em {daysUntil <= 0 ? 'hoje' : daysUntil === 1 ? 'amanhã' : daysUntil + ' dias'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={'text-base font-black ' + (urgent ? 'text-orange-400' : 'text-white')}>{item.totalQuantityNeeded}{item.unit}</p>
                    <p className="text-xs text-gray-500">necessários</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {stats?.referralCode && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-sm font-semibold text-white mb-1">Sistema de Indicação — QR Code de Balcão</p>
              <p className="text-xs text-gray-500">Clientes indicados ganham 15% de desconto no primeiro pedido</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-gray-500 mb-0.5">Indicações</p>
              <p className="text-xl font-black text-orange-400">{stats.referralCount}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="bg-white p-3 rounded-xl shrink-0">
              <QRCodeSVG value={referralUrl} size={120} level="H" />
            </div>
            <div className="flex-1 space-y-3">
              <div className="bg-gray-800 rounded-xl px-4 py-2.5 flex items-center justify-between gap-2">
                <p className="text-xs text-gray-300 font-mono truncate">{referralUrl}</p>
                <button onClick={copyReferralLink} className="shrink-0 text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
                  {copied ? '✓ Copiado' : 'Copiar link'}
                </button>
              </div>
              <div className="flex gap-2">
                <div ref={qrRef} className="hidden">
                  <QRCodeCanvas value={referralUrl} size={600} level="H" />
                </div>
                <button onClick={downloadQR} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Baixar QR Code
                </button>
                <Link href="/boutiques/dashboard/qrcode-impressao"
                  className="flex-1 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  🖨️ Imprimir Placa
                </Link>
              </div>
              <p className="text-xs text-gray-600">Código: <span className="font-mono font-bold text-gray-400">{stats.referralCode}</span></p>
            </div>
          </div>
        </div>
      )}

      {/* ── BALCÃO DE EVENTOS ───────────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500/10 to-transparent border-b border-gray-800 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center text-lg shrink-0">
              🏪
            </div>
            <div>
              <p className="font-bold text-white text-sm">Balcão de Eventos — Máquina de vendas</p>
              <p className="text-xs text-gray-500">Transforme cada cliente do balcão em um evento completo Tech Churras</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* 3 frentes */}
          <div>
            <p className="text-xs text-orange-400 font-bold uppercase tracking-widest mb-3">Suas 3 frentes de faturamento</p>
            <div className="space-y-2">
              {[
                {
                  n: '1', cor: 'border-orange-500/40 bg-orange-500/5',
                  badge: 'Ativo agora', badgeCor: 'bg-orange-500/20 text-orange-400',
                  titulo: 'Clientes da Tech Churras',
                  desc: 'Novos clientes digitais que chegam pelo app — você recebe o pedido sem fazer nada.',
                },
                {
                  n: '2', cor: 'border-amber-500/40 bg-amber-500/5',
                  badge: 'Ativo agora', badgeCor: 'bg-amber-500/20 text-amber-400',
                  titulo: 'Clientes do seu balcão',
                  desc: 'Quem já está comprando carne para um evento — o QR abaixo converte a visita em churrasco completo.',
                },
                {
                  n: '3', cor: 'border-blue-500/30 bg-blue-500/5',
                  badge: 'Futuro próximo', badgeCor: 'bg-blue-500/20 text-blue-400',
                  titulo: 'Seus próprios churrasqueiros',
                  desc: 'Com volume, você monta sua equipe de churrasqueiros parceiros e multiplica o faturamento sem sair do lugar.',
                },
              ].map(f => (
                <div key={f.n} className={`flex items-start gap-3 border rounded-xl p-3.5 ${f.cor}`}>
                  <div className="w-7 h-7 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xs font-black text-white shrink-0 mt-0.5">
                    {f.n}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-sm font-bold text-white">{f.titulo}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${f.badgeCor}`}>{f.badge}</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* QR do balcão */}
          <div className="border border-dashed border-orange-500/30 rounded-xl p-4">
            <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-3">QR Code — Balcão (Frente 2)</p>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="bg-white p-3 rounded-xl shrink-0">
                <QRCodeSVG value={balcaoUrl} size={110} level="H" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="bg-gray-800 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                  <p className="text-xs text-gray-400 font-mono truncate">{balcaoUrl}</p>
                  <button
                    onClick={() => copyBalcaoLink(balcaoUrl)}
                    className="shrink-0 text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    {copiedBalcao ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>

                <div className="flex gap-2">
                  <div ref={qrBalcaoRef} className="hidden">
                    <QRCodeCanvas value={balcaoUrl} size={600} level="H" />
                  </div>
                  <button
                    onClick={downloadQRBalcao}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium px-3 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Baixar QR
                  </button>
                  <Link
                    href="/boutiques/dashboard/qrcode-eventos"
                    className="flex-1 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-medium px-3 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    🖨️ Imprimir Placa
                  </Link>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">
                  Cole na frente do balcão. Quando o cliente escanear, {boutique.name} já estará pré-selecionado no pedido.
                </p>
              </div>
            </div>
          </div>

          {/* Script para atendente */}
          <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Script para o seu atendente</p>
            <div className="bg-gray-900 rounded-lg px-4 py-3 border border-gray-700">
              <p className="text-sm text-gray-200 leading-relaxed italic">
                "Você vai fazer churrasco? A gente tem parceria com churrasqueiros profissionais certificados — você escaneia esse QR aqui, escolhe o churrasqueiro e a carne já vem separada daqui mesmo. Tudo em um app, fácil."
              </p>
            </div>
            <p className="text-xs text-gray-600 mt-2">50% do trabalho já foi feito — o cliente está comprando carne, basta converter para o pacote completo.</p>
          </div>
        </div>
      </div>

      {stats && stats.recentOrders.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-sm font-semibold text-white mb-4">Pedidos Recentes</p>
          <div className="space-y-2">
            {stats.recentOrders.map(o => (
              <Link key={o.id} href={'/orders/' + o.id} className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-750 rounded-xl transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={'text-xs text-white px-2 py-0.5 rounded-full font-medium shrink-0 ' + (STATUS_COLOR[o.status] || 'bg-gray-500')}>
                    {STATUS_LABEL[o.status] || o.status}
                  </span>
                  <p className="text-sm font-medium text-gray-300 truncate">{o.customerName}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-orange-400">R$ {o.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <p className="text-xs text-gray-600">{new Date(o.eventDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── PACOTES DE CHURRASCO ─────────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-white">Pacotes de Churrasco</h2>
            <p className="text-xs text-gray-500 mt-0.5">Monte kits completos com desconto para seus clientes</p>
          </div>
          <button
            onClick={() => { cancelKitForm(); setShowKitForm(true) }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Novo pacote
          </button>
        </div>

        {showKitForm && (
          <div className="bg-gray-800 rounded-xl p-4 mb-4 border border-orange-500/30">
            <h3 className="font-semibold text-sm mb-3">{editingKitId ? 'Editar pacote' : 'Novo pacote'}</h3>

            {/* Cover photo */}
            <div className="mb-4">
              {kitForm.coverImageUrl ? (
                <div className="relative w-full h-32 rounded-xl overflow-hidden mb-2">
                  <img src={kitForm.coverImageUrl} alt="capa" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setKitForm(f => ({ ...f, coverImageUrl: '' }))}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/80"
                  >✕</button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => kitPhotoRef.current?.click()}
                  disabled={uploadingKitPhoto}
                  className="w-full h-20 border-2 border-dashed border-gray-600 rounded-xl flex items-center justify-center gap-2 text-sm text-gray-400 hover:border-orange-500 hover:text-orange-400 transition-colors mb-2"
                >
                  {uploadingKitPhoto ? '⏳ Enviando...' : '📷 Foto de capa (opcional)'}
                </button>
              )}
              <input ref={kitPhotoRef} type="file" accept="image/*" className="hidden" onChange={handleKitPhotoUpload} />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="col-span-2">
                <label className="block text-xs text-gray-400 mb-1">Nome do pacote *</label>
                <input type="text" value={kitForm.name} onChange={e => setKitForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="Ex: Kit Família 10 pessoas" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-400 mb-1">Descrição</label>
                <input type="text" value={kitForm.description} onChange={e => setKitForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="O que está incluído..." />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Mín. pessoas</label>
                <input type="number" min={1} value={kitForm.minGuests} onChange={e => setKitForm(f => ({ ...f, minGuests: +e.target.value }))}
                  className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Máx. pessoas</label>
                <input type="number" min={1} value={kitForm.maxGuests} onChange={e => setKitForm(f => ({ ...f, maxGuests: +e.target.value }))}
                  className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Preço normal (R$) *</label>
                <input type="number" min={0} step="0.01" value={kitForm.price} onChange={e => setKitForm(f => ({ ...f, price: +e.target.value }))}
                  className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Preço com desconto (R$)</label>
                <input type="number" min={0} step="0.01" value={kitForm.discountPrice || ''} onChange={e => setKitForm(f => ({ ...f, discountPrice: +e.target.value }))}
                  className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="0 = sem desconto" />
              </div>
            </div>

            {kitForm.price > 0 && kitForm.discountPrice > 0 && kitForm.discountPrice < kitForm.price && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2 mb-3 text-xs text-green-400">
                Economia de <strong>R$ {(kitForm.price - kitForm.discountPrice).toFixed(2)}</strong> ({Math.round((1 - kitForm.discountPrice / kitForm.price) * 100)}% de desconto)
              </div>
            )}

            {/* Kit items */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-400">Itens do pacote</label>
                <button type="button" onClick={addKitItem} className="text-xs text-orange-400 hover:text-orange-300">+ Adicionar item</button>
              </div>
              {kitItems.length === 0 && (
                <p className="text-xs text-gray-600 py-2 text-center">Nenhum item adicionado</p>
              )}
              <div className="space-y-2">
                {kitItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input type="text" value={item.productName} onChange={e => updateKitItem(idx, 'productName', e.target.value)}
                      className="flex-1 bg-gray-700 rounded-lg px-2 py-1.5 text-xs text-white" placeholder="Nome do produto" />
                    <input type="number" min={0.1} step="0.1" value={item.quantity} onChange={e => updateKitItem(idx, 'quantity', +e.target.value)}
                      className="w-16 bg-gray-700 rounded-lg px-2 py-1.5 text-xs text-white" />
                    <input type="text" value={item.unit} onChange={e => updateKitItem(idx, 'unit', e.target.value)}
                      className="w-12 bg-gray-700 rounded-lg px-2 py-1.5 text-xs text-white" placeholder="kg" />
                    <button type="button" onClick={() => removeKitItem(idx)} className="text-red-400 hover:text-red-300 text-sm">✕</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={submitKit} disabled={submittingKit} className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
                {submittingKit ? 'Salvando...' : editingKitId ? 'Salvar' : 'Criar pacote'}
              </button>
              <button onClick={cancelKitForm} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm">Cancelar</button>
            </div>
          </div>
        )}

        {kits.length === 0 && !showKitForm ? (
          <p className="text-gray-600 text-sm text-center py-4">Nenhum pacote criado. Monte seu primeiro kit!</p>
        ) : (
          <div className="space-y-3">
            {kits.map(k => {
              const saving = k.discountPrice && k.discountPrice < k.price ? k.price - k.discountPrice : 0
              return (
                <div key={k.id} className="bg-gray-800 rounded-xl overflow-hidden">
                  <div className="flex items-start gap-3 p-4">
                    {k.coverImageUrl ? (
                      <img src={k.coverImageUrl} alt={k.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gray-700 flex items-center justify-center shrink-0 text-2xl">🍖</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-white">{k.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{k.minGuests}–{k.maxGuests} pessoas</p>
                          {k.description && <p className="text-xs text-gray-500 mt-1">{k.description}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          {saving > 0 ? (
                            <>
                              <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full font-bold block mb-1">
                                PACOTE — Economize R${saving.toFixed(2)}
                              </span>
                              <p className="text-xs text-gray-500 line-through">R$ {k.price.toFixed(2)}</p>
                              <p className="text-sm font-bold text-orange-400">R$ {k.discountPrice!.toFixed(2)}</p>
                            </>
                          ) : (
                            <p className="text-sm font-bold text-orange-400">R$ {k.price.toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-700 px-4 py-2 flex gap-2 justify-end">
                    <button onClick={() => startEditKit(k)} className="text-xs text-blue-400 hover:text-blue-300 border border-blue-900 px-2 py-1 rounded">Editar</button>
                    <button onClick={() => removeKit(k.id)} className="text-xs text-red-400 hover:text-red-300 border border-red-900 px-2 py-1 rounded">Remover</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── PRODUTOS ─────────────────────────────────────────────────────── */}
      <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
        <p className="text-sm text-orange-300 font-medium mb-0.5">Mantenha seus preços sempre atualizados</p>
        <p className="text-xs text-orange-400/80">Eles aparecem diretamente para os clientes no momento do pedido.</p>
      </div>

      {activeDiscountCount > 0 && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-sm text-green-400">
          <strong>{activeDiscountCount}</strong> {activeDiscountCount === 1 ? 'produto com desconto ativo' : 'produtos com desconto ativo'}
        </div>
      )}

      <input ref={photoInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleAiPhotoSelect} />
      <input ref={productPhotoRef} type="file" accept="image/*" className="hidden" onChange={handleProductPhotoUpload} />

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-lg font-semibold">
          Produtos ({boutique.products.length})
          {photoCount > 0 && <span className="ml-2 text-xs text-green-400 font-normal">{photoCount} adicionado{photoCount > 1 ? 's' : ''} nesta sessão</span>}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => photoInputRef.current?.click()}
            disabled={photoState === 'analyzing'}
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {photoState === 'analyzing' ? (
              <><span className="inline-block w-3.5 h-3.5 border-2 border-gray-400/30 border-t-gray-300 rounded-full animate-spin" /> Analisando...</>
            ) : <>📸 Adicionar por foto</>}
          </button>
          <button onClick={() => { cancelForm(); setShowForm(true) }} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            + Adicionar produto
          </button>
        </div>
      </div>

      {photoState === 'done' && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-sm text-green-400">
          ✅ IA identificou o produto — confira e ajuste os dados abaixo. <strong>Preencha o preço</strong> antes de salvar.
        </div>
      )}
      {photoState === 'error' && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 text-sm text-yellow-400">
          ⚠️ {photoError || 'Não foi possível identificar o produto'} — preencha manualmente.
        </div>
      )}

      {showForm && (
        <div className="bg-gray-900 rounded-xl p-5 border border-orange-500/30">
          <h3 className="font-semibold mb-4">{editingId ? 'Editar produto' : 'Novo produto'}</h3>

          {/* Product photo */}
          <div className="mb-4">
            {form.imageUrl ? (
              <div className="relative w-24 h-24 rounded-xl overflow-hidden mb-2">
                <img src={form.imageUrl} alt="produto" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, imageUrl: '' }))}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-black/80"
                >✕</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => productPhotoRef.current?.click()}
                disabled={uploadingPhoto}
                className="flex items-center gap-2 text-xs text-gray-400 hover:text-orange-400 border border-dashed border-gray-600 hover:border-orange-500 rounded-lg px-3 py-2 transition-colors mb-2"
              >
                {uploadingPhoto ? '⏳ Enviando...' : '📷 Adicionar foto do produto (opcional)'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Nome *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white" placeholder="Ex: Picanha, Fraldinha..." />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Descrição</label>
              <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white" placeholder="Opcional" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Unidade</label>
              <input type="text" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white" placeholder="kg, un..." />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{priceLabel(form.unit)} *</label>
              <input type="number" min={0} step="0.01" value={form.price} onChange={e => setForm({ ...form, price: +e.target.value })}
                className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Categoria</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white">
                {Object.entries(CATEGORIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Estoque (opcional)</label>
              <input type="number" min={0} value={form.stockQuantity}
                onChange={e => setForm({ ...form, stockQuantity: e.target.value === '' ? '' : +e.target.value })}
                className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white" placeholder="Qtd." />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <button type="button" onClick={() => setForm(f => ({ ...f, available: !f.available }))}
                  className={'relative w-11 h-6 rounded-full transition-colors shrink-0 ' + (form.available ? 'bg-orange-500' : 'bg-gray-700')}>
                  <span className={'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ' + (form.available ? 'translate-x-5' : 'translate-x-0')} />
                </button>
                <span className="text-sm text-gray-300">{form.available ? 'Disponível para pedidos' : 'Indisponível'}</span>
              </label>
            </div>

            {/* Desconto */}
            <div className="col-span-2 border-t border-gray-800 pt-3">
              <label className="flex items-center gap-3 cursor-pointer mb-3">
                <button type="button" onClick={() => setForm(f => ({ ...f, discountEnabled: !f.discountEnabled }))}
                  className={'relative w-11 h-6 rounded-full transition-colors shrink-0 ' + (form.discountEnabled ? 'bg-green-500' : 'bg-gray-700')}>
                  <span className={'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ' + (form.discountEnabled ? 'translate-x-5' : 'translate-x-0')} />
                </button>
                <span className="text-sm text-gray-300 font-medium">Ativar desconto</span>
              </label>
              {form.discountEnabled && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Percentual de desconto (%)</label>
                    <input type="number" min={0} max={100} step={1} value={form.discountPercent}
                      onChange={e => setForm(f => ({ ...f, discountPercent: +e.target.value }))}
                      className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white" placeholder="Ex: 15" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Válido até (opcional)</label>
                    <input type="date" value={form.discountValidUntil}
                      onChange={e => setForm(f => ({ ...f, discountValidUntil: e.target.value }))}
                      className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white" />
                  </div>
                  {form.discountPercent > 0 && form.price > 0 && (
                    <div className="col-span-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
                      <p className="text-xs text-green-400">
                        Preço com desconto: <strong>R$ {discountedPrice(form.price, form.discountPercent).toFixed(2)}</strong>/{form.unit}
                        {' '}(de R$ {form.price.toFixed(2)})
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submitProduct} disabled={submitting} className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
              {submitting ? 'Salvando...' : editingId ? 'Salvar' : 'Adicionar'}
            </button>
            <button onClick={cancelForm} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm">Cancelar</button>
          </div>
        </div>
      )}

      {boutique.products.length === 0 && !showForm && (
        <div className="bg-gray-900 rounded-xl p-8 text-center text-gray-400">
          <p className="mb-2">Nenhum produto cadastrado ainda.</p>
          <p className="text-xs text-gray-500">Adicione seus cortes e produtos para que apareçam no momento do pedido dos clientes.</p>
        </div>
      )}

      <div className="space-y-2">
        {boutique.products.map(p => {
          const active = isDiscountActive(p)
          return (
            <div key={p.id} className="bg-gray-900 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center shrink-0 text-xl">🥩</div>
                )}
                <button type="button" onClick={() => toggleProduct(p.id)} title={p.available ? 'Clique para desativar' : 'Clique para ativar'}
                  className={'relative w-10 h-5 rounded-full transition-colors shrink-0 ' + (p.available ? 'bg-green-500' : 'bg-gray-600')}>
                  <span className={'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ' + (p.available ? 'translate-x-5' : 'translate-x-0')} />
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{p.name}</p>
                    {active && (
                      <span className="text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-bold shrink-0">
                        {p.discountPercent}% OFF
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    {CATEGORIES[p.category] || p.category} · {p.unit}
                    {p.stockQuantity != null && <span> · estoque: {p.stockQuantity}</span>}
                    {active && p.discountValidUntil && (
                      <span className="ml-1 text-orange-400"> · até {new Date(p.discountValidUntil).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <div className="text-right">
                  {active ? (
                    <>
                      <p className="text-xs text-gray-500 line-through leading-none">R$ {p.price.toFixed(2)}</p>
                      <p className="text-sm font-bold text-orange-400">R$ {discountedPrice(p.price, p.discountPercent!).toFixed(2)}/{p.unit}</p>
                    </>
                  ) : (
                    <span className="text-orange-400 font-semibold text-sm">R$ {p.price.toFixed(2)}/{p.unit}</span>
                  )}
                </div>
                <button onClick={() => startEdit(p)} className="text-xs text-blue-400 hover:text-blue-300 border border-blue-900 px-2 py-1 rounded">Editar</button>
                <button onClick={() => removeProduct(p.id)} className="text-xs text-red-400 hover:text-red-300 border border-red-900 px-2 py-1 rounded">Remover</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
