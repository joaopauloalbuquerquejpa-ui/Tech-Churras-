'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const VIDEO_BRASA = 'https://videos.pexels.com/video-files/3195394/3195394-uhd_2560_1440_25fps.mp4'

const passos = [
  {
    n: 1,
    titulo: 'Escolha seu Grillmaster',
    desc: 'Profissionais selecionados e chancelados por Jota Albuquerque. Cada detalhe verificado.',
  },
  {
    n: 2,
    titulo: 'Monte seu Kit de Carnes',
    desc: 'Nossa calculadora inteligente sugere as quantidades certas. Sem desperdício, sem falta.',
  },
  {
    n: 3,
    titulo: 'Aproveite o Evento',
    desc: 'O Grillmaster retira os insumos, prepara tudo e você só precisa curtir com seus convidados.',
  },
]

const kits = [
  {
    key: 'essential',
    badge: 'MAIS POPULAR',
    badgeCls: 'bg-orange-500 text-white',
    borderCls: 'border-orange-500/60 hover:border-orange-500',
    tituloCls: 'text-orange-400',
    nome: 'Kit Essencial',
    para: 'Até 15 pessoas',
    inclui: ['Picanha', 'Fraldinha', 'Linguiça', 'Carvão'],
    preco: 'A partir de R$ 189',
    btnLabel: 'Escolher Este Kit',
    btnCls: 'bg-orange-500 hover:bg-orange-600 text-white',
    href: '/menu/novo?kit=essential',
    hoverEffect: 'flame',
  },
  {
    key: 'prime',
    badge: 'RECOMENDADO',
    badgeCls: 'bg-amber-500 text-black',
    borderCls: 'border-amber-500/60 hover:border-amber-500',
    tituloCls: 'text-amber-400',
    nome: 'Kit Prime',
    para: 'Até 30 pessoas',
    inclui: ['Picanha Wagyu', 'Costela', 'Fraldinha', 'Linguiça Artesanal', 'Acompanhamentos'],
    preco: 'A partir de R$ 389',
    btnLabel: 'Escolher Este Kit',
    btnCls: 'bg-amber-500 hover:bg-amber-600 text-black',
    href: '/menu/novo?kit=prime',
    hoverEffect: 'gold',
  },
  {
    key: 'firetech',
    badge: 'EXPERIÊNCIA COMPLETA',
    badgeCls: 'bg-red-600 text-white',
    borderCls: 'border-red-600/60 hover:border-red-500',
    tituloCls: 'text-red-400',
    nome: 'Kit Firetech',
    para: '30+ pessoas',
    inclui: ['Cortes Nobres Selecionados', 'Wagyu', 'Acompanhamentos Premium', 'Barman', 'Chancela Jota Albuquerque'],
    preco: 'Sob Consulta',
    btnLabel: 'Falar com Especialista',
    btnCls: 'bg-red-600 hover:bg-red-700 text-white',
    href: '/menu/novo?kit=firetech',
    hoverEffect: 'fire',
  },
]

const PARTICLES = [
  { left: '8%',  bottom: '12%', size: 6,  delay: '0s',    dur: '3.2s' },
  { left: '18%', bottom: '8%',  size: 4,  delay: '0.7s',  dur: '2.5s' },
  { left: '30%', bottom: '20%', size: 10, delay: '1.1s',  dur: '4s'   },
  { left: '45%', bottom: '5%',  size: 5,  delay: '0.3s',  dur: '2.8s' },
  { left: '58%', bottom: '15%', size: 8,  delay: '1.5s',  dur: '3.5s' },
  { left: '70%', bottom: '10%', size: 4,  delay: '0.5s',  dur: '2.3s' },
  { left: '80%', bottom: '18%', size: 12, delay: '0.9s',  dur: '4.2s' },
  { left: '91%', bottom: '7%',  size: 6,  delay: '1.8s',  dur: '3s'   },
]

function useInView(ref: React.RefObject<Element | null>) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [ref])
  return visible
}

