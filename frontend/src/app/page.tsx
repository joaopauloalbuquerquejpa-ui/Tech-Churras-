import type { Metadata } from 'next'
import Link from 'next/link'
import { FlameIcon, MeatIcon, ChefIcon, CelebrationIcon, CheckIcon, TrophyIcon } from '@/components/icons/Icons'
import PriceCalculator from '@/components/PriceCalculator'
import GarantiaSelo from '@/components/GarantiaSelo'
import HomeMobileMenu from '@/components/HomeMobileMenu'
import { API_URL } from '@/lib/api'

export const metadata: Metadata = {
  title: 'Contratar Churrasqueiro Profissional em São Paulo | Tech Churras',
  description: 'Contrate Grillmasters profissionais certificados para aniversários, eventos corporativos e confraternizações em São Paulo. Kit de churrasco com IA, açougue premium parceiro e rastreamento ao vivo. Jota Grillmaster — fundador.',
  keywords: [
    'contratar churrasqueiro São Paulo',
    'grillmaster profissional SP',
    'churrasqueiro para aniversário São Paulo',
    'churrasco corporativo SP',
    'churrasqueiro a domicílio São Paulo',
    'Jota Grillmaster',
    'Tech Churras',
    'kit churrasco completo SP',
    'churrasqueiro para evento',
    'açougue parceiro churrasco',
  ],
  openGraph: {
    title: 'Contratar Churrasqueiro Profissional em SP | Tech Churras',
    description: 'Grillmasters certificados, açougue premium e IA que planeja o kit ideal. Acompanhe o churrasqueiro ao vivo no mapa. São Paulo e Grande SP.',
    type: 'website',
    url: 'https://www.techchurras.com.br',
    images: [{ url: '/jota.jpg', width: 1200, height: 630, alt: 'Tech Churras — Grillmasters Profissionais em SP' }],
  },
  alternates: { canonical: 'https://www.techchurras.com.br' },
}


const STATIC_TESTIMONIALS: Testimonial[] = []

interface Grillmaster {
  id: string; rating: number; pricePerHour: number; city: string; state: string
  specialties?: string; photoUrl?: string; certifiedAt?: string; user: { name: string }
}
interface Boutique {
  id: string; name: string; city: string; state: string
  description?: string; photoUrl?: string; isValidated?: boolean
}
interface Testimonial {
  id: string; rating: number; comment: string
  grillmasterName: string | null; customerFirstName: string; city: string | null
}

async function getFeaturedGrillmasters(): Promise<Grillmaster[]> {
  try {
    const res = await fetch(`${API_URL}/grillmasters?available=true&limit=6`, { next: { revalidate: 1800 } })
    if (!res.ok) return []
    const data = await res.json()
    const list: Grillmaster[] = Array.isArray(data) ? data : (data.grillmasters ?? [])
    return list.sort((a, b) => b.rating - a.rating).slice(0, 6)
  } catch { return [] }
}

async function getFeaturedBoutiques(): Promise<Boutique[]> {
  try {
    const res = await fetch(`${API_URL}/boutiques?limit=6`, { next: { revalidate: 1800 } })
    if (!res.ok) return []
    const data = await res.json()
    const list: Boutique[] = Array.isArray(data) ? data : (data.boutiques ?? [])
    return list.slice(0, 6)
  } catch { return [] }
}

