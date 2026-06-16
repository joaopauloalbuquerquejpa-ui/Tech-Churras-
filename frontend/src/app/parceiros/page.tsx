import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Seja Parceiro — Tech Churras',
  description: 'Cadastre seu açougue na maior plataforma de churrasqueiros profissionais de SP. Ganhe R$40 por cliente indicado, sem mensalidade.',
}

const STEPS = [
  {
    n: '01',
    title: 'Cadastro grátis',
    desc: 'Cria sua conta em 5 minutos. Aprovamos na hora.',
  },
  {
    n: '02',
    title: 'Seu QR code exclusivo',
    desc: 'Recebe um QR code e link único. Coloca no balcão, no WhatsApp, no Stories.',
  },
  {
    n: '03',
    title: 'Recebe por cada cliente',
    desc: 'Cada cliente que fechar um churrasqueiro pelo seu link — R$40 cai direto no seu PIX.',
  },
]

const BENEFITS = [
  { icon: '💰', title: 'R$40 por cliente', desc: 'Pagamento automático no PIX. Sem burocracia.' },
  { icon: '📈', title: 'Novos clientes', desc: 'Quem contrata churrasqueiro profissional compra a carne no parceiro da plataforma.' },
  { icon: '🚫', title: 'Zero mensalidade', desc: 'Sem contrato, sem custo fixo. Você só ganha.' },
  { icon: '📱', title: 'Dashboard completo', desc: 'Acompanha indicações, bônus e histórico em tempo real.' },
  { icon: '🏆', title: 'Selo de parceiro', desc: 'Seu açougue aparece como recomendado para todos os clientes da região.' },
  { icon: '⚡', title: 'Ativo em minutos', desc: 'Sem visita comercial, sem contrato. Cadastra e já começa.' },
]

const FAQS = [
  {
    q: 'Preciso pagar alguma mensalidade?',
    a: 'Não. O cadastro é gratuito e não tem nenhum custo fixo. Você só recebe.',
  },
  {
    q: 'Como recebo os R$40?',
    a: 'Direto no seu PIX. Você cadastra a chave uma vez e os pagamentos caem automaticamente conforme os clientes convertem.',
  },
  {
    q: 'E se o cliente não comprar a carne no meu açougue?',
    a: 'Você recebe pela indicação do churrasqueiro de qualquer forma. E o cliente que contrata um profissional sempre precisa de carne boa — naturalmente vai perguntar onde comprar.',
  },
  {
    q: 'Quanto tempo leva pra ser aprovado?',
    a: 'Aprovamos em até 24h. Na maioria das vezes, na hora.',
  },
  {
    q: 'Funciona pra qualquer açougue de SP?',
    a: 'Sim. Trabalhamos com açougues de todos os tamanhos em toda a Grande São Paulo.',
  },
]

const EARNINGS = [
  { clientes: 5, por_mes: 'R$ 200' },
  { clientes: 20, por_mes: 'R$ 800' },
  { clientes: 50, por_mes: 'R$ 2.000' },
  { clientes: 100, por_mes: 'R$ 4.000' },
]

