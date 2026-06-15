import type { Metadata } from 'next'
import Link from 'next/link'
import PriceCalculator from '@/components/PriceCalculator'
import HomeMobileMenu from '@/components/HomeMobileMenu'

export const metadata: Metadata = {
  title: 'Tech Churras — Churrasqueiro + Açougue Premium + IA, tudo num só app',
  description: 'Contrate churrasqueiros certificados, escolha cortes de açougues premium parceiros e acompanhe tudo ao vivo no mapa. O ecossistema completo do churrasco perfeito.',
  keywords: ['churrasqueiro', 'contratar churrasqueiro', 'açougue premium', 'churrasco profissional', 'Tech Churras', 'kit churrasco IA'],
  openGraph: {
    title: 'Tech Churras — O ecossistema completo do churrasco perfeito',
    description: 'Churrasqueiro certificado + açougue premium + IA que planeja tudo + tracking ao vivo. Tudo num só app.',
    type: 'website',
    images: [{ url: '/jota.jpg', width: 800, height: 800 }],
  },
}

const API = 'https://tech-churras-production.up.railway.app'

const STATIC_TESTIMONIALS: Testimonial[] = [
  { id: 's1', rating: 5, comment: 'Experiência incrível! O churrasqueiro chegou no horário, superou todas as expectativas e os convidados ficaram impressionados com a qualidade.', grillmasterName: 'Jota Albuquerque', customerFirstName: 'Rafael M.', city: 'São Paulo' },
  { id: 's2', rating: 5, comment: 'Nunca imaginei que contratar um churrasqueiro profissional seria tão fácil. Acompanhei tudo pelo app em tempo real. Recomendo 100%.', grillmasterName: null, customerFirstName: 'Camila R.', city: 'Rio de Janeiro' },
  { id: 's3', rating: 5, comment: 'Os cortes do açougue parceiro foram impecáveis. O churrasqueiro trouxe todo o equipamento e limpou tudo ao final. Perfeito.', grillmasterName: null, customerFirstName: 'Lucas T.', city: 'Belo Horizonte' },
]

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
    const res = await fetch(`${API}/grillmasters?available=true&limit=6`, { next: { revalidate: 1800 } })
    if (!res.ok) return []
    const data = await res.json()
    const list: Grillmaster[] = Array.isArray(data) ? data : (data.grillmasters ?? [])
    return list.sort((a, b) => b.rating - a.rating).slice(0, 6)
  } catch { return [] }
}

async function getFeaturedBoutiques(): Promise<Boutique[]> {
  try {
    const res = await fetch(`${API}/boutiques?limit=6`, { next: { revalidate: 1800 } })
    if (!res.ok) return []
    const data = await res.json()
    const list: Boutique[] = Array.isArray(data) ? data : (data.boutiques ?? [])
    return list.slice(0, 6)
  } catch { return [] }
}

