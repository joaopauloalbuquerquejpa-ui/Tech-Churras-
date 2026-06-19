import type { Metadata } from 'next'
import Link from 'next/link'
import { API_URL } from '@/lib/api'


interface Grillmaster {
  id: string
  rating: number
  totalOrders: number
  pricePerHour: number
  city: string
  state: string
  bio?: string
  specialties?: string
  churrascoStyle?: string
  photoUrl?: string
  certifiedAt?: string
  experience: number
  user: { name: string }
}

function cityLabel(slug: string) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export async function generateMetadata({ params }: { params: Promise<{ cidade: string }> }): Promise<Metadata> {
  const { cidade } = await params
  const city = cityLabel(decodeURIComponent(cidade))
  return {
    title: `Churrasqueiros em ${city}`,
    description: `Encontre churrasqueiros profissionais em ${city}. Contrate via app, acompanhe ao vivo e receba churrasco de qualidade no seu evento.`,
    keywords: [`churrasqueiro ${city}`, `churrasco ${city}`, `grillmaster ${city}`, 'Tech Churras', `contratar churrasqueiro ${city}`],
    openGraph: {
      title: `Churrasqueiros em ${city} — Tech Churras`,
      description: `${city} tem churrasqueiros certificados Tech Churras disponíveis para o seu evento.`,
      type: 'website',
    },
    alternates: {
      canonical: `/churrasqueiros/${cidade}`,
    },
  }
}

async function getGrillmasters(city: string): Promise<Grillmaster[]> {
  try {
    const res = await fetch(`${API_URL}/grillmasters?city=${encodeURIComponent(city)}&available=true&limit=50`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : (data.grillmasters ?? [])
  } catch {
    return []
  }
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  )
}

export default async function ChurrasqueirosPage({ params }: { params: Promise<{ cidade: string }> }) {
  const { cidade } = await params
  const citySlug = decodeURIComponent(cidade)
  const cityName = cityLabel(citySlug)
  const grillmasters = await getGrillmasters(cityName)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Churrasqueiros em ${cityName}`,
    description: `Lista de churrasqueiros profissionais em ${cityName} disponíveis via Tech Churras`,
    numberOfItems: grillmasters.length,
    itemListElement: grillmasters.slice(0, 10).map((gm, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Person',
        name: gm.user.name,
        description: gm.bio,
        url: `https://www.techchurras.com.br/grillmasters/${gm.id}`,
      },
    })),
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Nav */}
      <nav className="border-b border-gray-900 px-4 py-3 flex items-center justify-between max-w-5xl mx-auto">
        <Link href="/" className="font-black text-orange-400 text-lg">🔥 Tech Churras</Link>
        <Link href="/grillmasters" className="text-sm text-gray-400 hover:text-white transition-colors">Ver todos</Link>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="mb-10">
          <p className="text-sm text-orange-400 font-semibold uppercase tracking-wide mb-2">Churrasqueiros Profissionais</p>
          <h1 className="text-4xl font-black mb-3">
            Churrasqueiros em {cityName}
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            {grillmasters.length > 0
              ? `${grillmasters.length} churrasqueiro${grillmasters.length > 1 ? 's' : ''} profissional${grillmasters.length > 1 ? 'is' : ''} disponível${grillmasters.length > 1 ? 'is' : ''} em ${cityName}. Contrate pelo app e acompanhe ao vivo no mapa.`
              : `Ainda não temos churrasqueiros cadastrados em ${cityName}. Seja o primeiro ou explore outras cidades.`
            }
          </p>
        </div>

        {/* CTA */}
        <div className="flex gap-3 mb-10 flex-wrap">
          <Link href="/grillmasters"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors">
            Contratar churrasqueiro
          </Link>
          <Link href="/kit-perfeito"
            className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
            Kit Perfeito com IA
          </Link>
        </div>

        {/* Grid */}
        {grillmasters.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {grillmasters.map(gm => (
              <Link key={gm.id} href={`/grillmasters/${gm.id}`}
                className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/10 transition-all group">
                {/* Photo */}
                <div className="h-40 bg-gray-800 relative overflow-hidden">
                  {gm.photoUrl ? (
                    <img src={gm.photoUrl} alt={gm.user.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">🔥</div>
                  )}
                  {gm.certifiedAt && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                      ✓ CERTIFICADO
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-4">
                  <h2 className="font-bold text-white text-base mb-1">{gm.user.name}</h2>
                  <div className="flex items-center gap-2 mb-2">
                    <StarRating rating={gm.rating} />
                    <span className="text-xs text-gray-400">{gm.rating.toFixed(1)} · {gm.totalOrders} eventos</span>
                  </div>
                  {gm.specialties && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">{gm.specialties}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">{gm.experience} anos de exp.</span>
                    <span className="text-orange-400 font-bold text-sm">R$ {gm.pricePerHour.toFixed(0)}/h</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔥</p>
            <p className="text-gray-400 mb-6">Nenhum churrasqueiro encontrado em {cityName}.</p>
            <Link href="/grillmasters" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors">
              Ver todos os churrasqueiros
            </Link>
          </div>
        )}

        {/* SEO text block */}
        <div className="mt-16 prose prose-invert prose-sm max-w-none">
          <h2 className="text-xl font-bold text-white mb-3">Como contratar um churrasqueiro em {cityName}</h2>
          <p className="text-gray-400">
            A Tech Churras conecta você com churrasqueiros profissionais em {cityName} de forma simples e segura.
            Você escolhe o churrasqueiro, define a data do evento, seleciona os produtos via açougue parceiro e
            acompanha o churrasqueiro chegando em tempo real pelo app.
          </p>
          <p className="text-gray-400 mt-3">
            Todos os churrasqueiros da plataforma passam por um processo de certificação que inclui treinamento
            em padrões de corte, postura profissional e uso da plataforma. O pagamento é feito pelo app e o
            churrasqueiro recebe 93% do valor — garantindo uma parceria justa e transparente.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-900 mt-20 px-4 py-8 text-center text-xs text-gray-600">
        <p>© {new Date().getFullYear()} Tech Churras · Churrasqueiros profissionais</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link href="/para-churrasqueiros" className="hover:text-gray-400 transition-colors">Seja parceiro</Link>
          <Link href="/termos-de-uso" className="hover:text-gray-400 transition-colors">Termos</Link>
          <Link href="/politica-de-privacidade" className="hover:text-gray-400 transition-colors">Privacidade</Link>
        </div>
      </footer>
    </div>
  )
}