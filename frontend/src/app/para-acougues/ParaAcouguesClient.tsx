'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, useSpring, useMotionValue, useTransform, animate } from 'framer-motion'
import Link from 'next/link'
import { Events } from '@/lib/analytics'

const MENSALIDADE = 369
const COMISSAO_RATE = 0.07
const BONUS_POR_CLIENTE = 40
const WHATSAPP = 'https://wa.me/5511970593650?text=Ol%C3%A1%2C+quero+ser+parceiro+açougue+do+Tech+Churras'
const FUNDADOR_VAGAS = 3

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

  useEffect(() => {
    Events.boutiquePageView()
  }, [])

  const faturamento = clientes * ticket
  const comissao = faturamento * COMISSAO_RATE
  const bonus = clientes * BONUS_POR_CLIENTE
  const liquido = faturamento - comissao + bonus - MENSALIDADE
  const breakeven = Math.ceil(MENSALIDADE / (ticket * (1 - COMISSAO_RATE) + BONUS_POR_CLIENTE))

  const faq = [
    {
      q: 'Como funciona o bônus de R$ 40 por cliente?',
      a: 'Cada açougue parceiro recebe um QR code e link exclusivo. Quando um cliente novo se cadastra pela sua indicação e faz o primeiro pedido, você recebe automaticamente R$ 40 no seu repasse semanal via PIX — sem precisar fazer nada além de divulgar seu QR code. Não há limite de clientes que você pode indicar.',
    },
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
              {/* Prova concreta antes do headline */}
              <div className="inline-flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-2xl px-5 py-3 mb-6">
                <div>
                  <p className="text-2xl font-black text-orange-400 leading-none">R$ 3.779<span className="text-base font-bold text-orange-300">/mês</span></p>
                  <p className="text-xs text-gray-500 mt-0.5">renda extra com 20 pedidos · cálculo transparente abaixo</p>
                </div>
                <div className="w-px h-10 bg-gray-800" />
                <div>
                  <p className="text-sm font-bold text-white leading-none">R$ 15 bi</p>
                  <p className="text-xs text-gray-500 mt-0.5">mercado de churrasco/ano</p>
                </div>
              </div>

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
                  onClick={() => Events.boutiqueInterest('para-acougues-hero-cta')}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold px-8 py-4 rounded-xl text-base transition-all shadow-lg shadow-orange-500/25"
                >
                  🥩 Quero ser parceiro
                </Link>
                <a
                  href={WHATSAPP}
                  target="_blank" rel="noopener noreferrer"
                  onClick={() => Events.clickWhatsApp('para-acougues-hero')}
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

              {/* Parceiro Fundador box */}
              <div className="mt-8 bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/30 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🏅</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="font-black text-white text-sm">Pacote Parceiro Fundador</p>
                      <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                        {FUNDADOR_VAGAS} vagas
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">Primeiros {FUNDADOR_VAGAS} açougues parceiros em São Paulo:</p>
                    <div className="space-y-1.5">
                      {[
                        '3 meses sem mensalidade (economia de R$ 1.107)',
                        'Badge "Açougue Fundador" permanente na plataforma',
                        'Destaque nas buscas por 6 meses',
                        'Acesso direto ao fundador via WhatsApp',
                      ].map(b => (
                        <div key={b} className="flex items-start gap-2 text-xs text-gray-300">
                          <span className="text-amber-400 mt-0.5">✦</span>
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                    <a
                      href={`https://wa.me/5511970593650?text=${encodeURIComponent('Olá Jota! Quero uma das vagas de Parceiro Fundador do açougue na Tech Churras.')}`}
                      target="_blank" rel="noopener noreferrer"
                      onClick={() => Events.boutiqueFounderClick('para-acougues-hero')}
                      className="mt-4 inline-block text-xs bg-amber-500 hover:bg-amber-400 text-black font-black px-4 py-2 rounded-lg transition-colors"
                    >
                      Quero uma vaga de Fundador →
                    </a>
                  </div>
                </div>
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

      {/* ── PROGRAMA DE INDICAÇÃO ────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-5 py-2 text-sm font-bold text-green-400 mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Novidade — Programa de Indicação
            </div>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              Ganhe{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                R$ 40
              </span>{' '}
              por cada cliente que você converter
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Você já tem muitos clientes passando pelo seu balcão todo mês. Com o seu QR code exclusivo, cada um que virar cliente da Tech Churras vale{' '}
              <strong className="text-white">R$ 40 direto no seu repasse semanal.</strong>
            </p>
          </div>

          {/* Como funciona o bônus */}
          <div className="grid md:grid-cols-3 gap-5 mb-12">
            {[
              {
                step: '1', icon: '📲',
                title: 'QR Code no balcão',
                desc: 'Você recebe um link e QR code exclusivo. Coloca no balcão, no WhatsApp, no Instagram — onde quiser.',
                color: 'border-green-500/30 bg-green-500/5',
              },
              {
                step: '2', icon: '👤',
                title: 'Cliente se cadastra',
                desc: 'O cliente escaneia, cria conta e faz o primeiro pedido. Automaticamente fica vinculado ao seu açougue.',
                color: 'border-green-500/30 bg-green-500/5',
              },
              {
                step: '3', icon: '💸',
                title: 'R$ 40 cai no repasse',
                desc: 'No mesmo repasse semanal via PIX, os R$ 40 de bônus aparecem automaticamente. Sem burocracia.',
                color: 'border-green-500/30 bg-green-500/5',
              },
            ].map(s => (
              <div key={s.step} className={`border ${s.color} rounded-2xl p-6 text-center`}>
                <div className="text-4xl mb-3">{s.icon}</div>
                <div className="w-7 h-7 rounded-full bg-green-500 text-black text-xs font-black flex items-center justify-center mx-auto mb-3">{s.step}</div>
                <h3 className="font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Calculadora de bônus */}
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/30 rounded-2xl p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-xs font-bold text-green-400 uppercase tracking-widest mb-3">Potencial de bônus</p>
                <h3 className="text-2xl font-black text-white mb-6">Quanto você pode ganhar por mês?</h3>
                <div className="space-y-4">
                  {[
                    { clientes: 5,   label: 'Começo (5 clientes/mês)' },
                    { clientes: 20,  label: 'Crescendo (20 clientes/mês)' },
                    { clientes: 50,  label: 'Parceiro ativo (50 clientes/mês)' },
                    { clientes: 100, label: 'Referência da cidade (100/mês)' },
                  ].map(r => (
                    <div key={r.clientes} className="flex items-center justify-between gap-4">
                      <span className="text-sm text-gray-400 flex-1">{r.label}</span>
                      <span className="font-black text-green-400 text-lg whitespace-nowrap">
                        + R$ {(r.clientes * BONUS_POR_CLIENTE).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-black/40 rounded-2xl p-6 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Sem limite de ganhos</p>
                <p className="text-6xl font-black text-green-400 mb-2">∞</p>
                <p className="text-white font-bold mb-4">Quanto mais converte, mais ganha</p>
                <div className="space-y-2 text-sm text-gray-400 text-left">
                  <p className="flex items-center gap-2"><span className="text-green-400">✓</span> Pago junto ao repasse semanal via PIX</p>
                  <p className="flex items-center gap-2"><span className="text-green-400">✓</span> Sem limite mensal de bônus</p>
                  <p className="flex items-center gap-2"><span className="text-green-400">✓</span> Rastreado automaticamente pelo app</p>
                  <p className="flex items-center gap-2"><span className="text-green-400">✓</span> Você vê cada bônus no dashboard</p>
                </div>
                <a
                  href={WHATSAPP}
                  target="_blank" rel="noopener noreferrer"
                  onClick={() => Events.boutiqueInterest('para-acougues-qrcode')}
                  className="mt-5 inline-block bg-green-500 hover:bg-green-400 text-black font-black px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  Quero meu QR code exclusivo →
                </a>
              </div>
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
                desc: 'Você recebe o pedido, separa os cortes e os acompanhamentos prontos. O Grillmaster retira tudo em uma única visita.',
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

      {/* ── ACOMPANHAMENTOS ───────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-green-400 uppercase mb-3">Nova frente de receita</p>
            <h2 className="text-3xl sm:text-4xl font-black">Acompanhamentos: faturamento que não existia</h2>
            <p className="text-gray-400 mt-3 max-w-2xl mx-auto">
              No dia do evento, o churrasqueiro passa no seu balcão para retirar a carne.
              Agora ele leva também os acompanhamentos prontos — pão de alho, farofa, vinagrete, molhos.
              Você prepara, ele carrega. Zero entrega, zero logística extra para você.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-green-500/5 to-gray-900 border border-green-500/20 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-green-500/10">
                <p className="font-bold text-green-400">Acompanhamentos do churrasco completo</p>
                <p className="text-xs text-gray-500 mt-0.5">Você cadastra, o cliente escolhe na hora do pedido</p>
              </div>
              <div className="divide-y divide-gray-800/60">
                {[
                  { nome: 'Pão de alho artesanal', ticket: 'R$ 3–5/un', tag: 'Alta margem' },
                  { nome: 'Farofa de manteiga', ticket: 'R$ 25–40/porção', tag: 'Simples de preparar' },
                  { nome: 'Vinagrete fresco', ticket: 'R$ 20–35/porção', tag: 'Zero desperdício' },
                  { nome: 'Queijo coalho', ticket: 'R$ 30–50/porção', tag: 'Produto premium' },
                  { nome: 'Molho barbecue artesanal', ticket: 'R$ 15–25/porção', tag: 'Alta percepção de valor' },
                  { nome: 'Maionese temperada', ticket: 'R$ 20–35/porção', tag: 'Custo mínimo' },
                ].map(item => (
                  <div key={item.nome} className="flex items-center justify-between px-6 py-3.5">
                    <div>
                      <p className="text-sm text-white font-medium">{item.nome}</p>
                      <p className="text-xs text-green-500/60">{item.tag}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-300 shrink-0 ml-4">{item.ticket}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <p className="font-bold text-white mb-1">Potencial de receita só com acompanhamentos</p>
                <p className="text-xs text-gray-500 mb-5">Acima da venda de carnes. Estimativa por volume de eventos/mês.</p>
                <div className="space-y-4">
                  {[
                    { eventos: 5,  acomp: 80,  label: 'Começo' },
                    { eventos: 15, acomp: 100, label: 'Parceiro Ativo' },
                    { eventos: 30, acomp: 130, label: 'Referência SP' },
                    { eventos: 60, acomp: 160, label: 'Escala Total' },
                  ].map(e => {
                    const total = e.eventos * e.acomp
                    const barPct = Math.round((total / (60 * 160)) * 100)
                    return (
                      <div key={e.label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-gray-400">{e.label} · {e.eventos} eventos/mês</span>
                          <span className="text-sm font-black text-green-400">+ R$ {total.toLocaleString('pt-BR')}/mês</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2">
                          <div className="bg-gradient-to-r from-green-600 to-green-400 h-2 rounded-full transition-all" style={{ width: `${barPct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-700 mt-4">* Estimativa. Valores sujeitos ao volume real de pedidos.</p>
              </div>

              <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-5">
                <p className="text-sm font-bold text-orange-300 mb-2">Zero trabalho extra para o churrasqueiro</p>
                <p className="text-sm text-gray-400 leading-relaxed">
                  O churrasqueiro chancelado passa no seu balcão para retirar a carne e leva os acompanhamentos já prontos — tudo em uma única parada. Sem entrega, sem logística extra para você.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 FRENTES ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-orange-400 uppercase mb-3">Três frentes de faturamento</p>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">Seu açougue vira uma máquina de vendas</h2>
            <p className="text-gray-400 max-w-xl mx-auto text-sm">
              A maioria dos parceiros só pensa em clientes que chegam pelo app. Mas a maior oportunidade está dentro do seu próprio estabelecimento — e no futuro que cresce junto com você.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mb-10">
            {[
              {
                n: '1', icon: '📱',
                badge: 'Começa no dia 1', badgeCor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                cor: 'border-orange-500/30',
                titulo: 'Clientes da Tech Churras',
                desc: 'Quem contrata um churrasqueiro pelo app escolhe seus cortes automaticamente. Zero marketing, zero esforço — o cliente simplesmente aparece.',
                num: '+60', numLabel: 'novos eventos/mês possíveis',
              },
              {
                n: '2', icon: '🏪',
                badge: 'QR Code no balcão', badgeCor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                cor: 'border-amber-500/30',
                titulo: 'Seus clientes do balcão',
                desc: 'Quem entra comprando carne para um evento já fez 50% do caminho. Um QR no balcão converte a visita em pedido completo — churrasqueiro, carne e acompanhamentos.',
                num: '50%', numLabel: 'do trabalho já foi feito',
              },
              {
                n: '3', icon: '👨‍🍳',
                badge: 'Futuro próximo', badgeCor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                cor: 'border-blue-500/30',
                titulo: 'Seus próprios churrasqueiros',
                desc: 'Com volume, você monta sua equipe de churrasqueiros parceiros. O açougue vira operadora completa — carne, acompanhamentos e mão de obra. Faturamento ilimitado.',
                num: '∞', numLabel: 'escalabilidade',
              },
            ].map(f => (
              <div key={f.n} className={`bg-gray-900 border ${f.cor} rounded-2xl p-6 flex flex-col`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-2xl shrink-0">
                    {f.icon}
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${f.badgeCor}`}>{f.badge}</span>
                </div>
                <p className="text-xs font-bold text-gray-500 mb-1">Frente {f.n}</p>
                <p className="font-bold text-white text-lg mb-2">{f.titulo}</p>
                <p className="text-sm text-gray-400 leading-relaxed flex-1">{f.desc}</p>
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <p className="text-2xl font-black text-white">{f.num}</p>
                  <p className="text-xs text-gray-500">{f.numLabel}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-orange-500/5 to-gray-900 border border-orange-500/20 rounded-2xl p-6 text-center">
            <p className="text-sm font-bold text-white mb-1">Potencial combinado das 3 frentes (60 eventos/mês)</p>
            <p className="text-xs text-gray-500 mb-4">Estimativa baseada em ticket médio de mercado</p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { valor: 'R$ 16.800', label: 'Carnes via app', obs: '60 × R$ 280 médio' },
                { valor: 'R$ 9.600', label: 'Acompanhamentos', obs: '60 × R$ 160 médio' },
                { valor: 'Sem limite', label: 'Com equipe própria', obs: 'Escala com o volume' },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-orange-400 font-black text-xl leading-tight">{s.valor}</p>
                  <p className="text-xs text-gray-300 mt-1">{s.label}</p>
                  <p className="text-xs text-gray-600">{s.obs}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── DOR DO DONO ──────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-4 mb-12">
            {[
              { stat: '68%', label: 'dos clientes de açougue pesquisam preço online antes de comprar', color: 'red' },
              { stat: '3x', label: 'mais pedidos por cliente quando o açougue está presente em apps', color: 'orange' },
              { stat: 'R$ 15 bi', label: 'movimentados por churrasco no Brasil — sem app, você fica fora', color: 'amber' },
            ].map(({ stat, label, color }) => (
              <div key={stat} className={`bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center`}>
                <p className={`text-3xl font-black mb-2 ${color === 'red' ? 'text-red-400' : color === 'orange' ? 'text-orange-400' : 'text-amber-400'}`}>{stat}</p>
                <p className="text-sm text-gray-400 leading-relaxed">{label}</p>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-gray-900 to-gray-900/60 border border-red-500/20 rounded-2xl p-6 sm:p-8">
            <div className="flex gap-4 items-start">
              <span className="text-3xl mt-1">⚠️</span>
              <div>
                <h3 className="text-lg font-black text-white mb-2">O que acontece com o açougue que não digitaliza</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  O churrasqueiro profissional compra onde já tem parceria. Se o seu concorrente está na plataforma e você não está, <strong className="text-white">o churrasqueiro vai comprar no concorrente</strong> — semana que vem, mês que vem, e para sempre. Sem fidelidade, sem visibilidade, sem dados de demanda.
                </p>
                <a
                  href={WHATSAPP}
                  target="_blank" rel="noopener noreferrer"
                  onClick={() => Events.clickWhatsApp('para-acougues-dor')}
                  className="inline-flex items-center gap-2 text-sm font-bold text-orange-400 hover:text-orange-300 transition-colors"
                >
                  Garantir minha vaga agora →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SIMULADOR ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-gray-950/50">
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
                  <span className="text-gray-500">Faturamento bruto (carnes):</span>
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
                  <span className="text-gray-500">Bônus de indicação (R$ 40/cliente):</span>
                  <span className="text-green-400 font-medium">
                    + <AnimatedNumber value={bonus} prefix="R$ " decimals={2} />
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
                onClick={() => Events.boutiqueInterest('para-acougues-footer-cta')}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold px-10 py-4 rounded-xl text-lg transition-all shadow-xl shadow-orange-500/25"
              >
                🥩 Quero ser parceiro
              </Link>
              <a
                href={WHATSAPP}
                target="_blank" rel="noopener noreferrer"
                onClick={() => Events.clickWhatsApp('para-acougues-footer')}
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