async function getTestimonials(): Promise<Testimonial[]> {
  try {
    const res = await fetch(`${API}/public/testimonials`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    return await res.json()
  } catch { return [] }
}

const ECOSYSTEM = [
  {
    icon: '👨‍🍳',
    titulo: 'Churrasqueiro certificado',
    desc: 'Chancelados pela Tech Churras. Treinamento presencial, avaliação mínima 4.5★ e experiência comprovada. Você escolhe pelo perfil, estilo e avaliações.',
    href: '/grillmasters',
    cta: 'Ver churrasqueiros',
    cor: 'border-orange-500/30 bg-orange-500/5',
    badge: 'Chancelado',
  },
  {
    icon: '🥩',
    titulo: 'Açougue premium parceiro',
    desc: 'Só açougues validados pela Tech Churras entram na plataforma. Os cortes ficam separados antes do evento — o churrasqueiro retira no balcão no dia.',
    href: '/boutiques',
    cta: 'Ver açougues',
    cor: 'border-red-500/30 bg-red-500/5',
    badge: 'Validado',
  },
  {
    icon: '🤖',
    titulo: 'IA que planeja tudo',
    desc: 'Informe quantos convidados e o estilo do evento. A IA calcula os cortes certos, as quantidades exatas e sugere o churrasqueiro ideal para você.',
    href: '/kit-perfeito',
    cta: 'Montar com IA',
    cor: 'border-purple-500/30 bg-purple-500/5',
    badge: 'IA Generativa',
  },
  {
    icon: '📍',
    titulo: 'Acompanhe ao vivo',
    desc: 'No dia do evento, veja o churrasqueiro no mapa em tempo real. Compartilhe o link com seus convidados pelo WhatsApp — todo mundo acompanha junto.',
    href: '/register',
    cta: 'Começar agora',
    cor: 'border-green-500/30 bg-green-500/5',
    badge: 'Tempo real',
  },
]

const HOW_IT_WORKS = [
  {
    step: '1', icon: '👨‍🍳',
    title: 'Escolha o churrasqueiro',
    desc: 'Browse pelos churrasqueiros chancelados na sua cidade. Leia avaliações, veja o portfólio, compare preços e escolha o estilo certo para o seu evento.',
  },
  {
    step: '2', icon: '🥩',
    title: 'Monte o kit com açougue parceiro',
    desc: 'A IA sugere os cortes e quantidades certas para o número de convidados. Selecione do açougue validado — os cortes são separados e o churrasqueiro retira no dia.',
  },
  {
    step: '3', icon: '🔥',
    title: 'Curta. Acompanhe ao vivo.',
    desc: 'No dia do evento, o churrasqueiro aparece no mapa em tempo real. Você e seus convidados acompanham tudo pelo app. Só relaxar e curtir.',
  },
]

export default async function HomePage() {
  const [grillmasters, boutiques, rawTestimonials] = await Promise.all([
    getFeaturedGrillmasters(),
    getFeaturedBoutiques(),
    getTestimonials(),
  ])
  const testimonials = rawTestimonials.length > 0 ? rawTestimonials : STATIC_TESTIMONIALS

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Nav */}
      <nav className="relative border-b border-gray-900/50 px-4 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <span className="font-black text-orange-400 text-xl">🔥 Tech Churras</span>
        <div className="flex items-center gap-4">
          <Link href="/grillmasters" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">Churrasqueiros</Link>
          <Link href="/boutiques" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">Açougues</Link>
          <Link href="/kit-perfeito" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">IA ✨</Link>
          <Link href="/churras-club" className="text-sm text-orange-400 hover:text-orange-300 transition-colors hidden sm:block font-semibold">🏆 Club</Link>
          <Link href="/login" className="text-sm bg-gray-800 hover:bg-gray-700 text-white px-4 py-1.5 rounded-lg transition-colors">Entrar</Link>
          <Link href="/register" className="text-sm bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg font-semibold transition-colors hidden sm:inline-block">Cadastrar</Link>
          <HomeMobileMenu />
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 text-xs text-orange-400 font-semibold mb-8 uppercase tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
          Churrasqueiro + Açougue + IA + Tracking ao vivo
        </div>
        <h1 className="text-5xl md:text-7xl font-black leading-none mb-6">
          O melhor churrasco{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-orange-600">
            da sua vida
          </span>
          {' '}começa aqui.
        </h1>
        <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-4 leading-relaxed">
          Churrasqueiro certificado. Açougue premium parceiro. IA que planeja tudo. Acompanhamento ao vivo no mapa.
        </p>
        <p className="text-gray-600 text-base max-w-xl mx-auto mb-10">
          Tudo num só app — do planejamento ao último pedaço de carne.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/grillmasters"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-2xl text-lg transition-all hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5">
            Contratar churrasqueiro
          </Link>
          <Link href="/boutiques"
            className="bg-gray-800 hover:bg-gray-700 text-white font-semibold px-8 py-4 rounded-2xl text-lg transition-colors border border-gray-700">
            🥩 Ver açougues parceiros
          </Link>
          <Link href="/kit-perfeito"
            className="text-orange-400 hover:text-orange-300 font-semibold px-4 py-4 text-base transition-colors">
            Montar kit com IA ✨
          </Link>
        </div>
      </section>

      <PriceCalculator />

      {/* Ecossistema */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <p className="text-center text-sm text-orange-400 font-semibold uppercase tracking-wide mb-3">Por que a Tech Churras</p>
        <h2 className="text-3xl md:text-4xl font-black text-center mb-4">O ecossistema completo do churrasco perfeito</h2>
        <p className="text-center text-gray-500 max-w-xl mx-auto mb-12 text-base">
          Não é só um app de churrasqueiro. São quatro pilares integrados que garantem uma experiência que nenhuma indicação boca a boca consegue entregar.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {ECOSYSTEM.map(e => (
            <div key={e.titulo} className={`border ${e.cor} rounded-2xl p-6 flex flex-col`}>
              <div className="text-4xl mb-4">{e.icon}</div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{e.badge}</span>
              <h3 className="font-black text-white text-lg mb-3">{e.titulo}</h3>
              <p className="text-gray-400 text-sm leading-relaxed flex-1 mb-5">{e.desc}</p>
              <Link href={e.href} className="text-sm font-bold text-orange-400 hover:text-orange-300 transition-colors">
                {e.cta} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-900 py-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '93%', label: 'vai pro churrasqueiro', detail: 'Taxa mais justa do mercado' },
              { value: '4.9★', label: 'avaliação média', detail: 'Churrasqueiros chancelados' },
              { value: '100%', label: 'açougues validados', detail: 'Qualidade garantida nos cortes' },
              { value: 'R$ 0', label: 'taxa pro cliente', detail: 'Você paga só churrasqueiro + carne' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-3xl md:text-4xl font-black text-orange-400 mb-1">{s.value}</p>
                <p className="text-sm font-semibold text-white">{s.label}</p>
                <p className="text-xs text-gray-600 mt-0.5">{s.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <p className="text-center text-sm text-orange-400 font-semibold uppercase tracking-wide mb-3">Como funciona</p>
        <h2 className="text-3xl font-black text-center mb-12">Churrasco completo em 3 passos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {HOW_IT_WORKS.map(s => (
            <div key={s.step} className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-3xl mx-auto mb-4">
                {s.icon}
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
          <h2 className="text-3xl font-black text-center mb-12">O que nossos clientes dizem</h2>
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
              <p className="text-sm text-orange-400 font-semibold uppercase tracking-wide mb-1">👨‍🍳 Chancelados</p>
              <h2 className="text-3xl font-black">Churrasqueiros disponíveis</h2>
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
                    : <div className="w-full h-full flex items-center justify-center text-6xl">🔥</div>
                  }
                  {gm.certifiedAt && (
                    <div className="absolute top-3 right-3 bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full">✓ CERTIFICADO</div>
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
                    <span className="text-orange-400 font-bold text-sm">R$ {gm.pricePerHour.toFixed(0)}/h</span>
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
              <p className="text-sm text-red-400 font-semibold uppercase tracking-wide mb-1">🥩 Validados</p>
              <h2 className="text-3xl font-black">Açougues parceiros</h2>
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
                    : <div className="w-full h-full flex items-center justify-center text-6xl">🥩</div>
                  }
                  <div className="absolute top-3 right-3 bg-green-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full">✓ VALIDADO</div>
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

      {/* Kit Perfeito CTA */}
      <section className="bg-gradient-to-br from-orange-600 to-red-700 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-orange-200 font-semibold text-sm uppercase tracking-wide mb-3">IA generativa</p>
          <h2 className="text-3xl font-black mb-4">Kit Perfeito — calculado por IA</h2>
          <p className="text-orange-100 text-lg mb-8 max-w-xl mx-auto">
            Informe quantos convidados, a data e o estilo. A IA monta o kit ideal: churrasqueiro certo, cortes do açougue parceiro nas quantidades exatas, tudo organizado.
          </p>
          <Link href="/kit-perfeito"
            className="inline-block bg-white text-orange-600 hover:bg-orange-50 font-black px-8 py-4 rounded-2xl text-lg transition-colors">
            Montar meu kit agora ✨
          </Link>
        </div>
      </section>

      {/* For Partners */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <p className="text-center text-sm text-gray-500 font-semibold uppercase tracking-wide mb-3">Para parceiros</p>
        <h2 className="text-3xl font-black text-center mb-10">Cresça com a Tech Churras</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-7">
            <span className="text-4xl mb-4 block">👨‍🍳</span>
            <h3 className="text-xl font-bold mb-2">Churrasqueiro parceiro</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Receba pedidos pelo app, gerencie sua agenda e ganhe 93% de cada evento via PIX toda semana. Zero mensalidade. Treinamento de chancelamento com Jota incluso.
            </p>
            <Link href="/para-churrasqueiros"
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
              Quero ser churrasqueiro parceiro →
            </Link>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-7">
            <span className="text-4xl mb-4 block">🥩</span>
            <h3 className="text-xl font-bold mb-2">Açougue parceiro</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Seus cortes aparecem para quem já vai fazer churrasco — cliente certo, na hora certa. Sem entrega, sem marketing extra. Repasse semanal via PIX. Primeiros 3 açougues em SP ganham 3 meses sem mensalidade.
            </p>
            <Link href="/para-acougues"
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
              Quero ser açougue parceiro →
            </Link>
          </div>
        </div>
      </section>

      {/* Churras Club teaser */}
      <section className="border-y border-gray-800 py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-black mb-2">🏆 Churras Club</h2>
          <p className="text-gray-400 text-sm mb-5">
            Faz churrasco todo mês? Assine por R$ 49/mês e economize 5% em cada pedido, acesso prioritário aos melhores churrasqueiros e suporte VIP.
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
              <h2 className="text-3xl font-black text-white mb-2">Jota Albuquerque</h2>
              <p className="text-xs text-gray-500 mb-6">Fundador & CEO · 13+ anos · 1.800+ eventos</p>
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
            <p className="font-black text-orange-400 mb-3">🔥 Tech Churras</p>
            <p className="text-xs text-gray-600 leading-relaxed">a Tech Churras. Conectando churrasqueiros profissionais, açougues premium e clientes exigentes desde 2025.</p>
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
              <Link href="/para-churrasqueiros" className="block hover:text-gray-300 transition-colors">Seja churrasqueiro</Link>
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
  )
}
