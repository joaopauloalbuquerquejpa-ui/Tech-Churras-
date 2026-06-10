'use client'
import Link from 'next/link'

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
  },
  {
    key: 'firetech',
    badge: 'EXPERIÊNCIA COMPLETA',
    badgeCls: 'bg-red-600 text-white',
    borderCls: 'border-red-600/60 hover:border-red-500',
    tituloCls: 'text-red-400',
    nome: 'Kit Firetech',
    para: '30+ pessoas',
    inclui: ['Cortes Nobres Selecionados', 'Wagyu', 'Acompanhamentos Premium', 'Barman', 'Chancela Jota'],
    preco: 'Sob Consulta',
    btnLabel: 'Falar com Especialista',
    btnCls: 'bg-red-600 hover:bg-red-700 text-white',
    href: '/menu/novo?kit=firetech',
  },
]

export default function MenuPage() {
  function scrollToKits() {
    document.getElementById('kits')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="max-w-6xl mx-auto">

      {/* ── HERO ── */}
      <section
        className="relative rounded-2xl overflow-hidden py-20 px-6 text-center mb-16"
        style={{
          background: 'radial-gradient(ellipse at 50% 110%, rgba(249,115,22,0.22) 0%, transparent 62%), #0a0a0a',
        }}
      >
        <span className="inline-block text-xs font-bold tracking-widest text-orange-400 uppercase mb-4 px-3 py-1 rounded-full border border-orange-500/30">
          Powered by Jota Grillmaster
        </span>
        <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
          Seu Churrasco Perfeito<br className="hidden md:block" /> Começa Aqui
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-xl mx-auto mb-10">
          Do churrasqueiro ideal aos melhores cortes — tudo em um só lugar
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            href="/menu/novo"
            className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all hover:-translate-y-0.5 shadow-lg shadow-orange-500/20"
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

        {/* Trust signals */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
          <span>✓ Profissionais chancelados por Jota Grillmaster</span>
          <span>✓ Preço fechado antes do evento</span>
          <span>✓ Grillmaster retira os insumos para você</span>
          <span>✓ Suporte durante todo o evento</span>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section className="mb-16 px-2">
        <h2 className="text-2xl font-bold text-center mb-2">Como Funciona</h2>
        <p className="text-gray-500 text-center text-sm mb-8">Três passos. Um churrasco perfeito.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {passos.map(p => (
            <div
              key={p.n}
              className="bg-gray-900 border border-gray-800 hover:border-orange-500/40 rounded-2xl p-6 text-center transition-all hover:-translate-y-0.5"
            >
              <div className="w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mx-auto mb-4">
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
          {kits.map(k => (
            <div
              key={k.key}
              className={`bg-gray-900 border-2 rounded-2xl p-6 flex flex-col transition-all hover:-translate-y-1 ${k.borderCls}`}
            >
              <div className="flex items-start justify-between mb-4">
                <span className={`text-xs font-bold px-2 py-1 rounded-full tracking-widest uppercase ${k.badgeCls}`}>
                  {k.badge}
                </span>
              </div>
              <h3 className={`text-xl font-black mb-1 ${k.tituloCls}`}>{k.nome}</h3>
              <p className="text-xs text-gray-500 mb-4">Para {k.para}</p>
              <ul className="space-y-1 mb-6 flex-1">
                {k.inclui.map(item => (
                  <li key={item} className="text-sm text-gray-300 flex items-center gap-2">
                    <span className="text-orange-500 text-xs">◆</span>
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
          ))}
        </div>

        {/* Kit Personalizado */}
        <div className="border-2 border-dashed border-orange-500/40 hover:border-orange-500/70 rounded-2xl p-8 text-center transition-all hover:-translate-y-0.5 bg-orange-500/5">
          <div className="text-4xl mb-3 text-orange-400 font-bold">✎</div>
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
