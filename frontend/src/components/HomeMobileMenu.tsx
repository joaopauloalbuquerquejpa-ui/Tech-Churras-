'use client'
import { useState } from 'react'
import Link from 'next/link'

const LINKS = [
  { href: '/grillmasters', label: 'Churrasqueiros' },
  { href: '/boutiques', label: 'Açougues' },
  { href: '/kit-perfeito', label: 'Kit Perfeito IA ✨' },
  { href: '/churrasco-corporativo', label: 'Eventos para Empresas' },
  { href: '/churras-club', label: '🏆 Churras Club' },
  { href: '/lancamento', label: 'Cidade Piloto' },
  { href: '/ajuda', label: 'Ajuda' },
]

export default function HomeMobileMenu() {
  const [open, setOpen] = useState(false)

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        aria-label="Menu"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute top-14 left-0 right-0 z-50 bg-gray-900 border-b border-gray-800 px-4 py-4 flex flex-col gap-1">
          {LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <div className="h-px bg-gray-800 my-2" />
          <Link href="/register" onClick={() => setOpen(false)}
            className="px-4 py-3 rounded-xl text-sm font-bold text-orange-400 hover:bg-orange-500/10 transition-colors">
            Criar conta grátis →
          </Link>
        </div>
      )}
    </div>
  )
}
