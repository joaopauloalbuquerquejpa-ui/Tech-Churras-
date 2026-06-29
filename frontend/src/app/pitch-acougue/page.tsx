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
          1 vaga por bairro · São Paulo
        </div>

        <h1 className="text-3xl font-black leading-tight mb-4">
          Seu balcão já tem clientes<br />
          querendo churrasco.{' '}
          <span className="text-orange-500">Nós trazemos<br />o churrasqueiro.</span>
        </h1>

        <p className="text-gray-400 text-base leading-relaxed mb-6">
          A Tech Churras conecta clientes que querem fazer churrasco com churrasqueiros profissionais — e o açougue parceiro é quem fornece a carne. O pedido chega no seu app, o churrasqueiro retira no balcão. Você não muda nada na sua operação.
        </p>

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
        <p className="text-xs text-gray-600 text-center">* Primeiros 5 parceiros fundadores: R$ 369/mês · Demais: R$ 497/mês</p>
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

      {/* ── QUANTO VOCÊ GANHA ── */}
      <section className="px-5 py-8 border-t border-gray-900">
        <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-5">O que você ganha</p>

        <div className="space-y-3 mb-6">
          {[
            { icon: '🥩', texto: 'Faturamento com venda de carnes e acompanhamentos para cada evento' },
            { icon: '💰', texto: 'R$ 40 de bônus por cada cliente novo que você indicar via QR code' },
            { icon: '📈', texto: 'Marketing orgânico: seu açougue aparece para quem está planejando churrasco' },
            { icon: '🏅', texto: 'Badge "Açougue Parceiro" verificado no app — diferencial frente a concorrentes' },
            { icon: '📊', texto: 'Dashboard com pedidos, faturamento e previsão de demanda em tempo real' },
          ].map(item => (
            <div key={item.texto} className="flex gap-3 items-start">
              <span className="text-lg shrink-0">{item.icon}</span>
              <p className="text-gray-300 text-sm leading-relaxed">{item.texto}</p>
            </div>
          ))}
        </div>

        {/* Estimativa rápida */}
        <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-5">
          <p className="text-xs text-green-400 font-bold uppercase tracking-wide mb-3">Estimativa de renda extra</p>
          <div className="space-y-2.5">
            {[
              { eventos: 5,  receita: 1400,  label: '5 eventos/mês' },
              { eventos: 20, receita: 5600,  label: '20 eventos/mês' },
              { eventos: 40, receita: 11200, label: '40 eventos/mês' },
            ].map(e => (
              <div key={e.eventos} className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{e.label}</span>
                <span className="text-sm font-black text-green-400">
                  + R$ {e.receita.toLocaleString('pt-BR')}/mês
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-3">* Ticket médio de R$ 280 por evento. Estimativa.</p>
        </div>
      </section>

      {/* ── OFERTA PARCEIRO FUNDADOR ── */}
      <section className="px-5 py-8 border-t border-gray-900">
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🏅</span>
            <div>
              <p className="font-black text-white">Pacote Parceiro Fundador</p>
              <p className="text-xs text-amber-400">Apenas 1 por bairro em SP · válido até 06/08/2026</p>
            </div>
          </div>
          <div className="space-y-2.5 mb-5">
            {[
              '3 meses grátis — sem mensalidade (economia de R$ 1.107)',
              'Badge "Açougue Fundador" permanente no app',
              'Destaque nas buscas por 6 meses',
              'Acesso direto ao Jota Albuquerque via WhatsApp',
              'Exclusividade da sua região antes do concorrente entrar',
            ].map(b => (
              <div key={b} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-amber-400 mt-0.5 shrink-0">✦</span>
                <span>{b}</span>
              </div>
            ))}
          </div>
          <div className="bg-black/30 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400">Se o seu bairro ainda estiver disponível:</p>
            <p className="text-orange-400 font-black text-sm mt-0.5">Você paga R$ 0 nos primeiros 3 meses</p>
          </div>
        </div>
      </section>

      {/* ── QUEM É O JOTA ── */}
      <section className="px-5 py-8 border-t border-gray-900">
        <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-5">Quem está por trás</p>

        <div className="flex gap-4 items-start mb-5">
          <img
            src="/jota.jpg"
            alt="Jota Albuquerque"
            className="w-16 h-16 rounded-2xl object-cover object-top shrink-0"
          />
          <div>
            <p className="font-black text-white text-lg leading-tight">Jota Albuquerque</p>
            <p className="text-xs text-gray-500">Fundador & CEO · 13+ anos · 1.800+ eventos</p>
            <p className="text-xs text-orange-400 mt-1">Madonna · Lady Gaga · Neymar</p>
          </div>
        </div>

        <div className="bg-gray-900 border border-amber-500/20 rounded-2xl p-4 mb-4">
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
            "Já fiz churrasco para Madonna, Lady Gaga e Neymar. Mas o churrasco que mais me orgulha vai acontecer no quintal da sua cidade — e o seu açougue vai estar no meio disso."
          </p>
          <p className="text-xs text-orange-400 mt-2">— Jota Albuquerque, fundador</p>
        </blockquote>
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
