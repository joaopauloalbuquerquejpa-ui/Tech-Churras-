'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import Link from 'next/link'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  useEffect(() => {
    const raw = localStorage.getItem('auth-storage')
    const token = raw ? JSON.parse(raw)?.state?.token : null
    if (!token) router.push('/login')
  }, [])

  function handleLogout() {
    logout()
    router.push('/login')
  }

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/grillmasters', label: 'Churrasqueiros' },
    { href: '/boutiques', label: 'Acougues' },
    { href: '/orders', label: 'Pedidos' },
    { href: '/admin', label: 'Admin' },
  ]

  return (
    <div className='min-h-screen bg-gray-950 text-white'>
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
        <div className='flex items-center gap-4'>
          <span className='text-gray-400 text-sm hidden md:block'>Ola, {user?.name || 'Usuario'}</span>
          <button onClick={handleLogout}
            className='bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded text-sm'>
            Sair
          </button>
        </div>
      </nav>
      <main className='p-6'>{children}</main>
    </div>
  )
}