async function getTestimonials(): Promise<Testimonial[]> {
  try {
    const res = await fetch(`${API_URL}/public/testimonials`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    return await res.json()
  } catch { return [] }
}

const PERSONAS = [
  {
    icon: CelebrationIcon,
    badge: 'Para você',
    badgeColor: 'text-orange-400',
    titulo: 'Churrasco completo, sem stress',
    items: [
      'Faça tudo online — Grillmaster e cortes chegam até você',
      'Grillmaster chancelado na sua cidade',
      'Cortes do açougue parceiro separados no dia',
      'IA monta o kit certo para seus convidados',
    ],
    href: '/grillmasters',
    cta: 'Contratar Grillmaster',
    cor: 'border-orange-500/30 bg-orange-500/5',
  },
  {
    icon: ChefIcon,
    badge: 'Para Grillmasters',
    badgeColor: 'text-yellow-400',
    titulo: 'Mais pedidos. Mais renda.',
    items: [
      'Receba pedidos e gerencie agenda pelo app',
      'Chancela Jota Albuquerque inclusa',
      'Treinamento de chancelamento presencial',
      '2 meses sem mensalidade para os primeiros',
    ],
    href: '/para-churrasqueiros',
    cta: 'Quero ser Grillmaster parceiro',
    cor: 'border-yellow-500/20 bg-yellow-500/5',
  },
  {
    icon: MeatIcon,
    badge: 'Para açougues',
    badgeColor: 'text-red-400',
    titulo: 'Mais receita. Marketing orgânico. Zero logística.',
    items: [
      'Seus clientes já passam pelo balcão — converta-os em pedidos recorrentes',
      'Marketing orgânico: apareça para quem já está montando o churrasco',
      'Receita adicional por evento, repasse semanal via PIX',
      'Saia na frente dos concorrentes — seja o primeiro da sua cidade',
      '2 meses sem mensalidade para os primeiros parceiros',
    ],
    href: '/para-acougues',
    cta: 'Quero ser açougue parceiro',
    cor: 'border-red-500/20 bg-red-500/5',
  },
]

const HOW_IT_WORKS = [
  {
    step: '1', icon: ChefIcon,
    title: 'Escolha o Grillmaster',
    desc: 'Busque pelos Grillmasters chancelados na sua cidade. Leia avaliações, veja o portfólio, compare preços e escolha o estilo certo para o seu evento.',
  },
  {
    step: '2', icon: MeatIcon,
    title: 'Monte o kit com açougue parceiro',
    desc: 'A IA sugere os cortes e quantidades certas para o número de convidados — incluindo opções vegetarianas e veganas. Os cortes são separados e o Grillmaster retira no dia.',
  },
  {
    step: '3', icon: FlameIcon,
    title: 'Curta. Acompanhe ao vivo.',
    desc: 'No dia do evento, o Grillmaster aparece no mapa em tempo real. Você e seus convidados acompanham tudo pelo app. Só relaxar e curtir.',
  },
]

export default async function HomePage() {
  const [grillmasters, boutiques, rawTestimonials] = await Promise.all([
    getFeaturedGrillmasters(),
    getFeaturedBoutiques(),
    getTestimonials(),
  ])
  const testimonials = rawTestimonials.length > 0 ? rawTestimonials : STATIC_TESTIMONIALS

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Como contratar um churrasqueiro profissional em São Paulo?",
        "acceptedAnswer": { "@type": "Answer", "text": "Pelo app da Tech Churras: escolha o Grillmaster, selecione a data e o número de convidados, deixe a IA montar o kit de carnes e acompanhe o churrasqueiro ao vivo no mapa. Tudo em menos de 5 minutos." }
      },
      {
        "@type": "Question",
        "name": "Quanto custa um churrasqueiro profissional em SP?",
        "acceptedAnswer": { "@type": "Answer", "text": "Na Tech Churras os Grillmasters cobram a partir de R$180/hora. Para um evento de 4 horas com 20 pessoas, o custo médio com Grillmaster + kit de carnes fica entre R$1.200 e R$2.500, dependendo dos cortes escolhidos." }
      },
      {
        "@type": "Question",
        "name": "O churrasqueiro traz o equipamento?",
        "acceptedAnswer": { "@type": "Answer", "text": "Sim. Todos os Grillmasters da Tech Churras trazem a grelha, utensílios e temperos. As carnes são fornecidas pelos açougues premium parceiros da plataforma e entregues no local do evento." }
      },
      {
        "@type": "Question",
        "name": "A Tech Churras atende em qual região de São Paulo?",
        "acceptedAnswer": { "@type": "Answer", "text": "Atendemos toda São Paulo capital e Grande SP. O Grillmaster mais próximo do seu endereço é selecionado automaticamente pela plataforma." }
      },
      {
        "@type": "Question",
        "name": "É possível contratar churrasqueiro para evento corporativo?",
        "acceptedAnswer": { "@type": "Answer", "text": "Sim. A Tech Churras atende confraternizações corporativas, eventos de empresa e team building com churrasco. O Jota Grillmaster, fundador da plataforma, tem experiência em eventos de até 300 pessoas." }
      },
      {
        "@type": "Question",
        "name": "Tech Churras é o mesmo que a gíria 'tech churras' de encontros de tecnologia?",
        "acceptedAnswer": { "@type": "Answer", "text": "Não. Tech Churras é uma empresa registrada (CNPJ 67.830.186/0001-87) que opera um marketplace de churrasco sob demanda em São Paulo, conectando clientes a churrasqueiros profissionais (Grill Masters) e açougues parceiros. Não tem relação com o termo informal 'tech churras' usado para encontros de networking da comunidade de tecnologia." }
      }
    ]
  }

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Tech Churras",
      "alternateName": "Tech Churras — marketplace de churrasco em São Paulo",
      "disambiguatingDescription": "Empresa registrada (CNPJ 67.830.186/0001-87) que opera um marketplace de churrasco sob demanda em São Paulo. Não deve ser confundida com o termo informal 'tech churras' usado para encontros de networking da comunidade de tecnologia brasileira.",
      "url": "https://www.techchurras.com.br",
      "logo": "https://www.techchurras.com.br/icon-512.png",
      "description": "Marketplace de churrasco a domicílio: churrasqueiro profissional + carnes de açougue parceiro, em um pedido único online. São Paulo, Brasil.",
      "founder": { "@type": "Person", "name": "Jota Albuquerque", "jobTitle": "BBQ Master" },
      "taxID": "67.830.186/0001-87",
      "areaServed": { "@type": "City", "name": "São Paulo" },
    }) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Service",
      "serviceType": "Churrasco a domicílio com churrasqueiro profissional",
      "provider": { "@type": "Organization", "name": "Tech Churras", "url": "https://www.techchurras.com.br" },
      "areaServed": { "@type": "City", "name": "São Paulo" },
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "BRL",
        "lowPrice": "800",
        "highPrice": "2500",
        "description": "Churrasco completo: churrasqueiro profissional + kit de carnes de açougue parceiro + taxa de serviço. Pedido online sem cadastro prévio.",
        "url": "https://www.techchurras.com.br/pedido",
      },
    }) }} />
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Nav */}
      <nav className="relative border-b border-gray-900/50 px-4 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="h-8 overflow-hidden relative w-9">
            <img src="/logo-flame.png" alt="" role="presentation" className="absolute bottom-0 h-14 w-auto" />
          </div>
          <span className="font-black text-xl text-white leading-none">Tech <span className="text-orange-500">Churras</span></span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/grillmasters" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">Churrasqueiros</Link>
          <Link href="/boutiques" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">Açougues</Link>
          <Link href="/kit-perfeito" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">IA ✨</Link>
          <Link href="/churras-club" className="text-sm text-orange-400 hover:text-orange-300 transition-colors hidden sm:inline-flex items-center gap-1 font-semibold"><TrophyIcon size={14} /> Club</Link>
          <Link href="/login" className="text-sm bg-gray-800 hover:bg-gray-700 text-white px-4 py-1.5 rounded-lg transition-colors">Entrar</Link>
          <Link href="/register" className="text-sm bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg font-semibold transition-colors hidden sm:inline-block">Cadastrar</Link>
          <HomeMobileMenu />
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 text-xs text-orange-400 font-semibold mb-8 uppercase tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
          Grillmaster + Açougue + IA + Localização ao vivo
        </div>
        <h1 className="font-display text-5xl md:text-7xl font-black leading-none mb-6">
          O melhor churrasco{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-orange-600">
            da sua vida
          </span>
          {' '}começa aqui.
        </h1>
        <p className="text-gray-300 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Grillmaster profissional. Açougue premium. IA que monta tudo.{' '}
          <span className="text-gray-400">Um ecossistema completo — para festas, eventos corporativos e qualquer ocasião que mereça o melhor.</span>
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/grillmasters"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-2xl text-lg transition-all hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5">
            Contratar Grillmaster
          </Link>
          <Link href="/boutiques"
            className="bg-gray-800 hover:bg-gray-700 text-white font-semibold px-8 py-4 rounded-2xl text-lg transition-colors border border-gray-700 inline-flex items-center gap-2">
            <MeatIcon size={18} /> Ver açougues parceiros
          </Link>
          <Link href="/kit-perfeito"
            className="text-orange-400 hover:text-orange-300 font-semibold px-4 py-4 text-base transition-colors">
            Montar kit com IA ✨
          </Link>
        </div>
      </section>

      <PriceCalculator />

      {/* Garantia — eliminação de risco logo abaixo do CTA principal */}
      <section className="max-w-6xl mx-auto px-4 pb-8">
        <div className="max-w-xl mx-auto">
          <GarantiaSelo />
        </div>
      </section>

      {/* Para quem é? */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <p className="text-center text-sm text-orange-400 font-semibold uppercase tracking-wide mb-3">Para quem é?</p>
        <h2 className="font-display text-3xl md:text-4xl font-black text-center mb-4">Uma plataforma. Três soluções.</h2>
        <p className="text-center text-gray-500 max-w-xl mx-auto mb-12 text-base">
          Cliente, Grillmaster ou açougue — a Tech Churras tem uma solução feita para você.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PERSONAS.map(p => (
            <div key={p.titulo} className={`border ${p.cor} rounded-2xl p-7 flex flex-col`}>
              <div className="mb-4"><p.icon size={34} className="text-orange-400" /></div>
              <span className={`text-xs font-bold uppercase tracking-widest mb-2 ${p.badgeColor}`}>{p.badge}</span>
              <h3 className="font-black text-white text-xl mb-4">{p.titulo}</h3>
              <ul className="space-y-2 flex-1 mb-6">
                {p.items.map(item => (
                  <li key={item} className="flex items-start gap-2 text-gray-400 text-sm">
                    <CheckIcon size={15} className="text-orange-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href={p.href} className="text-sm font-bold text-orange-400 hover:text-orange-300 transition-colors">
                {p.cta} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-900 py-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-center">
            {[
              { value: '4.9★', label: 'avaliação média', detail: 'Grillmasters chancelados' },
              { value: '100%', label: 'açougues validados', detail: 'Qualidade garantida nos cortes' },
              { value: 'R$ 0', label: 'taxa pro cliente', detail: 'Você paga só Grillmaster + carne' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-3xl md:text-4xl font-black text-orange-400 mb-1">{s.value}</p>
                <p className="text-sm font-semibold text-white">{s.label}</p>
                <p className="text-xs text-gray-600 mt-0.5">{s.detail}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-600 mt-8">
            Fundada por{' '}<span className="text-gray-400 font-semibold">Jota Albuquerque</span>{' '}— 13 anos de Jota BBQ Eventos servindo clientela triple AAA em São Paulo e Rio de Janeiro
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <p className="text-center text-sm text-orange-400 font-semibold uppercase tracking-wide mb-3">Como funciona</p>
        <h2 className="font-display text-3xl font-black text-center mb-12">Churrasco completo em 3 passos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {HOW_IT_WORKS.map(s => (
            <div key={s.step} className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-4">
                <s.icon size={30} className="text-orange-400" />
              </div>
              <div className="inline-flex items-center justify-center w-6 h-6 bg-orange-500 text-white text-xs font-black rounded-full mb-3">
                {s.step}
              </div>
              <h3 className="font-bold text-white text-lg mb-2">{s.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-20" suppressHydrationWarning>
          <p className="text-center text-sm text-orange-400 font-semibold uppercase tracking-wide mb-3">Quem usou, aprovou</p>
          <h2 className="font-display text-3xl font-black text-center mb-12">O que nossos clientes dizem</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonials.slice(0, 6).map(t => (
              <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center gap-1 text-yellow-400 text-lg">
                  {Array.from({ length: t.rating }, (_, i) => <span key={i}>★</span>)}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed flex-1">"{t.comment}"</p>
                <div className="flex items-center justify-between border-t border-gray-800 pt-3">
                  <div>
                    <p className="text-xs font-semibold text-white">{t.customerFirstName}</p>
                    {t.city && <p className="text-xs text-gray-600">{t.city}</p>}
                  </div>
                  {t.grillmasterName && (
                    <p className="text-xs text-orange-400 font-medium">com {t.grillmasterName.split(' ')[0]}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Grillmasters */}
      {grillmasters.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-sm text-orange-400 font-semibold uppercase tracking-wide mb-1 inline-flex items-center gap-1.5"><ChefIcon size={14} /> Chancelados</p>
              <h2 className="font-display text-3xl font-black">Grillmasters disponíveis</h2>
            </div>
            <Link href="/grillmasters" className="text-sm text-orange-400 hover:text-orange-300 font-semibold transition-colors">
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {grillmasters.map(gm => (
              <Link key={gm.id} href={`/grillmasters/${gm.id}`}
                className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-500/10 transition-all group">
                <div className="h-44 bg-gray-800 relative overflow-hidden">
                  {gm.photoUrl
                    ? <img src={gm.photoUrl} alt={gm.user.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center text-orange-500/40"><FlameIcon size={56} /></div>
                  }
                  {gm.certifiedAt && (
                    <div className="absolute top-3 right-3 bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1"><CheckIcon size={10} /> CERTIFICADO</div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-white">{gm.user.name}</h3>
                    <span className="shrink-0 text-yellow-400 font-bold text-sm">★ {gm.rating.toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{gm.city}, {gm.state}</p>
                  {gm.specialties && <p className="text-xs text-gray-400 line-clamp-2 mb-3">{gm.specialties}</p>}
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">Disponível</span>
                    <span className="text-xs text-gray-500">Grillmaster certificado</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Boutiques */}
      {boutiques.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-sm text-red-400 font-semibold uppercase tracking-wide mb-1 inline-flex items-center gap-1.5"><MeatIcon size={14} /> Validados</p>
              <h2 className="font-display text-3xl font-black">Açougues parceiros</h2>
            </div>
            <Link href="/boutiques" className="text-sm text-orange-400 hover:text-orange-300 font-semibold transition-colors">
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {boutiques.map(b => (
              <Link key={b.id} href={`/boutiques/${b.id}`}
                className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-red-500/30 hover:shadow-xl hover:shadow-red-500/10 transition-all group">
                <div className="h-44 bg-gray-800 relative overflow-hidden">
                  {b.photoUrl
                    ? <img src={b.photoUrl} alt={b.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center text-red-500/40"><MeatIcon size={56} /></div>
                  }
                  <div className="absolute top-3 right-3 bg-green-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1"><CheckIcon size={10} /> VALIDADO</div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-white mb-1">{b.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{b.city}, {b.state}</p>
                  {b.description && <p className="text-xs text-gray-400 line-clamp-2 mb-3">{b.description}</p>}
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-medium">Cortes premium</span>
                </div>
              </Link>
            ))}
          </div>
          {boutiques.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm">Açougues parceiros em breve na sua cidade.</p>
            </div>
          )}
        </section>
      )}


      {/* Churras Club teaser */}
      <section className="border-y border-gray-800 py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-display text-2xl font-black mb-2 inline-flex items-center gap-2"><TrophyIcon size={22} /> Churras Club</h2>
          <p className="text-gray-400 text-sm mb-5">
            Faz churrasco todo mês? Assine por R$ 49/mês e economize 5% em cada pedido, acesso prioritário aos melhores Grillmasters e suporte VIP.
          </p>
          <Link href="/churras-club"
            className="inline-block bg-yellow-500 hover:bg-yellow-400 text-black font-black px-6 py-3 rounded-xl transition-colors">
            Conhecer o Churras Club
          </Link>
        </div>
      </section>

      {/* Founder */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="relative h-72 md:h-auto bg-gray-800">
              <img src="/jota.jpg" alt="Jota Albuquerque" className="w-full h-full object-cover object-top" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-gray-900/30" />
            </div>
            <div className="p-8 md:p-10 flex flex-col justify-center">
              <p className="text-xs text-orange-400 font-bold uppercase tracking-widest mb-4">Quem está por trás</p>
              <h2 className="font-display text-3xl font-black text-white mb-2">Jota Albuquerque</h2>
              <p className="text-xs text-gray-500 mb-6">Fundador & CEO · 13 anos de Jota BBQ Eventos · SP e RJ</p>
              <p className="text-4xl text-orange-500 font-black leading-none mb-2">"</p>
              <p className="text-gray-300 text-base leading-relaxed mb-8">
                Já fiz churrasco para Madonna, Lady Gaga e Neymar. Mas o churrasco que mais me orgulha vai acontecer no quintal da sua casa. A Tech Churras existe para isso.
              </p>
              <Link href="/founder"
                className="inline-block self-start bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors">
                Conheça a história completa →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-900 px-4 py-10">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-6 overflow-hidden relative w-7">
                <img src="/logo-flame.png" alt="" role="presentation" className="absolute bottom-0 h-10 w-auto" />
              </div>
              <p className="font-black text-white">Tech <span className="text-orange-500">Churras</span></p>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">A Tech Churras. Conectando Grillmasters profissionais, açougues premium e clientes exigentes desde 2026.</p>
          </div>
          <div>
            <p className="font-semibold text-sm mb-3 text-gray-300">Plataforma</p>
            <div className="space-y-2 text-xs text-gray-500">
              <Link href="/grillmasters" className="block hover:text-gray-300 transition-colors">Churrasqueiros</Link>
              <Link href="/boutiques" className="block hover:text-gray-300 transition-colors">Açougues</Link>
              <Link href="/kit-perfeito" className="block hover:text-gray-300 transition-colors">Kit Perfeito IA</Link>
              <Link href="/churras-club" className="block hover:text-gray-300 transition-colors">Churras Club</Link>
              <Link href="/founder" className="block hover:text-gray-300 transition-colors">Fundador</Link>
            </div>
          </div>
          <div>
            <p className="font-semibold text-sm mb-3 text-gray-300">Parceiros</p>
            <div className="space-y-2 text-xs text-gray-500">
              <Link href="/para-churrasqueiros" className="block hover:text-gray-300 transition-colors">Seja Grillmaster</Link>
              <Link href="/para-acougues" className="block hover:text-gray-300 transition-colors">Seja açougue</Link>
              <Link href="/register" className="block hover:text-gray-300 transition-colors">Criar conta</Link>
            </div>
          </div>
          <div>
            <p className="font-semibold text-sm mb-3 text-gray-300">Legal</p>
            <div className="space-y-2 text-xs text-gray-500">
              <Link href="/termos-de-uso" className="block hover:text-gray-300 transition-colors">Termos de uso</Link>
              <Link href="/politica-de-privacidade" className="block hover:text-gray-300 transition-colors">Privacidade</Link>
              <Link href="/ajuda" className="block hover:text-gray-300 transition-colors">Ajuda</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-900 pt-8 pb-4 max-w-5xl mx-auto">
          <p className="text-xs text-gray-700 mb-3 font-semibold uppercase tracking-wide">Churrasqueiros por cidade</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-600">
            {['sao-paulo','rio-de-janeiro','belo-horizonte','brasilia','curitiba','porto-alegre','salvador','fortaleza','recife','manaus','goiania','campinas','natal','joao-pessoa','teresina'].map(c => (
              <Link key={c} href={`/churrasqueiros/${c}`} className="hover:text-gray-400 transition-colors">
                {c.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </Link>
            ))}
          </div>
          <p className="text-xs text-gray-700 mt-4 mb-3 font-semibold uppercase tracking-wide">Açougues por cidade</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-600">
            {['sao-paulo','rio-de-janeiro','belo-horizonte','brasilia','curitiba','porto-alegre','salvador','fortaleza','recife','campinas'].map(c => (
              <Link key={c} href={`/acougues/${c}`} className="hover:text-gray-400 transition-colors">
                {c.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </Link>
            ))}
          </div>
        </div>
        <div className="border-t border-gray-900 pt-6 text-center text-xs text-gray-700">
          © {new Date().getFullYear()} Tech Churras · CNPJ em registro · Feito com 🔥 no Brasil
        </div>
      </footer>
    </div>
    </>
  )
}
