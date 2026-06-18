'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cart'

function NavItem({
  href,
  icon,
  label,
  active,
  badge,
}: {
  href: string
  icon: React.ReactNode
  label: string
  active: boolean
  badge?: number
}) {
  return (
    <Link
      href={href}
      className={`relative flex flex-col items-center gap-0.5 flex-1 pt-2 pb-1 transition-colors ${
        active ? 'text-orange-400' : 'text-gray-500'
      }`}
    >
      <span className="relative">
        {icon}
        {badge != null && badge > 0 && (
          <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </Link>
  )
}

export default function MobileNav() {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const itemCount = useCartStore((s) => s.itemCount())

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  if (user?.role === 'GRILLMASTER') {
    return (
      <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-gray-900 border-t border-gray-800 flex safe-bottom">
        <NavItem href="/grillmasters/dashboard" icon={<GridIcon />} label="Dashboard" active={isActive('/grillmasters/dashboard')} />
        <NavItem href="/ajuda" icon={<HelpIcon />} label="Ajuda" active={isActive('/ajuda')} />
      </nav>
    )
  }

  if (user?.role === 'BOUTIQUE') {
    return (
      <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-gray-900 border-t border-gray-800 flex safe-bottom">
        <NavItem href="/boutiques/dashboard" icon={<GridIcon />} label="Meu Açougue" active={isActive('/boutiques/dashboard')} />
        <NavItem href="/ajuda" icon={<HelpIcon />} label="Ajuda" active={isActive('/ajuda')} />
      </nav>
    )
  }

  if (user?.role === 'ADMIN') {
    return (
      <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-gray-900 border-t border-gray-800 flex safe-bottom">
        <NavItem href="/admin" icon={<ShieldIcon />} label="Painel" active={isActive('/admin')} />
        <NavItem href="/ajuda" icon={<HelpIcon />} label="Ajuda" active={isActive('/ajuda')} />
      </nav>
    )
  }

  if (user) {
    return (
      <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-gray-900 border-t border-gray-800 flex safe-bottom">
        <NavItem href="/dashboard" icon={<HomeIcon />} label="Home" active={isActive('/dashboard')} />
        <NavItem href="/grillmasters" icon={<FireIcon />} label="Churrasco" active={isActive('/grillmasters') || isActive('/boutiques') || isActive('/kit-perfeito')} />
        <NavItem href="/menu/novo" icon={<CartIcon />} label="Pedido" active={isActive('/menu/novo')} badge={itemCount} />
        <NavItem href="/orders" icon={<OrdersIcon />} label="Pedidos" active={isActive('/orders')} />
        <NavItem href="/perfil" icon={<PersonIcon />} label="Perfil" active={isActive('/perfil') || isActive('/indicar')} />
      </nav>
    )
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-gray-900 border-t border-gray-800 flex safe-bottom">
      <NavItem href="/grillmasters" icon={<FireIcon />} label="Churrasqueiros" active={isActive('/grillmasters')} />
      <NavItem href="/boutiques" icon={<MeatIcon />} label="Açougues" active={isActive('/boutiques')} />
      <NavItem href="/churras-club" icon={<StarIcon />} label="Club" active={isActive('/churras-club')} />
      <NavItem href="/login" icon={<PersonIcon />} label="Entrar" active={isActive('/login')} />
    </nav>
  )
}

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function FireIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c0 0-5 4.5-5 9a5 5 0 0 0 10 0c0-4.5-5-9-5-9z" />
      <path d="M12 12c0 0-2 1.5-2 3a2 2 0 0 0 4 0c0-1.5-2-3-2-3z" />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  )
}

function OrdersIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  )
}

function HelpIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function MeatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.6 3.4a4.5 4.5 0 0 1 0 6.4L14 15l-5-5 5.2-5.2a4.5 4.5 0 0 1 4.4-.4z" />
      <path d="M9 15L4.6 19.4a2 2 0 0 1-2.8-2.8L6 12" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}
