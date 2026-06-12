'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react'

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

interface Product {
  id: string; name: string; description?: string; price: number; unit: string
  category: string; available: boolean; stockQuantity?: number | null
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

const emptyForm = { name: '', description: '', price: 0, unit: 'kg', category: 'CARNE', available: true, stockQuantity: '' as string | number }

function priceLabel(unit: string) {
  if (unit === 'kg') return 'Preço por kg (R$)'
  if (unit === 'un' || unit === 'unidade') return 'Preço por unidade (R$)'
  return `Preço por ${unit} (R$)`
}

export default function BoutiqueDashboardPage() {
  const [boutique, setBoutique] = useState<Boutique | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [demand, setDemand] = useState<DemandItem[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    try {
      const h = { Authorization: 'Bearer ' + getToken() }
      const [bRes, sRes, dRes] = await Promise.all([
        fetch(BASE + '/boutiques/my', { headers: h }),
        fetch(BASE + '/boutiques/dashboard/stats', { headers: h }),
        fetch(BASE + '/boutiques/dashboard/demand-forecast', { headers: h }),
      ])
      if (!bRes.ok) { setNotFound(true); return }
      const [b, s, d] = await Promise.all([
        bRes.json(),
        sRes.ok ? sRes.json() : null,
        dRes.ok ? dRes.json() : [],
      ])
      setBoutique(b)
      if (s) setStats(s)
      if (Array.isArray(d)) setDemand(d)
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
        }
      }
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
    setForm({ name: p.name, description: p.description || '', price: p.price, unit: p.unit, category: p.category, available: p.available, stockQuantity: p.stockQuantity ?? '' })
    setShowForm(true)
  }

  function cancelForm() { setShowForm(false); setEditingId(null); setForm(emptyForm) }

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

  if (loading) return <p className="text-gray-400 p-6">Carregando...</p>

  if (notFound) return (
    <div className="max-w-xl mx-auto p-6">
      <div className="bg-gray-900 rounded-xl p-8 text-center">
        <p className="text-gray-400 mb-4">Você não tem um açougue cadastrado.</p>
        <Link href="/boutiques/new" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg inline-block font-medium">
          Cadastrar açougue
        </Link>
      </div>
    </div>
  )

  if (!boutique) return null
  const referralUrl = stats?.referralCode ? SITE_URL + '/r/' + stats.referralCode : ''

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

      {/* Pending badge */}
      {stats && stats.pendingOrdersCount > 0 && (
        <div className="bg-orange-500/15 border border-orange-500/40 rounded-xl px-5 py-3 flex items-center gap-3">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse shrink-0" />
          <p className="text-orange-300 font-semibold text-sm">
            Você tem <span className="font-black">{stats.pendingOrdersCount}</span> {stats.pendingOrdersCount === 1 ? 'pedido' : 'pedidos'} para preparar
          </p>
        </div>
      )}

      {/* Stats cards */}
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

      {/* Revenue chart */}
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
                formatter={(v: number) => ['R$ ' + v.toFixed(2), 'Faturamento']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Demand forecast */}
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
                      <p className={'text-sm font-semibold ' + (urgent ? 'text-orange-300' : 'text-white')}>
                        {CATEGORIES[item.category] || item.category}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.eventsCount} {item.eventsCount === 1 ? 'evento confirmado' : 'eventos confirmados'} ·
                        próximo em {daysUntil <= 0 ? 'hoje' : daysUntil === 1 ? 'amanhã' : daysUntil + ' dias'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={'text-base font-black ' + (urgent ? 'text-orange-400' : 'text-white')}>
                      {item.totalQuantityNeeded}{item.unit}
                    </p>
                    <p className="text-xs text-gray-500">necessários</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Referral section */}
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
              </div>
              <p className="text-xs text-gray-600">Código: <span className="font-mono font-bold text-gray-400">{stats.referralCode}</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Recent orders */}
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

      {/* Product management */}
      <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
        <p className="text-sm text-orange-300 font-medium mb-0.5">Mantenha seus preços sempre atualizados</p>
        <p className="text-xs text-orange-400/80">Eles aparecem diretamente para os clientes no momento do pedido.</p>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Produtos ({boutique.products.length})</h2>
        <button onClick={() => { cancelForm(); setShowForm(true) }} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Adicionar produto
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 rounded-xl p-5 border border-orange-500/30">
          <h3 className="font-semibold mb-4">{editingId ? 'Editar produto' : 'Novo produto'}</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Nome *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white" placeholder="Ex: Picanha, Fraldinha..." />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Descrição</label>
              <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white" placeholder="Opcional" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Unidade</label>
              <input type="text" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white" placeholder="kg, un..." />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{priceLabel(form.unit)} *</label>
              <input type="number" min={0} step="0.01" value={form.price} onChange={e => setForm({ ...form, price: +e.target.value })} className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Categoria</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white">
                {Object.entries(CATEGORIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Estoque (opcional)</label>
              <input type="number" min={0} value={form.stockQuantity} onChange={e => setForm({ ...form, stockQuantity: e.target.value === '' ? '' : +e.target.value })} className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white" placeholder="Qtd." />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <button type="button" onClick={() => setForm(f => ({ ...f, available: !f.available }))} className={'relative w-11 h-6 rounded-full transition-colors shrink-0 ' + (form.available ? 'bg-orange-500' : 'bg-gray-700')}>
                  <span className={'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ' + (form.available ? 'translate-x-5' : 'translate-x-0')} />
                </button>
                <span className="text-sm text-gray-300">{form.available ? 'Disponível para pedidos' : 'Indisponível'}</span>
              </label>
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
        {boutique.products.map(p => (
          <div key={p.id} className="bg-gray-900 rounded-xl px-5 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button type="button" onClick={() => toggleProduct(p.id)} title={p.available ? 'Clique para desativar' : 'Clique para ativar'} className={'relative w-10 h-5 rounded-full transition-colors shrink-0 ' + (p.available ? 'bg-green-500' : 'bg-gray-600')}>
                <span className={'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ' + (p.available ? 'translate-x-5' : 'translate-x-0')} />
              </button>
              <div className="min-w-0">
                <p className="font-medium truncate">{p.name}</p>
                <p className="text-xs text-gray-400">{CATEGORIES[p.category] || p.category} &middot; {p.unit}{p.stockQuantity != null && <span className="ml-2 text-gray-500">estoque: {p.stockQuantity}</span>}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-2">
              <span className="text-orange-400 font-semibold text-sm">R$ {p.price.toFixed(2)}/{p.unit}</span>
              <button onClick={() => startEdit(p)} className="text-xs text-blue-400 hover:text-blue-300 border border-blue-900 px-2 py-1 rounded">Editar</button>
              <button onClick={() => removeProduct(p.id)} className="text-xs text-red-400 hover:text-red-300 border border-red-900 px-2 py-1 rounded">Remover</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
