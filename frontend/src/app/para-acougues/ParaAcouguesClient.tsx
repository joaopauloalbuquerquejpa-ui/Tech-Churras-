'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, useSpring, useMotionValue, useTransform, animate } from 'framer-motion'
import Link from 'next/link'

const MENSALIDADE = 369
const COMISSAO_RATE = 0.07
const WHATSAPP = 'https://wa.me/5511970593650?text=Ol%C3%A1%2C+quero+ser+parceiro+açougue+do+Tech+Churras'

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
export default function ParaAcouguesClient({ boutiqueCount }: { boutiqueCount: number }) {
  const [clientes, setClientes] = useState(20)
  const [ticket, setTicket] = useState(180)

  const faturamento = clientes * ticket
  const comissao = faturamento * COMISSAO_RATE
  const liquido = faturamento - comissao - MENSALIDADE
  const breakeven = Math.ceil(MENSALIDADE / (ticket * (1 - COMISSAO_RATE)))

  const faq = [
    {
      q: 'Preciso ter site ou app próprio?',
      a: 'Não. A Tech Churras cuida de toda a parte tecnológica — app, pagamento, logística de pedidos. Você só precisa ter internet no balcão para acompanhar os pedidos no dashboard.',
    },
    {
      q: 'Como recebo o dinheiro das vendas?',
      a: 'O repasse é feito semanalmente via PIX diretamente para o CNPJ ou CPF cadastrado, já com a comissão da plataforma descontada automaticamente.',
    },
    {
      q: 'Há contratos ou fidelidade mínima?',
      a: 'Trabalhamos com contratos simples e sem burocracia. Fale com nosso time para mais detalhes sobre as condições de parceria.',
    },
    {
      q: 'Como funciona o repasse semanal?',
      a: 'Toda sexta-feira processamos os pedidos da semana anterior. O valor líquido (faturamento − 7% de comissão) cai na sua conta via PIX até as 18h.',
    },
    {
      q: 'Preciso mudar minha forma de trabalhar?',
      a: 'Quase nada muda. Você continua atendendo normalmente — os pedidos da plataforma chegam no seu dashboard e você prepara os itens como faria para qualquer cliente. O Grillmaster retira no balcão.',
    },
    {
      q: 'O que acontece se eu não tiver um produto em estoque?',
      a: 'Você pode marcar produtos como indisponíveis no dashboard a qualquer momento, e eles deixam de aparecer para novos pedidos até você reativá-los.',
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
                Transforme seu balcão em uma{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
                  máquina de vendas
                </span>{' '}
                recorrentes
              </h1>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Um QR code no seu balcão já conecta seus clientes à plataforma — eles pedem online, você fornece a carne, o Grillmaster retira. Venda mais sem mudar sua operação.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/register?role=boutique"
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold px-8 py-4 rounded-xl text-base transition-all shadow-lg shadow-orange-500/25"
                >
                  🥩 Quero ser parceiro
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
                  '✅ Sem taxa de adesão',
                  '✅ Sem contratos complexos',
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
                  <span className="ml-2 text-xs text-gray-600">Dashboard do Açougue</span>
                </div>
                {/* Stats row */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: 'Pedidos hoje', value: '12', sub: '+3 novos', color: 'text-orange-400' },
                    { label: 'Faturamento mês', value: 'R$ 4.280', sub: '↑ 23% vs mês ant.', color: 'text-green-400' },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-800 rounded-xl p-3">
                      <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                      <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-gray-600">{s.sub}</p>
                    </div>
                  ))}
                </div>
                {/* QR mockup */}
                <div className="bg-gradient-to-br from-orange-500/15 to-amber-500/10 border border-orange-500/30 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shrink-0 text-3xl">
                    ▦
                  </div>
                  <div>
                    <p className="text-xs text-orange-400 font-semibold">Seu QR code exclusivo</p>
                    <p className="text-sm font-bold mt-0.5">techchurras.com.br/r/SEUCODIGO</p>
                    <p className="text-xs text-gray-500 mt-1">Cliente escaneia → 15% desconto no 1º pedido</p>
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
                n: '01', icon: '📱', title: 'QR code no balcão',
                desc: 'Você recebe um QR code exclusivo para imprimir e colocar no seu açougue.',
              },
              {
                n: '02', icon: '🎁', title: 'Cliente se cadastra',
                desc: 'Ele escaneia, cria conta e ganha 15% de desconto no primeiro churrasco.',
              },
              {
                n: '03', icon: '📦', title: 'Pedido chega no app',
                desc: 'Você recebe o pedido no dashboard, separa os cortes. O Grillmaster retira.',
              },
              {
                n: '04', icon: '💰', title: 'Você recebe semanal',
                desc: 'O repasse cai via PIX toda sexta, já com a comissão descontada.',
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
            <h2 className="text-3xl sm:text-4xl font-black">Simule seus ganhos</h2>
            <p className="text-gray-400 mt-3 max-w-lg mx-auto">Ajuste os sliders e veja quanto a plataforma pode gerar para o seu açougue.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Sliders */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 space-y-8">
              <Slider
                label="Clientes indicados por mês"
                value={clientes} min={0} max={100} step={1}
                onChange={setClientes}
                format={v => `${v} clientes`}
              />
              <Slider
                label="Ticket médio por pedido"
                value={ticket} min={50} max={500} step={10}
                onChange={setTicket}
                format={v => `R$ ${v}`}
              />

              {/* Context hints */}
              <div className="pt-4 border-t border-gray-800 space-y-1.5">
                <p className="text-xs text-gray-600 flex gap-2">
                  <span className="text-gray-500">Faturamento bruto:</span>
                  <span className="text-white font-medium">
                    <AnimatedNumber value={faturamento} prefix="R$ " decimals={2} />
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
                  <span className="text-red-400 font-medium">− R$ 369,00</span>
                </p>
              </div>
            </div>

            {/* Result card */}
            <div>
              <div className={`rounded-2xl p-8 border transition-all ${
                liquido > 0
                  ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/30'
                  : 'bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20'
              }`}>
                <p className="text-sm text-gray-400 mb-2">Resultado líquido estimado / mês</p>
                <p className={`text-5xl font-black mb-1 tabular-nums ${liquido > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  <AnimatedNumber value={liquido} prefix="R$ " decimals={2} />
                </p>

                {clientes === 0 ? (
                  <p className="text-sm text-gray-500 mt-3">
                    Arraste o slider para simular suas indicações.
                  </p>
                ) : (
                  <p className="text-sm text-green-400/80 mt-3">
                    💡 Com o ticket médio de <strong>R$ {ticket}</strong>, apenas{' '}
                    <strong><AnimatedNumber value={breakeven} /></strong>{' '}
                    cliente{breakeven === 1 ? '' : 's'}/mês já cobre{breakeven === 1 ? '' : 'm'} a mensalidade.
                    {liquido > 0 ? ' Tudo que vier além disso é lucro extra.' : ' Você ainda não atingiu o ponto de equilíbrio.'}
                  </p>
                )}
              </div>

              {/* ROI chips */}
              {liquido > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">Retorno em</p>
                    <p className="text-2xl font-black text-amber-400">
                      {Math.ceil(MENSALIDADE / (ticket * (1 - COMISSAO_RATE)))}
                    </p>
                    <p className="text-xs text-gray-500">clientes</p>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">ROI estimado</p>
                    <p className="text-2xl font-black text-amber-400">
                      {Math.round((liquido / MENSALIDADE) * 100)}%
                    </p>
                    <p className="text-xs text-gray-500">ao mês</p>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-600 mt-4 leading-relaxed">
                * Simulação estimada. Valores reais dependem do volume de pedidos efetivados via plataforma.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRANSPARÊNCIA DE CUSTOS ───────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-gray-950/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest text-orange-400 uppercase mb-3">Sem surpresas</p>
            <h2 className="text-3xl sm:text-4xl font-black">Transparência total de custos</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 mb-10">
            {[
              {
                label: 'Mensalidade',
                value: 'R$ 369/mês',
                sub: 'Cobrança mensal recorrente',
                icon: '📅',
                color: 'border-orange-500/40',
              },
              {
                label: 'Comissão',
                value: '7%',
                sub: 'Sobre vendas via plataforma',
                icon: '📊',
                color: 'border-amber-500/40',
              },
              {
                label: 'Taxa de adesão',
                value: 'R$ 0',
                sub: 'Grátis para entrar',
                icon: '🎁',
                color: 'border-green-500/40',
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
            <h3 className="font-bold text-lg mb-5 text-white">O que está incluído na mensalidade</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                '📈 Dashboard com pedidos e faturamento em tempo real',
                '🔮 Previsão de demanda baseada em histórico',
                '📱 QR code exclusivo de indicação para o balcão',
                '🏆 Ranking de parceiros — destaque no app para os mais ativos',
                '💬 Suporte via WhatsApp em horário comercial',
                '📦 Gestão de catálogo de produtos com preços',
                '💸 Repasse semanal automático via PIX',
                '📷 Página de perfil do açougue no app',
                '🤖 Tech Churras IA — seus clientes planejam o evento com a IA antes de comprar, e o catálogo do seu açougue aparece automaticamente nas sugestões',
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
              <span className="text-3xl font-black text-orange-400">{boutiqueCount}</span>
              <span className="text-sm text-gray-400">açougues já fazem parte do Tech Churras</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black">Nossos parceiros</h2>
          </div>

          {/* Placeholder cards — populável futuramente */}
          <div className="grid sm:grid-cols-3 gap-5 mb-10">
            {[
              {
                name: 'Açougue Premium SP',
                city: 'São Paulo, SP',
                quote: '"O QR code virou rotina aqui no balcão. Os clientes já pedem pelo app sem precisar ligar."',
                since: 'Parceiro desde 2026',
              },
              {
                name: 'Casa de Carnes Bom Sabor',
                city: 'São Paulo, SP',
                quote: '"O repasse semanal é pontual e a transparência do dashboard é incrível. Zero surpresa."',
                since: 'Parceiro desde 2026',
              },
              {
                name: 'Seu Açougue aqui',
                city: 'Sua cidade, SP',
                quote: '"Poderia ser o depoimento do seu negócio. Entre e faça parte."',
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
                    🥩
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
              Pronto para transformar seu balcão em um canal digital?
            </h2>
            <p className="text-gray-400 mb-10 text-lg">
              Cadastre seu açougue gratuitamente. A plataforma começa a gerar resultado no primeiro mês.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register?role=boutique"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold px-10 py-4 rounded-xl text-lg transition-all shadow-xl shadow-orange-500/25"
              >
                🥩 Quero ser parceiro
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
              Sem taxa de adesão · Sem contratos complexos
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
