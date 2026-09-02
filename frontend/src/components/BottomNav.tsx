'use client'
import Link from 'next/link'
import { ChefIcon, MeatIcon, FlameIcon, PersonIcon } from '@/components/icons/Icons'

// Barra fixa embaixo, padrão iFood/Uber — reduz de "abrir menu > escolher"
// pra 1 toque nos destinos mais usados. Só mobile (sm:hidden), como o
// HomeMobileMenu que ela substitui na navegação principal.
export default function BottomNav() {
  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-950/95 backdrop-blur border-t border-gray-800 flex items-stretch justify-around"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <Link href="/" className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-gray-400 active:scale-95 transition-transform">
        <FlameIcon size={20} />
        <span className="text-[10px] font-medium">Início</span>
      </Link>
      <Link href="/grillmasters" className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-gray-400 active:scale-95 transition-transform">
        <ChefIcon size={20} />
        <span className="text-[10px] font-medium">Churrasqueiros</span>
      </Link>
      <Link href="/pedido" className="flex-1 flex flex-col items-center -mt-4">
        <span className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/40 active:scale-95 transition-transform border-4 border-gray-950">
          <FlameIcon size={24} className="text-white" />
        </span>
        <span className="text-[10px] font-bold text-orange-400 mt-0.5">Contratar</span>
      </Link>
      <Link href="/boutiques" className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-gray-400 active:scale-95 transition-transform">
        <MeatIcon size={20} />
        <span className="text-[10px] font-medium">Açougues</span>
      </Link>
      <Link href="/login" className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-gray-400 active:scale-95 transition-transform">
        <PersonIcon size={20} />
        <span className="text-[10px] font-medium">Entrar</span>
      </Link>
    </nav>
  )
}