export default function MenuPage() {
  const passosRef = useRef<HTMLDivElement>(null)
  const passosVisible = useInView(passosRef)
  const [hoveredKit, setHoveredKit] = useState<string | null>(null)

  function scrollToKits() {
    document.getElementById('kits')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="max-w-6xl mx-auto">

      {/* ── HERO com vídeo ── */}
      <section className="relative rounded-2xl overflow-hidden mb-16" style={{ minHeight: 520 }}>
        {/* Vídeo de fundo */}
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 0 }}
        >
          <source src={VIDEO_BRASA} type="video/mp4" />
        </video>

        {/* Overlay escuro */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.88) 100%)',
            zIndex: 1,
          }}
        />

        {/* Overlay laranja radial */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(194,54,22,0.16) 0%, transparent 70%)',
            zIndex: 2,
          }}
        />

        {/* Partículas de fogo */}
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float-particle pointer-events-none"
            style={{
              left: p.left,
              bottom: p.bottom,
              width: p.size,
              height: p.size,
              background: `radial-gradient(circle, rgba(251,191,36,0.9) 0%, rgba(194,54,22,0.7) 60%, transparent 100%)`,
              animationDelay: p.delay,
              animationDuration: p.dur,
              zIndex: 3,
            }}
          />
        ))}

        {/* Conteúdo */}
        <div className="relative py-20 px-6 text-center" style={{ zIndex: 4 }}>
          <span
            className="inline-block text-xs font-bold tracking-widest text-orange-400 uppercase mb-4 px-3 py-1 rounded-full border border-orange-500/30 animate-fadeInUp"
            style={{ animationDelay: '0.1s', opacity: 0 }}
          >
            Powered by Jota Grillmaster
          </span>

          <h1
            className="text-4xl md:text-6xl font-black mb-4 leading-tight animate-fadeInUp"
            style={{ animationDelay: '0.3s', opacity: 0 }}
          >
            Seu Churrasco Perfeito<br className="hidden md:block" /> Começa Aqui
          </h1>

          <p
            className="text-gray-300 text-lg md:text-xl max-w-xl mx-auto mb-10 animate-fadeInUp"
            style={{ animationDelay: '0.6s', opacity: 0 }}
          >
            Do churrasqueiro ideal aos melhores cortes — tudo em um só lugar
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fadeInUp"
            style={{ animationDelay: '0.9s', opacity: 0 }}
          >
            <Link
              href="/menu/novo"
              className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all hover:-translate-y-0.5 shadow-lg shadow-orange-500/30 animate-flamePulse"
            >
              Montar Meu Churrasco
            </Link>
            <button
              onClick={scrollToKits}
              className="inline-flex items-center justify-center gap-2 border-2 border-orange-500/50 hover:border-orange-500 text-orange-400 hover:text-white hover:bg-orange-500/10 font-bold px-8 py-4 rounded-xl text-lg transition-all"
            >
              Ver Kits Prontos
            </button>
          </div>

          <div
            className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-400 animate-fadeInUp"
            style={{ animationDelay: '1.1s', opacity: 0 }}
          >
            <span>&#10003; Profissionais chancelados por Jota Grillmaster</span>
            <span>&#10003; Preço fechado antes do evento</span>
            <span>&#10003; Grillmaster retira os insumos para você</span>
            <span>&#10003; Suporte durante todo o evento</span>
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section className="mb-16 px-2">
        <h2 className="text-2xl font-bold text-center mb-2">Como Funciona</h2>
        <p className="text-gray-500 text-center text-sm mb-8">Três passos. Um churrasco perfeito.</p>
        <div ref={passosRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {passos.map((p, i) => (
            <div
              key={p.n}
              className="bg-gray-900 border border-gray-800 hover:border-orange-500/40 rounded-2xl p-6 text-center transition-all hover:-translate-y-0.5"
              style={
                passosVisible
                  ? { animation: `slideInFromBottom 0.6s ease forwards`, animationDelay: `${i * 0.15}s`, opacity: 0 }
                  : { opacity: 0 }
              }
            >
              <div className="w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mx-auto mb-4 animate-pulseScale">
                <span className="text-2xl font-black text-orange-500">{p.n}</span>
              </div>
              <h3 className="font-bold text-white mb-2">{p.titulo}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── KITS ── */}
      <section id="kits" className="mb-16 px-2">
        <h2 className="text-2xl font-bold text-center mb-2">Escolha Seu Kit</h2>
        <p className="text-gray-500 text-center text-sm mb-8">
          Kits pensados para cada tipo de evento. Do íntimo ao grandioso.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {kits.map(k => {
            const isHovered = hoveredKit === k.key
            const extraStyle: React.CSSProperties = {}
            if (isHovered && k.hoverEffect === 'gold') {
              extraStyle.background = 'linear-gradient(135deg, #1a1500 0%, #2a1f00 50%, #1a1500 100%)'
              extraStyle.backgroundSize = '200% 200%'
            }
            if (isHovered && k.hoverEffect === 'fire') {
              extraStyle.boxShadow = '0 0 30px rgba(239,68,68,0.4), 0 0 60px rgba(194,54,22,0.2)'
            }
            if (isHovered && k.hoverEffect === 'flame') {
              extraStyle.boxShadow = '0 0 20px rgba(194,54,22,0.3)'
            }
            return (
              <div
                key={k.key}
                onMouseEnter={() => setHoveredKit(k.key)}
                onMouseLeave={() => setHoveredKit(null)}
                className={`bg-gray-900 border-2 rounded-2xl p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 ${k.borderCls} ${isHovered && k.hoverEffect === 'fire' ? 'animate-flamePulse' : ''}`}
                style={extraStyle}
              >
                <div className="flex items-start justify-between mb-4">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full tracking-widest uppercase ${k.badgeCls}`}>
                    {k.badge}
                  </span>
                </div>

                <h3
                  className={`text-xl font-black mb-1 ${k.tituloCls}`}
                  style={
                    isHovered && k.hoverEffect === 'gold'
                      ? {
                          background: 'linear-gradient(90deg, #f59e0b, #fde68a, #f59e0b)',
                          backgroundSize: '200% auto',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          animation: 'goldShimmer 1.5s linear infinite',
                        }
                      : undefined
                  }
                >
                  {k.nome}
                </h3>

                <p className="text-xs text-gray-500 mb-4">Para {k.para}</p>
                <ul className="space-y-1 mb-6 flex-1">
                  {k.inclui.map(item => (
                    <li key={item} className="text-sm text-gray-300 flex items-center gap-2">
                      <span className="text-orange-500 text-xs">&#9670;</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-2xl font-black text-white mb-4">{k.preco}</p>
                <Link
                  href={k.href}
                  className={`w-full text-center font-bold py-3 rounded-xl transition-colors ${k.btnCls}`}
                >
                  {k.btnLabel}
                </Link>
              </div>
            )
          })}
        </div>

        {/* Assistente de IA */}
        <Link
          href="/menu/assistente"
          className="block border-2 border-amber-500/40 hover:border-amber-500 rounded-2xl p-6 mb-4 transition-all hover:-translate-y-0.5 bg-gradient-to-r from-amber-950/30 to-gray-900 group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-2xl shadow-lg shadow-orange-500/20">
              🤖
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-bold text-white">Tech Churras IA</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500 text-black font-bold">NOVO</span>
              </div>
              <p className="text-gray-400 text-sm">
                Diga quantos convidados e o menu — a IA calcula tudo e monta seu carrinho.
              </p>
            </div>
            <span className="text-gray-500 group-hover:text-orange-400 transition-colors text-lg shrink-0">→</span>
          </div>
        </Link>

        {/* Kit Personalizado */}
        <div
          className="border-2 border-dashed rounded-2xl p-8 text-center transition-all hover:-translate-y-0.5 bg-orange-500/5 group"
          style={{ borderColor: 'rgba(194,54,22,0.4)' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(194,54,22,0.7)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(194,54,22,0.4)')}
        >
          <div className="text-4xl mb-3 text-orange-400 font-bold group-hover:animate-pulseScale inline-block">&#9998;</div>
          <h3 className="text-xl font-bold text-white mb-2">Monte do Seu Jeito</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
            Escolha cada item, cada corte e cada detalhe do seu evento. Calculadora inteligente inclusa.
          </p>
          <Link
            href="/menu/novo?kit=custom"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-xl transition-colors"
          >
            Personalizar Agora
          </Link>
        </div>
      </section>
    </div>
  )
}
