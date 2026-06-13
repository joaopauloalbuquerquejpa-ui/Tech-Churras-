'use client'
import { useState, useEffect, useRef } from 'react'
import { animate } from 'framer-motion'
import Link from 'next/link'

const COMISSAO_RATE = 0.07
const WHATSAPP = 'https://wa.me/5511970593650?text=Ol%C3%A1%2C+quero+ser+churrasqueiro+parceiro+do+Tech+Churras'

// ── Animated number counter ──────────────────────────────────────────
function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0 }: {
  value: number; prefix?: string; suffix?: string; decimals?: number
}) {
  const [display, setDisplay] = useState(value)
  const prevRef = useRef(value)

  useEffect(() => {
    const from = prevRef.current
    prevRef.current = value
    const controls = animate(from, value, {
      duration: 0.6,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(v),
    })
    return controls.stop
  }, [value])

  return (
    <span>
      {prefix}{display.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
    </span>
  )
}

// ── Slider ────────────────────────────────────────────────────────────
function Slider({ label, value, min, max, step, onChange, format }: {
  label: string; value: number; min: number; max: number; step: number
  onChange: (v: number) => void; format: (v: number) => string
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{label}</span>
        <span className="text-sm font-bold text-orange-400">{format(value)}</span>
      </div>
      <div className="relative">
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #f97316 ${pct}%, #374151 ${pct}%)`,
          }}
        />
      </div>
    </div>
  )
}

