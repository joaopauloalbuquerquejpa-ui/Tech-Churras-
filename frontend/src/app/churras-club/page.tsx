'use client'
import { useState } from 'react'
import Link from 'next/link'

const BENEFITS = [
  {
    icon: '💰',
    title: '5% de desconto em todo pedido',
    desc: 'Em cada churrasco contratado, você economiza 5% automaticamente — sem cupom, sem complicação.',
  },
  {
    icon: '⚡',
    title: 'Churrasqueiro prioritário',
    desc: 'Seu pedido vai para o topo da fila dos churrasqueiros mais bem avaliados da sua região.',
  },
  {
    icon: '📅',
    title: 'Agendamento com prioridade',
    desc: 'Datas disputadas (feriados, vésperas) ficam disponíveis primeiro para membros Churras Club.',
  },
  {
    icon: '🎯',
    title: 'Kit Perfeito ilimitado',
    desc: 'Use a IA do Kit Perfeito quantas vezes quiser para montar o churrasco ideal para cada evento.',
  },
  {
    icon: '💬',
    title: 'Suporte VIP',
    desc: 'Canal direto com a equipe Tech Churras via WhatsApp. Resposta em até 2 horas.',
  },
  {
    icon: '🏆',
    title: 'Pontos em dobro',
    desc: 'Acumule pontos duas vezes mais rápido e troque por descontos em futuros churrascos.',
  },
]

const FAQS = [
  {
    q: 'Quando o desconto de 5% é aplicado?',
    a: 'Automaticamente no checkout de todo pedido, sem precisar de cupom. Aparece no resumo do pedido antes de você confirmar.',
  },
  {
    q: 'Posso cancelar quando quiser?',
    a: 'Sim. O Churras Club é mensalidade sem fidelidade. Cancele em qualquer momento pelo app e não haverá cobrança no mês seguinte.',
  },
  {
    q: 'O desconto vale para produtos do açougue também?',
    a: 'Sim, o desconto de 5% incide sobre o valor total do pedido: churrasqueiro + produtos do açougue.',
  },
  {
    q: 'Posso usar o Churras Club para eventos da empresa?',
    a: 'Sim! Muitos membros assinam para cobrir churrascos corporativos recorrentes. Para contratos anuais corporativos, entre em contato.',
  },
]

export default function ChurrasClubPage() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleInterest(e: React.FormEvent) {
    e.preventDefault()
    const msg = `Olá! Tenho interesse no Churras Club.\n\nNome: ${name}\nEmail: ${email}\n\nQuero saber mais sobre a assinatura mensal.`
    window.open(`https://wa.me/5599999999999?text=${encodeURIComponent(msg)}`, '_blank')
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-gray-900 px-4 py-3 flex items-center justify-between max-w-5xl mx-auto">
        <Link href="/" className="font-black text-orange-400 text-lg">🔥 Tech Churras</Link>
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">Acessar conta</Link>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-1.5 text-sm text-orange-400 font-semibold mb-6">
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          Lançamento em breve
        </div>
        <h1 className="text-5xl md:text-6xl font-black mb-6">
          Churras{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Club</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-4">
          Para quem faz churrasco todo mês. Uma assinatura que paga o próprio preço no primeiro pedido.
        </p>
        <p className="text-4xl font-black text-orange-400 mb-2">
          R$ 49<span className="text-lg font-normal text-gray-500">/mês</span>
        </p>
        <p className="text-sm text-gray-500 mb-10">Cancele quando quiser · Sem fidelidade</p>

        {/* Savings calculator */}
        <div className="inline-block bg-gray-900 border border-gray-800 rounded-2xl px-8 py-5 mb-12 text-left">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Exemplo de economia</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-8">
              <span className="text-gray-300">Pedido médio de churrasco</span>
              <span className="font-bold">R$ 1.200</span>
            </div>
            <div className="flex items-center justify-between gap-8">
              <span className="text-gray-300">Desconto 5% Churras Club</span>
              <span className="font-bold text-green-400">− R$ 60</span>
            </div>
            <div className="flex items-center justify-between gap-8">
              <span className="text-gray-300">Custo da assinatura</span>
              <span className="font-bold text-red-400">− R$ 49</span>
            </div>
            <div className="h-px bg-gray-700 my-2" />
            <div className="flex items-center justify-between gap-8">
              <span className="text-white font-semibold">Economia líquida</span>
              <span className="font-black text-green-400 text-lg">+ R$ 11 por mês</span>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2">* Com 2 pedidos por mês, economiza R$ 71</p>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-center mb-10">O que está incluso</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {BENEFITS.map(b => (
            <div key={b.title} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <span className="text-3xl mb-3 block">{b.icon}</span>
              <h3 className="font-bold text-white mb-2">{b.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Interest form */}
      <section className="bg-gray-900 border-y border-gray-800 py-16">
        <div className="max-w-lg mx-auto px-4 text-center">
          {submitted ? (
            <div>
              <p className="text-4xl mb-4">🔥</p>
              <h2 className="text-2xl font-bold text-green-400 mb-2">Interesse registrado!</h2>
              <p className="text-gray-400 text-sm">Você receberá um aviso assim que o Churras Club abrir as inscrições.</p>
              <Link href="/dashboard" className="mt-6 inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors">
                Voltar ao app
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-2">Quero ser dos primeiros</h2>
              <p className="text-gray-400 text-sm mb-8">
                O Churras Club está em fase de lançamento. Deixe seu contato e avisamos assim que abrir.
              </p>
              <form onSubmit={handleInterest} className="space-y-3">
                <input
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 placeholder-gray-600"
                />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Seu email"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 placeholder-gray-600"
                />
                <button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-colors text-base"
                >
                  Quero fazer parte — R$ 49/mês
                </button>
              </form>
              <p className="text-xs text-gray-600 mt-3">Sem cobrança agora. Você decide quando entrar.</p>
            </>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-4 py-20">
        <h2 className="text-2xl font-bold text-center mb-10">Perguntas frequentes</h2>
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-3"
              >
                <span className="font-semibold text-sm text-white">{f.q}</span>
                <span className={`shrink-0 text-gray-500 transition-transform ${faqOpen === i ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {faqOpen === i && (
                <div className="px-5 pb-4 text-sm text-gray-400 leading-relaxed">{f.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-2xl mx-auto px-4 pb-20 text-center">
        <p className="text-gray-500 text-sm mb-6">Já é cliente? Contrate um churrasco agora.</p>
        <Link href="/grillmasters" className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-bold px-8 py-3.5 rounded-xl transition-colors">
          Ver churrasqueiros disponíveis
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-900 px-4 py-8 text-center text-xs text-gray-600">
        <p>© {new Date().getFullYear()} Tech Churras · O churrasqueiro dos famosos</p>
      </footer>
    </div>
  )
}
