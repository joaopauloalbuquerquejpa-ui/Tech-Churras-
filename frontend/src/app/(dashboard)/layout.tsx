'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cart'
import { useFavoritesStore } from '@/store/favorites'
import Link from 'next/link'
import NotificationBell from '@/components/NotificationBell'
import { usePushNotifications } from '@/hooks/usePushNotifications'

function PushBanner() {
  const { permission, subscribed, supported, subscribe } = usePushNotifications()
  if (!supported || permission === 'denied' || permission === 'granted' || subscribed) return null
  return (
    <div className="bg-orange-500/10 border-b border-orange-500/20 px-6 py-2.5 flex items-center justify-between gap-4">
      <p className="text-sm text-orange-200">
        Receba atualizacoes dos seus pedidos em tempo real.
      </p>
      <button
        onClick={subscribe}
        className="shrink-0 text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
      >
        Ativar notificacoes
      </button>
    </div>
  )
}

function CartIcon({ count }: { count: number }) {
  return (
    <Link href="/menu/novo" className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-800 transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 leading-none">
          {count}
        </span>
      )}
    </Link>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const itemCount = useCartStore((s) => s.itemCount())
  const loadFavorites = useFavoritesStore((s) => s.load)

  useEffect(() => {
    const raw = localStorage.getItem('auth-storage')
    const token = raw ? JSON.parse(raw)?.state?.token : null
    if (!token) router.push('/login')
    else loadFavorites()
  }, [])

  function handleLogout() {
    logout()
    router.push('/login')
  }

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/menu', label: 'Menu' },
    { href: '/grillmasters', label: 'Churrasqueiros' },
    { href: '/boutiques', label: 'Acougues' },
    { href: '/orders', label: 'Pedidos' },
    { href: '/favoritos', label: 'Favoritos' },
    ...(user?.role === 'GRILLMASTER' ? [{ href: '/grillmasters/dashboard', label: 'Meu Dashboard' }] : []),
    { href: '/admin', label: 'Admin' },
    { href: '/founder', label: 'Fundador' },
  ]

  return (
    <div className='min-h-screen bg-gray-950 text-white'>
      <PushBanner />
      <nav className='bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between'>
        <div className='flex items-center gap-6'>
          <h1 className='text-xl font-bold text-orange-500'>Tech Churras</h1>
          <div className='hidden md:flex items-center gap-1'>
            {links.map(link => (
              <Link key={link.href} href={link.href}
                className={'px-3 py-1.5 rounded-lg text-sm font-medium transition ' +
                  (pathname === link.href || pathname.startsWith(link.href + '/')
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800')}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className='flex items-center gap-3'>
          <span className='text-gray-400 text-sm hidden md:block'>Ola, {user?.name || 'Usuario'}</span>
          <CartIcon count={itemCount} />
          <NotificationBell />
          <button onClick={handleLogout}
            className='bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded text-sm'>
            Sair
          </button>
        </div>
      </nav>
      <main className='p-6'>{children}</main>
      <footer className='border-t border-gray-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600'>
        <span>© 2026 Tech Churras</span>
        <div className='flex gap-5'>
          <a href='/termos-de-uso' target='_blank' className='hover:text-gray-400 transition-colors'>Termos de Uso</a>
          <a href='/politica-de-privacidade' target='_blank' className='hover:text-gray-400 transition-colors'>Politica de Privacidade</a>
        </div>
      </footer>
    </div>
  )
}
