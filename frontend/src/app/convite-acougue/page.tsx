'use client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'

const WHATSAPP_BASE = 'https://wa.me/5511970593650'

const BENEFICIOS_FUNDADOR = [
  { icon: '📅', titulo: '3 meses sem mensalidade', desc: 'Economia de R$ 1.107 garantida antes de cobrar qualquer centavo.' },
  { icon: '🏅', titulo: 'Badge "Açougue Fundador"', desc: 'Selo permanente na plataforma. Quem entrar depois não terá esse diferencial.' },
  { icon: '📍', titulo: 'Destaque nas buscas por 6 meses', desc: 'Seu açougue aparece em primeiro antes de qualquer outro na cidade.' },
  { icon: '🤝', titulo: 'Acesso direto ao fundador', desc: 'WhatsApp direto com Jota para qualquer dúvida, ajuste ou sugestão.' },
  { icon: '🤖', titulo: 'IA que indica seu açougue', desc: 'A IA da plataforma sugere seus cortes quando o cliente monta o kit do evento.' },
  { icon: '💰', titulo: 'Repasse semanal via PIX', desc: 'Toda sexta-feira, o valor das vendas da semana cai direto na sua conta.' },
]

const COMO_FUNCIONA = [
  { n: '1', texto: 'Você cadastra seus cortes e preços no dashboard' },
  { n: '2', texto: 'Cliente contrata o churrasqueiro + seleciona cortes do seu açougue' },
  { n: '3', texto: 'Churrasqueiro retira no seu balcão no dia do evento' },
  { n: '4', texto: 'Você recebe o valor via PIX na sexta-feira' },
]

