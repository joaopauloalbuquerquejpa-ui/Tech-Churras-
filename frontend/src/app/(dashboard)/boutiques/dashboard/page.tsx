'use client'
import { API_URL } from '@/lib/api'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react'
import { ChartIcon, GiftIcon, MeatIcon, ChefIcon, CheckIcon, RocketIcon, PersonIcon, ChatIcon, CameraIcon, StoreIcon, PhoneIcon, PrinterIcon, CashIcon } from '@/components/icons/Icons'
import type { ComponentType } from 'react'
import PhoneVerificationBanner from '@/components/PhoneVerificationBanner'

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
  const res = await fetch(API_URL + '/upload/image', {
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
  pixKey?: string | null; cpfCnpj?: string | null
  offersSideDishPrep?: boolean
}

interface OrderItem { name: string; quantity: number; unit: string }
interface Stats {
  totalRevenue30days: number; totalOrders30days: number; pendingOrdersCount: number
  revenueByDay: { date: string; revenue: number }[]
  recentOrders: { id: string; customerName: string; customerPhone?: string | null; grillmasterName?: string | null; totalPrice: number; status: string; eventDate: string; guestCount?: number; items?: OrderItem[] }[]
  referralCode: string | null; referralCount: number
  trialActive?: boolean; trialOrdersCompleted?: number; trialOrdersThreshold?: number
}

interface DemandItem {
  category: string; totalQuantityNeeded: number; unit: string; eventsCount: number; nextEventDate: string
}

interface MonthlyReport {
  month: string
  monthLabel: string
  isCurrentMonth: boolean
  growthPct: number | null
  availableSince: string
  ordersCompleted: number
  grossRevenue: number
  netRevenue: number
  avgOrderValue: number
  topProducts: { name: string; unit: string; quantity: number; revenue: number }[]
}

interface ReferralStats {
  referralCode: string; referralLink: string
  totalReferrals: number; pendingBonus: number; paidBonus: number
}

interface KitItem {
  productId: string; productName: string; quantity: number; unit: string; price: number
}

interface Kit {
  id: string; name: string; description: string; price: number
  discountPrice?: number | null; coverImageUrl?: string | null
  minGuests: number; maxGuests: number; items: string
}

interface SocialPost {
  id: string; imageUrl: string; caption: string; context?: string | null; createdAt: string
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

type Tab = 'overview' | 'referrals' | 'balcao' | 'produtos' | 'conteudo'

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
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null)
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null)
  const [monthlyReportLoading, setMonthlyReportLoading] = useState(false)
  const [reportMonth, setReportMonth] = useState<string | null>(null)
  const [contract, setContract] = useState<{ id: string; status: string; durationMonths: number; acceptedAt: string | null; generatedAt: string } | null>(null)
  const [showContractText, setShowContractText] = useState(false)
  const [contractText, setContractText] = useState('')
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedReferral, setCopiedReferral] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [readyOrderIds, setReadyOrderIds] = useState<Set<string>>(new Set())
  const [confirmingReadyId, setConfirmingReadyId] = useState<string | null>(null)
  const [acceptedOrderIds, setAcceptedOrderIds] = useState<Set<string>>(new Set())
  const [rejectedOrderIds, setRejectedOrderIds] = useState<Set<string>>(new Set())
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null)
  const qrRef = useRef<HTMLDivElement>(null)
  const qrBalcaoRef = useRef<HTMLDivElement>(null)
  const qrIndicacaoRef = useRef<HTMLDivElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const productPhotoRef = useRef<HTMLInputElement>(null)
  const [copiedBalcao, setCopiedBalcao] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(true)
  const [pixForm, setPixForm] = useState({ pixKey: '', cpfCnpj: '' })
  const [savingPix, setSavingPix] = useState(false)
  const [pixMsg, setPixMsg] = useState('')

  const [photoState, setPhotoState] = useState<'idle' | 'analyzing' | 'done' | 'error'>('idle')
  const [photoError, setPhotoError] = useState('')
  const [photoCount, setPhotoCount] = useState(0)

  const [showKitForm, setShowKitForm] = useState(false)
  const [editingKitId, setEditingKitId] = useState<string | null>(null)
  const [kitForm, setKitForm] = useState(emptyKitForm)
  const [kitItems, setKitItems] = useState<KitItem[]>([])
  const [submittingKit, setSubmittingKit] = useState(false)
  const [generatingKitItems, setGeneratingKitItems] = useState(false)
  const [kitItemsError, setKitItemsError] = useState('')
  const [uploadingKitPhoto, setUploadingKitPhoto] = useState(false)
  const kitPhotoRef = useRef<HTMLInputElement>(null)

  // ── Divulgação (conteúdo de redes sociais com fotos reais) ────────────
  const [contentPreviewUrl, setContentPreviewUrl] = useState('')
  const [contentContext, setContentContext] = useState('')
  const [generatingPost, setGeneratingPost] = useState(false)
  const [postError, setPostError] = useState('')
  const [currentPost, setCurrentPost] = useState<SocialPost | null>(null)
  const [editableCaption, setEditableCaption] = useState('')
  const [brandedImageUrl, setBrandedImageUrl] = useState('')
  const [copiedCaption, setCopiedCaption] = useState(false)
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [postsLoaded, setPostsLoaded] = useState(false)
  const contentPhotoRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchAll() }, [])

  useEffect(() => {
    if (activeTab === 'conteudo' && !postsLoaded) fetchSocialPosts()
  }, [activeTab, postsLoaded])

  useEffect(() => {
    if (activeTab !== 'overview') return
    fetchMonthlyReport(reportMonth ?? undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, reportMonth])

  async function fetchMonthlyReport(month?: string) {
    setMonthlyReportLoading(true)
    try {
      const url = month ? `${API_URL}/boutiques/dashboard/monthly-report?month=${month}` : `${API_URL}/boutiques/dashboard/monthly-report`
      const res = await fetch(url, { headers: { Authorization: 'Bearer ' + getToken() } })
      if (res.ok) setMonthlyReport(await res.json())
    } catch { /* silencioso — relatório é informativo, não bloqueia o dashboard */ }
    finally { setMonthlyReportLoading(false) }
  }

  function shiftReportMonth(delta: number) {
    const base = monthlyReport?.month ?? new Date().toISOString().slice(0, 7)
    const [y, m] = base.split('-').map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    setReportMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  async function fetchAll() {
    try {
      const h = { Authorization: 'Bearer ' + getToken() }
      const [bRes, sRes, dRes, cRes, rRes] = await Promise.all([
        fetch(API_URL + '/boutiques/my', { headers: h }),
        fetch(API_URL + '/boutiques/dashboard/stats', { headers: h }),
        fetch(API_URL + '/boutiques/dashboard/demand-forecast', { headers: h }),
        fetch(API_URL + '/contracts/my', { headers: h }),
        fetch(API_URL + '/boutiques/dashboard/referrals', { headers: h }),
      ])
      if (!bRes.ok) { setNotFound(true); return }
      const [b, s, d, contracts] = await Promise.all([
        bRes.json(), sRes.ok ? sRes.json() : null,
        dRes.ok ? dRes.json() : [], cRes.ok ? cRes.json() : [],
      ])
      setBoutique(b)
      setPixForm({ pixKey: b.pixKey ?? '', cpfCnpj: b.cpfCnpj ?? '' })
      if (s) setStats(s)
      if (Array.isArray(d)) setDemand(d)
      if (Array.isArray(contracts) && contracts.length > 0) setContract(contracts[0])
      if (rRes.ok) setReferralStats(await rRes.json())
      const kRes = await fetch(API_URL + '/boutiques/' + b.id + '/kits')
      if (kRes.ok) setKits(await kRes.json())
      fetch(API_URL + '/auth/me', { headers: h }).then(r => r.ok ? r.json() : null).then(me => { if (me) setPhoneVerified(!!me.phoneVerified) }).catch(() => {})
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  async function toggleOpen() {
    if (!boutique) return
    const res = await fetch(API_URL + '/boutiques', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
      body: JSON.stringify({ open: !boutique.open }),
    })
    if (res.ok) setBoutique(prev => prev ? { ...prev, open: !prev.open } : null)
  }

  async function toggleOffersSideDishPrep() {
    if (!boutique) return
    const res = await fetch(API_URL + '/boutiques', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
      body: JSON.stringify({ offersSideDishPrep: !boutique.offersSideDishPrep }),
    })
    if (res.ok) setBoutique(prev => prev ? { ...prev, offersSideDishPrep: !prev.offersSideDishPrep } : null)
  }

  async function handleSavePix() {
    setSavingPix(true); setPixMsg('')
    try {
      const res = await fetch(API_URL + '/boutiques', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
        body: JSON.stringify(pixForm),
      })
      if (res.ok) {
        const updated = await res.json()
        setBoutique(prev => prev ? { ...prev, ...updated } : null)
        setPixMsg('Salvo!')
      } else {
        const d = await res.json()
        setPixMsg('Erro: ' + (d.error ?? 'tente novamente'))
      }
    } finally { setSavingPix(false) }
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
        const res = await fetch(API_URL + '/boutiques/products/' + editingId, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const updated = await res.json()
          setBoutique(prev => prev ? { ...prev, products: prev.products.map(p => p.id === updated.id ? updated : p) } : null)
        }
      } else {
        const res = await fetch(API_URL + '/boutiques/products', {
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
    const res = await fetch(API_URL + '/boutiques/products/' + id + '/toggle', {
      method: 'PATCH', headers: { Authorization: 'Bearer ' + getToken() },
    })
    if (res.ok) {
      const updated = await res.json()
      setBoutique(prev => prev ? { ...prev, products: prev.products.map(p => p.id === id ? updated : p) } : null)
    }
  }

  async function removeProduct(id: string) {
    if (!confirm('Remover produto?')) return
    const res = await fetch(API_URL + '/boutiques/products/' + id, {
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

      const res = await fetch(API_URL + '/ai/suggest-product', {
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

  async function fetchSocialPosts() {
    setLoadingPosts(true)
    try {
      const res = await fetch(API_URL + '/ai/social-posts', { headers: { Authorization: 'Bearer ' + getToken() } })
      if (res.ok) setSocialPosts(await res.json())
    } finally {
      setLoadingPosts(false)
      setPostsLoaded(true)
    }
  }

  function renderBrandedImage(imageUrl: string, name: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          if (!ctx) { reject(new Error('canvas indisponível')); return }
          ctx.drawImage(img, 0, 0)

          const scrimHeight = Math.round(canvas.height * 0.3)
          const grad = ctx.createLinearGradient(0, canvas.height - scrimHeight, 0, canvas.height)
          grad.addColorStop(0, 'rgba(10,8,6,0)')
          grad.addColorStop(1, 'rgba(10,8,6,0.82)')
          ctx.fillStyle = grad
          ctx.fillRect(0, canvas.height - scrimHeight, canvas.width, scrimHeight)

          const baseX = canvas.width * 0.055
          const baseY = canvas.height - canvas.height * 0.065
          const nameSize = Math.round(canvas.width * 0.05)
          const tagSize = Math.round(nameSize * 0.42)

          ctx.textBaseline = 'alphabetic'
          ctx.fillStyle = '#ff7a3d'
          ctx.font = `700 ${tagSize}px Arial, sans-serif`
          ctx.fillText('TECH CHURRAS · PARCEIRO', baseX, baseY - nameSize - 6)

          ctx.fillStyle = '#ffffff'
          ctx.font = `800 ${nameSize}px Arial, sans-serif`
          ctx.fillText(name, baseX, baseY)

          resolve(canvas.toDataURL('image/jpeg', 0.92))
        } catch (err) { reject(err) }
      }
      img.onerror = () => reject(new Error('Não foi possível carregar a imagem'))
      img.src = imageUrl
    })
  }

  async function handleContentPhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setContentPreviewUrl(URL.createObjectURL(file))
    setCurrentPost(null)
    setBrandedImageUrl('')
    setPostError('')
    await generateSocialPost(file)
  }

  async function generateSocialPost(file: File) {
    setGeneratingPost(true)
    setPostError('')
    try {
      const compressed = await compressImage(file)
      const fd = new FormData()
      fd.append('context', contentContext)
      fd.append('file', compressed, 'foto.jpg')
      const res = await fetch(API_URL + '/ai/social-post', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + getToken() },
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha ao gerar post')
      setCurrentPost(data)
      setEditableCaption(data.caption)
      setSocialPosts(prev => [data, ...prev])
      try {
        const branded = await renderBrandedImage(data.imageUrl, boutique?.name || '')
        setBrandedImageUrl(branded)
      } catch { /* preview sem moldura ainda funciona */ }
    } catch (err: any) {
      setPostError(err.message || 'Erro ao gerar conteúdo')
    } finally {
      setGeneratingPost(false)
      if (contentPhotoRef.current) contentPhotoRef.current.value = ''
    }
  }

  function copyCaption() {
    if (!editableCaption) return
    navigator.clipboard.writeText(editableCaption)
    setCopiedCaption(true)
    setTimeout(() => setCopiedCaption(false), 2000)
  }

  function downloadBrandedImage() {
    if (!brandedImageUrl) return
    const a = document.createElement('a')
    a.href = brandedImageUrl
    a.download = 'tech-churras-post.jpg'
    a.click()
  }

  async function deleteSocialPost(id: string) {
    if (!confirm('Remover este post do histórico?')) return
    const res = await fetch(API_URL + '/ai/social-posts/' + id, {
      method: 'DELETE', headers: { Authorization: 'Bearer ' + getToken() },
    })
    if (res.ok) setSocialPosts(prev => prev.filter(p => p.id !== id))
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
        const res = await fetch(API_URL + '/boutiques/kits/' + editingKitId, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const updated = await res.json()
          setKits(prev => prev.map(k => k.id === updated.id ? updated : k))
        }
      } else {
        const res = await fetch(API_URL + '/boutiques/kits', {
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
    const res = await fetch(API_URL + '/boutiques/kits/' + id, {
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
    try {
      const parsed = JSON.parse(k.items) || []
      // Enrich items with product data if productId is present
      const productMap = new Map((boutique?.products || []).map(p => [p.id, p]))
      setKitItems(parsed.map((item: KitItem) => {
        const p = item.productId ? productMap.get(item.productId) : null
        return { ...item, price: item.price ?? p?.price ?? 0, unit: item.unit ?? p?.unit ?? 'kg' }
      }))
    } catch { setKitItems([]) }
    setShowKitForm(true)
  }

  function cancelKitForm() { setShowKitForm(false); setEditingKitId(null); setKitForm(emptyKitForm); setKitItems([]) }
  function addKitItem() { setKitItems(prev => [...prev, { productId: '', productName: '', quantity: 1, unit: 'kg', price: 0 }]) }
  function selectKitProduct(idx: number, productId: string) {
    const p = boutique?.products.find(p => p.id === productId)
    if (!p) return
    setKitItems(prev => prev.map((item, i) => i === idx
      ? { ...item, productId: p.id, productName: p.name, unit: p.unit, price: p.price }
      : item
    ))
  }
  function updateKitItem(idx: number, field: keyof KitItem, value: string | number) {
    setKitItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }
  function removeKitItem(idx: number) { setKitItems(prev => prev.filter((_, i) => i !== idx)) }
  function autoCalcKitPrice() {
    const total = kitItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
    if (total > 0) setKitForm(f => ({ ...f, price: +total.toFixed(2) }))
  }

  function copyReferralLink() {
    if (!stats?.referralCode) return
    navigator.clipboard.writeText(SITE_URL + '/r/' + stats.referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function copyFullReferralLink() {
    const link = referralStats?.referralLink ?? (stats?.referralCode ? SITE_URL + '/r/' + stats.referralCode : '')
    if (!link) return
    navigator.clipboard.writeText(link)
    setCopiedReferral(true)
    setTimeout(() => setCopiedReferral(false), 2000)
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

  function downloadQRIndicacao() {
    const canvas = qrIndicacaoRef.current?.querySelector('canvas')
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
          <MeatIcon size={36} className="text-orange-400" />
        </div>
        <h1 className="font-display text-2xl font-bold mb-2">Cadastre seu açougue!</h1>
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
      <p className="text-center text-xs text-gray-600 mt-3">R$ 369/mês + 10% de comissão · Grátis até o 3º pedido como Açougue Embaixador</p>
    </div>
  )

  if (!boutique) return null

  const referralCode = referralStats?.referralCode ?? stats?.referralCode ?? null
  const referralLink = referralStats?.referralLink ?? (referralCode ? `${SITE_URL}/r/${referralCode}` : '')
  const balcaoUrl = SITE_URL + '/menu/novo?boutiqueId=' + boutique.id + '&utm_source=qr_balcao'
  const activeDiscountCount = boutique.products.filter(isDiscountActive).length

  const TABS: { id: Tab; label: string; icon: ComponentType<{ size?: number; className?: string }> }[] = [
    { id: 'overview', label: 'Visão Geral', icon: ChartIcon },
    { id: 'referrals', label: 'Indicações', icon: GiftIcon },
    { id: 'balcao', label: 'Balcão', icon: StoreIcon },
    { id: 'produtos', label: 'Produtos', icon: MeatIcon },
    { id: 'conteudo', label: 'Divulgação', icon: CameraIcon },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header — sempre visível */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">{boutique.name}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{boutique.city}, {boutique.state}</p>
          <span className={'text-xs px-2 py-0.5 rounded-full mt-2 inline-block ' + (boutique.approved ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400')}>
            {boutique.approved ? 'Aprovado' : 'Aguardando aprovação'}
          </span>
        </div>
        <button onClick={toggleOpen} className={'px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors ' + (boutique.open ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300')}>
          {boutique.open ? 'Loja aberta — fechar' : 'Loja fechada — abrir'}
        </button>
      </div>

      <PhoneVerificationBanner verified={phoneVerified} onVerified={() => setPhoneVerified(true)} />

      {stats && stats.trialOrdersThreshold != null && (() => {
        const done = stats.trialOrdersCompleted ?? 0
        const threshold = stats.trialOrdersThreshold
        const remaining = Math.max(0, threshold - done)
        if (!stats.trialActive) return (
          <div className="bg-red-500/15 border border-red-500/40 rounded-xl px-5 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse shrink-0" />
              <p className="text-red-300 font-semibold text-sm">Seu período gratuito encerrou depois do {threshold}º pedido. Assine para continuar recebendo pedidos.</p>
            </div>
            <a href="mailto:techchurras@gmail.com?subject=Assinar Tech Churras" className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-4 py-2 rounded-lg whitespace-nowrap transition-colors">Assinar agora</a>
          </div>
        )
        if (remaining <= 1) return (
          <div className="bg-yellow-500/15 border border-yellow-500/40 rounded-xl px-5 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse shrink-0" />
              <p className="text-yellow-300 font-semibold text-sm">Falta <span className="font-black">{remaining === 0 ? 'completar este' : '1'} pedido</span> pro seu período gratuito acabar. Continue sem parar!</p>
            </div>
            <a href="mailto:techchurras@gmail.com?subject=Assinar Tech Churras" className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-xs px-4 py-2 rounded-lg whitespace-nowrap transition-colors">Assinar agora</a>
          </div>
        )
        return (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-5 py-3 flex items-center gap-3">
            <GiftIcon size={18} className="text-green-400" />
            <p className="text-green-300 text-sm"><span className="font-bold">Grátis até o {threshold}º pedido</span> — você já completou {done}, faltam {remaining}.</p>
          </div>
        )
      })()}

      {stats && stats.pendingOrdersCount > 0 && (
        <div className="bg-orange-500/15 border border-orange-500/40 rounded-xl px-5 py-3 flex items-center gap-3">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse shrink-0" />
          <p className="text-orange-300 font-semibold text-sm">
            Você tem <span className="font-black">{stats.pendingOrdersCount}</span> {stats.pendingOrdersCount === 1 ? 'pedido' : 'pedidos'} para preparar
          </p>
        </div>
      )}

      {/* Abas de navegação */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={
              'flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-sm font-medium transition-colors ' +
              (activeTab === tab.id
                ? 'bg-orange-500 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800')
            }
          >
            <span className="leading-none"><tab.icon size={16} /></span>
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.id === 'referrals' && (referralStats?.totalReferrals ?? 0) > 0 && (
              <span className={'text-xs px-1.5 py-0.5 rounded-full font-bold ' + (activeTab === 'referrals' ? 'bg-white/20 text-white' : 'bg-green-500/20 text-green-400')}>
                {referralStats!.totalReferrals}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════ VISÃO GERAL */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
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

          {boutique.products.filter(p => p.available).length === 0 && (
            <div className="bg-gradient-to-br from-orange-500/15 to-amber-500/10 border border-orange-500/40 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <RocketIcon size={22} className="text-orange-400" />
                <div>
                  <h2 className="font-bold text-white">Primeiros passos — comece a vender hoje</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Complete abaixo para aparecer nas buscas e receber seus primeiros pedidos</p>
                </div>
              </div>
              <div className="space-y-2.5">
                {[
                  { done: true,  icon: '✅', label: 'Açougue cadastrado', sub: 'Você já está na plataforma!' },
                  { done: boutique.approved, icon: boutique.approved ? '✅' : '⏳', label: 'Aprovação da equipe Tech Churras', sub: boutique.approved ? 'Aprovado — seu açougue está ativo' : 'Nossa equipe avisa no WhatsApp em até 24h' },
                  { done: boutique.products.some(p => p.available && p.category === 'CARNE'), icon: '📦', label: 'Revisar preço e ativar seus cortes', sub: 'Já deixamos 5 cortes comuns pré-cadastrados em "Produtos" — só ajustar o preço e marcar como disponível' },
                  { done: false, icon: '🥗', label: 'Adicionar 1 acompanhamento (farofa, vinagrete...)', sub: 'Categoria "Acompanhamento" — churrasqueiros retiram tudo em uma visita' },
                  { done: boutique.open, icon: boutique.open ? '✅' : '🔓', label: 'Abrir sua loja', sub: boutique.open ? 'Loja aberta — você já aparece nas buscas!' : 'Clique em "Loja fechada — abrir" no topo desta página' },
                  { done: false, icon: '🖨️', label: 'Imprimir a placa do balcão', sub: 'Vá em "Balcão" e imprima seu QR code exclusivo' },
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
                <button
                  onClick={() => setActiveTab('produtos')}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
                >
                  + Adicionar produto agora
                </button>
                <button
                  onClick={() => setActiveTab('balcao')}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-semibold px-4 py-2 rounded-lg transition-colors border border-gray-700"
                >
                  🖨️ Imprimir placa do balcão
                </button>
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
                    const res = await fetch(API_URL + '/contracts/' + contract.id, { headers: { Authorization: 'Bearer ' + getToken() } })
                    if (res.ok) { const c = await res.json(); setContractText(c.contractText); setShowContractText(true) }
                  }}
                  className="mt-2 text-sm text-orange-400 hover:text-orange-300 underline"
                >Visualizar contrato</button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nenhum contrato gerado ainda.</p>
            )}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="font-semibold text-sm text-gray-300 uppercase tracking-wide mb-3">Dados de recebimento</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Chave PIX</label>
                <input value={pixForm.pixKey} onChange={e => setPixForm(f => ({ ...f, pixKey: e.target.value }))}
                  placeholder="CPF/CNPJ, email, telefone ou chave aleatória"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 placeholder-gray-600" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">CPF ou CNPJ</label>
                <input value={pixForm.cpfCnpj} onChange={e => setPixForm(f => ({ ...f, cpfCnpj: e.target.value }))}
                  placeholder="Só números"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 placeholder-gray-600" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleSavePix} disabled={savingPix}
                className="text-xs bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg transition-colors">
                {savingPix ? 'Salvando...' : 'Salvar'}
              </button>
              {pixMsg && <span className="text-xs text-gray-400">{pixMsg}</span>}
            </div>
            <p className="text-[11px] text-gray-600 mt-2">Usado só pra garantir que o repasse semanal cai na conta certa — ninguém mais vê esses dados.</p>
          </div>

          {stats && stats.revenueByDay.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-sm font-semibold text-gray-300 mb-4">Faturamento — últimos 30 dias</p>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={stats.revenueByDay} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c23616" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#c23616" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={(v: number) => 'R$' + v} />
                  <Tooltip
                    contentStyle={{ background: '#111', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                    formatter={(v) => ['R$ ' + Number(v).toFixed(2), 'Faturamento']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#c23616" strokeWidth={2} fill="url(#revenueGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-white">Relatório mensal</p>
                <p className="text-xs text-gray-500 mt-0.5">Pedidos feitos neste mês · Pix cai após o evento, pode virar o mês</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => shiftReportMonth(-1)}
                  disabled={monthlyReportLoading || !!(monthlyReport && monthlyReport.availableSince && new Date(monthlyReport.availableSince) >= new Date(monthlyReport.month + '-01'))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 text-sm"
                  aria-label="Mês anterior"
                >‹</button>
                <span className="text-xs text-gray-400 capitalize min-w-[110px] text-center">{monthlyReport?.monthLabel ?? '...'}</span>
                <button
                  onClick={() => shiftReportMonth(1)}
                  disabled={monthlyReportLoading || !!monthlyReport?.isCurrentMonth}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 text-sm"
                  aria-label="Próximo mês"
                >›</button>
              </div>
            </div>

            {monthlyReportLoading && !monthlyReport ? (
              <p className="text-gray-600 text-sm py-4 text-center">Carregando...</p>
            ) : monthlyReport && monthlyReport.ordersCompleted === 0 ? (
              <p className="text-gray-600 text-sm py-4 text-center">Nenhum pedido concluído {monthlyReport.isCurrentMonth ? 'ainda neste mês' : 'nesse mês'}.</p>
            ) : monthlyReport ? (
              <>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-gray-800 rounded-xl p-3">
                    <p className="text-lg font-black text-green-400">R$ {monthlyReport.netRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p className="text-[10px] text-gray-500">receita líquida (90%)</p>
                    {monthlyReport.growthPct != null && (
                      <p className={'text-[10px] font-semibold mt-0.5 ' + (monthlyReport.growthPct >= 0 ? 'text-green-400' : 'text-red-400')}>
                        {monthlyReport.growthPct >= 0 ? '↑' : '↓'} {Math.abs(monthlyReport.growthPct)}% vs mês anterior
                      </p>
                    )}
                  </div>
                  <div className="bg-gray-800 rounded-xl p-3">
                    <p className="text-lg font-black text-white">{monthlyReport.ordersCompleted}</p>
                    <p className="text-[10px] text-gray-500">pedidos concluídos</p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-3">
                    <p className="text-lg font-black text-white">R$ {monthlyReport.avgOrderValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p className="text-[10px] text-gray-500">ticket médio</p>
                  </div>
                </div>
                {monthlyReport.topProducts.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Mais vendidos no mês</p>
                    <div className="space-y-1.5">
                      {monthlyReport.topProducts.map((p, i) => (
                        <div key={p.name} className="flex items-center justify-between text-sm">
                          <span className="text-gray-300 truncate">{i + 1}. {p.name} <span className="text-gray-600">({p.quantity}{p.unit})</span></span>
                          <span className="text-orange-400 font-medium shrink-0 ml-2">R$ {p.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>

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

          {stats && stats.recentOrders.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-sm font-semibold text-white mb-4">Pedidos</p>
              <div className="space-y-3">
                {stats.recentOrders.map(o => {
                  const isPending = o.status === 'PENDING' && !acceptedOrderIds.has(o.id) && !rejectedOrderIds.has(o.id)
                  const isAccepted = o.status === 'CONFIRMED' || acceptedOrderIds.has(o.id)
                  const isRejected = o.status === 'CANCELLED' || rejectedOrderIds.has(o.id)
                  return (
                    <div key={o.id} className={'rounded-xl border ' + (isPending ? 'border-orange-500/50 bg-orange-500/5' : 'border-gray-700 bg-gray-800')}>
                      <div className="px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={'text-xs text-white px-2 py-0.5 rounded-full font-medium shrink-0 ' + (STATUS_COLOR[o.status] || 'bg-gray-500')}>
                                {acceptedOrderIds.has(o.id) ? 'Aceito' : rejectedOrderIds.has(o.id) ? 'Recusado' : (STATUS_LABEL[o.status] || o.status)}
                              </span>
                              {isPending && <span className="inline-block w-2 h-2 rounded-full bg-orange-400 animate-pulse" />}
                            </div>
                            <p className="text-sm font-bold text-white mt-1">{o.customerName}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(o.eventDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                              {o.guestCount ? ` · ${o.guestCount} convidados` : ''}
                            </p>
                            {o.grillmasterName && <p className="text-xs text-gray-600 mt-0.5 inline-flex items-center gap-1"><ChefIcon size={11} /> {o.grillmasterName}</p>}
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-bold text-orange-400">R$ {o.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            <Link href={'/orders/' + o.id} className="text-xs text-gray-600 hover:text-gray-400 underline">Ver detalhes</Link>
                          </div>
                        </div>

                        {o.items && o.items.length > 0 && (
                          <div className="mt-2 bg-gray-900 rounded-lg px-3 py-2 space-y-0.5">
                            {o.items.map((item, idx) => (
                              <p key={idx} className="text-xs text-gray-400">
                                <span className="font-semibold text-white">{item.quantity} {item.unit}</span> {item.name}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>

                      {isPending && (
                        <div className="px-4 pb-3 flex gap-2">
                          <button
                            onClick={async () => {
                              setProcessingOrderId(o.id)
                              try {
                                await fetch(`${API_URL}/boutiques/orders/${o.id}/accept`, { method: 'PATCH', headers: { Authorization: 'Bearer ' + getToken() } })
                                setAcceptedOrderIds(prev => new Set([...prev, o.id]))
                              } catch { /* silently fail */ }
                              finally { setProcessingOrderId(null) }
                            }}
                            disabled={processingOrderId === o.id}
                            className="flex-1 text-xs font-bold text-white bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-xl py-2.5 transition-colors"
                          >
                            ✅ Aceitar pedido
                          </button>
                          <button
                            onClick={async () => {
                              setProcessingOrderId(o.id)
                              try {
                                await fetch(`${API_URL}/boutiques/orders/${o.id}/reject`, { method: 'PATCH', headers: { Authorization: 'Bearer ' + getToken(), 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: 'Sem estoque no momento' }) })
                                setRejectedOrderIds(prev => new Set([...prev, o.id]))
                              } catch { /* silently fail */ }
                              finally { setProcessingOrderId(null) }
                            }}
                            disabled={processingOrderId === o.id}
                            className="text-xs font-bold text-gray-400 hover:text-red-400 border border-gray-700 hover:border-red-500 rounded-xl px-4 py-2.5 transition-colors"
                          >
                            Recusar
                          </button>
                        </div>
                      )}

                      {isAccepted && !readyOrderIds.has(o.id) && !rejectedOrderIds.has(o.id) && (
                        <div className="px-4 pb-3">
                          <button
                            onClick={async () => {
                              setConfirmingReadyId(o.id)
                              try {
                                await fetch(`${API_URL}/boutiques/orders/${o.id}/ready`, { method: 'PATCH', headers: { Authorization: 'Bearer ' + getToken() } })
                                setReadyOrderIds(prev => new Set([...prev, o.id]))
                              } catch { /* silently fail */ }
                              finally { setConfirmingReadyId(null) }
                            }}
                            disabled={confirmingReadyId === o.id}
                            className="w-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl py-2.5 transition-colors"
                          >
                            {confirmingReadyId === o.id ? 'Confirmando...' : '📦 Cortes prontos — avisar churrasqueiro'}
                          </button>
                        </div>
                      )}

                      {readyOrderIds.has(o.id) && (
                        <div className="px-4 pb-3">
                          <p className="text-xs text-green-400 text-center bg-green-500/10 rounded-lg py-2 inline-flex items-center justify-center gap-1.5 w-full"><CheckIcon size={12} /> Churrasqueiro notificado para buscar os cortes</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ INDICAÇÕES */}
      {activeTab === 'referrals' && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Clientes indicados</p>
              <p className="text-3xl font-black text-orange-400">{referralStats?.totalReferrals ?? stats?.referralCount ?? 0}</p>
            </div>
            <div className="bg-gray-900 border border-green-500/30 rounded-2xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Bônus a receber</p>
              <p className="text-2xl font-black text-green-400">
                R$ {(referralStats?.pendingBonus ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">no próximo repasse</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Bônus já pago</p>
              <p className="text-2xl font-black text-gray-300">
                R$ {(referralStats?.paidBonus ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* QR Code + link */}
          {referralCode ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-xs text-green-400 font-bold uppercase tracking-widest mb-1">Seu QR Code exclusivo</p>
              <p className="text-sm text-gray-400 mb-4">
                Coloque no balcão, no WhatsApp, no Instagram — cada cliente que escanear e fizer o primeiro pedido vale <strong className="text-white">R$ 40</strong> para você.
              </p>
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                <div className="bg-white p-4 rounded-2xl shrink-0 shadow-lg">
                  <QRCodeSVG value={referralLink} size={140} level="H" />
                </div>
                <div className="flex-1 space-y-3 w-full">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Link de indicação</p>
                    <div className="bg-gray-800 rounded-xl px-4 py-2.5 flex items-center justify-between gap-2">
                      <p className="text-xs text-gray-300 font-mono truncate">{referralLink}</p>
                      <button onClick={copyFullReferralLink} className="shrink-0 text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
                        {copiedReferral ? (<span className="inline-flex items-center gap-1"><CheckIcon size={12} /> Copiado</span>) : 'Copiar'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Código de indicação</p>
                    <div className="bg-gray-800 rounded-xl px-4 py-2.5">
                      <p className="text-lg font-black font-mono text-white tracking-widest">{referralCode}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div ref={qrIndicacaoRef} className="hidden">
                      <QRCodeCanvas value={referralLink} size={600} level="H" />
                    </div>
                    <button onClick={downloadQRIndicacao} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Baixar QR Code
                    </button>
                    <Link
                      href="/boutiques/dashboard/qrcode-impressao"
                      className="flex-1 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      🖨️ Imprimir Placa
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
              <p className="text-gray-500 text-sm">Código de indicação ainda não gerado. Entre em contato com o suporte.</p>
            </div>
          )}

          {/* Como funciona */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <p className="text-xs text-orange-400 font-bold uppercase tracking-widest mb-4">Como funciona</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  n: '1', icon: PhoneIcon,
                  titulo: 'Compartilhe o QR Code',
                  desc: 'Imprima e coloque no balcão. Mande o link no WhatsApp e Instagram.',
                },
                {
                  n: '2', icon: PersonIcon,
                  titulo: 'Cliente se cadastra',
                  desc: 'Ele escaneia, cria conta e faz o primeiro pedido. Fica vinculado ao seu açougue.',
                },
                {
                  n: '3', icon: CashIcon,
                  titulo: 'R$ 40 no repasse',
                  desc: 'O bônus cai automaticamente no seu repasse semanal via PIX. Sem burocracia.',
                },
              ].map(s => (
                <div key={s.n} className="bg-gray-800 rounded-xl p-4 flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-xs font-black text-green-400 shrink-0 mt-0.5">
                    {s.n}
                  </div>
                  <div>
                    <p className="mb-1 text-orange-400"><s.icon size={18} /></p>
                    <p className="text-sm font-bold text-white mb-1">{s.titulo}</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dicas de conversão */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <p className="text-xs text-orange-400 font-bold uppercase tracking-widest mb-4">Dicas para converter mais</p>
            <div className="space-y-3">
              {[
                {
                  icon: PrinterIcon,
                  titulo: 'Placa no balcão',
                  desc: 'Imprima o QR code em tamanho A5 ou A4 e coloque na frente do caixa. Clientes que estão comprando carne para evento já estão no perfil certo.',
                  acao: 'Imprimir placa',
                  href: '/boutiques/dashboard/qrcode-impressao',
                },
                {
                  icon: ChatIcon,
                  titulo: 'Script para o atendente',
                  desc: '"Você vai fazer churrasco? A gente tem parceria com churrasqueiros profissionais — você escaneia esse QR e a carne já vem separada daqui. Tudo num app."',
                  acao: null,
                  href: null,
                },
                {
                  icon: PhoneIcon,
                  titulo: 'Status do WhatsApp',
                  desc: 'Mande o link de indicação como status. Clientes que já compram aqui são os mais propensos a usar.',
                  acao: null,
                  href: null,
                },
              ].map((d, i) => (
                <div key={i} className="flex gap-3 bg-gray-800 rounded-xl p-4">
                  <span className="shrink-0 text-orange-400"><d.icon size={18} /></span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white mb-1">{d.titulo}</p>
                    <p className="text-xs text-gray-400 leading-relaxed italic">{d.desc}</p>
                    {d.href && (
                      <Link href={d.href} className="inline-block mt-2 text-xs text-orange-400 hover:text-orange-300 font-medium underline">
                        {d.acao} →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Potencial de ganhos */}
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-2xl p-5">
            <p className="text-xs text-green-400 font-bold uppercase tracking-widest mb-3">Potencial de bônus mensal</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { clientes: 5, bonus: 200 },
                { clientes: 20, bonus: 800 },
                { clientes: 50, bonus: 2000 },
                { clientes: 100, bonus: 4000 },
              ].map(r => (
                <div key={r.clientes} className="bg-gray-900/60 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">{r.clientes} clientes/mês</p>
                  <p className="text-xl font-black text-green-400 mt-1">+R$ {r.bonus.toLocaleString('pt-BR')}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">Sem limite de indicações. Bônus pago junto ao repasse semanal.</p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ BALCÃO */}
      {activeTab === 'balcao' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500/10 to-transparent border-b border-gray-800 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center text-lg shrink-0">🏪</div>
              <div>
                <p className="font-bold text-white text-sm">Balcão de Eventos — Máquina de vendas</p>
                <p className="text-xs text-gray-500">Transforme cada cliente do balcão em um evento completo Tech Churras</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-5">
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
                    <div className="w-7 h-7 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xs font-black text-white shrink-0 mt-0.5">{f.n}</div>
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

            <div className="border border-dashed border-orange-500/30 rounded-xl p-4">
              <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-3">QR Code — Balcão</p>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="bg-white p-3 rounded-xl shrink-0">
                  <QRCodeSVG value={balcaoUrl} size={110} level="H" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="bg-gray-800 rounded-xl px-3 py-2 flex items-center justify-between gap-2 min-w-0">
                    <p className="text-xs text-gray-400 font-mono truncate min-w-0">{balcaoUrl}</p>
                    <button
                      onClick={() => copyBalcaoLink(balcaoUrl)}
                      className="shrink-0 text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                    >
                      {copiedBalcao ? (<span className="inline-flex items-center gap-1"><CheckIcon size={12} /> Copiado</span>) : 'Copiar'}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <div ref={qrBalcaoRef} className="hidden">
                      <QRCodeCanvas value={balcaoUrl} size={600} level="H" />
                    </div>
                    <button onClick={downloadQRBalcao} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium px-3 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Baixar QR
                    </button>
                    <Link href="/boutiques/dashboard/qrcode-eventos"
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
      )}

      {/* ══════════════════════════════════════════════════════ PRODUTOS */}
      {activeTab === 'produtos' && (
        <div className="space-y-6">
          {/* Acompanhamentos — serviço do açougue, aparece no pedido do cliente */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-white text-sm">Preparar acompanhamentos prontos</h2>
              <p className="text-xs text-gray-500 mt-0.5">Arroz, farofa, vinagrete, maionese, salada, chimichurri — cobrado à parte do cliente. Se você não oferecer, o Grillmaster pode oferecer no lugar (quando ele preparar).</p>
            </div>
            <button onClick={toggleOffersSideDishPrep}
              className={`relative w-12 h-6 rounded-full shrink-0 transition-colors ${boutique.offersSideDishPrep ? 'bg-orange-500' : 'bg-gray-700'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${boutique.offersSideDishPrep ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Pacotes de Churrasco */}
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

                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-gray-400">Produtos do kit</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={generatingKitItems || !boutique || boutique.products.length === 0}
                        title={!boutique || boutique.products.length === 0 ? 'Cadastre produtos primeiro' : 'Sugerir itens com IA baseado no seu catálogo'}
                        onClick={async () => {
                          if (!boutique) return
                          setGeneratingKitItems(true)
                          setKitItemsError('')
                          try {
                            const guests = kitForm.minGuests || 10
                            const homens = Math.round(guests * 0.55)
                            const mulheres = Math.round(guests * 0.30)
                            const criancas = guests - homens - mulheres
                            const res = await fetch(API_URL + '/ai/suggest-from-catalog', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
                              body: JSON.stringify({
                                homens, mulheres, criancas,
                                occasion: kitForm.name || 'churrasco',
                                products: boutique.products
                                  .filter(p => p.available)
                                  .map(p => ({ id: p.id, name: p.name, category: p.category, price: p.price, unit: p.unit })),
                              }),
                            })
                            if (!res.ok) {
                              const err = await res.json().catch(() => ({}))
                              throw new Error((err as any).error || 'Erro ao sugerir itens com IA')
                            }
                            const data = await res.json()
                            if (Array.isArray(data.items)) {
                              const productMap = new Map(boutique.products.map(p => [p.id, p]))
                              const suggested: KitItem[] = data.items
                                .map((item: { productId: string; quantity: number; unit?: string }) => {
                                  const p = productMap.get(item.productId)
                                  if (!p) return null
                                  return { productId: p.id, productName: p.name, quantity: item.quantity, unit: item.unit || p.unit, price: p.price }
                                })
                                .filter(Boolean) as KitItem[]
                              if (suggested.length > 0) setKitItems(suggested)
                              else setKitItemsError('IA não reconheceu itens do seu catálogo — monte manualmente')
                            }
                          } catch (err: any) {
                            setKitItemsError(err.message || 'Erro ao sugerir itens com IA — monte manualmente')
                          } finally { setGeneratingKitItems(false) }
                        }}
                        className="text-xs text-orange-400 hover:text-orange-300 disabled:opacity-40 flex items-center gap-1"
                      >
                        {generatingKitItems ? '⏳ Gerando...' : '✨ Sugerir com IA'}
                      </button>
                      <button type="button" onClick={addKitItem} className="text-xs text-gray-400 hover:text-gray-300">+ Adicionar</button>
                    </div>
                  </div>
                  {kitItemsError && <p className="text-xs text-red-400 -mt-2">{kitItemsError}</p>}

                  {!boutique || boutique.products.filter(p => p.available).length === 0 ? (
                    <p className="text-xs text-yellow-500/80 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
                      Cadastre produtos no seu catálogo primeiro para montar o kit.
                    </p>
                  ) : kitItems.length === 0 ? (
                    <p className="text-xs text-gray-600 py-2 text-center">Nenhum produto adicionado. Clique em "+ Adicionar" ou use a IA.</p>
                  ) : null}

                  <div className="space-y-2">
                    {kitItems.map((item, idx) => {
                      const availableProducts = boutique?.products.filter(p => p.available) ?? []
                      const subtotal = item.price * item.quantity
                      return (
                        <div key={idx} className="bg-gray-800/60 border border-gray-700 rounded-xl p-3">
                          <div className="flex gap-2 items-center mb-2">
                            <select
                              value={item.productId}
                              onChange={e => selectKitProduct(idx, e.target.value)}
                              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-xs text-white outline-none"
                            >
                              <option value="">— Selecione um produto —</option>
                              {availableProducts.map(p => (
                                <option key={p.id} value={p.id}>{p.name} · R$ {p.price.toFixed(2)}/{p.unit}</option>
                              ))}
                            </select>
                            <button type="button" onClick={() => removeKitItem(idx)} className="text-red-400 hover:text-red-300 text-sm shrink-0">✕</button>
                          </div>
                          {item.productId && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Quantidade:</span>
                              <input
                                type="number" min={0.1} step={item.unit === 'kg' ? 0.5 : 1} value={item.quantity}
                                onChange={e => updateKitItem(idx, 'quantity', +e.target.value)}
                                className="w-20 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-xs text-white outline-none"
                              />
                              <span className="text-xs text-gray-500">{item.unit}</span>
                              <span className="ml-auto text-xs text-orange-400 font-medium">R$ {subtotal.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {kitItems.filter(i => i.productId).length > 0 && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
                      <span className="text-xs text-gray-400">
                        Total dos produtos: <span className="text-white font-medium">R$ {kitItems.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}</span>
                      </span>
                      <button type="button" onClick={autoCalcKitPrice} className="text-xs text-orange-400 hover:text-orange-300">
                        Usar como preço do kit →
                      </button>
                    </div>
                  )}
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

          {/* Produtos */}
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
                ) : <span className="inline-flex items-center gap-1.5"><CameraIcon size={14} /> Adicionar por foto</span>}
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
                <div key={p.id} className={'rounded-xl px-4 py-3 flex items-center justify-between gap-3 transition-colors ' + (p.available ? 'bg-gray-900' : 'bg-gray-900/60 border border-red-900/40')}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className={'w-12 h-12 rounded-lg object-cover ' + (!p.available ? 'opacity-40' : '')} />
                      ) : (
                        <div className={'w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center text-orange-400/60 ' + (!p.available ? 'opacity-40' : '')}><MeatIcon size={20} /></div>
                      )}
                      {!p.available && (
                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black px-1 py-0.5 rounded leading-none">FORA</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button type="button" onClick={() => toggleProduct(p.id)}
                        className={'relative w-10 h-5 rounded-full transition-colors ' + (p.available ? 'bg-green-500' : 'bg-red-700')}>
                        <span className={'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ' + (p.available ? 'translate-x-5' : 'translate-x-0')} />
                      </button>
                      <span className={'text-[10px] text-center font-semibold ' + (p.available ? 'text-green-500' : 'text-red-500')}>
                        {p.available ? 'OK' : 'ESGOT.'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={'font-medium truncate ' + (!p.available ? 'text-gray-500' : '')}>{p.name}</p>
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
      )}

      {/* ══════════════════════════════════════════════════════ DIVULGAÇÃO */}
      {activeTab === 'conteudo' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-orange-500/15 to-amber-500/10 border border-orange-500/40 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <CameraIcon size={20} className="text-orange-400" />
              <h2 className="font-bold text-white">Conteúdo pra Instagram — de graça, com foto de verdade</h2>
            </div>
            <p className="text-xs text-gray-400">
              Manda uma foto real da sua loja (fachada, corte, vitrine, bastidor) e a IA escreve a legenda pra você. Baixa a imagem já com sua marca e posta direto no seu Instagram.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Contexto (opcional) — o que é a foto?</label>
              <input
                type="text"
                value={contentContext}
                onChange={e => setContentContext(e.target.value)}
                placeholder="Ex: picanha maturada 21 dias, fachada nova, chegada de wagyu..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600"
              />
            </div>

            <input ref={contentPhotoRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleContentPhotoSelect} />
            <button
              onClick={() => contentPhotoRef.current?.click()}
              disabled={generatingPost}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <CameraIcon size={18} />
              {generatingPost ? 'Gerando conteúdo...' : 'Enviar foto real e gerar post'}
            </button>

            {postError && <p className="text-xs text-red-400">{postError}</p>}

            {generatingPost && contentPreviewUrl && (
              <div className="flex items-center gap-3 bg-gray-800/60 rounded-xl p-3">
                <img src={contentPreviewUrl} alt="preview" className="w-16 h-16 rounded-lg object-cover opacity-60" />
                <p className="text-xs text-gray-400">Analisando sua foto e escrevendo a legenda...</p>
              </div>
            )}

            {currentPost && !generatingPost && (
              <div className="border border-orange-500/30 bg-orange-500/5 rounded-2xl p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">Imagem com sua marca</p>
                    {brandedImageUrl ? (
                      <img src={brandedImageUrl} alt="post" className="w-full rounded-xl border border-gray-800" />
                    ) : (
                      <img src={currentPost.imageUrl} alt="post" className="w-full rounded-xl border border-gray-800" />
                    )}
                    <button
                      onClick={downloadBrandedImage}
                      disabled={!brandedImageUrl}
                      className="mt-2 w-full bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-200 text-sm font-semibold py-2 rounded-lg transition-colors"
                    >
                      ⬇️ Baixar imagem
                    </button>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-xs text-gray-500 mb-1.5">Legenda (edite se quiser)</p>
                    <textarea
                      value={editableCaption}
                      onChange={e => setEditableCaption(e.target.value)}
                      rows={8}
                      className="flex-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white resize-none"
                    />
                    <button
                      onClick={copyCaption}
                      className="mt-2 w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold py-2 rounded-lg transition-colors"
                    >
                      {copiedCaption ? (<span className="inline-flex items-center justify-center gap-1"><CheckIcon size={14} /> Copiado</span>) : 'Copiar legenda'}
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-gray-600 text-center">Baixa a imagem e cola a legenda direto no seu Instagram — pronto.</p>
              </div>
            )}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <p className="text-sm font-semibold text-white mb-3">Seus posts gerados</p>
            {loadingPosts ? (
              <p className="text-xs text-gray-500">Carregando...</p>
            ) : socialPosts.length === 0 ? (
              <p className="text-xs text-gray-500">Nenhum post gerado ainda — manda sua primeira foto acima.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {socialPosts.map(p => (
                  <div key={p.id} className="bg-gray-800 rounded-xl overflow-hidden group relative">
                    <img src={p.imageUrl} alt="" className="w-full h-28 object-cover" />
                    <button
                      onClick={() => deleteSocialPost(p.id)}
                      className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-red-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remover"
                    >×</button>
                    <p className="text-[10px] text-gray-500 px-2 py-1.5 truncate">{new Date(p.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
            <div className="flex-1 overflow-y-auto p-5">
              <pre className="font-mono text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{contractText}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}