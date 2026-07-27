import type { Metadata } from 'next'
import Link from 'next/link'
import CorporateLeadForm from './CorporateLeadForm'

export const metadata: Metadata = {
  title: 'Churrasco Corporativo em São Paulo | Confraternização de Empresa | Tech Churras',
  description:
    'Confraternização de fim de ano com churrasco completo na sua empresa: churrasqueiro profissional, carnes de açougue premium, preço fechado por pessoa e garantia de execução. Reserve entre julho e setembro e garanta a melhor data.',
  keywords: [
    'churrasco corporativo São Paulo',
    'confraternização empresa churrasco',
    'churrasco fim de ano empresa SP',
    'buffet churrasco corporativo',
    'churrasqueiro para empresa',
    'evento corporativo churrasco',
  ],
  openGraph: {
    title: 'Churrasco Corporativo em SP — confra de fim de ano resolvida',
    description: 'Churrasqueiro profissional + carnes premium + preço fechado. As melhores datas de dezembro se esgotam em setembro.',
    type: 'website',
    url: 'https://www.techchurras.com.br/churrasco-corporativo',
    images: [{ url: '/jota.jpg', width: 1200, height: 630, alt: 'Tech Churras — Churrasco Corporativo' }],
  },
  alternates: { canonical: 'https://www.techchurras.com.br/churrasco-corporativo' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'Churrasco corporativo e confraternização de empresas',
  provider: { '@type': 'Organization', name: 'Tech Churras', url: 'https://www.techchurras.com.br' },
  areaServed: { '@type': 'City', name: 'São Paulo' },
  audience: { '@type': 'BusinessAudience', name: 'Empresas em São Paulo' },
}

const DIFERENCIAIS = [
  { icon: '🔥', title: 'O churrasqueiro é o show', desc: 'Corte ao vivo, estação de brasa e o fogo como entretenimento — a confra vira experiência, não fila de buffet.' },
  { icon: '🥩', title: 'Carne calculada por pessoa', desc: 'Cortes de açougue parceiro dimensionados por convidado. Carne não acaba no meio da festa — garantido.' },
  { icon: '💰', title: 'Preço fechado antes de pagar', desc: 'Sem orçamento que muda depois: valor total por pessoa definido na proposta, pagamento seguro via Mercado Pago.' },
  { icon: '📍', title: 'Execução garantida', desc: 'Churrasqueiro rastreado por GPS no dia, equipe de suporte acompanhando e política de reembolso se algo falhar.' },
]

export default function ChurrascoCorporativoPage() {
  return (
    <div className="min-h-screen bg-[#1c1714] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Header */}
      <div className="bg-gray-900/80 border-b border-gray-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-black text-lg">Tech <span className="text-orange-500">Churras</span></Link>
          <a href="#proposta" className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">Pedir proposta</a>
        </div>
      </div>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-12 pb-10">
        <p className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-3">Confraternização de fim de ano · São Paulo</p>
        <h1 className="text-3xl sm:text-5xl font-black leading-tight mb-4">
          A confra que o seu time vai <span className="text-orange-500">lembrar o ano inteiro.</span>
        </h1>
        <p className="text-gray-300 text-lg max-w-2xl mb-3">
          Churrasco completo na empresa ou no espaço que você escolher: churrasqueiro profissional comandando o fogo,
          carnes de açougue premium calculadas por pessoa e preço fechado — sem surpresa no orçamento nem carne acabando às 14h.
        </p>
        <p className="text-orange-300/90 text-sm font-medium max-w-2xl mb-8">
          ⏳ As melhores datas de novembro e dezembro se esgotam entre julho e setembro. Quem reserva agora escolhe a data — quem deixa pra outubro escolhe a sobra.
        </p>
        <a href="#proposta" className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-2xl text-lg transition-colors shadow-lg shadow-orange-500/25">
          Receber proposta em 24h →
        </a>
      </section>

      {/* Diferenciais */}
      <section className="max-w-4xl mx-auto px-4 py-10 border-t border-gray-800">
        <h2 className="text-2xl font-black mb-6">Por que empresas escolhem a Tech Churras</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {DIFERENCIAIS.map((d) => (
            <div key={d.title} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="text-2xl mb-2">{d.icon}</div>
              <h3 className="font-bold mb-1">{d.title}</h3>
              <p className="text-gray-400 text-sm">{d.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section className="max-w-4xl mx-auto px-4 py-10 border-t border-gray-800">
        <h2 className="text-2xl font-black mb-6">Como funciona</h2>
        <ol className="space-y-4">
          {[
            ['1', 'Você conta o tamanho da festa', 'Número de pessoas, mês desejado e local (escritório, área externa, chácara — a gente se adapta).'],
            ['2', 'Proposta fechada em até 24h', 'Valor total por pessoa com carnes, churrasqueiro e taxa — tudo incluso, aprovação por e-mail ou WhatsApp.'],
            ['3', 'A Tech Churras executa', 'Açougue parceiro entrega os cortes, o Grill Master comanda o fogo e sua equipe só aproveita.'],
          ].map(([n, t, d]) => (
            <li key={n} className="flex gap-4 items-start">
              <span className="w-9 h-9 shrink-0 rounded-full bg-orange-500 text-white font-black flex items-center justify-center">{n}</span>
              <div><b>{t}</b><p className="text-gray-400 text-sm mt-0.5">{d}</p></div>
            </li>
          ))}
        </ol>
      </section>

      {/* Form */}
      <section id="proposta" className="max-w-4xl mx-auto px-4 py-12 border-t border-gray-800">
        <div className="max-w-lg">
          <h2 className="text-2xl font-black mb-2">Peça sua proposta</h2>
          <p className="text-gray-400 text-sm mb-6">Resposta em até 24h úteis, direto no seu WhatsApp. Sem compromisso.</p>
          <CorporateLeadForm />
        </div>
      </section>

      <footer className="border-t border-gray-800 px-4 py-8 text-center text-gray-500 text-sm">
        Tech Churras · CNPJ 67.830.186/0001-87 · <Link href="/" className="text-orange-400">techchurras.com.br</Link>
      </footer>
    </div>
  )
}
