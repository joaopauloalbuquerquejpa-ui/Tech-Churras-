'use client'
import { API_URL } from '@/lib/api'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { LockIcon } from '@/components/icons/Icons'
import { OrdersTab } from './_tabs/OrdersTab'
import { UsersTab } from './_tabs/UsersTab'
import { LeadsTab } from './_tabs/LeadsTab'
import { ResumoTab } from './_tabs/ResumoTab'
import { MetricasTab } from './_tabs/MetricasTab'
import { PendingTab } from './_tabs/PendingTab'
import { FinanceiroTab } from './_tabs/FinanceiroTab'
import { ContractsTab } from './_tabs/ContractsTab'
import { EquipeTab } from './_tabs/EquipeTab'

// Isola useSearchParams num componente próprio, dentro de Suspense — sem
// isso a rota inteira perde SSR (mesmo problema já corrigido antes na
// página do ebook). Só repassa a aba lida na URL pro pai via callback.
function TabFromUrl({ onTab }: { onTab: (tab: Tab) => void }) {
  const searchParams = useSearchParams()
  useEffect(() => {
    const t = searchParams.get('tab') as Tab | null
    if (t) onTab(t)
  }, [searchParams])
  return null
}

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

type Tab = 'stats' | 'orders' | 'pending' | 'users' | 'financeiro' | 'contracts' | 'equipe' | 'leads' | 'metricas'

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('stats')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [zapiStatus, setZapiStatus] = useState<{ status: string; connected?: boolean; phone?: string | null } | null>(null)

  async function fetchStats(silent = false) {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    const h = { Authorization: 'Bearer ' + getToken() }
    try {
      const s = await fetch(API_URL + '/admin/stats', { headers: h }).then(r => r.json())
      setStats(s)
      setLastUpdated(new Date())
      fetch(API_URL + '/admin/zapi-status', { headers: h })
        .then(r => r.ok ? r.json() : null)
        .then(z => { if (z) setZapiStatus(z) })
        .catch(() => {})
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(() => fetchStats(true), 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <p className="text-gray-400">Carregando...</p>

  return (
    <div>
      <Suspense fallback={null}>
        <TabFromUrl onTab={setTab} />
      </Suspense>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">Painel Admin</h1>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-500">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
              Atualizado às {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <a
            href="/admin/seguranca"
            className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <LockIcon size={12} /> Segurança
          </a>
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {refreshing ? '↻' : 'Atualizar'}
          </button>
        </div>
      </div>

      {tab === 'stats' && stats && <ResumoTab stats={stats} zapiStatus={zapiStatus} />}
      {tab === 'orders' && <OrdersTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'pending' && <PendingTab />}
      {tab === 'equipe' && <EquipeTab />}
      {tab === 'financeiro' && <FinanceiroTab />}
      {tab === 'contracts' && <ContractsTab />}
      {tab === 'leads' && <LeadsTab />}
      {tab === 'metricas' && <MetricasTab />}
    </div>
  )
}
