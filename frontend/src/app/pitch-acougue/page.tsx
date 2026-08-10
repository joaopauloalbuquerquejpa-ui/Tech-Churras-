import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Parceria Tech Churras — Proposta para Açougues',
  robots: { index: false },
}

const WHATSAPP = 'https://wa.me/5511970593650?text=Ol%C3%A1+Jota%2C+vi+a+proposta+da+Tech+Churras+e+quero+saber+mais+sobre+a+parceria+como+a%C3%A7ougue.'

export default function PitchAcougue() {
  return (
    <div className="min-h-screen bg-gray-950 text-white pb-28">

      {/* ── HEADER ── */}
      <div className="px-5 pt-8 pb-6 flex items-center justify-between">
        <span className="font-black text-xl">Tech <span className="text-orange-500">Churras</span></span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400 border border-orange-500/30 bg-orange-500/10 px-3 py-1 rounded-full">
          Proposta de parceria
        </span>
      </div>

      {/* ── HERO ── */}
      <section className="px-5 pt-2 pb-10">
        <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1 text-xs text-red-400 font-semibold mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
1 mês grátis pra todo novo Açougue Embaixador
        </div>

        <h1 className="text-3xl font-black leading-tight mb-4">
          Seu balcão já tem clientes<br />
          querendo churrasco.{' '}
          <span className="text-orange-500">Nós trazemos<br />o churrasqueiro.</span>
        </h1>

        <p className="text-gray-400 text-base leading-relaxed mb-4">
          A Tech Churras conecta clientes que querem fazer churrasco com churrasqueiros profissionais — e o açougue parceiro é quem fornece a carne. O pedido chega no seu app, o churrasqueiro retira no balcão. Você não muda nada na sua operação.
        </p>

        {/* CTA secundário — pra quem já decidiu antes de rolar a página inteira */}
        <a
          href={WHATSAPP}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-sm mb-6 transition-colors"
        >
          💬 Já quero saber mais — falar com o Jota
        </a>

        {/* Argumento central: cliente premium garantido (Kantar 2025: canal açougue -6%, perdendo lares de alta renda) */}
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 mb-2">
          <p className="text-sm text-gray-300 leading-relaxed">
            <b className="text-orange-400">O cliente que mais gasta está sumindo do balcão tradicional.</b> O comércio
            de bairro perdeu 6% de volume no último ano — e quem foi embora foi justamente o cliente de alta renda,
            pro digital e pra quem já vende online. A Tech Churras traz esse cliente de volta pra você: <b className="text-white">pedido
            de churrasco completo, ticket a partir de R$ 350 (podendo passar de R$ 1.000) em carne</b>, direto no seu
            açougue. Um pedido grande por mês já paga a mensalidade.
          </p>
        </div>
        <p className="text-[10px] text-gray-600 mb-6">* Fonte: Kantar 2025 — dado de mercado, não específico da Tech Churras.</p>

        {/* Prova social real — rede já em formação, pré-lançamento */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-orange-400">23</p>
            <p className="text-[10px] text-gray-500 mt-0.5">açougues em negociação em SP</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-orange-400">35</p>
            <p className="text-[10px] text-gray-500 mt-0.5">churrasqueiros já cadastrados, em todas as regiões</p>
          </div>
        </div>

        {/* Quick numbers */}
        <div className="grid grid-cols-3 gap-3 mb-2">
          {[
            { valor: 'R$ 0', label: 'pra entrar' },
            { valor: '10%', label: 'de comissão' },
            { valor: 'PIX', label: 'toda sexta' },
          ].map(n => (
            <div key={n.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
              <p className="text-lg font-black text-orange-400">{n.valor}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{n.label}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 text-center">* Mensalidade R$ 369/mês pra todo açougue parceiro · 1º mês grátis como Açougue Embaixador</p>
      </section>

      {/* ── QUEM ESTÁ POR TRÁS ── */}
      <section className="px-5 pb-8">
        <div className="bg-gradient-to-br from-gray-900 to-gray-900/60 border border-amber-500/30 rounded-2xl p-5">
          <div className="flex gap-4 items-start mb-4">
            <div className="relative shrink-0">
              <img
                src="/jota.jpg"
                alt="Jota Albuquerque"
                className="w-24 h-24 rounded-2xl object-cover object-top border-2 border-amber-500/40"
              />
              <span className="absolute -bottom-1.5 -right-1.5 bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full">✓ REAL</span>
            </div>
            <div>
              <p className="font-black text-white text-xl leading-tight">Jota Albuquerque</p>
              <p className="text-xs text-gray-400 mt-0.5">Fundador & CEO · 13 anos de Jota BBQ Eventos</p>
              <p className="text-sm text-orange-400 font-semibold mt-1">Artistas · Atletas · Marcas</p>
              <div className="flex items-center gap-3 mt-2.5">
                <a
                  href="https://www.instagram.com/jota.grillmaster"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-gray-300 hover:text-orange-400 underline underline-offset-2"
                >
                  📷 @jota.grillmaster
                </a>
                <a
                  href="https://www.linkedin.com/in/jo%C3%A3o-jota-albuquerque-/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-gray-300 hover:text-orange-400 underline underline-offset-2"
                >
                  💼 LinkedIn
                </a>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-gray-500 mb-4">Verifique você mesmo quem está te chamando — perfil real, sem letra miúda.</p>

          {/* Fotos reais — prova visual, sem IA */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <img src="/churrasco-real-1.jpg" alt="Jota Albuquerque preparando um corte nobre" className="w-full h-32 object-cover rounded-xl" />
            <img src="/churrasco-real-2.jpg" alt="Corte com folha de ouro preparado pelo Jota" className="w-full h-32 object-cover rounded-xl" />
          </div>
          <p className="text-[10px] text-gray-600 mb-4">Fotos reais de eventos — nada gerado por IA.</p>

          <div className="bg-black/40 border border-amber-500/20 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🌍</span>
              <div>
                <p className="text-sm font-bold text-white">Bahari of Brazil — Zanzibar, Tanzânia</p>
                <p className="text-xs text-amber-400">Parceria oficial com o Governo de Zanzibar</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Jota é sócio e BBQ Master do Bahari of Brazil, hub culinário criado em PPP com o Ministério de TI e Inovação da Tanzânia. Quem constrói um restaurante com governo africano traz o mesmo padrão de qualidade para os açougues parceiros da Tech Churras.
            </p>
          </div>

          <blockquote className="border-l-2 border-orange-500 pl-4">
            <p className="text-gray-300 text-sm italic leading-relaxed">
              "Já fiz churrasco para artistas e atletas que todo mundo conhece. Mas o churrasco que mais me orgulha vai acontecer no quintal da sua cidade — e o seu açougue vai estar no meio disso."
            </p>
            <p className="text-xs text-orange-400 mt-2">— Jota Albuquerque, fundador</p>
          </blockquote>
        </div>
      </section>

      {/* ── 5 FONTES DE FATURAMENTO ── */}
      <section className="px-5 py-8 border-t border-gray-900">
        <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-1">O que muda no seu faturamento</p>
        <h2 className="font-black text-white text-xl leading-tight mb-6">4 fontes de renda — de hoje até o seu próprio churrasqueiro</h2>
        <div className="space-y-5">
          {[
            {
              n: '1', icon: '🥩',
              titulo: 'Venda de carne recorrente',
              desc: 'Cada evento fechado no app é pedido garantido de carne — ticket a partir de R$ 350, podendo passar de R$ 1.000, direto no seu açougue, toda semana.',
            },
            {
              n: '2', icon: '📸',
              titulo: 'Marketing de graça, todo mês',
              desc: 'Manda uma foto real do balcão ou de um corte e a IA devolve pronto o post com legenda pro seu Instagram. Sem agência, sem custo extra.',
            },
            {
              n: '3', icon: '🥗',
              titulo: 'Acompanhamentos: receita que não existia',
              desc: 'Farofa, vinagrete, arroz, molhos — venda também os acompanhamentos de cada evento e aumente o ticket médio sem custo de aquisição de cliente.',
            },
            {
              n: '4', icon: '👨‍🍳',
              titulo: 'O passo seguinte: seu próprio churrasqueiro',
              desc: 'Com o volume de pedidos crescendo semana a semana, seu açougue pode ter um churrasqueiro chancelado pelo próprio Jota Albuquerque. Carne e mão de obra saindo do mesmo lugar — 100% do faturamento do evento fica com vocês, tudo validado pela Tech Churras.',
              destaque: true,
            },
          ].map(s => (
            <div key={s.n} className={'flex gap-4 items-start rounded-2xl p-4 ' + (s.destaque ? 'bg-amber-500/10 border border-amber-500/30' : '')}>
              <div className={'w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ' + (s.destaque ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-orange-500/10 border border-orange-500/20')}>
                {s.icon}
              </div>
              <div>
                <p className={'font-bold text-sm ' + (s.destaque ? 'text-amber-300' : 'text-white')}>{s.n}. {s.titulo}</p>
                <p className="text-gray-400 text-sm mt-1 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Boca-a-boca — efeito colateral, não é receita direta */}
        <div className="mt-5 flex gap-3 items-start bg-gray-900/60 rounded-xl p-4">
          <span className="text-lg shrink-0">🗣️</span>
          <p className="text-xs text-gray-400 leading-relaxed">
            <b className="text-gray-300">De brinde:</b> todo churrasco que sai do seu açougue vira propaganda ao vivo — o
            convidado pergunta de onde veio a carne, e o nome do seu açougue circula entre quem também vai querer comprar.
          </p>
        </div>

        {/* A conta na prática */}
        <div className="mt-6 bg-green-500/5 border border-green-500/20 rounded-2xl p-5">
          <p className="text-xs text-green-400 font-bold uppercase tracking-wide mb-2">A conta na prática — só com venda de carne</p>
          <p className="text-xs text-gray-500 leading-relaxed mb-4">
            Evento mínimo: 10 convidados × ~450g de proteína por pessoa = 4,5kg de carne.
            Com o kg médio a R$ 75 (mix de cortes), dá <strong className="text-white">~R$ 350 por evento</strong>.
            Você fica com <strong className="text-white">90%</strong> disso — os outros 10% são a comissão da Tech Churras.
            Isso é o piso: eventos maiores que 10 pessoas rendem mais.
          </p>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm min-w-[420px]">
              <thead>
                <tr className="text-gray-500 text-[11px] uppercase tracking-wide">
                  <th className="text-left font-semibold pb-2 pl-1">Eventos/semana</th>
                  <th className="text-left font-semibold pb-2">≈ Eventos/mês</th>
                  <th className="text-right font-semibold pb-2">Fatura em carne</th>
                  <th className="text-right font-semibold pb-2 pr-1">Você recebe (90%)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { semana: 2,  mes: 9,   bruto: 3150,  liquido: 2835 },
                  { semana: 5,  mes: 22,  bruto: 7700,  liquido: 6930 },
                  { semana: 10, mes: 43,  bruto: 15050, liquido: 13545 },
                  { semana: 20, mes: 87,  bruto: 30450, liquido: 27405 },
                  { semana: 30, mes: 130, bruto: 45500, liquido: 40950 },
                  { semana: 40, mes: 173, bruto: 60550, liquido: 54495 },
                ].map((r, i) => (
                  <tr key={r.semana} className={i % 2 === 0 ? 'bg-black/20' : ''}>
                    <td className="py-2 pl-1 font-bold text-white">{r.semana}</td>
                    <td className="py-2 text-gray-400">{r.mes}</td>
                    <td className="py-2 text-right text-gray-300">R$ {r.bruto.toLocaleString('pt-BR')}</td>
                    <td className="py-2 pr-1 text-right font-black text-green-400">R$ {r.liquido.toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-gray-600 mt-3">* Estimativa conservadora, considerando só o evento mínimo (10 convidados) e apenas a venda de carne — não inclui acompanhamentos nem indicações.</p>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section className="px-5 py-8 border-t border-gray-900">
        <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-5">Como funciona</p>
        <div className="space-y-4">
          {[
            {
              n: '1', icon: '📱',
              titulo: 'QR code no seu balcão',
              desc: 'Você recebe um QR code exclusivo. O cliente escaneia, cria conta e já fica vinculado ao seu açougue.',
            },
            {
              n: '2', icon: '📦',
              titulo: 'Pedido chega no seu app',
              desc: 'Quando alguém contratar um churrasqueiro pelo app, o pedido de carne vai direto pro seu dashboard. Você separa os cortes.',
            },
            {
              n: '3', icon: '💸',
              titulo: 'Churrasqueiro retira. Você recebe.',
              desc: 'O churrasqueiro chancelado passa no seu balcão, retira a carne e os acompanhamentos. O repasse cai via PIX toda sexta.',
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

      {/* ── FERRAMENTAS INCLUSAS ── */}
      <section className="px-5 py-8 border-t border-gray-900">
        <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-5">E tem mais — ferramentas inclusas</p>

        <div className="space-y-3 mb-6">
          {[
            { icon: '💰', texto: 'R$ 40 de bônus por cada cliente novo que você indicar via QR code' },
            { icon: '🏅', texto: 'Badge "Açougue Parceiro" verificado no app — diferencial frente a concorrentes' },
            { icon: '📊', texto: 'Dashboard com pedidos, faturamento e previsão de demanda em tempo real' },
          ].map(item => (
            <div key={item.texto} className="flex gap-3 items-start">
              <span className="text-lg shrink-0">{item.icon}</span>
              <p className="text-gray-300 text-sm leading-relaxed">{item.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROGRAMA AÇOUGUE EMBAIXADOR ── */}
      <section className="px-5 py-8 border-t border-gray-900">
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🏅</span>
            <div>
              <p className="font-black text-white">Programa Açougue Embaixador</p>
              <p className="text-xs text-amber-400">Pra todo novo parceiro — pra você ver com seus próprios olhos que funciona</p>
            </div>
          </div>
          <div className="space-y-2.5 mb-5">
            {[
              '1 mês grátis — sem mensalidade',
              'Badge "Açougue Embaixador" no app',
              'Destaque nas buscas no primeiro mês',
              'Acesso direto ao Jota Albuquerque via WhatsApp',
            ].map(b => (
              <div key={b} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-amber-400 mt-0.5 shrink-0">✦</span>
                <span>{b}</span>
              </div>
            ))}
          </div>
          <div className="bg-black/30 rounded-xl p-3 text-center">
            <p className="text-orange-400 font-black text-sm">Você paga R$ 0 no primeiro mês</p>
          </div>
        </div>
      </section>

      {/* ── ZERO RISCO ── */}
      <section className="px-5 py-8 border-t border-gray-900">
        <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-4">Sem risco para você</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '✅', texto: 'Sem taxa de entrada' },
            { icon: '✅', texto: 'Sem contrato de fidelidade' },
            { icon: '✅', texto: 'Sem mudança na operação' },
            { icon: '✅', texto: 'Sem logística de entrega' },
            { icon: '✅', texto: 'Repasse semanal via PIX' },
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
          <span className="text-xl">💬</span>
          Falar com o Jota no WhatsApp
        </a>
        <p className="text-center text-xs text-gray-600 mt-2">
          Responde em até 2 horas · Sem compromisso
        </p>
      </div>

    </div>
  )
}
