import Link from 'next/link'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-xl font-bold text-orange-500">
          Tech Churras
        </Link>
        <span className="text-gray-700 hidden sm:block">|</span>
        <span className="text-sm text-gray-400 hidden sm:block">Documentos Legais</span>
        <Link
          href="/dashboard"
          className="ml-auto text-sm text-gray-400 hover:text-white transition-colors"
        >
          &larr; Voltar ao app
        </Link>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-10 leading-relaxed">
        {children}
      </main>
      <footer className="border-t border-gray-800 px-6 py-6 text-center text-xs text-gray-600">
        <div className="flex justify-center gap-6 mb-2">
          <Link href="/termos-de-uso" className="hover:text-gray-400 transition-colors">Termos de Uso</Link>
          <Link href="/politica-de-privacidade" className="hover:text-gray-400 transition-colors">Politica de Privacidade</Link>
        </div>
        © 2026 Tech Churras. Todos os direitos reservados.
      </footer>
    </div>
  )
}
