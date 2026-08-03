'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cart'
import { useFavoritesStore } from '@/store/favorites'
import Link from 'next/link'
import NotificationBell from '@/components/NotificationBell'
import OnboardingTour from '@/components/OnboardingTour'
import SupportButton from '@/components/SupportButton'
import MobileNav from '@/components/MobileNav'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
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

  const PROTECTED_PREFIXES = [
    '/dashboard', '/orders', '/menu', '/perfil',
    '/admin', '/favoritos',
    '/boutiques/dashboard', '/grillmasters/dashboard',
  ]

  useEffect(() => {
    const raw = localStorage.getItem('auth-storage')
    const token = raw ? JSON.parse(raw)?.state?.token : null
    const isProtected = PROTECTED_PREFIXES.some(
      p => pathname === p || pathname.startsWith(p + '/')
    )
    if (!token && isProtected) {
      // Leva o destino (com query string) junto — sem isso o cliente perdia
      // a escolha de GM/kit que já tinha feito e caía no dashboard genérico
      // depois de logar, em vez de voltar pro que estava fazendo. Lê
      // window.location direto (em vez de useSearchParams) pra não forçar
      // todo page do dashboard a precisar de Suspense boundary.
      const dest = pathname + window.location.search
      router.push('/login?redirect=' + encodeURIComponent(dest))
    }
    else if (token) loadFavorites()
  }, [pathname])

  function handleLogout() {
    logout()
    router.push('/login')
  }

  const customerLinks = [
    { href: '/dashboard', label: 'Dashboard', tour: 'dashboard-link' },
    { href: '/menu', label: 'Menu', tour: 'menu-link' },
    { href: '/grillmasters', label: 'Churrasqueiros', tour: 'grillmasters-link' },
    { href: '/boutiques', label: 'Acougues', tour: 'boutiques-link' },
    { href: '/kit-perfeito', label: '✨ Kit IA', tour: '' },
    { href: '/menu/assistente', label: 'Assistente', tour: '' },
    { href: '/churras-club', label: '🏆 Club', tour: '' },
    { href: '/orders', label: 'Pedidos', tour: 'orders-link' },
    { href: '/favoritos', label: 'Favoritos', tour: 'favoritos-link' },
    { href: '/indicar', label: '🎁 Indicar', tour: '' },
    { href: '/perfil', label: 'Perfil', tour: '' },
    { href: '/ajuda', label: 'Ajuda', tour: '' },
  ]

  const publicLinks = [
    { href: '/boutiques', label: 'Acougues', tour: '' },
    { href: '/grillmasters', label: 'Churrasqueiros', tour: '' },
    { href: '/kit-perfeito', label: 'Kit Perfeito', tour: '' },
    { href: '/churras-club', label: '🏆 Club', tour: '' },
    { href: '/ajuda', label: 'Ajuda', tour: '' },
  ]
  const boutiqueLinks = [
    { href: '/boutiques/dashboard', label: 'Meu Acougue', tour: 'boutique-dashboard-link' },
    { href: '/ajuda', label: 'Ajuda', tour: '' },
  ]
  const grillmasterLinks = [
    { href: '/grillmasters/dashboard', label: 'Meu Dashboard', tour: 'dashboard-gm-link' },
    { href: '/ajuda', label: 'Ajuda', tour: '' },
  ]
  const adminLinks = [
    { href: '/admin', label: 'Painel', tour: '' },
    { href: '/founder', label: 'Fundador', tour: '' },
    { href: '/ajuda', label: 'Ajuda', tour: '' },
  ]
  const links =
    !user ? publicLinks :
    user.role === 'BOUTIQUE' ? boutiqueLinks :
    user.role === 'GRILLMASTER' ? grillmasterLinks :
    user.role === 'ADMIN' ? adminLinks :
    customerLinks

  return (
    <div className='min-h-screen bg-gray-950 text-white'>
      <PushBanner />
      <nav className='bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between gap-4'>
        <div className='flex items-center gap-6 min-w-0'>
          <Link href='/' className='flex items-center gap-2 shrink-0'>
            <div className='h-8 overflow-hidden relative w-9'>
              <img src='/logo-flame.png' alt='' role='presentation' className='absolute bottom-0 h-14 w-auto' />
            </div>
            <span className='font-black text-xl text-white leading-none'>Tech <span className='text-orange-500'>Churras</span></span>
          </Link>
          <div className='hidden md:flex items-center gap-1 min-w-0 overflow-x-auto whitespace-nowrap'>
            {links.map(link => (
              <Link key={link.href} href={link.href}
                {...(link.tour ? { 'data-tour': link.tour } : {})}
                className={'shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition ' +
                  (pathname === link.href || pathname.startsWith(link.href + '/')
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800')}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className='flex items-center gap-3 shrink-0'>
          {user && <span className='text-gray-400 text-sm hidden md:block whitespace-nowrap max-w-[160px] truncate'>Ola, {user.name}</span>}
          <CartIcon count={itemCount} />
          {user && <NotificationBell />}
          {user ? (
            <button onClick={handleLogout} className='bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded text-sm'>
              Sair
            </button>
          ) : (
            <Link href='/login' className='bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm font-medium'>
              Entrar
            </Link>
          )}
        </div>
      </nav>
      {/* Nunca mostrar o tour em telas de fluxo crítico (pagamento, checkout) —
          já bloqueou clique no botão de pagar logo depois do guest checkout. */}
      {user && !pathname.includes('/payment') && pathname !== '/pedido' && pathname !== '/kit-perfeito' && (
        <OnboardingTour userId={user.id} role={user.role} />
      )}
      {/* pb extra no desktop pra sobrar espaço embaixo do conteúdo — o toast de
          instalar o PWA é fixed bottom-right e cobria cards perto do rodapé. */}
      <main className='p-6 pb-24 md:pb-28'>{children}</main>
      <MobileNav />
      <PWAInstallPrompt />
      <SupportButton />
      <footer className='border-t border-gray-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600'>
        <span>© 2026 Tech Churras</span>
        <div className='flex gap-5'>
          <a href='/galeria' className='hover:text-gray-400 transition-colors'>Galeria</a>
          <a href='/ajuda' className='hover:text-gray-400 transition-colors'>Ajuda</a>
          <a href='/termos-de-uso' target='_blank' className='hover:text-gray-400 transition-colors'>Termos de Uso</a>
          <a href='/politica-de-privacidade' target='_blank' className='hover:text-gray-400 transition-colors'>Politica de Privacidade</a>
        </div>
      </footer>
    </div>
  )
}
