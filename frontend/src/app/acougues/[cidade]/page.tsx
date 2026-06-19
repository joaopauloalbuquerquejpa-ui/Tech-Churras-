import type { Metadata } from 'next'
import Link from 'next/link'
import { API_URL } from '@/lib/api'


interface Boutique {
  id: string
  name: string
  city: string
  state: string
  rating: number
  description?: string
  logoUrl?: string
  facadeUrl?: string
  openingHours?: string
  deliveryOrPickup?: string
  open: boolean
}

function cityLabel(slug: string) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export async function generateMetadata({ params }: { params: Promise<{ cidade: string }> }): Promise<Metadata> {
  const { cidade } = await params
  const city = cityLabel(decodeURIComponent(cidade))
  return {
    title: `Açougues em ${city}`,
    description: `Os melhores açougues parceiros em ${city}. Carnes premium selecionadas, entrega no evento e integração com churrasqueiros profissionais via Tech Churras.`,
    keywords: [`açougue ${city}`, `carne ${city}`, `churrasco ${city}`, 'Tech Churras', `acougue parceiro ${city}`],
    openGraph: {
      title: `Açougues em ${city} — Tech Churras`,
      description: `Encontre açougues premium em ${city} com entrega para seu evento de churrasco.`,
      type: 'website',
    },
    alternates: {
      canonical: `/acougues/${cidade}`,
    },
  }
}

async function getBoutiques(city: string): Promise<Boutique[]> {
  try {
    const res = await fetch(`${API_URL}/boutiques?city=${encodeURIComponent(city)}`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : (data.boutiques ?? [])
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

export default async function AcouguesPage({ params }: { params: Promise<{ cidade: string }> }) {
  const { cidade } = await params
  const citySlug = decodeURIComponent(cidade)
  const cityName = cityLabel(citySlug)
  const boutiques = await getBoutiques(cityName)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Açougues em ${cityName}`,
    description: `Lista de açougues premium em ${cityName} parceiros da Tech Churras`,
    numberOfItems: boutiques.length,
    itemListElement: boutiques.slice(0, 10).map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'FoodEstablishment',
        name: b.name,
        description: b.description,
        address: { '@type': 'PostalAddress', addressLocality: b.city, addressRegion: b.state, addressCountry: 'BR' },
        url: `https://www.techchurras.com.br/boutiques/${b.id}`,
      },
    })),
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Nav */}
      <nav className="border-b border-gray-900 px-4 py-3 flex items-center justify-between max-w-5xl mx-auto">
        <Link href="/" className="font-black text-orange-400 text-lg">🔥 Tech Churras</Link>
        <Link href="/boutiques" className="text-sm text-gray-400 hover:text-white transition-colors">Ver todos</Link>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="mb-10">
          <p className="text-sm text-orange-400 font-semibold uppercase tracking-wide mb-2">Açougues Parceiros</p>
          <h1 className="text-4xl font-black mb-3">
            Açougues em {cityName}
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            {boutiques.length > 0
              ? `${boutiques.length} açougue${boutiques.length > 1 ? 's' : ''} premium em ${cityName}. Selecione os cortes certos para o seu churrasco e receba tudo organizado no evento.`
              : `Ainda não temos açougues cadastrados em ${cityName}. Indique um açougue para se juntar à plataforma.`
            }
          </p>
        </div>

        {/* CTA */}
        <div className="flex gap-3 mb-10 flex-wrap">
          <Link href="/boutiques"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors">
            Ver açougues
          </Link>
          <Link href="/kit-perfeito"
            className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
            Montar kit com IA
          </Link>
        </div>

        {/* Grid */}
        {boutiques.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {boutiques.map(b => (
              <Link key={b.id} href={`/boutiques/${b.id}`}
                className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/10 transition-all group">
                {/* Cover */}
                <div className="h-40 bg-gray-800 relative overflow-hidden">
                  {b.facadeUrl || b.logoUrl ? (
                    <img
                      src={b.facadeUrl ?? b.logoUrl!}
                      alt={b.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">🥩</div>
                  )}
                  <div className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    b.open ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'
                  }`}>
                    {b.open ? 'ABERTO' : 'FECHADO'}
                  </div>
                </div>
                {/* Info */}
                <div className="p-4">
                  <h2 className="font-bold text-white text-base mb-1">{b.name}</h2>
                  <div className="flex items-center gap-2 mb-2">
                    <StarRating rating={b.rating} />
                    <span className="text-xs text-gray-400">{b.rating.toFixed(1)}</span>
                  </div>
                  {b.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">{b.description}</p>
                  )}
                  {b.openingHours && (
                    <p className="text-xs text-gray-600">{b.openingHours}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🥩</p>
            <p className="text-gray-400 mb-6">Nenhum açougue encontrado em {cityName}.</p>
            <Link href="/boutiques" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors">
              Ver todos os açougues
            </Link>
          </div>
        )}

        {/* SEO text block */}
        <div className="mt-16 prose prose-invert prose-sm max-w-none">
          <h2 className="text-xl font-bold text-white mb-3">Açougues premium em {cityName} — parceiros Tech Churras</h2>
          <p className="text-gray-400">
            Os açougues parceiros da Tech Churras em {cityName} oferecem cortes nobres selecionados especialmente
            para churrasco. Ao montar seu pedido pelo app, você escolhe os produtos diretamente do açougue e eles
            chegam organizados para o seu churrasqueiro profissional trabalhar.
          </p>
          <p className="text-gray-400 mt-3">
            Açougues parceiros pagam uma mensalidade reduzida (R$ 369/mês) e uma comissão de 7% por pedido
            concluído. Em troca, ganham visibilidade na plataforma, acesso a clientes premium e integração
            com o sistema de gestão de pedidos.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-900 mt-20 px-4 py-8 text-center text-xs text-gray-600">
        <p>© {new Date().getFullYear()} Tech Churras · Açougues premium</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link href="/para-acougues" className="hover:text-gray-400 transition-colors">Seja parceiro</Link>
          <Link href="/termos-de-uso" className="hover:text-gray-400 transition-colors">Termos</Link>
          <Link href="/politica-de-privacidade" className="hover:text-gray-400 transition-colors">Privacidade</Link>
        </div>
      </footer>
    </div>
  )
}