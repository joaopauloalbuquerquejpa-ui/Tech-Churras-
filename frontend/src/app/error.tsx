'use client'
import { useEffect } from 'react'
import Link from 'next/link'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-8xl mb-6">💨</p>
        <h1 className="text-3xl font-black text-red-400 mb-3">Algo deu errado</h1>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
          Tivemos um problema inesperado. Nossa equipe foi notificada. Tente novamente ou volte ao início.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Tentar novamente
          </button>
          <Link href="/"
            className="bg-gray-800 hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
            Ir para o início
          </Link>
        </div>
      </div>
    </div>
  )
}
