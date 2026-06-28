import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Parceria para Açougues em São Paulo | Tech Churras',
  description: 'Cadastre seu açougue gratuitamente na Tech Churras e apareça nas sugestões da IA para todos os churrascos da sua região. Ganhe R$40 por cliente indicado, sem mensalidade e sem contrato.',
  keywords: [
    'parceria açougue São Paulo',
    'cadastrar açougue SP',
    'açougue parceiro churrasco',
    'como ganhar com açougue SP',
    'Tech Churras parceiro',
  ],
  openGraph: {
    title: 'Seu açougue no maior app de churrasco de SP | Tech Churras',
    description: 'Sua carne nas sugestões da IA. R$40 por cliente. Sem mensalidade. Apenas 1 açougue por bairro.',
    url: 'https://www.techchurras.com.br/parceiros',
    images: [{ url: '/jota.jpg', width: 800, height: 800 }],
  },
  alternates: { canonical: 'https://www.techchurras.com.br/parceiros' },
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
  { icon: '🤖', title: 'Sua carne na IA', desc: 'Seus produtos aparecem nas sugestões automáticas da IA para clientes da sua região.' },
  { icon: '🚫', title: 'Zero mensalidade', desc: 'Sem contrato, sem custo fixo. Você só ganha.' },
  { icon: '📱', title: 'Dashboard completo', desc: 'Acompanha indicações, bônus e histórico em tempo real.' },
  { icon: '🏆', title: 'Exclusivo por bairro', desc: 'Apenas 1 açougue parceiro por bairro em SP. Garanta o seu antes do concorrente.' },
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
            <img src="/logo-flame.png" alt="" role="presentation" className="absolute bottom-0 h-14 w-auto" />
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
          🔥 Apenas 1 vaga por bairro em SP
        </div>
        <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">
          Seu açougue no maior app de<br />
          <span className="text-orange-500">churrasco profissional</span> de SP
        </h1>
        <p className="text-gray-400 text-lg mb-4 max-w-xl mx-auto">
          Ganhe <strong className="text-white">R$40 por cada cliente</strong> que fechar um churrasqueiro pelo seu link — e sua carne aparece automaticamente nas sugestões da nossa IA para todos os clientes da região.
        </p>
        <p className="text-orange-400/80 text-sm mb-8 font-medium">Sem mensalidade. Sem contrato. Ativo em minutos.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/register?role=BOUTIQUE"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-black text-lg px-8 py-4 rounded-2xl transition-colors shadow-lg shadow-orange-500/20"
          >
            Quero ser parceiro — é grátis →
          </Link>
          <a
            href="https://wa.me/5511970593650?text=Oi%20Jota%2C%20vi%20a%20parceria%20Tech%20Churras%20e%20quero%20cadastrar%20meu%20açougue!"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 border-2 border-green-600 hover:bg-green-900/30 text-green-400 font-bold text-base px-6 py-4 rounded-2xl transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            Falar com o Jota
          </a>
        </div>
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

      {/* IA angle highlight */}
      <section className="px-4 pb-16 max-w-3xl mx-auto">
        <div className="bg-gradient-to-br from-gray-900 to-orange-500/5 border border-orange-500/20 rounded-2xl p-7">
          <div className="flex items-start gap-4">
            <span className="text-4xl shrink-0">🤖</span>
            <div>
              <h3 className="text-xl font-black text-white mb-2">Sua carne nas sugestões da IA</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Nossa IA monta kits de churrasco personalizados para cada cliente — e ela usa os produtos do açougue parceiro mais próximo do evento. Isso significa que quando alguém pesquisa churrasco na sua região, o seu catálogo aparece automaticamente nas recomendações.
              </p>
              <div className="bg-gray-950/60 rounded-xl p-4 border border-gray-800">
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Exemplo real</p>
                <p className="text-sm text-gray-300 italic">
                  "João, para o seu aniversário de 30 pessoas montei 8kg de picanha e 4kg de fraldinha do <strong className="text-orange-400">Açougue do Bairro</strong> — o Jota garante que esses cortes são o destaque de qualquer festa! 🔥"
                </p>
              </div>
            </div>
          </div>
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
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-black text-lg px-8 py-4 rounded-2xl transition-colors w-full shadow-lg shadow-orange-500/20 mb-3"
          >
            Cadastrar meu açougue grátis →
          </Link>
          <a
            href="https://wa.me/5511970593650?text=Oi%20Jota%2C%20vi%20a%20parceria%20Tech%20Churras%20e%20quero%20cadastrar%20meu%20açougue!"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full border-2 border-green-700 hover:bg-green-900/20 text-green-400 font-bold py-4 rounded-2xl transition-colors text-base mb-4"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            Prefere conversar? Fala com o Jota no WhatsApp
          </a>
          <p className="text-gray-600 text-xs">Já tem conta? <Link href="/login" className="text-orange-400 hover:underline">Entrar</Link></p>
        </div>
      </section>

      {/* Footer mínimo */}
      <footer className="border-t border-gray-900 px-4 py-6 text-center text-xs text-gray-600">
        © {new Date().getFullYear()} Tech Churras · <Link href="/termos-de-uso" className="hover:text-gray-400">Termos</Link> · <Link href="/politica-de-privacidade" className="hover:text-gray-400">Privacidade</Link>
      </footer>
    </div>
  )
}
