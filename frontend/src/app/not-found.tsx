import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Página não encontrada — Tech Churras',
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-8xl mb-6">🔥</p>
        <h1 className="text-5xl font-black text-orange-400 mb-3">404</h1>
        <h2 className="text-2xl font-bold mb-3">Essa brasa apagou</h2>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
          A página que você procura não existe ou foi movida. Mas o churrasco ainda está rolando!
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors">
            Ir para o início
          </Link>
          <Link href="/grillmasters"
            className="bg-gray-800 hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
            Ver churrasqueiros
          </Link>
        </div>
      </div>
    </div>
  )
}