// ── FAQ item ──────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left text-white font-medium hover:bg-white/5 transition-colors"
      >
        <span>{q}</span>
        <span className={`text-orange-400 text-lg transition-transform duration-200 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      {open && (
        <div className="px-5 pb-4 text-gray-400 text-sm leading-relaxed border-t border-gray-800">
          {a}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────
export default function ParaChurrasqueirosClient({ grillmasterCount }: { grillmasterCount: number }) {
  const [precoHora, setPrecoHora] = useState(150)
  const [horasPorEvento, setHorasPorEvento] = useState(4)
  const [eventosMes, setEventosMes] = useState(6)

  const faturamentoBruto = precoHora * horasPorEvento * eventosMes
  const comissao = faturamentoBruto * COMISSAO_RATE
  const liquido = faturamentoBruto * (1 - COMISSAO_RATE)
  const ticketLiquido = precoHora * horasPorEvento * (1 - COMISSAO_RATE)

  const faq = [
    {
      q: 'Preciso ter experiência profissional para entrar?',
      a: 'Você precisa saber fazer um bom churrasco e ter disposição para atender com qualidade. Nossa equipe analisa seu perfil e, quando aprovado, você começa a receber pedidos. Churrasqueiros com fotos e avaliações se destacam mais.',
    },
    {
      q: 'Qual é o custo para entrar na plataforma?',
      a: 'Zero. Não há mensalidade, taxa de adesão ou qualquer custo fixo. A Tech Churras cobra apenas 7% sobre o valor da sua mão de obra em cada evento realizado — ou seja, você só paga quando você ganha.',
    },
    {
      q: 'Como funciona o pagamento?',
      a: 'Toda sexta-feira processamos os pedidos da semana anterior. O valor líquido (93% da sua mão de obra) cai diretamente no seu PIX até as 18h. Você cadastra a chave PIX no seu perfil e nunca precisa cobrar nada.',
    },
    {
      q: 'Posso recusar pedidos?',
      a: 'Sim. Você define a disponibilidade da sua agenda pelo app. Quando estiver disponível, aceita ou recusa pedidos. Churrasqueiros com alta taxa de aceite ganham mais visibilidade na plataforma.',
    },
    {
      q: 'O açougue parceiro inclui a carne?',
      a: 'Sim. Quando o cliente pede junto com um açougue parceiro, a carne já fica separada para você retirar. Você não precisa comprar, transportar ou negociar — é só retirar e ir para o evento.',
    },
    {
      q: 'O que preciso levar para o evento?',
      a: 'Equipamento de churrasqueiro — grelha, faca, avental, etc. Você pode marcar no seu perfil se leva o equipamento ou não, e isso é exibido para o cliente antes de contratar. A carne e insumos são responsabilidade do açougue ou do cliente.',
    },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* ── NAV ──────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 backdrop-blur-xl bg-black/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-black text-white">
            Tech <span className="text-orange-500">Churras</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">
              Entrar
            </Link>
            <a
              href={WHATSAPP}
              target="_blank" rel="noopener noreferrer"
              className="text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 px-4 sm:px-6 overflow-hidden">
        {/* BG glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(249,115,22,0.12) 0%, transparent 70%)' }} />
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-1.5 text-xs font-semibold text-orange-400 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            Cidade Piloto — São Paulo · Vagas limitadas
          </div>

          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-5">
                Transforme seu talento no churrasco em{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
                  renda mensal recorrente
                </span>
              </h1>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Receba pedidos pelo app, gerencie sua agenda e ganhe 93% de cada evento direto no seu PIX toda semana. Sem mensalidade, sem burocracia.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/register?role=grillmaster"
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold px-8 py-4 rounded-xl text-base transition-all shadow-lg shadow-orange-500/25"
                >
                  🔥 Quero ser churrasqueiro parceiro
                </Link>
                <a
                  href={WHATSAPP}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 border border-gray-700 hover:border-gray-500 text-white font-medium px-8 py-4 rounded-xl text-base transition-colors"
                >
                  💬 Falar no WhatsApp
                </a>
              </div>

              {/* Trust row */}
              <div className="flex flex-wrap gap-4 mt-6">
                {[
                  '✅ Zero mensalidade',
                  '✅ 93% de cada pedido',
                  '✅ PIX toda sexta',
                ].map(t => (
                  <span key={t} className="text-xs text-gray-500">{t}</span>
                ))}
              </div>
            </div>

            {/* Dashboard mockup */}
            <div className="relative">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  <span className="ml-2 text-xs text-gray-600">Painel do Churrasqueiro</span>
                </div>
                {/* Stats row */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: 'Renda este mês', value: 'R$ 3.348', sub: '6 eventos realizados', color: 'text-green-400' },
                    { label: 'Avaliação média', value: '4,9 ★', sub: '23 avaliações recebidas', color: 'text-amber-400' },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-800 rounded-xl p-3">
                      <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                      <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-gray-600">{s.sub}</p>
                    </div>
                  ))}
                </div>
                {/* Próximo evento */}
                <div className="bg-gradient-to-br from-orange-500/15 to-amber-500/10 border border-orange-500/30 rounded-xl p-4">
                  <p className="text-xs text-orange-400 font-semibold mb-2">Próximo evento</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">Churrasco familiar · 10 pessoas</p>
                      <p className="text-xs text-gray-500 mt-0.5">Sáb, 15 jun · 4h · R$ 600</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-green-400 font-semibold">Você recebe</p>
                      <p className="text-lg font-black text-green-400">R$ 558</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Glow */}
              <div className="absolute -inset-4 rounded-3xl pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at center, rgba(249,115,22,0.06) 0%, transparent 70%)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ─────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-gray-950/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest text-orange-400 uppercase mb-3">Simples assim</p>
            <h2 className="text-3xl sm:text-4xl font-black">Como funciona</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                n: '01', icon: '📝', title: 'Crie seu perfil',
                desc: 'Cadastre-se, adicione fotos, defina seu preço por hora e suas especialidades de churrasco.',
              },
              {
                n: '02', icon: '📅', title: 'Gerencie sua agenda',
                desc: 'Marque os dias disponíveis no app. Você recebe pedidos apenas quando estiver livre.',
              },
              {
                n: '03', icon: '🔥', title: 'Faça o evento',
                desc: 'Apareça no local, pegue os insumos do açougue parceiro e entregue um churrasco incrível.',
              },
              {
                n: '04', icon: '💸', title: 'Receba via PIX',
                desc: '93% do valor cai no seu PIX toda sexta-feira, sem precisar cobrar ninguém.',
              },
            ].map((s, i) => (
              <div key={i} className="relative bg-gray-900 border border-gray-800 hover:border-orange-500/30 rounded-2xl p-6 transition-colors">
                <span className="absolute top-4 right-4 text-xs font-black text-gray-800">{s.n}</span>
                <div className="text-3xl mb-4">{s.icon}</div>
                <h3 className="font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SIMULADOR ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest text-orange-400 uppercase mb-3">Calculadora</p>
            <h2 className="text-3xl sm:text-4xl font-black">Simule sua renda mensal</h2>
            <p className="text-gray-400 mt-3 max-w-lg mx-auto">Ajuste os sliders e veja quanto você pode ganhar na plataforma.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Sliders */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 space-y-8">
              <Slider
                label="Seu preço por hora"
                value={precoHora} min={80} max={400} step={10}
                onChange={setPrecoHora}
                format={v => `R$ ${v}/h`}
              />
              <Slider
                label="Horas por evento"
                value={horasPorEvento} min={2} max={8} step={1}
                onChange={setHorasPorEvento}
                format={v => `${v}h`}
              />
              <Slider
                label="Eventos por mês"
                value={eventosMes} min={1} max={20} step={1}
                onChange={setEventosMes}
                format={v => `${v} eventos`}
              />

              {/* Context hints */}
              <div className="pt-4 border-t border-gray-800 space-y-1.5">
                <p className="text-xs text-gray-600 flex gap-2">
                  <span className="text-gray-500">Valor bruto por evento:</span>
                  <span className="text-white font-medium">
                    <AnimatedNumber value={precoHora * horasPorEvento} prefix="R$ " decimals={2} />
                  </span>
                </p>
                <p className="text-xs text-gray-600 flex gap-2">
                  <span className="text-gray-500">Faturamento bruto/mês:</span>
                  <span className="text-white font-medium">
                    <AnimatedNumber value={faturamentoBruto} prefix="R$ " decimals={2} />
                  </span>
                </p>
                <p className="text-xs text-gray-600 flex gap-2">
                  <span className="text-gray-500">Comissão plataforma (7%):</span>
                  <span className="text-red-400 font-medium">
                    − <AnimatedNumber value={comissao} prefix="R$ " decimals={2} />
                  </span>
                </p>
                <p className="text-xs text-gray-600 flex gap-2">
                  <span className="text-gray-500">Mensalidade:</span>
                  <span className="text-green-400 font-medium">R$ 0,00</span>
                </p>
              </div>
            </div>

            {/* Result card */}
            <div>
              <div className="rounded-2xl p-8 border bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/30">
                <p className="text-sm text-gray-400 mb-2">Você recebe por mês</p>
                <p className="text-5xl font-black mb-1 tabular-nums text-green-400">
                  <AnimatedNumber value={liquido} prefix="R$ " decimals={2} />
                </p>
                <p className="text-sm text-green-400/80 mt-3">
                  🎉 <strong>{eventosMes} evento{eventosMes > 1 ? 's' : ''}/mês</strong> a <strong>R$ {(ticketLiquido).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> líquido cada.
                </p>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  💡 Sem custo fixo — você só repassa os 7% quando realiza um evento. Mês sem evento = zero custo.
                </p>
              </div>

              {/* Chips */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Líquido por evento</p>
                  <p className="text-2xl font-black text-amber-400">
                    <AnimatedNumber value={ticketLiquido} prefix="R$ " decimals={0} />
                  </p>
                  <p className="text-xs text-gray-500">já descontada a comissão</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Por hora trabalhada</p>
                  <p className="text-2xl font-black text-amber-400">
                    <AnimatedNumber value={precoHora * (1 - COMISSAO_RATE)} prefix="R$ " decimals={0} />
                  </p>
                  <p className="text-xs text-gray-500">líquido no seu bolso</p>
                </div>
              </div>

              <p className="text-xs text-gray-600 mt-4 leading-relaxed">
                * Simulação estimada. Valores reais dependem dos pedidos confirmados e realizados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── EXEMPLOS DE GANHOS ───────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-gray-950/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest text-orange-400 uppercase mb-3">Cenários reais</p>
            <h2 className="text-3xl sm:text-4xl font-black">Exemplos de ganhos</h2>
            <p className="text-gray-400 mt-3 max-w-lg mx-auto">Veja quanto churrasqueiros em diferentes estágios podem ganhar por mês.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                perfil: 'Churrasqueiro de fim de semana',
                tag: 'Iniciante',
                tagColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
                icon: '🌱',
                detalhes: '4 eventos/mês · R$ 80/h · 4h por evento',
                bruto: 1280,
                comissao: 89.60,
                liquido: 1190.40,
                porEvento: 297.60,
              },
              {
                perfil: 'Churrasqueiro regular',
                tag: 'Intermediário',
                tagColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                icon: '🔥',
                detalhes: '8 eventos/mês · R$ 100/h · 5h por evento',
                bruto: 4000,
                comissao: 280,
                liquido: 3720,
                porEvento: 465,
                destaque: true,
              },
              {
                perfil: 'Churrasqueiro full-time',
                tag: 'Profissional',
                tagColor: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
                icon: '👑',
                detalhes: '15 eventos/mês · R$ 150/h · 6h por evento',
                bruto: 13500,
                comissao: 945,
                liquido: 12555,
                porEvento: 837,
              },
            ].map((c, i) => (
              <div
                key={i}
                className={`relative rounded-2xl p-6 border transition-colors ${
                  c.destaque
                    ? 'border-orange-500/40 bg-gradient-to-br from-orange-500/10 to-amber-500/5'
                    : 'border-gray-800 bg-gray-900'
                }`}
              >
                {c.destaque && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    Mais popular
                  </div>
                )}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{c.icon}</span>
                  <span className={`text-xs font-semibold border rounded-full px-2.5 py-0.5 ${c.tagColor}`}>{c.tag}</span>
                </div>
                <h3 className="font-bold text-white mb-1">{c.perfil}</h3>
                <p className="text-xs text-gray-500 mb-5">{c.detalhes}</p>

                <div className="space-y-2 text-sm mb-5">
                  <div className="flex justify-between text-gray-400">
                    <span>Receita bruta</span>
                    <span className="text-white font-medium">R$ {c.bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Comissão (7%)</span>
                    <span className="text-red-400">− R$ {c.comissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Mensalidade</span>
                    <span className="text-green-400">R$ 0,00</span>
                  </div>
                  <div className="border-t border-gray-700 pt-2 flex justify-between font-bold">
                    <span className="text-white">Você recebe/mês</span>
                    <span className="text-green-400 text-base">R$ {c.liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="bg-black/30 rounded-xl px-4 py-2.5 text-center">
                  <p className="text-xs text-gray-500">Por evento</p>
                  <p className="text-lg font-black text-amber-400">R$ {c.porEvento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 text-center mt-6">* Valores estimados. Resultados reais dependem dos eventos confirmados e realizados.</p>
        </div>
      </section>

      {/* ── POR QUE A TECH CHURRAS ────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-gray-950/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest text-orange-400 uppercase mb-3">Sem surpresas</p>
            <h2 className="text-3xl sm:text-4xl font-black">Modelo 100% justo</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 mb-10">
            {[
              {
                label: 'Mensalidade',
                value: 'R$ 0',
                sub: 'Sempre grátis para entrar',
                icon: '🎁',
                color: 'border-green-500/40',
              },
              {
                label: 'Comissão',
                value: '7%',
                sub: 'Só quando você ganha',
                icon: '📊',
                color: 'border-amber-500/40',
              },
              {
                label: 'Você recebe',
                value: '93%',
                sub: 'De cada pedido concluído',
                icon: '💸',
                color: 'border-orange-500/40',
              },
            ].map(c => (
              <div key={c.label} className={`bg-gray-900 border ${c.color} rounded-2xl p-6 text-center`}>
                <div className="text-3xl mb-3">{c.icon}</div>
                <p className="text-3xl font-black mb-1">{c.value}</p>
                <p className="text-sm font-semibold text-gray-300">{c.label}</p>
                <p className="text-xs text-gray-500 mt-1">{c.sub}</p>
              </div>
            ))}
          </div>

          {/* Inclusos */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8">
            <h3 className="font-bold text-lg mb-5 text-white">O que você tem acesso gratuitamente</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                '📱 App para gerenciar pedidos e agenda em tempo real',
                '⭐ Sistema de avaliações — construa sua reputação',
                '📅 Agenda digital com bloqueio de datas ocupadas',
                '💬 Chat direto com o cliente antes do evento',
                '💸 Repasse semanal automático via PIX toda sexta',
                '🥩 Integração com açougues parceiros — carne pronta para retirar',
                '📷 Página de perfil pública com fotos e especialidades',
                '🔔 Notificações de novos pedidos na sua área',
                '🤖 Tech Churras IA — o cliente chega até você com o evento já planejado, aumentando a conversão do seu perfil',
              ].map(item => (
                <div key={item} className="flex items-start gap-3 text-sm text-gray-300">
                  <span className="shrink-0">{item.slice(0, 2)}</span>
                  <span>{item.slice(3)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PROVA SOCIAL ──────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-3 bg-orange-500/10 border border-orange-500/20 rounded-full px-6 py-3 mb-6">
              <span className="text-3xl font-black text-orange-400">{grillmasterCount}</span>
              <span className="text-sm text-gray-400">churrasqueiros já fazem parte do Tech Churras</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black">Quem já está na plataforma</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-5 mb-10">
            {[
              {
                name: 'Carlos Mendes',
                city: 'São Paulo, SP',
                quote: '"Antes pegava clientes só por indicação. Hoje tenho agenda cheia pelo app e recebo sem precisar cobrar ninguém."',
                since: 'Parceiro desde 2026',
              },
              {
                name: 'Ricardo Oliveira',
                city: 'São Paulo, SP',
                quote: '"O sistema de avaliação me ajudou a construir reputação rápido. Em 3 meses já estava entre os mais bem avaliados."',
                since: 'Parceiro desde 2026',
              },
              {
                name: 'Seu perfil aqui',
                city: 'Sua cidade, SP',
                quote: '"Poderia ser o seu depoimento. Cadastre-se e comece a receber pedidos."',
                since: 'Em breve',
                isPlaceholder: true,
              },
            ].map((p, i) => (
              <div
                key={i}
                className={`rounded-2xl p-6 border ${
                  (p as any).isPlaceholder
                    ? 'border-dashed border-orange-500/30 bg-orange-500/5'
                    : 'border-gray-800 bg-gray-900'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                    (p as any).isPlaceholder ? 'bg-orange-500/20' : 'bg-gray-800'
                  }`}>
                    🔥
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.city}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 italic leading-relaxed mb-3">{p.quote}</p>
                <p className="text-xs text-orange-400">{p.since}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-gray-950/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest text-orange-400 uppercase mb-3">Dúvidas</p>
            <h2 className="text-3xl sm:text-4xl font-black">Perguntas frequentes</h2>
          </div>
          <div className="space-y-3">
            {faq.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 -mx-8 -my-4 rounded-3xl pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at center, rgba(249,115,22,0.08) 0%, transparent 70%)' }} />
            <p className="text-xs font-semibold tracking-widest text-orange-400 uppercase mb-4">Seja parceiro</p>
            <h2 className="text-3xl sm:text-4xl font-black mb-4 leading-tight">
              Pronto para transformar seu talento em renda recorrente?
            </h2>
            <p className="text-gray-400 mb-10 text-lg">
              Cadastre-se gratuitamente. Sem mensalidade. Você começa a receber pedidos assim que seu perfil for aprovado.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register?role=grillmaster"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold px-10 py-4 rounded-xl text-lg transition-all shadow-xl shadow-orange-500/25"
              >
                🔥 Quero ser churrasqueiro parceiro
              </Link>
              <a
                href={WHATSAPP}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 border border-gray-700 hover:border-orange-500/50 hover:bg-orange-500/5 text-white font-medium px-10 py-4 rounded-xl text-lg transition-colors"
              >
                💬 Falar no WhatsApp
              </a>
            </div>
            <p className="text-sm text-gray-600 mt-6">
              Zero mensalidade · 93% de cada pedido · PIX toda sexta
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-900 px-4 sm:px-6 py-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="font-black text-white">
            Tech <span className="text-orange-500">Churras</span>
          </Link>
          <div className="flex gap-6 text-sm text-gray-600">
            <Link href="/termos-de-uso" className="hover:text-gray-400 transition-colors">Termos de Uso</Link>
            <Link href="/politica-de-privacidade" className="hover:text-gray-400 transition-colors">Privacidade</Link>
            <Link href="/dashboard" className="hover:text-gray-400 transition-colors">App</Link>
          </div>
          <p className="text-xs text-gray-700">© 2026 Tech Churras</p>
        </div>
      </footer>
    </div>
  )
}
