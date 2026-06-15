import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Tech Churras chegou na sua cidade!',
  description: 'Contrate churrasqueiros profissionais certificados pelo app. Acompanhe ao vivo, pague com segurança. Somos a plataforma líder em churrasqueiros para eventos no Brasil.',
  openGraph: {
    title: 'Tech Churras chegou na sua cidade!',
    description: 'Churrasqueiros profissionais + carnes premium. Contrate pelo app, acompanhe ao vivo.',
    type: 'website',
    images: [{ url: '/jota.jpg', width: 800, height: 800 }],
  },
}

const API = 'https://tech-churras-production.up.railway.app'

interface Grillmaster {
  id: string
  rating: number
  pricePerHour: number
  city: string
  state: string
  specialties?: string
  photoUrl?: string
  certifiedAt?: string
  user: { name: string }
}

async function getGrillmasters(): Promise<Grillmaster[]> {
  try {
    const res = await fetch(`${API}/grillmasters?available=true&limit=4`, {
      next: { revalidate: 1800 },
    })
    if (!res.ok) return []
    const data = await res.json()
    const list: Grillmaster[] = Array.isArray(data) ? data : (data.grillmasters ?? [])
    return list.sort((a, b) => b.rating - a.rating).slice(0, 4)
  } catch {
    return []
  }
}

const BENEFITS = [
  {
    icon: '🔥',
    title: 'Churrasqueiros certificados',
    desc: 'Todos os profissionais passam pelo treinamento Tech Churras e recebem o selo Chancelado por Jota Grillmaster.',
  },
  {
    icon: '📍',
    title: 'Acompanhe ao vivo no mapa',
    desc: 'No dia do evento, veja o churrasqueiro chegando em tempo real. Compartilhe o link com seus convidados.',
  },
  {
    icon: '🥩',
    title: 'Carnes premium entregues',
    desc: 'Parceria com açougues selecionados. O churrasqueiro retira as carnes e leva tudo organizado para o seu evento.',
  },
  {
    icon: '💳',
    title: 'Pagamento seguro',
    desc: 'Pague com Pix, cartão de crédito ou débito pelo Mercado Pago. Zero surpresas no preço final.',
  },
]

const STEPS = [
  {
    n: '1',
    icon: '📲',
    title: 'Crie sua conta grátis',
    desc: 'Cadastre-se em 1 minuto e acesse todos os churrasqueiros disponíveis na sua região.',
  },
  {
    n: '2',
    icon: '🧑‍🍳',
    title: 'Escolha e contrate',
    desc: 'Selecione o churrasqueiro, a data, o número de convidados e os cortes que você quer.',
  },
  {
    n: '3',
    icon: '🎉',
    title: 'Aproveite o churrasco',
    desc: 'No dia, acompanhe chegando ao vivo. O churrasqueiro cuida de tudo. Você só curte.',
  },
]

