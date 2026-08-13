import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { API_URL } from '@/lib/api'

const BAIRROS_SP = [
  'pinheiros', 'moema', 'vila-olimpia', 'itaim-bibi', 'jardins',
  'brooklin', 'santo-andre', 'santo-amaro', 'campo-belo', 'morumbi',
  'lapa', 'perdizes', 'vila-madalena', 'higienopolis', 'bela-vista',
  'consolacao', 'cerqueira-cesar', 'jardim-paulista', 'jardim-america',
  'aclimacao', 'liberdade', 'vila-mariana', 'saude', 'ipiranga',
  'mooca', 'belem', 'tatuape', 'vila-formosa', 'penha', 'santana',
  'tucuruvi', 'mandaqui', 'casa-verde', 'limao', 'freguesia-do-o',
  'pirituba', 'jaguara', 'butanta', 'raposo-tavares', 'campo-limpo',
  'santo-amaro', 'cursino', 'jabaquara', 'vila-prudente', 'sao-mateus',
  'guaianases', 'itaquera', 'sao-miguel-paulista', 'ermelino-matarazzo',
  'cidade-tiradentes', 'iguatemi', 'aricanduva', 'parelheiros',
]

function bairroLabel(slug: string) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export async function generateStaticParams() {
  return BAIRROS_SP.map(bairro => ({ bairro }))
}

export async function generateMetadata({ params }: { params: Promise<{ bairro: string }> }): Promise<Metadata> {
  const { bairro } = await params
  const nome = bairroLabel(bairro)
  return {
    title: `Churrasqueiro em ${nome}, São Paulo — Tech Churras`,
    description: `Contrate churrasqueiros profissionais certificados em ${nome}, SP. Carne selecionada entregue no evento, rastreamento ao vivo e pagamento seguro pelo app.`,
    keywords: [
      `churrasqueiro ${nome}`, `churrasqueiro ${nome} SP`, `churrasco ${nome}`,
      `contratar churrasqueiro ${nome}`, `grillmaster ${nome}`, 'Tech Churras São Paulo',
    ],
    openGraph: {
      title: `Churrasqueiro em ${nome}, São Paulo — Tech Churras`,
      description: `Churrasqueiros certificados em ${nome}. Peça pelo app e acompanhe ao vivo.`,
      type: 'website',
    },
    alternates: { canonical: `/churrasqueiros/sao-paulo/${bairro}` },
  }
}

interface Grillmaster {
  id: string
  rating: number
  totalOrders: number
  pricePerHour: number
  city: string
  bio?: string
  photoUrl?: string
  experience: number
  user: { name: string }
}

async function getGrillmasters(): Promise<Grillmaster[]> {
  try {
    const res = await fetch(`${API_URL}/grillmasters?city=S%C3%A3o%20Paulo&available=true&limit=50`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : (data.grillmasters ?? [])
  } catch { return [] }
}

export default async function BairroPage({ params }: { params: Promise<{ bairro: string }> }) {
  const { bairro } = await params
  const nome = bairroLabel(bairro)
  const grillmasters = await getGrillmasters()

  const ldJson = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `Churrasqueiros em ${nome}, São Paulo`,
    provider: { '@type': 'Organization', name: 'Tech Churras', url: 'https://www.techchurras.com.br' },
    areaServed: { '@type': 'Place', name: `${nome}, São Paulo, SP, Brasil` },
    description: `Contrate churrasqueiros profissionais certificados em ${nome}, SP.`,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ldJson) }} />

      <div className="min-h-screen bg-black text-white">
        {/* Hero */}
        <div className="bg-gradient-to-b from-orange-950/40 to-black pt-16 pb-12 px-4 text-center">
          <nav className="text-xs text-gray-500 mb-6 flex justify-center gap-1">
            <Link href="/" className="hover:text-orange-400">Home</Link>
            <span>/</span>
            <Link href="/churrasqueiros/sao-paulo" className="hover:text-orange-400">São Paulo</Link>
            <span>/</span>
            <span className="text-gray-300">{nome}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-black mb-3">
            Churrasqueiro em <span className="text-orange-400">{nome}</span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto text-sm md:text-base">
            Churrasqueiros profissionais certificados atendendo {nome} e região. Carne selecionada,
            entrega no evento e rastreamento ao vivo pelo app.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <Link href="/register" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm">
              Pedir agora
            </Link>
            <Link href="/kit-perfeito" className="border border-orange-500/40 text-orange-400 hover:bg-orange-500/10 font-bold px-6 py-3 rounded-xl transition-colors text-sm">
              ✨ Kit perfeito com IA
            </Link>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-4 px-4 py-6 border-b border-gray-800">
          {['🔥 Churrasqueiros certificados', '📍 Atendem ' + nome, '⭐ Avaliados pela comunidade', '🔒 Pagamento seguro'].map(b => (
            <span key={b} className="text-xs text-gray-400 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-full">{b}</span>
          ))}
        </div>

        {/* GMs grid */}
        <div className="max-w-4xl mx-auto px-4 py-10">
          <h2 className="text-lg font-bold mb-6 text-gray-200">
            {grillmasters.length > 0 ? `${grillmasters.length} churrasqueiros disponíveis` : 'Churrasqueiros disponíveis'}
          </h2>
          {grillmasters.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-4">🔥</p>
              <p className="text-gray-400 mb-6">Cadastre-se e seja o primeiro churrasqueiro em {nome}!</p>
              <Link href="/para-churrasqueiros" className="bg-orange-500 text-white font-bold px-6 py-3 rounded-xl">
                Quero ser parceiro
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {grillmasters.map(gm => (
                <Link key={gm.id} href={`/grillmasters/${gm.id}`}
                  className="bg-gray-900 border border-gray-800 hover:border-orange-500/40 rounded-2xl p-4 flex gap-4 items-center transition-colors">
                  {gm.photoUrl ? (
                    <Image src={gm.photoUrl} alt={gm.user.name} width={56} height={56} className="w-14 h-14 rounded-full object-cover shrink-0 border border-gray-700" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-orange-900/30 flex items-center justify-center text-2xl shrink-0">👨‍🍳</div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate">{gm.user.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">⭐ {gm.rating.toFixed(1)} · {gm.experience} anos · R$ {gm.pricePerHour}/h</p>
                    {gm.bio && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{gm.bio}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* CTA final */}
        <div className="bg-orange-500/10 border-t border-orange-500/20 px-4 py-12 text-center">
          <h2 className="text-xl font-black mb-2">Pronto para o churrasco perfeito em {nome}?</h2>
          <p className="text-gray-400 text-sm mb-6">Crie sua conta grátis e faça seu primeiro pedido em 3 minutos.</p>
          <Link href="/register" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-2xl inline-block transition-colors">
            Começar agora — é grátis
          </Link>
        </div>
      </div>
    </>
  )
}
