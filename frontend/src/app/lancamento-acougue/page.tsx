'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Events } from '@/lib/analytics'

const LAUNCH_DATE = new Date('2026-07-06T10:00:00-03:00')

function useCountdown() {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 })
  useEffect(() => {
    function tick() {
      const diff = Math.max(0, LAUNCH_DATE.getTime() - Date.now())
      setT({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return t
}

function Num({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl font-black text-white tabular-nums"
        style={{ background: 'linear-gradient(135deg,#1c0800,#2d1200)', border: '1px solid rgba(249,115,22,0.35)' }}>
        {String(n).padStart(2, '0')}
      </div>
      <p className="text-[10px] text-gray-600 uppercase tracking-widest">{label}</p>
    </div>
  )
}

export default function LancamentoAcouguePage() {
  const c = useCountdown()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Events.viewContent('lancamento_acougue')
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) return
    setLoading(true)
    Events.boutiqueInterest('lancamento_acougue_form')
    const params = new URLSearchParams({ name, phone, role: 'BOUTIQUE', utm_source: 'lancamento_acougue' })
    window.location.href = `/register?${params}`
  }

  return (
    <div className="min-h-screen bg-[#060606] text-white overflow-x-hidden">

      {/* ── URGENCY BAR ── */}
      <div className="w-full bg-orange-500 text-center py-2 px-4">
        <p className="text-xs sm:text-sm font-bold text-black">
          🔥 Lançamento oficial <strong>06 de julho de 2026</strong> em São Paulo — 60 dias grátis para os primeiros açougues
        </p>
      </div>

      {/* ── NAV ── */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <p className="text-xl font-black">Tech <span className="text-orange-500">Churras</span></p>
        <Link href="/register?role=BOUTIQUE&utm_source=nav_lancamento"
          onClick={() => Events.boutiqueFounderClick('nav')}
          className="text-xs sm:text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl transition-colors hidden sm:block">
          Cadastrar açougue →
        </Link>
      </nav>

      {/* ── HERO ── */}
      <section className="max-w-5xl mx-auto px-5 pt-10 pb-16 text-center">

        <div className="inline-flex items-center gap-2 text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 mb-7">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse inline-block" />
          Contagem regressiva para o lançamento
        </div>

        {/* COUNTDOWN */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-10">
          <Num n={c.d} label="dias" />
          <span className="text-orange-500 text-2xl font-black pb-5">:</span>
          <Num n={c.h} label="horas" />
          <span className="text-orange-500 text-2xl font-black pb-5">:</span>
          <Num n={c.m} label="min" />
          <span className="text-orange-500 text-2xl font-black pb-5">:</span>
          <Num n={c.s} label="seg" />
        </div>

        <h1 className="text-4xl sm:text-6xl font-black leading-[1.05] mb-5">
          Transforme seu açougue em{' '}
          <br className="hidden sm:block" />
          <span style={{ background: 'linear-gradient(90deg,#f97316,#fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Hub de Eventos
          </span>
        </h1>

        <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
          Na quinta-feira o cliente passa no balcão. Na sexta ele decide fazer churrasco. Com a Tech Churras,
          ele escaneia o QR do seu açougue e contrata <strong className="text-white">carne + churrasqueiro profissional</strong> sem sair da loja.
          Você aumenta o ticket e captura um cliente que ia pro supermercado.
        </p>

        {/* METRICS ROW */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {[
            { v: '60 dias', l: 'grátis', sub: 'sem cartão' },
            { v: '20 min', l: 'para operar', sub: 'do cadastro ao QR no balcão' },
            { v: '7%', l: 'comissão', sub: 'só quando você vender' },
            { v: 'R$ 0', l: 'de setup', sub: 'zero custo inicial' },
          ].map(m => (
            <div key={m.l} className="bg-gray-900 border border-gray-800 rounded-2xl px-5 py-4 text-center min-w-[110px]">
              <p className="text-2xl font-black text-orange-400">{m.v}</p>
              <p className="text-xs font-bold text-white">{m.l}</p>
              <p className="text-[11px] text-gray-600">{m.sub}</p>
            </div>
          ))}
        </div>

        {/* CTA FORM */}
        <form onSubmit={submit} className="bg-gray-900 border border-orange-500/30 rounded-3xl p-7 max-w-md mx-auto">
          <p className="text-xl font-black text-white mb-1">Quero ser açougue fundador</p>
          <p className="text-xs text-gray-500 mb-5">Garanta os 60 dias grátis e suporte prioritário no lançamento</p>
          <div className="space-y-3 mb-4">
            <input type="text" required placeholder="Nome do açougue"
              value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 focus:border-orange-500 rounded-xl px-4 py-3.5 text-sm text-white placeholder-gray-600 outline-none transition-colors" />
            <input type="tel" required placeholder="Seu WhatsApp — (11) 99999-9999"
              value={phone} onChange={e => setPhone(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 focus:border-orange-500 rounded-xl px-4 py-3.5 text-sm text-white placeholder-gray-600 outline-none transition-colors" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full font-black text-white text-base py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-70"
            style={{ background: 'linear-gradient(90deg,#f97316,#ea580c)', boxShadow: '0 0 30px rgba(249,115,22,0.4)' }}>
            {loading ? 'Redirecionando...' : '🔥 Entrar na lista de lançamento →'}
          </button>
          <p className="text-[11px] text-gray-600 text-center mt-3">Sem spam. Você recebe só o link de cadastro.</p>
        </form>
      </section>

      {/* ── DORES ── */}
      <section className="border-t border-gray-900 bg-gray-950 py-16">
        <div className="max-w-5xl mx-auto px-5">
          <p className="text-xs text-orange-400 font-bold uppercase tracking-widest text-center mb-2">Por que agora</p>
          <h2 className="text-3xl font-black text-white text-center mb-10">Três dores que custam dinheiro todo fim de semana</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { icon: '📉', t: 'Cliente some na quinta', d: 'Na sexta ele vai no supermercado porque não sabia que você entrega churrasco completo. O QR no balcão captura esse cliente na hora — antes de ele sair.' },
              { icon: '🥩', t: 'Corte nobre parado na vitrine', d: 'Picanha, fraldinha e costela têm margem alta — mas o cliente não sabe o que pedir. O kit pronto fecha a venda com um toque.' },
              { icon: '📋', t: 'Cadastro de cliente zero', d: 'Você não tem como avisar clientes de promoções. Cada pedido no QR gera um lead no seu painel — nome, WhatsApp, histórico de compras.' },
            ].map(d => (
              <div key={d.t} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <p className="text-3xl mb-3">{d.icon}</p>
                <p className="font-bold text-white text-base mb-2">{d.t}</p>
                <p className="text-sm text-gray-400 leading-relaxed">{d.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-5">
          <p className="text-xs text-orange-400 font-bold uppercase tracking-widest text-center mb-2">Simples de verdade</p>
          <h2 className="text-3xl font-black text-white text-center mb-3">Do cadastro ao QR no balcão em 20 minutos</h2>
          <p className="text-gray-500 text-center text-sm mb-10 max-w-xl mx-auto">Nenhum equipamento. Nenhum técnico. Você faz tudo pelo celular.</p>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { n: '01', icon: '🥩', t: 'Cadastre seu açougue', d: 'Fotos, produtos e horários. Tudo simples pelo celular. Em menos de 20 minutos você está operando.' },
              { n: '02', icon: '📲', t: 'Cole o QR no balcão', d: 'O sistema gera a placa automaticamente. Imprima, plastifique e coloque no balcão. O cliente aponta a câmera.' },
              { n: '03', icon: '💰', t: 'Receba pedidos e pague', d: 'Aceite ou recuse cada pedido como no iFood. O pagamento cai no Pix toda semana. Você controla tudo.' },
            ].map(s => (
              <div key={s.n} className="flex gap-4">
                <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xs font-black text-orange-400"
                  style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
                  {s.n}
                </div>
                <div>
                  <p className="text-2xl mb-1">{s.icon}</p>
                  <p className="font-bold text-white text-sm mb-1">{s.t}</p>
                  <p className="text-sm text-gray-400 leading-relaxed">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QR DEMO ── */}
      <section className="border-y border-gray-900 bg-gray-950 py-16">
        <div className="max-w-5xl mx-auto px-5">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-xs text-orange-400 font-bold uppercase tracking-widest mb-3">O QR code inteligente</p>
              <h2 className="text-3xl font-black text-white mb-4 leading-tight">Atualiza sozinho como o cardápio do iFood</h2>
              <p className="text-gray-400 leading-relaxed mb-5">
                O QR é fixo no balcão, mas o conteúdo é ao vivo: o cliente sempre vê só o que você tem em estoque naquele momento.
                Acabou a picanha? Desaparece do QR automaticamente.
              </p>
              <ul className="space-y-2">
                {[
                  'Cliente vê seu açougue já pré-selecionado',
                  'Escolhe os cortes e as quantidades',
                  'O sistema sugere as quantidades pelo número de convidados',
                  'Seleciona o churrasqueiro disponível na região',
                  'Paga pelo Mercado Pago — sem cadastro',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-400">
                    <span className="text-orange-400 mt-0.5 shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
              <p className="text-xs text-gray-600 mb-4 uppercase tracking-widest">Exemplo de kit no QR</p>
              <div className="space-y-3">
                {[
                  { name: 'Kit Churrasquinho', sub: '5–15 convidados', old: 'R$ 289', price: 'R$ 249' },
                  { name: 'Kit Família', sub: '15–30 convidados', old: 'R$ 579', price: 'R$ 499' },
                  { name: 'Kit Evento Premium', sub: '30–80 convidados', old: 'R$ 1.290', price: 'R$ 1.090' },
                ].map(k => (
                  <div key={k.name} className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3 text-left">
                    <div>
                      <p className="text-sm font-bold text-white">{k.name}</p>
                      <p className="text-xs text-gray-500">{k.sub}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600 line-through">{k.old}</p>
                      <p className="text-sm font-black text-orange-400">{k.price}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-4">Você cria e edita os kits quando quiser</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CREDIBILIDADE ── */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-5">
          <div className="grid md:grid-cols-[1fr_380px] gap-10 items-center">
            <div>
              <p className="text-xs text-amber-400 font-bold uppercase tracking-widest mb-3">Quem está por trás</p>
              <h2 className="text-3xl font-black text-white mb-4 leading-tight">
                Construído por quem opera no mais alto nível
              </h2>
              <p className="text-gray-400 leading-relaxed mb-3">
                <strong className="text-white">Jota Albuquerque</strong> é sócio executivo do <strong className="text-white">Bahari of Brazil</strong> —
                500m² dentro do Ministério de TI e Inovação da Tanzânia, parceria oficial PPP com o Governo de Zanzibar.
                Assinou o cardápio de cortes nobres para uma experiência única no continente africano.
              </p>
              <p className="text-gray-400 leading-relaxed">
                A mesma visão de profissionalizar o churrasco chegou ao Brasil. A Tech Churras é a infraestrutura que o açougue brasileiro sempre precisou e nunca teve.
              </p>
              <div className="flex flex-wrap gap-2 mt-5">
                {['🏛️ PPP com o Governo', '🌍 Zanzibar, Tanzânia', '📐 500m² no Ministério', '🍖 Cardápio assinado'].map(t => (
                  <span key={t} className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-300 px-3 py-1 rounded-full">{t}</span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden border border-amber-500/20 bg-gray-900 aspect-video flex items-center justify-center relative">
              <img src="/bahari-restaurante.jpg" alt="Bahari of Brazil" className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur text-xs text-amber-300 font-bold px-3 py-1 rounded-full border border-amber-500/20">
                🌍 Zanzibar, Tanzânia
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FREEMIUM ── */}
      <section className="border-t border-gray-900 bg-gray-950 py-16">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <div className="rounded-3xl border border-orange-500/30 p-10"
            style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.08), #060606)' }}>
            <p className="text-7xl font-black text-orange-400 leading-none mb-1">60</p>
            <p className="text-2xl font-bold text-white mb-1">dias 100% gratuitos</p>
            <p className="text-gray-500 text-sm mb-6">Depois do lançamento</p>
            <div className="grid sm:grid-cols-3 gap-4 mb-8 text-left">
              {[
                { icon: '✅', t: 'Painel completo', d: 'Produtos, kits, pedidos, QR, relatórios — tudo disponível desde o dia 1.' },
                { icon: '✅', t: 'Suporte prioritário', d: 'Açougues fundadores entram no grupo VIP com suporte direto da equipe.' },
                { icon: '✅', t: 'Sem cobrança', d: 'Zero custo por 60 dias. Sem cartão de crédito no cadastro.' },
              ].map(f => (
                <div key={f.t} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <p className="text-base mb-1">{f.icon}</p>
                  <p className="text-sm font-bold text-white mb-1">{f.t}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.d}</p>
                </div>
              ))}
            </div>
            <p className="text-gray-400 text-sm mb-6">
              Após o período gratuito: <strong className="text-white">R$ 369/mês</strong> + <strong className="text-white">7% de comissão</strong> só quando você vender.
              Cancele quando quiser, sem multa.
            </p>
            <Link href="/register?role=BOUTIQUE&utm_source=lancamento_freemium"
              onClick={() => Events.boutiqueFounderClick('freemium')}
              className="inline-block font-black text-white text-lg px-10 py-5 rounded-2xl transition-all hover:scale-105"
              style={{ background: 'linear-gradient(90deg,#f97316,#ea580c)', boxShadow: '0 0 40px rgba(249,115,22,0.4)' }}>
              Cadastrar meu açougue agora →
            </Link>
            <p className="text-xs text-gray-600 mt-3">São Paulo Capital · Início 06/07/2026 · Expansão nacional em seguida</p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-14">
        <div className="max-w-3xl mx-auto px-5">
          <h2 className="text-2xl font-black text-white text-center mb-8">Perguntas rápidas</h2>
          <div className="space-y-3">
            {[
              { q: 'Preciso de tablet, computador ou impressora especial?', a: 'Não. O painel funciona no celular. O QR você imprime em qualquer impressora comum — ou a gente envia plastificado.' },
              { q: 'E se eu ficar sem estoque de um corte?', a: 'Você desativa o produto em segundos pelo celular. Ele some do QR automaticamente para os próximos clientes.' },
              { q: 'O pagamento cai na minha conta ou fica na plataforma?', a: 'Cai direto no seu Pix, toda semana. A Tech Churras desconta apenas a comissão de 7% automaticamente.' },
              { q: 'Preciso ter churrasqueiros cadastrados no meu açougue?', a: 'Não. A plataforma já conecta seu açougue com churrasqueiros certificados disponíveis na sua região.' },
              { q: 'Posso recusar um pedido se não tiver estoque?', a: 'Sim. Você aceita ou recusa cada pedido no seu painel, exatamente como os restaurantes no iFood.' },
              { q: 'E se eu não quiser continuar após os 60 dias?', a: 'Você cancela dentro da plataforma com 1 clique. Sem multa, sem burocracia.' },
            ].map(({ q, a }) => (
              <div key={q} className="bg-gray-900 border border-gray-800 rounded-2xl px-6 py-5">
                <p className="font-bold text-white text-sm mb-1.5">{q}</p>
                <p className="text-sm text-gray-400 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="border-t border-gray-900 bg-gray-950 py-16 text-center px-5">
        <p className="text-xs text-orange-400 font-bold uppercase tracking-widest mb-3">Lançamento · São Paulo · 06/07/2026</p>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-5 leading-tight max-w-2xl mx-auto">
          Seu açougue merece mais do que vender corte por corte.
        </h2>
        <p className="text-gray-400 max-w-xl mx-auto mb-8 leading-relaxed">
          Seja um açougue fundador. Os primeiros terão vantagem competitiva, suporte prioritário e acesso ao programa de indicação com <strong className="text-white">R$ 200 de bônus por indicação</strong>.
        </p>
        <Link href="/register?role=BOUTIQUE&utm_source=lancamento_final_cta"
          onClick={() => Events.boutiqueFounderClick('final_cta')}
          className="inline-block font-black text-white text-xl px-12 py-6 rounded-3xl transition-all hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(90deg,#f97316,#ea580c)', boxShadow: '0 0 60px rgba(249,115,22,0.4)' }}>
          🔥 Quero ser açougue fundador →
        </Link>
        <p className="text-xs text-gray-600 mt-4">60 dias grátis · Sem cartão · Cancele quando quiser</p>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-900 py-8 text-center px-5">
        <p className="text-sm font-black mb-1">Tech <span className="text-orange-500">Churras</span></p>
        <p className="text-xs text-gray-600">techchurras.com.br · techchurras@gmail.com</p>
        <div className="flex items-center justify-center gap-4 mt-3">
          <Link href="/termos-de-uso" className="text-xs text-gray-700 hover:text-gray-500 transition-colors">Termos</Link>
          <Link href="/politica-de-privacidade" className="text-xs text-gray-700 hover:text-gray-500 transition-colors">Privacidade</Link>
          <Link href="/para-acougues" className="text-xs text-gray-700 hover:text-gray-500 transition-colors">Para açougues</Link>
        </div>
      </footer>
    </div>
  )
}
