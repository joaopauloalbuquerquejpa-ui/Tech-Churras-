import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Seja Churrasqueiro Parceiro — Tech Churras',
  robots: { index: false },
}

const WHATSAPP = 'https://wa.me/5511970593650?text=Ol%C3%A1+Jota%2C+vi+a+proposta+da+Tech+Churras+e+quero+me+tornar+um+Grillmaster+parceiro.'
const WHATSAPP_FUNDADOR = 'https://wa.me/5511970593650?text=Ol%C3%A1+Jota%2C+quero+uma+das+10+vagas+de+Churrasqueiro+Fundador+da+Tech+Churras.'

export default function PitchChurrasqueiro() {
  return (
    <div className="min-h-screen bg-gray-950 text-white pb-28">

      {/* ── HEADER ── */}
      <div className="px-5 pt-8 pb-6 flex items-center justify-between">
        <span className="font-black text-xl">Tech <span className="text-orange-500">Churras</span></span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400 border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 rounded-full">
          Proposta de parceria
        </span>
      </div>

      {/* ── HERO ── */}
      <section className="px-5 pt-2 pb-10">
        <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-3 py-1 text-xs text-yellow-400 font-semibold mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
          10 vagas · Churrasqueiro Fundador · SP
        </div>

        <h1 className="text-3xl font-black leading-tight mb-4">
          Você sabe fazer churrasco.{' '}
          <span className="text-orange-500">Nós enchemos<br />sua agenda.</span>
        </h1>

        <p className="text-gray-400 text-base leading-relaxed mb-6">
          A Tech Churras envia pedidos direto para o seu celular — você escolhe os que quer pegar, faz o evento e recebe 93% no PIX toda sexta. Zero mensalidade, zero burocracia.
        </p>

        {/* Quick numbers */}
        <div className="grid grid-cols-3 gap-3 mb-2">
          {[
            { valor: 'R$ 0', label: 'mensalidade' },
            { valor: '93%', label: 'você recebe' },
            { valor: 'PIX', label: 'toda sexta' },
          ].map(n => (
            <div key={n.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
              <p className="text-lg font-black text-orange-400">{n.valor}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{n.label}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 text-center">* 7% de comissão apenas quando você realiza um evento</p>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section className="px-5 py-8 border-t border-gray-900">
        <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-5">Como funciona</p>
        <div className="space-y-4">
          {[
            {
              n: '1', icon: '📝',
              titulo: 'Crie seu perfil gratuitamente',
              desc: 'Fotos, especialidades, preço por hora e disponibilidade. Leva menos de 10 minutos.',
            },
            {
              n: '2', icon: '📲',
              titulo: 'Receba pedidos na sua área',
              desc: 'Quando um cliente contratar na sua região, você recebe a notificação. Aceita ou recusa — você decide.',
            },
            {
              n: '3', icon: '🥩',
              titulo: 'Retire a carne no açougue parceiro',
              desc: 'Passe no açougue antes do evento, retire a carne e os acompanhamentos já separados. Tudo em uma parada.',
            },
            {
              n: '4', icon: '💸',
              titulo: '93% cai no seu PIX',
              desc: 'Toda sexta-feira o repasse é automático. Sem precisar cobrar, emitir nota ou esperar.',
            },
          ].map(s => (
            <div key={s.n} className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-xl shrink-0">
                {s.icon}
              </div>
              <div>
                <p className="font-bold text-white text-sm">{s.titulo}</p>
                <p className="text-gray-400 text-sm mt-1 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── QUANTO VOCÊ GANHA ── */}
      <section className="px-5 py-8 border-t border-gray-900">
        <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-5">Quanto você pode ganhar</p>

        <div className="space-y-3 mb-5">
          {[
            { perfil: 'Fim de semana (4 eventos/mês · R$80/h · 4h)', liquido: 1190 },
            { perfil: 'Regular (8 eventos/mês · R$100/h · 5h)',       liquido: 3720 },
            { perfil: 'Full-time (15 eventos/mês · R$150/h · 6h)',    liquido: 12555 },
          ].map(e => (
            <div key={e.perfil} className="flex items-center justify-between gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-400 leading-snug flex-1">{e.perfil}</p>
              <p className="text-sm font-black text-green-400 shrink-0">
                R$ {e.liquido.toLocaleString('pt-BR')}/mês
              </p>
            </div>
          ))}
        </div>

        <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-4 text-center">
          <p className="text-xs text-gray-400">Você define seu preço e sua agenda.</p>
          <p className="text-sm font-bold text-green-400 mt-1">Quanto mais eventos, mais você ganha. Sem teto.</p>
        </div>
      </section>

      {/* ── CHANCELAMENTO JOTA ── */}
      <section className="px-5 py-8 border-t border-gray-900">
        <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-5">O diferencial que nenhum app tem</p>

        <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/5 border border-orange-500/30 rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <img
              src="/jota.jpg"
              alt="Jota Albuquerque"
              className="w-14 h-14 rounded-xl object-cover object-top shrink-0 border-2 border-orange-500/40"
            />
            <div>
              <p className="font-black text-white">Chancelamento Jota Albuquerque</p>
              <p className="text-xs text-gray-500">13 anos de Jota BBQ Eventos · SP e RJ</p>
              <p className="text-xs text-orange-400 mt-0.5">Artistas · Atletas · Marcas</p>
            </div>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed mb-4">
            Todo churrasqueiro da Tech Churras passa por um processo de chancelamento desenvolvido pelo Jota. Não é um curso online — é um padrão de qualidade real que o cliente reconhece e paga mais para ter.
          </p>
          <div className="space-y-2">
            {[
              '👨‍🏫 Treinamento presencial com Jota — técnicas de corte, fogo, tempero e postura',
              '🏅 Badge "Chancelado Tech Churras" visível no seu perfil público',
              '⭐ Prioridade nas buscas frente a churrasqueiros sem chancela',
              '📋 Avaliação contínua — só quem mantém padrão fica na rede',
            ].map(item => (
              <div key={item} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="shrink-0">{item.slice(0, 2)}</span>
                <span>{item.slice(3)}</span>
              </div>
            ))}
          </div>
        </div>

        <blockquote className="border-l-2 border-orange-500 pl-4">
          <p className="text-gray-300 text-sm italic leading-relaxed">
            "Passei anos fazendo churrasco para os maiores eventos do mundo. O que aprendi não está em curso nenhum. Quero passar isso para os churrasqueiros da Tech Churras."
          </p>
          <p className="text-xs text-orange-400 mt-2">— Jota Albuquerque, fundador</p>
        </blockquote>
      </section>

      {/* ── OFERTA CHURRASQUEIRO FUNDADOR ── */}
      <section className="px-5 py-8 border-t border-gray-900">
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🏅</span>
            <div>
              <p className="font-black text-white">Churrasqueiro Fundador</p>
              <p className="text-xs text-amber-400">Apenas 10 vagas em SP · 1ª turma</p>
            </div>
          </div>
          <div className="space-y-2.5 mb-5">
            {[
              'Treinamento presencial exclusivo com Jota Albuquerque',
              'Badge "Churrasqueiro Fundador" permanente no app',
              'Prioridade máxima nas buscas por 6 meses',
              'Acesso direto ao fundador via WhatsApp',
              'Primeiros a receber pedidos quando a plataforma lançar',
            ].map(b => (
              <div key={b} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-amber-400 mt-0.5 shrink-0">✦</span>
                <span>{b}</span>
              </div>
            ))}
          </div>
          <div className="bg-black/30 rounded-xl p-3 text-center mb-4">
            <p className="text-xs text-gray-400">As 10 vagas são preenchidas por ordem de chegada.</p>
            <p className="text-orange-400 font-black text-sm mt-0.5">Quem entrar primeiro tem a vantagem.</p>
          </div>
          <a
            href={WHATSAPP_FUNDADOR}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-black py-3 rounded-xl text-sm transition-colors"
          >
            Quero uma das 10 vagas →
          </a>
        </div>
      </section>

      {/* ── QUEM É O JOTA ── */}
      <section className="px-5 py-8 border-t border-gray-900">
        <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-5">Quem assina a chancela</p>

        <div className="bg-gray-900 border border-amber-500/20 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🌍</span>
            <div>
              <p className="text-sm font-bold text-white">Bahari of Brazil — Zanzibar, Tanzânia</p>
              <p className="text-xs text-amber-400">Parceria oficial com o Governo de Zanzibar</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Jota é sócio e BBQ Master do Bahari of Brazil — hub culinário de 500m² criado em PPP com o Ministério de TI e Inovação da Tanzânia. Primeiro restaurante do país com parceria oficial de governo. É o padrão que ele traz para os churrasqueiros da Tech Churras.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { valor: '13', label: 'anos de experiência' },
            { valor: 'SP e RJ', label: 'Jota BBQ Eventos' },
            { valor: 'AAA', label: 'clientela atendida' },
            { valor: 'Gov. Zanzibar', label: 'parceiro institucional' },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
              <p className="font-black text-orange-400 text-base">{s.valor}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ZERO RISCO ── */}
      <section className="px-5 py-8 border-t border-gray-900">
        <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-4">Sem risco para você</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '✅', texto: 'Zero mensalidade' },
            { icon: '✅', texto: '93% de cada evento' },
            { icon: '✅', texto: 'Você define seu preço' },
            { icon: '✅', texto: 'Você escolhe os pedidos' },
            { icon: '✅', texto: 'PIX toda sexta automático' },
            { icon: '✅', texto: 'Cancela quando quiser' },
          ].map(item => (
            <div key={item.texto} className="flex items-center gap-2 text-sm text-gray-300">
              <span>{item.icon}</span>
              <span>{item.texto}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA STICKY ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-950/95 backdrop-blur-sm border-t border-gray-800 px-5 py-4">
        <a
          href={WHATSAPP}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-black py-4 rounded-2xl text-base transition-colors"
        >
          <span className="text-xl">🔥</span>
          Falar com o Jota no WhatsApp
        </a>
        <p className="text-center text-xs text-gray-600 mt-2">
          Responde em até 2 horas · Sem compromisso
        </p>
      </div>

    </div>
  )
}