export default function ParceirosPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Nav */}
      <nav className="px-4 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 overflow-hidden relative w-9">
            <img src="/logo-flame.png" alt="" className="absolute bottom-0 h-14 w-auto" />
          </div>
          <span className="font-black text-xl text-white leading-none">Tech <span className="text-orange-500">Churras</span></span>
        </Link>
        <Link
          href="/register?role=BOUTIQUE"
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
        >
          Cadastrar açougue
        </Link>
      </nav>

      {/* Hero */}
      <section className="px-4 pt-10 pb-16 max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-1.5 text-sm text-orange-400 font-semibold mb-6">
          🔥 Parceria exclusiva para açougues de SP
        </div>
        <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">
          Seu açougue no maior app de<br />
          <span className="text-orange-500">churrasco profissional</span> de SP
        </h1>
        <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
          Ganhe <strong className="text-white">R$40 por cada cliente</strong> que fechar um churrasqueiro pelo seu link. Sem mensalidade. Sem contrato. Ativo em minutos.
        </p>
        <Link
          href="/register?role=BOUTIQUE"
          className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-black text-lg px-8 py-4 rounded-2xl transition-colors shadow-lg shadow-orange-500/20"
        >
          Quero ser parceiro — é grátis →
        </Link>
        <p className="text-gray-600 text-xs mt-3">Aprovação em até 24h · Sem cartão de crédito</p>
      </section>

      {/* Potencial de ganho */}
      <section className="px-4 pb-16 max-w-3xl mx-auto">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <p className="font-bold text-white">Quanto você pode ganhar por mês</p>
            <p className="text-xs text-gray-500 mt-0.5">Baseado em R$40 por cliente convertido</p>
          </div>
          <div className="divide-y divide-gray-800">
            {EARNINGS.map((e) => (
              <div key={e.clientes} className="px-6 py-3 flex items-center justify-between">
                <span className="text-gray-400 text-sm">{e.clientes} clientes indicados</span>
                <span className="font-black text-orange-400 text-lg">{e.por_mes}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="px-4 pb-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-black text-center mb-10">Como funciona</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((s) => (
            <div key={s.n} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="text-orange-500 font-black text-3xl mb-3">{s.n}</div>
              <p className="font-bold text-white mb-1">{s.title}</p>
              <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefícios */}
      <section className="px-4 pb-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-black text-center mb-10">Por que virar parceiro</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {BENEFITS.map((b) => (
            <div key={b.title} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="text-2xl mb-2">{b.icon}</div>
              <p className="font-bold text-white text-sm mb-1">{b.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Founder quote */}
      <section className="px-4 pb-16 max-w-2xl mx-auto">
        <div className="bg-gray-900 border border-orange-500/20 rounded-2xl p-6 flex gap-4 items-start">
          <img
            src="/jota.jpg"
            alt="Jota Albuquerque"
            className="w-14 h-14 rounded-xl object-cover shrink-0"
          />
          <div>
            <p className="text-gray-300 text-sm leading-relaxed italic mb-3">
              "O churrasqueiro profissional e o açougue premium são a mesma história — o cliente que quer churrasco de verdade precisa dos dois. A Tech Churras conecta esse ecossistema."
            </p>
            <p className="text-white font-bold text-sm">Jota Albuquerque</p>
            <p className="text-orange-500 text-xs">Fundador · Tech Churras</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 pb-16 max-w-2xl mx-auto">
        <h2 className="text-2xl font-black text-center mb-8">Perguntas frequentes</h2>
        <div className="space-y-3">
          {FAQS.map((f) => (
            <div key={f.q} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <p className="font-bold text-white text-sm mb-1.5">{f.q}</p>
              <p className="text-gray-400 text-sm leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="px-4 pb-20 max-w-xl mx-auto text-center">
        <div className="bg-gradient-to-br from-orange-500/10 to-gray-900 border border-orange-500/20 rounded-3xl p-8">
          <p className="text-2xl font-black mb-2">Pronto pra começar?</p>
          <p className="text-gray-400 text-sm mb-6">Cadastro gratuito. Aprovação em até 24h. Sem contrato.</p>
          <Link
            href="/register?role=BOUTIQUE"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-black text-lg px-8 py-4 rounded-2xl transition-colors w-full shadow-lg shadow-orange-500/20"
          >
            Cadastrar meu açougue grátis →
          </Link>
          <p className="text-gray-600 text-xs mt-3">Já tem conta? <Link href="/login" className="text-orange-400 hover:underline">Entrar</Link></p>
        </div>
      </section>

      {/* Footer mínimo */}
      <footer className="border-t border-gray-900 px-4 py-6 text-center text-xs text-gray-600">
        © {new Date().getFullYear()} Tech Churras · <Link href="/termos-de-uso" className="hover:text-gray-400">Termos</Link> · <Link href="/politica-de-privacidade" className="hover:text-gray-400">Privacidade</Link>
      </footer>
    </div>
  )
}
