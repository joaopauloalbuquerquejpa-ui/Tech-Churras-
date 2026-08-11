'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { API_URL } from '@/lib/api'
import { Badge } from '@/components/admin/ui/Badge'

const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })

function getToken() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
}

interface AdvancedMetrics {
  funnel: { total: number; confirmed: number; completed: number; confirmRate: number; completeRate: number }
  revenueByDay: Record<string, number>
  ordersByHour: { hour: number; count: number }[]
  topGms: { id: string; name: string; rating: number; totalOrders: number; acceptedOrders: number; acceptRate: number }[]
}

interface DemandForecast {
  byDayOfWeek: { day: string; count: number; revenue: number }[]
  byHour: { hour: number; count: number }[]
  trendVsLastMonth: number
  next14Days: { date: string; dayName: string; expectedOrders: number; confidence: string }[]
  narrative: string
  totalOrders90d: number
}

export function MetricasTab() {
  const [advancedMetrics, setAdvancedMetrics] = useState<AdvancedMetrics | null>(null)
  const [demandForecast, setDemandForecast] = useState<DemandForecast | null>(null)
  const [loadingMetrics, setLoadingMetrics] = useState(false)

  async function loadMetrics() {
    setLoadingMetrics(true)
    const h = { Authorization: 'Bearer ' + getToken() }
    const [adv, fc] = await Promise.all([
      fetch(API_URL + '/admin/metrics/advanced', { headers: h }).then(r => r.json()).catch(() => null),
      fetch(API_URL + '/admin/demand-forecast', { headers: h }).then(r => r.json()).catch(() => null),
    ])
    setAdvancedMetrics(adv)
    setDemandForecast(fc)
    setLoadingMetrics(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">Métricas Avançadas + Previsão IA</h2>
        <button
          onClick={loadMetrics}
          disabled={loadingMetrics}
          className="text-sm bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {loadingMetrics ? 'Carregando...' : advancedMetrics ? 'Atualizar' : 'Carregar dados'}
        </button>
      </div>

      {!advancedMetrics && !loadingMetrics && (
        <div className="text-center py-12 text-gray-500">Clique em &quot;Carregar dados&quot; para ver as métricas.</div>
      )}

      {loadingMetrics && (
        <div className="text-center py-12 text-gray-400">Analisando dados com IA... (pode levar alguns segundos)</div>
      )}

      {advancedMetrics && (
        <>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <p className="text-sm font-semibold text-gray-400 mb-4">Funil de conversão — todos os tempos</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-black text-white">{advancedMetrics.funnel.total}</p>
                <p className="text-xs text-gray-500 mt-1">Pedidos criados</p>
              </div>
              <div>
                <p className="text-3xl font-black text-blue-400">{advancedMetrics.funnel.confirmed}</p>
                <p className="text-xs text-gray-500 mt-1">Confirmados ({advancedMetrics.funnel.confirmRate}%)</p>
              </div>
              <div>
                <p className="text-3xl font-black text-green-400">{advancedMetrics.funnel.completed}</p>
                <p className="text-xs text-gray-500 mt-1">Concluídos ({advancedMetrics.funnel.completeRate}%)</p>
              </div>
            </div>
          </div>

          {advancedMetrics.topGms.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-sm font-semibold text-gray-400 mb-4">Top churrasqueiros — por pedidos</p>
              <div className="space-y-3">
                {advancedMetrics.topGms.map((gm, i) => {
                  const acceptedPct = gm.totalOrders > 0 ? (gm.acceptedOrders / gm.totalOrders) * 100 : 0
                  return (
                    <div key={gm.id} className="flex items-center gap-3">
                      <span className="text-gray-600 text-sm w-4">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-white">{gm.name}</p>
                          <span className="text-xs text-gray-500">{gm.acceptRate}% aceite</span>
                        </div>
                        <div className="flex gap-0.5 mt-1.5 h-1.5 rounded-full overflow-hidden bg-gray-800">
                          <div className="h-full bg-orange-500" style={{ width: acceptedPct + '%' }} />
                        </div>
                      </div>
                      <Badge tone="yellow">★ {gm.rating}</Badge>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {demandForecast && (
        <>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-400">Previsão de demanda — próximos 14 dias</p>
              <Badge tone={demandForecast.trendVsLastMonth >= 0 ? 'green' : 'red'}>
                {demandForecast.trendVsLastMonth >= 0 ? '+' : ''}{demandForecast.trendVsLastMonth}% vs mês anterior
              </Badge>
            </div>

            {demandForecast.narrative && (
              <div className="text-sm text-gray-300 whitespace-pre-line leading-relaxed border-l-2 border-orange-500/40 pl-3">
                {demandForecast.narrative}
              </div>
            )}

            <div className="grid grid-cols-7 gap-1">
              {demandForecast.next14Days.map(d => (
                <div key={d.date} className={`rounded-lg p-2 text-center ${d.expectedOrders >= 2 ? 'bg-orange-500/20 border border-orange-500/30' : 'bg-gray-800'}`}>
                  <p className="text-[10px] text-gray-500">{d.dayName.slice(0, 3)}</p>
                  <p className="text-xs font-bold text-white mt-0.5">{d.expectedOrders.toFixed(1)}</p>
                  <p className={`text-[9px] mt-0.5 ${d.confidence === 'alta' ? 'text-green-400' : d.confidence === 'média' ? 'text-yellow-400' : 'text-gray-600'}`}>
                    {d.confidence}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Gráfico real — antes era <div> com width calculado à mão */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <p className="text-sm font-semibold text-gray-400 mb-4">Pedidos por dia da semana (90 dias)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={demandForecast.byDayOfWeek} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={(v: string) => v.slice(0, 3)} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#111', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any) => [v, 'Pedidos']}
                />
                <Bar dataKey="count" fill="#c23616" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}
