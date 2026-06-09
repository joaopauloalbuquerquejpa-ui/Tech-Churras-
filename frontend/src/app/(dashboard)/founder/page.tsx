'use client'
import Link from 'next/link'

const conquistas = [
  {
    icon: '🔥',
    titulo: 'Festivais',
    texto: 'Palcos dos maiores festivais do pais: Barbaros, Let\'s Grill e Carnivoria.',
  },
  {
    icon: '★',
    titulo: 'Celebridades',
    texto: 'Atendeu icones como Madonna, Lady Gaga e Neymar Jr., alem de atletas da NBA e NFL.',
  },
  {
    icon: '◆',
    titulo: 'Corporativo',
    texto: 'Elevou o padrao de eventos para gigantes como Grupo Heineken e RedBull.',
  },
  {
    icon: '◉',
    titulo: 'Podcast',
    texto: 'Criador do "Cast in The House by Jota", o primeiro podcast audiovisual de churrasco do Brasil.',
  },
  {
    icon: '◈',
    titulo: 'Internacional',
    texto: 'Assinou o cardapio do One Resort Aquapark & SPA na Tunisia.',
  },
  {
    icon: '◍',
    titulo: 'Zanzibar',
    texto: 'Socio executivo do Bahari of Brazil na Ilha de Zanzibar, Tanzania.',
  },
]

export default function FounderPage() {
  return (
    <div className="max-w-4xl mx-auto">

      {/* HERO */}
      <div className="text-center py-12 px-4">
        <span className="inline-block bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4">
          Churrasqueiro dos Famosos
        </span>
        <h1 className="text-4xl md:text-5xl font-bold mb-3">
          Conhea o Fundador
        </h1>
        <p className="text-gray-400 text-lg">
          A historia por tras da revolucao do churrasco
        </p>
      </div>

      {/* BIO */}
      <div className="bg-gray-900 rounded-2xl p-8 mb-8 border border-gray-800 flex flex-col md:flex-row gap-8 items-start">
        {/* Placeholder para foto futura */}
        {/* <img src="/jota.jpg" alt="Jota Albuquerque" className="w-48 h-48 rounded-xl object-cover shrink-0" /> */}
        <div className="w-40 h-40 rounded-xl bg-gray-800 border border-orange-500/30 shrink-0 flex items-center justify-center">
          <span className="text-4xl font-black text-orange-500">JA</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-1">Jota Albuquerque</h2>
          <span className="text-orange-400 text-sm font-medium">Fundador & CEO da Tech Churras</span>
          <p className="text-gray-300 mt-4 leading-relaxed">
            Com mais de 13 anos de trajetoria, Joao "Jota" Albuquerque consolidou-se como o
            Churrasqueiro dos Famosos e uma das maiores referencias do churrasco no Brasil.
            Especialista em dominar o fogo e a brasa, ele transforma cada evento em uma experiencia
            memoravel que une tecnica apurada, excelencia gastronomica e hospitalidade.
          </p>
        </div>
      </div>

      {/* CONQUISTAS */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 text-white">Conquistas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {conquistas.map((c) => (
            <div
              key={c.titulo}
              className="bg-gray-900 border border-orange-500/20 rounded-xl p-5 hover:border-orange-500/50 transition-colors"
            >
              <div className="text-2xl mb-3 text-orange-400 font-bold">{c.icon}</div>
              <h3 className="font-semibold text-white mb-1">{c.titulo}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{c.texto}</p>
            </div>
          ))}
        </div>
      </div>

      {/* A VISAO */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-6">
        <h2 className="text-xl font-bold mb-4">Por que a Tech Churras existe</h2>
        <p className="text-gray-300 leading-relaxed">
          Organizar um churrasco profissional era um pesadelo logistico. Erros no calculo de carne,
          profissionais sem qualificacao e insumos duvidosos geravam desperdicio e frustracao. Jota
          criou a Tech Churras para resolver isso: uma plataforma end-to-end que conecta os melhores
          churrasqueiros, as melhores boutiques de carne e os clientes que merecem uma experiencia
          premium. Do aplicativo a brasa, a Tech Churras executa tudo.
        </p>
      </div>

      {/* METODOLOGIA */}
      <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-8 mb-10">
        <h2 className="text-xl font-bold mb-4 text-orange-400">A Chancela Jota Grillmaster</h2>
        <p className="text-gray-300 leading-relaxed">
          Cada churrasqueiro na plataforma passa pelo processo de curadoria e certificacao pessoal de
          Jota. A Chancela Jota Grillmaster e a garantia de que voce esta contratando um profissional
          treinado nos mais altos padroes da gastronomia do fogo.
        </p>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pb-12">
        <Link
          href="/grillmasters"
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-xl text-center transition-colors"
        >
          Ver Churrasqueiros Certificados
        </Link>
        <Link
          href="/grillmasters/new"
          className="border border-orange-500 text-orange-400 hover:bg-orange-500/10 font-bold px-8 py-3 rounded-xl text-center transition-colors"
        >
          Cadastre-se como Grillmaster
        </Link>
      </div>

    </div>
  )
}
