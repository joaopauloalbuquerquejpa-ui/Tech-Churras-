'use client'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { Events } from '@/lib/analytics'

const WHATSAPP_BASE = 'https://wa.me/5511970593650'
const TICKET_MEDIO = 300
const COMISSAO = 0.10
const MENSALIDADE = 369

const ESCALA_GANHOS = [
  { nivel: 'Iniciante', pedidos: 5, icon: '🌱' },
  { nivel: 'Crescendo', pedidos: 15, icon: '📈' },
  { nivel: 'Parceiro Ativo', pedidos: 30, icon: '🔥' },
  { nivel: 'Referência SP', pedidos: 60, icon: '🏆' },
].map(e => {
  const bruto = e.pedidos * TICKET_MEDIO
  const comissao = bruto * COMISSAO
  const liquido = bruto - comissao - MENSALIDADE
  const liquidoFundador = bruto - comissao
  return { ...e, bruto, liquido, liquidoFundador }
})

const BENEFICIOS_FUNDADOR = [
  { icon: '📅', titulo: '3 meses sem mensalidade', desc: 'Economia de R$ 1.107 garantida antes de cobrar qualquer centavo.' },
  { icon: '🏅', titulo: 'Badge "Açougue Fundador"', desc: 'Selo permanente na plataforma. Quem entrar depois não terá esse diferencial.' },
  { icon: '📍', titulo: 'Destaque nas buscas por 6 meses', desc: 'Seu açougue aparece em primeiro antes de qualquer outro em SP.' },
  { icon: '🤝', titulo: 'Acesso direto ao fundador', desc: 'WhatsApp direto com Jota para qualquer dúvida, ajuste ou sugestão.' },
  { icon: '🤖', titulo: 'IA que indica seu açougue', desc: 'Quando o cliente monta o kit do evento, a IA sugere os cortes do seu catálogo.' },
  { icon: '✦', titulo: 'Produtos validados pela Tech Churras', desc: 'Seu açougue recebe o selo de qualidade validado — diferencial que o cliente vê antes de comprar.' },
]

const COMO_FUNCIONA = [
  { n: '1', texto: 'Você cadastra seus cortes e preços no dashboard — leva menos de 10 minutos' },
  { n: '2', texto: 'Cliente contrata o churrasqueiro + seleciona os cortes do seu açougue no mesmo app' },
  { n: '3', texto: 'O churrasqueiro retira a carne E os acompanhamentos prontos no seu balcão — tudo em uma única visita' },
  { n: '4', texto: 'Você recebe o valor via PIX toda sexta-feira, já com comissão descontada' },
]

function WaIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current shrink-0">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM11.9 2C6.458 2 2.015 6.443 2.015 11.885c0 1.778.468 3.51 1.36 5.034L2 22l5.225-1.372A9.86 9.86 0 0011.9 23.77C17.342 23.77 22 19.327 22 13.885 22 8.443 17.342 4 11.9 4z"/>
    </svg>
  )
}

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function ConviteContent() {
  const params = useSearchParams()
  const nome = params.get('nome') ?? 'seu açougue'
  const nomeFormatado = decodeURIComponent(nome.replace(/\+/g, ' '))

  useEffect(() => {
    Events.boutiquePageView()
  }, [])

  const waMsg = encodeURIComponent(
    `Olá Jota! Recebi o convite exclusivo para o ${nomeFormatado} ser Parceiro Fundador da Tech Churras. Quero saber mais!`
  )
  const waUrl = `${WHATSAPP_BASE}?text=${waMsg}`
  const cadastroUrl = `/register?role=boutique&ref=convite&nome=${encodeURIComponent(nomeFormatado)}`

  const maxLiquido = ESCALA_GANHOS[ESCALA_GANHOS.length - 1].liquidoFundador

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* Nav */}
      <nav className="border-b border-white/5 px-4 py-4 flex items-center justify-between max-w-3xl mx-auto">
        <Link href="/" className="font-black text-white text-lg">
          Tech <span className="text-orange-500">Churras</span>
        </Link>
        <a href={waUrl} target="_blank" rel="noopener noreferrer"
          onClick={() => Events.clickWhatsApp('convite-acougue-nav')}
          className="flex items-center gap-2 text-sm bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-lg transition-colors">
          <WaIcon /> WhatsApp
        </a>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Badge convite */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-5 py-2 text-sm text-amber-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Convite exclusivo · Parceiro Fundador · São Paulo
          </div>
        </div>

        {/* Mensagem do Jota */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden mb-6">
          <div className="grid sm:grid-cols-[220px_1fr]">
            <div className="relative h-56 sm:h-auto bg-gray-800">
              <img src="/jota.jpg" alt="Jota Albuquerque"
                className="w-full h-full object-cover object-top" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-gray-900/20" />
            </div>
            <div className="p-6 sm:p-8 flex flex-col justify-center">
              <p className="text-xs text-orange-400 font-bold uppercase tracking-widest mb-2">Mensagem pessoal</p>
              <p className="text-3xl text-orange-500 font-black leading-none mb-2">"</p>
              <p className="text-gray-200 text-base leading-relaxed mb-5">
                Estou construindo a maior plataforma de churrasco do Brasil e quero que{' '}
                <span className="text-white font-bold">{nomeFormatado}</span>{' '}
                seja um dos primeiros açougues a fazer parte dessa história.
                Reservei uma das 3 vagas de Parceiro Fundador especialmente para vocês.
              </p>
              <div>
                <p className="text-white font-bold text-sm">Jota Albuquerque</p>
                <p className="text-gray-500 text-xs">Fundador & CEO, Tech Churras</p>
                <p className="text-gray-600 text-xs mt-0.5">13+ anos · 1.800+ eventos · Madonna, Lady Gaga, Neymar</p>
              </div>
            </div>
          </div>
        </div>

        {/* Credenciais em chips */}
        <div className="flex flex-wrap gap-2 mb-10">
          {[
            { icon: '🔥', label: '1.800+ eventos realizados' },
            { icon: '🌍', label: 'Brasil, EUA e Europa' },
            { icon: '⭐', label: 'Madonna · Lady Gaga · Neymar' },
            { icon: '🏆', label: '13 anos de experiência' },
          ].map(c => (
            <div key={c.label} className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 rounded-full px-3 py-1.5 text-xs text-gray-300">
              <span>{c.icon}</span>
              <span>{c.label}</span>
            </div>
          ))}
        </div>

        {/* Bloco Bahari */}
        <div className="bg-gradient-to-br from-amber-500/10 to-gray-900 border border-amber-500/20 rounded-2xl overflow-hidden mb-10">
          <div className="grid sm:grid-cols-[240px_1fr]">
            <div className="relative h-48 sm:h-auto bg-gray-800">
              <img src="/bahari-restaurante.jpg" alt="Bahari of Brazil — Zanzibar"
                className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-gray-900/20" />
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-xs text-amber-300 px-2.5 py-1 rounded-full font-semibold">
                🌍 Zanzibar, Tanzânia
              </div>
            </div>
            <div className="p-6 flex flex-col justify-center">
              <p className="text-xs text-amber-400 font-bold uppercase tracking-widest mb-1">Por que o padrão Tech Churras é diferente</p>
              <h3 className="font-black text-white text-lg mb-2">Bahari of Brazil — PPP com o Governo de Zanzibar</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Nosso restaurante Bahari of Brazil tem 500 metros quadrados dentro do Ministério de TI e Inovação da Tanzânia. O primeiro restaurante do país em parceria com o Governo oficialmente. Jota Albuquerque é sócio executivo do projeto Bahari of Brazil e assinou o cardápio dos cortes mais nobres para uma experiência única e marcante.
              </p>
              <p className="text-xs text-gray-600">
                Essa é a credencial de quem está construindo a Tech Churras — e quem vai trazer clientes para o seu açougue.
              </p>
            </div>
          </div>
        </div>

        {/* O que é */}
        <div className="mb-10">
          <p className="text-xs text-orange-400 font-bold uppercase tracking-widest mb-3">A plataforma</p>
          <h2 className="text-2xl font-black mb-4">O problema que resolvemos para o seu açougue</h2>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4">
            <p className="text-sm text-gray-500 font-semibold uppercase tracking-wide mb-2">A realidade de hoje</p>
            <p className="text-gray-300 leading-relaxed text-sm">
              Todo fim de semana, pessoas fazem churrasco na sua cidade. A maioria compra carne no supermercado por comodidade — não porque prefere. Seu açougue tem qualidade muito superior, mas o cliente não te encontra na hora que precisa.
            </p>
          </div>

          <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-5">
            <p className="text-sm text-orange-400 font-semibold uppercase tracking-wide mb-2">Como a Tech Churras muda isso</p>
            <p className="text-gray-300 leading-relaxed text-sm mb-4">
              Quando alguém contrata um churrasqueiro pela Tech Churras, o app apresenta automaticamente os cortes do seu açougue como a opção premium — com foto, preço e validação de qualidade. O cliente compra os cortes junto com o serviço, o churrasqueiro retira no seu balcão e você fatura sem precisar fazer entrega, marketing ou atendimento extra.
            </p>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { valor: 'R$ 0', label: 'investimento em marketing' },
                { valor: '0', label: 'entregas para fazer' },
                { valor: '100%', label: 'do ticket entra no caixa' },
              ].map(s => (
                <div key={s.label} className="bg-gray-900/60 rounded-xl p-3">
                  <p className="text-orange-400 font-black text-lg">{s.valor}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Churrasqueiros 100% chancelados */}
        <div className="bg-gradient-to-br from-orange-500/5 to-gray-900 border border-orange-500/20 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-2xl shrink-0">
              👨‍🍳
            </div>
            <div>
              <p className="text-xs text-orange-400 font-bold uppercase tracking-widest mb-1">Diferencial exclusivo</p>
              <h3 className="font-black text-white text-lg mb-2">Churrasqueiros 100% chancelados pela Tech Churras</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Nenhum churrasqueiro entra na plataforma sem passar pelo programa de chancelamento da Tech Churras — treinamento presencial desenvolvido por Jota com 1.800+ eventos de experiência. Técnicas de corte, controle de fogo, temperos, equipamentos e postura profissional. Só quem é aprovado e mantém avaliação acima de 4.5★ continua ativo.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Técnicas de corte certificadas', 'Controle de fogo', 'Equipamentos homologados', 'Avaliação mínima 4.5★'].map(t => (
                  <span key={t} className="text-xs bg-orange-500/10 text-orange-300 border border-orange-500/20 px-2.5 py-1 rounded-full">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Insumos validados */}
        <div className="bg-gradient-to-br from-green-500/5 to-gray-900 border border-green-500/20 rounded-2xl p-6 mb-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-2xl shrink-0">
              🥩
            </div>
            <div>
              <p className="text-xs text-green-400 font-bold uppercase tracking-widest mb-1">Qualidade garantida</p>
              <h3 className="font-black text-white text-lg mb-2">Seu açougue com o Selo de Validação Tech Churras</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Não trabalhamos com qualquer açougue. Os insumos e produtos dos parceiros passam pela validação da Tech Churras antes de entrar na plataforma — origem, qualidade dos cortes e padrão de atendimento. Isso significa que os clientes confiam nos produtos que aparecem no app, e o seu açougue aparece com o selo de validação que diferencia de qualquer concorrente.
              </p>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-sm">✓</div>
                <span className="text-sm text-green-400 font-semibold">Selo "Açougue Validado Tech Churras"</span>
              </div>
            </div>
          </div>
        </div>

        {/* Acompanhamentos — nova frente de faturamento */}
        <div className="mb-10">
          <p className="text-xs text-green-400 font-bold uppercase tracking-widest mb-2">Nova frente de receita</p>
          <h2 className="text-2xl font-black mb-2">Acompanhamentos: faturamento que não existia</h2>
          <p className="text-gray-500 text-sm mb-5">
            No dia do churrasco, o churrasqueiro passa no seu açougue para retirar a carne.
            Agora ele retira também os acompanhamentos prontos — pão de alho, farofa, vinagrete.
            Você prepara, ele carrega. Zero entrega, zero logística extra. Uma operação simples que abre uma frente inteira de receita.
          </p>

          <div className="bg-gradient-to-br from-green-500/5 to-gray-900 border border-green-500/20 rounded-2xl overflow-hidden mb-5">
            <div className="px-5 py-4 border-b border-green-500/10">
              <p className="text-sm font-bold text-green-400">Acompanhamentos padrão do churrasco completo</p>
              <p className="text-xs text-gray-500 mt-0.5">Você cadastra no dashboard, o cliente escolhe na hora de fechar o pedido</p>
            </div>
            <div className="divide-y divide-gray-800/60">
              {[
                { nome: 'Pão de alho artesanal', preco: 'R$ 3–5/un', detalhe: 'Alta margem, giro constante' },
                { nome: 'Farofa de manteiga', preco: 'R$ 25–40/porção', detalhe: 'Simples de preparar' },
                { nome: 'Vinagrete fresco', preco: 'R$ 20–35/porção', detalhe: 'Zero desperdício' },
                { nome: 'Queijo coalho grelhado', preco: 'R$ 30–50/porção', detalhe: 'Produto premium' },
                { nome: 'Molho barbecue artesanal', preco: 'R$ 15–25/porção', detalhe: 'Alta percepção de valor' },
                { nome: 'Maionese temperada', preco: 'R$ 20–35/porção', detalhe: 'Custo mínimo' },
              ].map(item => (
                <div key={item.nome} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm text-white font-medium">{item.nome}</p>
                    <p className="text-xs text-green-500/70">{item.detalhe}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-300 shrink-0 ml-3">{item.preco}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <p className="text-sm font-bold text-white mb-1">Potencial de receita só com acompanhamentos</p>
            <p className="text-xs text-gray-600 mb-4">Acima da venda de carnes. Baseado em ticket médio por evento.</p>
            <div className="space-y-3">
              {[
                { eventos: 5,  acomp: 80,  label: 'Começo' },
                { eventos: 15, acomp: 100, label: 'Parceiro Ativo' },
                { eventos: 30, acomp: 130, label: 'Parceiro Referência' },
                { eventos: 60, acomp: 160, label: 'Escala Total' },
              ].map(e => {
                const total = e.eventos * e.acomp
                const barPct = Math.round((total / (60 * 160)) * 100)
                return (
                  <div key={e.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">{e.label} · {e.eventos} eventos/mês</span>
                      <span className="text-sm font-black text-green-400">+ R$ {fmt(total)}/mês</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5">
                      <div className="bg-gradient-to-r from-green-600 to-green-400 h-1.5 rounded-full" style={{ width: `${barPct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-gray-700 mt-4">* Estimativa. Valores acima das vendas de carne e sujeitos ao volume real de pedidos.</p>
          </div>
        </div>

        {/* Como funciona */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-10">
          <h3 className="font-bold text-white text-lg mb-5">Como funciona para o seu açougue</h3>
          <div className="space-y-4">
            {COMO_FUNCIONA.map(p => (
              <div key={p.n} className="flex items-start gap-4">
                <div className="w-7 h-7 rounded-full bg-orange-500 text-white font-black text-sm flex items-center justify-center shrink-0 mt-0.5">
                  {p.n}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{p.texto}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 3 Frentes de faturamento */}
        <div className="mb-10">
          <p className="text-xs text-orange-400 font-bold uppercase tracking-widest mb-2">Três frentes de faturamento</p>
          <h2 className="text-2xl font-black mb-2">Seu açougue vira uma máquina de vendas</h2>
          <p className="text-gray-500 text-sm mb-6">
            A maioria dos parceiros só pensa em clientes que chegam pelo app. Mas a maior oportunidade está dentro do seu próprio estabelecimento — e no futuro que cresce junto com você.
          </p>

          <div className="space-y-3 mb-6">
            {[
              {
                n: '1', icon: '📱', cor: 'border-orange-500/30 bg-orange-500/5',
                badgeCor: 'bg-orange-500/20 text-orange-400', badge: 'Começa no dia 1',
                titulo: 'Clientes que chegam pela Tech Churras',
                desc: 'Quem contrata um churrasqueiro pelo app escolhe os cortes do seu açougue automaticamente. Você não faz nada — o cliente aparece, o churrasqueiro retira e você fatura.',
              },
              {
                n: '2', icon: '🏪', cor: 'border-amber-500/30 bg-amber-500/5',
                badgeCor: 'bg-amber-500/20 text-amber-400', badge: 'QR Code no balcão',
                titulo: 'Seus próprios clientes do balcão',
                desc: 'Quem entra no seu açougue comprando carne para um evento já fez 50% do caminho. Um QR Code no balcão converte essa visita em um pedido completo — churrasqueiro, carne e acompanhamentos — sem você precisar explicar nada.',
              },
              {
                n: '3', icon: '👨‍🍳', cor: 'border-blue-500/20 bg-blue-500/5',
                badgeCor: 'bg-blue-500/20 text-blue-400', badge: 'Futuro próximo',
                titulo: 'Seus próprios churrasqueiros',
                desc: 'Com volume de eventos, você monta sua própria equipe de churrasqueiros parceiros. O açougue vira uma operadora completa de churrascos — controlando a carne, os acompanhamentos e a mão de obra. O faturamento multiplica sem sair do estabelecimento.',
              },
            ].map(f => (
              <div key={f.n} className={`border rounded-2xl p-5 ${f.cor}`}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-900/60 border border-gray-700 flex items-center justify-center text-xl shrink-0">
                    {f.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-gray-500">Frente {f.n}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${f.badgeCor}`}>{f.badge}</span>
                    </div>
                    <p className="font-bold text-white mb-1.5">{f.titulo}</p>
                    <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-900 border border-orange-500/20 rounded-2xl p-5">
            <p className="text-sm font-bold text-white mb-3">Potencial combinado das 3 frentes</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { valor: 'R$ 16.800', label: 'Carnes via app/mês', obs: '60 eventos × R$ 280' },
                { valor: 'R$ 9.600', label: 'Acompanhamentos/mês', obs: '60 eventos × R$ 160' },
                { valor: 'Ilimitado', label: 'Com equipe própria', obs: 'Escala conforme cresce' },
              ].map(s => (
                <div key={s.label} className="bg-gray-800/60 rounded-xl p-3">
                  <p className="text-orange-400 font-black text-base leading-tight">{s.valor}</p>
                  <p className="text-xs text-gray-400 mt-1 leading-tight">{s.label}</p>
                  <p className="text-xs text-gray-600 mt-0.5 leading-tight">{s.obs}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-700 mt-3 text-center">* Estimativas baseadas em parceiros ativos. Resultados variam conforme o volume.</p>
          </div>
        </div>

        {/* Escala de ganhos */}
        <div className="mb-10">
          <p className="text-xs text-orange-400 font-bold uppercase tracking-widest mb-2">Potencial de receita</p>
          <h2 className="text-2xl font-black mb-1">Quanto seu açougue pode ganhar</h2>
          <p className="text-gray-500 text-sm mb-6">Baseado em ticket médio de R$ 300 por pedido de carne. Como Parceiro Fundador, os 3 primeiros meses são sem mensalidade.</p>

          <div className="space-y-3">
            {ESCALA_GANHOS.map(e => {
              const barPct = Math.round((e.liquidoFundador / maxLiquido) * 100)
              return (
                <div key={e.nivel} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{e.icon}</span>
                      <div>
                        <p className="font-bold text-white text-sm">{e.nivel}</p>
                        <p className="text-xs text-gray-500">{e.pedidos} pedidos/mês · R$ {fmt(e.bruto)} bruto</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-amber-400 font-black text-lg">R$ {fmt(e.liquidoFundador)}</p>
                      <p className="text-xs text-amber-600">líquido/mês (Fundador)</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-amber-400 h-1.5 rounded-full transition-all"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                  {e.liquido > 0 && (
                    <p className="text-xs text-gray-600 mt-2">
                      Após o período Fundador: R$ {fmt(e.liquido)}/mês líquido
                    </p>
                  )}
                </div>
              )
            })}
          </div>
          <p className="text-xs text-gray-700 mt-3">* Estimativa. Valores dependem do volume real de pedidos via plataforma.</p>
        </div>

        {/* Pacote Fundador */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-2xl">🏅</span>
            <div>
              <h2 className="text-2xl font-black">Pacote Parceiro Fundador</h2>
              <p className="text-xs text-amber-400 font-semibold">Somente para os primeiros 3 açougues em São Paulo</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
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

        {/* Custos */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
          <h3 className="font-bold text-white text-lg mb-5">Custos — sem surpresas</h3>
          <div className="divide-y divide-gray-800">
            {[
              { label: 'Taxa de adesão', valor: 'R$ 0', cor: 'text-green-400', obs: 'Grátis para entrar' },
              { label: 'Mensalidade — Parceiro Fundador', valor: 'R$ 0 / 3 meses', cor: 'text-amber-400', obs: 'Depois R$ 369/mês — cancela quando quiser, sem multa' },
              { label: 'Comissão por pedido', valor: '10%', cor: 'text-gray-200', obs: 'Só sobre pedidos vendidos via plataforma' },
              { label: 'Repasse', valor: 'Toda sexta', cor: 'text-green-400', obs: 'Via PIX, já com comissão descontada automaticamente' },
            ].map(c => (
              <div key={c.label} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
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
        <div className="space-y-3 mb-4">
          <a href={waUrl} target="_blank" rel="noopener noreferrer"
            onClick={() => { Events.clickWhatsApp('convite-acougue-cta'); Events.boutiqueFounderClick('convite-whatsapp') }}
            className="flex items-center justify-center gap-3 w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-2xl text-base transition-colors shadow-lg shadow-green-900/30">
            <WaIcon />
            Falar com Jota no WhatsApp
          </a>
          <Link href={cadastroUrl}
            onClick={() => Events.boutiqueInterest('convite-acougue-cadastro')}
            className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl text-base transition-colors shadow-lg shadow-orange-900/30">
            🥩 Cadastrar {nomeFormatado} agora
          </Link>
          <p className="text-center text-xs text-gray-600">
            Sem cartão de crédito · Sem burocracia · Cancela quando quiser
          </p>
        </div>

        {/* Urgência */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-5 py-4 flex items-center gap-3 mb-10">
          <span className="text-xl shrink-0">⏳</span>
          <p className="text-sm text-amber-300 leading-relaxed">
            <span className="font-bold">Restam 3 vagas de Parceiro Fundador em São Paulo.</span>{' '}
            Após o preenchimento, novas parcerias entram na lista de espera sem as condições exclusivas.
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