function ConviteContent() {
  const params = useSearchParams()
  const nome = params.get('nome') ?? 'seu açougue'
  const nomeFormatado = nome.replace(/\+/g, ' ')

  const waMsg = encodeURIComponent(
    `Olá Jota! Recebi o convite para o ${nomeFormatado} ser Parceiro Fundador da Tech Churras. Quero saber mais!`
  )
  const waUrl = `${WHATSAPP_BASE}?text=${waMsg}`
  const cadastroUrl = `/register?role=boutique&ref=convite&nome=${encodeURIComponent(nomeFormatado)}`

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* Nav */}
      <nav className="border-b border-white/5 px-4 py-4 flex items-center justify-between max-w-3xl mx-auto">
        <Link href="/" className="font-black text-white text-lg">
          Tech <span className="text-orange-500">Churras</span>
        </Link>
        <a
          href={waUrl}
          target="_blank" rel="noopener noreferrer"
          className="text-sm bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-lg transition-colors"
        >
          💬 WhatsApp
        </a>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-5 py-2 text-sm text-amber-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Convite exclusivo · Parceiro Fundador · São Paulo
          </div>
        </div>

        {/* Fundador message */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden mb-8">
          <div className="grid sm:grid-cols-[200px_1fr]">
            <div className="relative h-52 sm:h-auto bg-gray-800">
              <img
                src="/jota.jpg"
                alt="Jota Albuquerque"
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-gray-900/20" />
            </div>
            <div className="p-6 sm:p-8 flex flex-col justify-center">
              <p className="text-xs text-orange-400 font-bold uppercase tracking-widest mb-3">Mensagem pessoal</p>
              <p className="text-3xl text-orange-500 font-black leading-none mb-3">"</p>
              <p className="text-gray-200 text-base leading-relaxed mb-5">
                Estou construindo a maior plataforma de churrasco do Brasil e quero que{' '}
                <span className="text-white font-bold">{nomeFormatado}</span>{' '}
                seja um dos primeiros açougues a fazer parte dessa história.
                Reservei uma das {3} vagas de Parceiro Fundador especialmente para vocês.
              </p>
              <div>
                <p className="text-white font-bold text-sm">Jota Albuquerque</p>
                <p className="text-gray-500 text-xs">Fundador & CEO, Tech Churras</p>
                <p className="text-gray-600 text-xs mt-0.5">13+ anos · 500+ eventos · Madonna, Lady Gaga, Neymar</p>
              </div>
            </div>
          </div>
        </div>

        {/* O que é a Tech Churras */}
        <div className="mb-8">
          <h2 className="text-2xl font-black mb-2">O que é a Tech Churras?</h2>
          <p className="text-gray-400 leading-relaxed">
            Somos uma plataforma que conecta churrasqueiros profissionais com clientes que querem fazer churrasco de qualidade em casa. O cliente contrata o churrasqueiro e compra os cortes — tudo no mesmo app. O seu açougue é o fornecedor preferencial de carne.
          </p>
        </div>

        {/* Como funciona */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
          <h3 className="font-bold text-white mb-5">Como funciona para o seu açougue</h3>
          <div className="space-y-4">
            {COMO_FUNCIONA.map(p => (
              <div key={p.n} className="flex items-start gap-4">
                <div className="w-7 h-7 rounded-full bg-orange-500 text-white font-black text-sm flex items-center justify-center shrink-0">
                  {p.n}
                </div>
                <p className="text-gray-300 text-sm pt-0.5 leading-relaxed">{p.texto}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Benefícios Fundador */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🏅</span>
            <div>
              <h2 className="text-2xl font-black">Pacote Parceiro Fundador</h2>
              <p className="text-xs text-amber-400 font-semibold">Somente para os primeiros 3 açougues em São Paulo</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {BENEFICIOS_FUNDADOR.map(b => (
              <div key={b.titulo} className="bg-gray-900 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                <span className="text-xl shrink-0">{b.icon}</span>
                <div>
                  <p className="font-bold text-white text-sm mb-1">{b.titulo}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transparência de custos */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
          <h3 className="font-bold text-white mb-5">Custos — sem surpresas</h3>
          <div className="space-y-3">
            {[
              { label: 'Taxa de adesão', valor: 'R$ 0', cor: 'text-green-400', obs: 'Grátis para entrar' },
              { label: 'Mensalidade (Parceiro Fundador)', valor: 'R$ 0 / 3 meses', cor: 'text-amber-400', obs: 'Depois R$ 369/mês — cancela quando quiser' },
              { label: 'Comissão por pedido', valor: '7%', cor: 'text-gray-300', obs: 'Sobre o valor dos cortes vendidos via plataforma' },
              { label: 'Repasse', valor: 'Toda sexta', cor: 'text-green-400', obs: 'Via PIX, já com a comissão descontada' },
            ].map(c => (
              <div key={c.label} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-300 font-medium">{c.label}</p>
                  <p className="text-xs text-gray-600">{c.obs}</p>
                </div>
                <span className={`text-sm font-black shrink-0 ${c.cor}`}>{c.valor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="space-y-3 mb-8">
          <a
            href={waUrl}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-2xl text-base transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM11.9 2C6.458 2 2.015 6.443 2.015 11.885c0 1.778.468 3.51 1.36 5.034L2 22l5.225-1.372A9.86 9.86 0 0011.9 23.77C17.342 23.77 22 19.327 22 13.885 22 8.443 17.342 4 11.9 4z"/>
            </svg>
            Falar com Jota no WhatsApp
          </a>
          <Link
            href={cadastroUrl}
            className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl text-base transition-colors"
          >
            🥩 Cadastrar {nomeFormatado} agora
          </Link>
          <p className="text-center text-xs text-gray-600">
            Sem cartão de crédito · Sem burocracia · Cancela quando quiser
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-900 pt-6 text-center">
          <Link href="/" className="font-black text-gray-600 hover:text-gray-400 transition-colors">
            Tech <span className="text-orange-600">Churras</span>
          </Link>
          <p className="text-xs text-gray-700 mt-1">© 2026 · Feito com 🔥 no Brasil</p>
        </div>
      </div>
    </div>
  )
}

export default function ConviteAcougue() {
  return (
    <Suspense>
      <ConviteContent />
    </Suspense>
  )
}
