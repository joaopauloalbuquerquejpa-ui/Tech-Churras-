'use client'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  ChartIcon, ClipboardIcon, AlertIcon, CashIcon, CardIcon, ChefIcon,
  TargetIcon, RocketIcon, GiftIcon, StarIcon, StoreIcon, LockIcon,
} from '@/components/icons/Icons'

const OPERACAO = [
  { tab: 'stats', label: 'Resumo', icon: ChartIcon },
  { tab: 'orders', label: 'Pedidos', icon: ClipboardIcon },
  { tab: 'pending', label: 'Pendentes', icon: AlertIcon },
  { tab: 'financeiro', label: 'Financeiro', icon: CashIcon },
  { tab: 'contracts', label: 'Contratos', icon: CardIcon },
  { tab: 'equipe', label: 'Minha Equipe', icon: ChefIcon },
  { tab: 'leads', label: 'Leads', icon: TargetIcon },
  { tab: 'metricas', label: 'Métricas IA', icon: RocketIcon },
] as const

const FERRAMENTAS = [
  { href: '/admin/repasses', label: 'Repasses', icon: CashIcon },
  { href: '/admin/cupons', label: 'Cupons', icon: GiftIcon },
  { href: '/admin/alpha-testers', label: 'Alpha Testers', icon: StarIcon },
  { href: '/admin/onboarding-acougue', label: 'Onboarding Açougue', icon: StoreIcon },
  { href: '/admin/seguranca', label: 'Segurança', icon: LockIcon },
] as const

export type AdminTabCounts = Partial<Record<(typeof OPERACAO)[number]['tab'], number>>

function NavGroupLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-3 mb-2 mt-5 first:mt-0">{children}</p>
}

export function AdminSidebar({ counts = {}, orientation = 'vertical' }: { counts?: AdminTabCounts; orientation?: 'vertical' | 'horizontal' }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeTab = pathname === '/admin' ? (searchParams.get('tab') || 'stats') : null

  if (orientation === 'horizontal') {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {OPERACAO.map(({ tab, label, icon: Icon }) => {
          const active = activeTab === tab
          const count = counts[tab]
          return (
            <Link
              key={tab}
              href={`/admin?tab=${tab}`}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Icon size={16} />
              {label}
              {!!count && <span className="text-xs opacity-80">({count})</span>}
            </Link>
          )
        })}
      </div>
    )
  }

  return (
    <nav className="w-full md:w-60 shrink-0">
      <NavGroupLabel>Operação</NavGroupLabel>
      <div className="space-y-1">
        {OPERACAO.map(({ tab, label, icon: Icon }) => {
          const active = activeTab === tab
          const count = counts[tab]
          return (
            <Link
              key={tab}
              href={`/admin?tab=${tab}`}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={17} />
              <span className="flex-1">{label}</span>
              {!!count && (
                <span className={`text-xs px-1.5 rounded-full ${active ? 'bg-white/20' : 'bg-gray-800 text-gray-500'}`}>{count}</span>
              )}
            </Link>
          )
        })}
      </div>

      <NavGroupLabel>Ferramentas</NavGroupLabel>
      <div className="space-y-1">
        {FERRAMENTAS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === href ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Icon size={17} />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
