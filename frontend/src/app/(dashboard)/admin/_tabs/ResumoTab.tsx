'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { API_URL } from '@/lib/api'
import { ClipboardIcon, CashIcon, PersonIcon, FlameIcon, StoreIcon, ChefIcon } from '@/components/icons/Icons'
import { MetricCard } from '@/components/admin/ui/MetricCard'

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

interface Stats {
  totalOrders: number
  totalUsers: number
  totalGrillmasters: number
  totalBoutiques: number
  totalRevenue: number
  ordersToday: number
  revenueToday: number
  usersToday: number
  activeOrders: number
  revenueWeek: number
}

type ZapiStatus = { status: string; connected?: boolean; phone?: string | null; message?: string } | null

export function ResumoTab({ stats, zapiStatus }: { stats: Stats; zapiStatus: ZapiStatus }) {
  const [revenueByDay, setRevenueByDay] = useState<{ date: string; revenue: number }[]>([])

  useEffect(() => {
    let cancelled = false
    fetch(`${API_URL}/admin/metrics/advanced`, { headers: { Authorization: 'Bearer ' + getToken() } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled || !data?.revenueByDay) return
        setRevenueByDay(Object.entries(data.revenueByDay as Record<string, number>).map(([date, revenue]) => ({ date, revenue })))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  return (
    <div className="space-y-4">
      {/* Hoje */}
      <div className="bg-gradient-to-r from-orange-900/20 to-gray-900 border border-orange-500/20 rounded-2xl p-5">
        <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-4">Hoje</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Pedidos hoje</p>
            <p className="text-3xl font-black text-white">{stats.ordersToday}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Receita hoje</p>
            <p className="text-2xl font-black text-green-400">R$ {(stats.revenueToday ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Novos usuários</p>
            <p className="text-3xl font-black text-white">{stats.usersToday}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Pedidos ativos</p>
            <p className="text-3xl font-black text-orange-400">{stats.activeOrders}</p>
          </div>
        </div>
      </div>

      {/* Gráfico real de receita — antes esse dado já vinha do backend e era descartado */}
      {revenueByDay.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-sm font-semibold text-gray-300 mb-4">Receita — últimos 30 dias</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={revenueByDay} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="resumoRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c23616" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#c23616" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={(v: number) => 'R$' + v} />
              <Tooltip
                contentStyle={{ background: '#111', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                formatter={(v: any) => ['R$ ' + Number(v).toFixed(2), 'Receita']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#c23616" strokeWidth={2} fill="url(#resumoRevenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Métricas gerais */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard icon={<ClipboardIcon size={18} />} label="Total Pedidos" value={stats.totalOrders} accent="orange"
          hint={`R$ ${(stats.revenueWeek ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} últimos 7 dias`} />
        <MetricCard icon={<PersonIcon size={18} />} label="Usuários" value={stats.totalUsers} accent="orange" />
        <MetricCard icon={<ChefIcon size={18} />} label="Churrasqueiros" value={stats.totalGrillmasters} accent="orange" />
        <MetricCard icon={<StoreIcon size={18} />} label="Açougues" value={stats.totalBoutiques} accent="orange" />
        <MetricCard icon={<CashIcon size={18} />} label="Receita Total" value={`R$ ${(stats.totalRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} accent="green" />
        <Link
          href="/admin/repasses"
          className="bg-gray-900 rounded-2xl p-5 border border-orange-500/20 hover:border-orange-500/50 hover:bg-gray-800 transition-all group"
        >
          <p className="text-gray-400 text-sm group-hover:text-orange-400 transition-colors">Repasses Semanais</p>
          <p className="text-lg font-bold text-orange-400 mt-1">Gerenciar →</p>
          <p className="text-xs text-gray-600 mt-1">Pagamentos para parceiros</p>
        </Link>
        <Link
          href="/admin/onboarding-acougue"
          className="bg-gray-900 rounded-2xl p-5 border border-green-500/20 hover:border-green-500/50 hover:bg-gray-800 transition-all group"
        >
          <p className="text-gray-400 text-sm group-hover:text-green-400 transition-colors">Onboarding Açougue</p>
          <p className="text-lg font-bold text-green-400 mt-1">Roteiro →</p>
          <p className="text-xs text-gray-600 mt-1">Script de visita presencial</p>
        </Link>
      </div>

      {/* Z-API Status */}
      {zapiStatus && (
        <div className={[
          'rounded-xl p-4 border flex items-center justify-between gap-4',
          zapiStatus.status === 'not_configured' ? 'bg-gray-900 border-gray-700' :
          zapiStatus.status === 'ok' && zapiStatus.connected ? 'bg-green-900/20 border-green-500/30' :
          'bg-red-900/20 border-red-500/30',
        ].join(' ')}>
          <div className="flex items-center gap-3">
            <span className={[
              'inline-block w-2.5 h-2.5 rounded-full shrink-0',
              zapiStatus.status === 'not_configured' ? 'bg-gray-600' :
              zapiStatus.status === 'ok' && zapiStatus.connected ? 'bg-green-400 animate-pulse' :
              'bg-red-400',
            ].join(' ')} />
            <div>
              <p className="text-sm font-semibold text-white">WhatsApp (Z-API)</p>
              <p className="text-xs text-gray-500">
                {zapiStatus.status === 'not_configured' ? 'Não configurado — ZAPI_INSTANCE/ZAPI_TOKEN ausentes' :
                 zapiStatus.status === 'ok' && zapiStatus.connected ? `Conectado${zapiStatus.phone ? ' · ' + zapiStatus.phone : ''}` :
                 zapiStatus.status === 'ok' && !zapiStatus.connected ? 'Instância offline — reconecte no painel Z-API' :
                 'Erro ao verificar: ' + (zapiStatus.message ?? '')}
              </p>
            </div>
          </div>
          {zapiStatus.status === 'ok' && !zapiStatus.connected && (
            <a
              href="https://app.z-api.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0"
            >
              Reconectar
            </a>
          )}
        </div>
      )}
    </div>
  )
}