export default async function LancamentoPage() {
  const grillmasters = await getGrillmasters()

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-gray-900/50 px-4 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <span className="font-black text-orange-400 text-xl">🔥 Tech Churras</span>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">Entrar</Link>
          <Link href="/register" className="text-sm bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
            Criar conta grátis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 text-xs text-orange-400 font-bold mb-8 uppercase tracking-wide">
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          Cidade Piloto — plataforma ativa
        </div>
        <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6">
          O melhor churrasco do{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
            seu evento
          </span>{' '}
          está aqui.
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Contrate churrasqueiros profissionais certificados pelo app. Acompanhe chegando ao vivo no mapa. Carnes premium do açougue parceiro. Tudo em um só lugar.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register"
            className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-black px-10 py-4 rounded-2xl text-lg transition-all hover:shadow-lg hover:shadow-orange-500/30">
            Quero um churrasqueiro agora
          </Link>
          <a href={`https://wa.me/5511970593650?text=${encodeURIComponent('Olá! Vi a Tech Churras chegou na minha cidade e quero saber mais!')}`}
            target="_blank" rel="noopener noreferrer"
            className="w-full sm:w-auto flex items-center justify-center gap-2 border border-gray-700 hover:border-green-500/50 text-gray-300 hover:text-white font-semibold px-8 py-4 rounded-2xl text-base transition-all hover:bg-green-500/5">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-green-400"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.9 2C6.458 2 2.015 6.443 2.015 11.885c0 1.778.468 3.51 1.36 5.034L2 22l5.225-1.372a9.86 9.86 0 004.675 1.187C17.342 21.815 22 17.385 22 11.9 22 6.458 17.342 2 11.9 2z"/></svg>
            Falar com a equipe
          </a>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-y border-gray-900 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {BENEFITS.map(b => (
              <div key={b.title} className="text-center">
                <div className="text-4xl mb-3">{b.icon}</div>
                <h3 className="font-bold text-white text-sm mb-2">{b.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 py-20">
        <p className="text-center text-sm text-orange-400 font-bold uppercase tracking-wide mb-3">Como funciona</p>
        <h2 className="text-3xl font-black text-center mb-12">Churrasco perfeito em 3 passos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map(s => (
            <div key={s.n} className="relative text-center">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-3xl mx-auto mb-4">
                {s.icon}
              </div>
              <div className="inline-flex items-center justify-center w-7 h-7 bg-orange-500 text-white text-sm font-black rounded-full mb-3">
                {s.n}
              </div>
              <h3 className="font-bold text-white text-lg mb-2">{s.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured GMs */}
      {grillmasters.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 pb-20">
          <p className="text-center text-sm text-orange-400 font-bold uppercase tracking-wide mb-3">Nossos profissionais</p>
          <h2 className="text-3xl font-black text-center mb-8">Conheça alguns churrasqueiros</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {grillmasters.map(gm => (
              <Link key={gm.id} href={`/grillmasters/${gm.id}`}
                className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-orange-500/40 transition-all group">
                <div className="h-36 bg-gray-800 relative">
                  {gm.photoUrl ? (
                    <img src={gm.photoUrl} alt={gm.user.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-black text-white/20">
                      {gm.user.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                    </div>
                  )}
                  {gm.certifiedAt && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full">✓</div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-bold text-white text-sm truncate">{gm.user.name.split(' ')[0]}</p>
                  <p className="text-xs text-gray-500">{gm.city}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-yellow-400 text-xs">★ {gm.rating.toFixed(1)}</span>
                    <span className="text-orange-400 font-bold text-xs">R$ {gm.pricePerHour.toFixed(0)}/h</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/grillmasters" className="inline-block border border-gray-700 hover:border-orange-500/50 text-gray-300 hover:text-white px-8 py-3 rounded-xl font-semibold text-sm transition-all">
              Ver todos os churrasqueiros →
            </Link>
          </div>
        </section>
      )}

      {/* Partners CTA */}
      <section className="bg-gradient-to-br from-orange-600 to-red-700 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black mb-4">Quer ser churrasqueiro parceiro?</h2>
          <p className="text-orange-100 text-lg mb-8 max-w-xl mx-auto">
            Receba pedidos pelo app, ganhe mais e faça parte da maior plataforma de churrasqueiros do Brasil.
            <strong className="block mt-1">93% de cada pedido vai direto para você.</strong>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/para-churrasqueiros"
              className="inline-block bg-white text-orange-600 hover:bg-orange-50 font-black px-8 py-4 rounded-2xl text-base transition-colors">
              Quero ser churrasqueiro parceiro →
            </Link>
            <Link href="/para-acougues"
              className="inline-block border-2 border-white/30 hover:border-white text-white font-semibold px-8 py-4 rounded-2xl text-base transition-colors">
              Sou açougue parceiro
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-black mb-4">Pronto para o churrasco perfeito?</h2>
        <p className="text-gray-400 text-lg mb-8">Crie sua conta grátis em 1 minuto e contrate seu churrasqueiro.</p>
        <Link href="/register"
          className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-black px-12 py-5 rounded-2xl text-xl transition-all hover:shadow-lg hover:shadow-orange-500/30">
          Começar agora — é grátis
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-900 px-4 py-8 text-center">
        <p className="font-black text-orange-400 mb-2">🔥 Tech Churras</p>
        <p className="text-xs text-gray-600">O churrasqueiro dos famosos · Feito com 🔥 no Brasil</p>
        <div className="flex justify-center gap-5 mt-4 text-xs text-gray-600">
          <Link href="/termos-de-uso" className="hover:text-gray-400 transition-colors">Termos de Uso</Link>
          <Link href="/politica-de-privacidade" className="hover:text-gray-400 transition-colors">Privacidade</Link>
          <Link href="/ajuda" className="hover:text-gray-400 transition-colors">Ajuda</Link>
        </div>
      </footer>
    </div>
  )
}
