'use client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'

const WHATSAPP_BASE = 'https://wa.me/5511970593650'

const ESCALA_GANHOS = [
  { nivel: 'Fim de semana', icon: '🌱', eventos: 4,  horas: 4, preco: 100 },
  { nivel: 'Parceiro Regular', icon: '🔥', eventos: 8,  horas: 5, preco: 120 },
  { nivel: 'Profissional', icon: '👑', eventos: 15, horas: 6, preco: 150 },
  { nivel: 'Full-time', icon: '🏆', eventos: 20, horas: 6, preco: 200 },
].map(e => {
  const bruto = e.eventos * e.horas * e.preco
  const liquido = bruto * 0.93
  return { ...e, bruto, liquido }
})

const BENEFICIOS_CHANCELAMENTO = [
  { icon: '👨‍🏫', titulo: 'Treinamento com Jota', desc: 'Presencial. Técnicas de 1.800+ eventos: corte, fogo, temperos, postura.' },
  { icon: '🏅', titulo: 'Badge Chancelado', desc: 'Aparece no seu perfil. O cliente vê antes de contratar — diferencial imediato.' },
  { icon: '📍', titulo: 'Prioridade nas buscas', desc: 'Churrasqueiros Fundadores aparecem em primeiro por 6 meses.' },
  { icon: '🤝', titulo: 'Acesso direto ao Jota', desc: 'WhatsApp direto com o fundador para dúvidas e crescimento.' },
  { icon: '🥩', titulo: 'Carne já separada', desc: 'Açougues parceiros separam os cortes — você só retira e vai pro evento.' },
  { icon: '💸', titulo: 'PIX toda sexta', desc: '93% do valor do evento cai na sua conta sem precisar cobrar ninguém.' },
]

const COMO_FUNCIONA = [
  { n: '1', texto: 'Você cria seu perfil com fotos, especialidades e preço por hora — leva 10 minutos' },
  { n: '2', texto: 'Cliente encontra seu perfil, vê suas avaliações e contrata pelo app' },
  { n: '3', texto: 'Você confirma, retira a carne no açougue parceiro e vai pro evento' },
  { n: '4', texto: '93% do valor cai no seu PIX toda sexta-feira, automático' },
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
  const nome = params.get('nome') ?? 'você'
  const nomeFormatado = decodeURIComponent(nome.replace(/\+/g, ' '))
  const primeiroNome = nomeFormatado.split(' ')[0]

  const waMsg = encodeURIComponent(
    `Olá Jota! Recebi seu convite para ser Churrasqueiro Fundador da Tech Churras. Quero saber mais!`
  )
  const waUrl = `${WHATSAPP_BASE}?text=${waMsg}`
  const cadastroUrl = `/register?role=grillmaster&ref=convite&nome=${encodeURIComponent(nomeFormatado)}`
  const maxLiquido = ESCALA_GANHOS[ESCALA_GANHOS.length - 1].liquido

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* Nav */}
      <nav className="border-b border-white/5 px-4 py-4 flex items-center justify-between max-w-3xl mx-auto">
        <Link href="/" className="font-black text-white text-lg">
          Tech <span className="text-orange-500">Churras</span>
        </Link>
        <a href={waUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-lg transition-colors">
          <WaIcon /> WhatsApp
        </a>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-5 py-2 text-sm text-orange-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            Convite exclusivo · Churrasqueiro Fundador · São Paulo
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
                {primeiroNome}, estou montando o time de churrasqueiros que vai definir o padrão da Tech Churras em São Paulo.
                Quero você como um dos primeiros — e quero treinar você pessoalmente com tudo que aprendi em 1.800 eventos pelo mundo.
              </p>
              <div>
                <p className="text-white font-bold text-sm">Jota Albuquerque</p>
                <p className="text-gray-500 text-xs">Fundador & CEO, Tech Churras</p>
                <p className="text-gray-600 text-xs mt-0.5">13+ anos · 1.800+ eventos · Madonna, Lady Gaga, Neymar</p>
              </div>
            </div>
          </div>
        </div>

        {/* Credenciais */}
        <div className="flex flex-wrap gap-2 mb-10">
          {[
            { icon: '🔥', label: '1.800+ eventos realizados' },
            { icon: '🌍', label: 'Brasil, EUA e Europa' },
            { icon: '⭐', label: 'Madonna · Lady Gaga · Neymar' },
            { icon: '🏆', label: '13 anos de experiência' },
          ].map(c => (
            <div key={c.label} className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 rounded-full px-3 py-1.5 text-xs text-gray-300">
              <span>{c.icon}</span><span>{c.label}</span>
            </div>
          ))}
        </div>

        {/* O problema que resolvemos para o churrasqueiro */}
        <div className="mb-10">
          <p className="text-xs text-orange-400 font-bold uppercase tracking-widest mb-3">A oportunidade</p>
          <h2 className="text-2xl font-black mb-4">O talento que você tem merece mais do que indicação boca a boca</h2>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4">
            <p className="text-sm text-gray-500 font-semibold uppercase tracking-wide mb-2">A realidade hoje</p>
            <p className="text-gray-300 leading-relaxed text-sm">
              Todo churrasqueiro bom depende de indicação. Quando para de chegar indicação, para de chegar dinheiro. Você não tem controle sobre sua agenda, não tem previsibilidade de renda e fica refém de quem te conhece.
            </p>
          </div>

          <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-5">
            <p className="text-sm text-orange-400 font-semibold uppercase tracking-wide mb-2">Como a Tech Churras muda isso</p>
            <p className="text-gray-300 leading-relaxed text-sm mb-4">
              Seu perfil aparece para clientes que já estão procurando um churrasqueiro — não para pessoas que você conhece. Você define o preço, a disponibilidade e recebe 93% de cada evento direto no PIX toda sexta. Sem cobrar, sem negociar, sem depender de ninguém.
            </p>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { valor: '93%', label: 'do evento vai para você' },
                { valor: 'R$ 0', label: 'de mensalidade' },
                { valor: '100%', label: 'digital e automático' },
              ].map(s => (
                <div key={s.label} className="bg-gray-900/60 rounded-xl p-3">
                  <p className="text-orange-400 font-black text-lg">{s.valor}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chancelamento */}
        <div className="bg-gradient-to-br from-orange-500/5 to-gray-900 border border-orange-500/20 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-2xl shrink-0">🏅</div>
            <div>
              <p className="text-xs text-orange-400 font-bold uppercase tracking-widest mb-1">Diferencial único</p>
              <h3 className="font-black text-white text-lg mb-2">Programa de Chancelamento Tech Churras</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Não é um app de freelas. É uma rede de profissionais certificados. Você passa por treinamento presencial com Jota — técnicas de corte, controle de fogo, temperos e postura profissional — e recebe o selo que o cliente vê antes de contratar. Isso justifica um preço maior e gera mais confiança.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Técnicas de corte', 'Controle de fogo', 'Temperos regionais', 'Postura profissional', 'Equipamentos'].map(t => (
                  <span key={t} className="text-xs bg-orange-500/10 text-orange-300 border border-orange-500/20 px-2.5 py-1 rounded-full">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Insumos parceiros */}
        <div className="bg-gradient-to-br from-green-500/5 to-gray-900 border border-green-500/20 rounded-2xl p-6 mb-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-2xl shrink-0">🥩</div>
            <div>
              <p className="text-xs text-green-400 font-bold uppercase tracking-widest mb-1">Logística resolvida</p>
              <h3 className="font-black text-white text-lg mb-2">Açougues parceiros: a carne já está separada</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Quando o cliente contrata você com o kit completo, os cortes ficam separados no açougue parceiro validado pela Tech Churras. Você retira no balcão no dia do evento — sem precisar comprar, negociar preço ou carregar geladeira. Você só precisa chegar e fazer o que sabe fazer.
              </p>
            </div>
          </div>
        </div>

        {/* Como funciona */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-10">
          <h3 className="font-bold text-white text-lg mb-5">Como funciona na prática</h3>
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

        {/* Escala de ganhos */}
        <div className="mb-10">
          <p className="text-xs text-orange-400 font-bold uppercase tracking-widest mb-2">Potencial de renda</p>
          <h2 className="text-2xl font-black mb-1">Quanto você pode ganhar</h2>
          <p className="text-gray-500 text-sm mb-6">Estimativas por perfil de dedicação. Você define quantos eventos quer fazer por mês.</p>

          <div className="space-y-3">
            {ESCALA_GANHOS.map(e => {
              const barPct = Math.round((e.liquido / maxLiquido) * 100)
              return (
                <div key={e.nivel} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{e.icon}</span>
                      <div>
                        <p className="font-bold text-white text-sm">{e.nivel}</p>
                        <p className="text-xs text-gray-500">{e.eventos} eventos · {e.horas}h · R$ {e.preco}/h</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-black text-lg">R$ {fmt(e.liquido)}</p>
                      <p className="text-xs text-gray-500">líquido/mês</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-orange-500 to-green-400 h-1.5 rounded-full"
                      style={{ width: `${barPct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-gray-700 mt-3">* Estimativa. Resultado real depende dos eventos confirmados.</p>
        </div>

        {/* Benefícios Fundador */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-2xl">🏅</span>
            <div>
              <h2 className="text-2xl font-black">Pacote Churrasqueiro Fundador</h2>
              <p className="text-xs text-amber-400 font-semibold">Somente para os primeiros 10 churrasqueiros em São Paulo</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {BENEFICIOS_CHANCELAMENTO.map(b => (
              <div key={b.titulo} className="bg-gray-900 border border-orange-500/20 rounded-xl p-4 flex gap-3">
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
              { label: 'Mensalidade', valor: 'R$ 0', cor: 'text-green-400', obs: 'Para sempre. Sem custo fixo.' },
              { label: 'Taxa de adesão', valor: 'R$ 0', cor: 'text-green-400', obs: 'Grátis para entrar e criar perfil' },
              { label: 'Comissão por evento', valor: '7%', cor: 'text-gray-200', obs: 'Só quando você ganha — mês sem evento = zero custo' },
              { label: 'Você recebe', valor: '93%', cor: 'text-green-400', obs: 'Via PIX toda sexta-feira, automático' },
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
            className="flex items-center justify-center gap-3 w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-2xl text-base transition-colors shadow-lg shadow-green-900/30">
            <WaIcon />
            Falar com Jota no WhatsApp
          </a>
          <Link href={cadastroUrl}
            className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl text-base transition-colors shadow-lg shadow-orange-900/30">
            🔥 Quero ser Churrasqueiro Fundador
          </Link>
          <p className="text-center text-xs text-gray-600">
            Zero mensalidade · 93% de cada evento · PIX toda sexta
          </p>
        </div>

        {/* Urgência */}
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl px-5 py-4 flex items-center gap-3 mb-10">
          <span className="text-xl shrink-0">⏳</span>
          <p className="text-sm text-orange-300 leading-relaxed">
            <span className="font-bold">Restam 10 vagas de Churrasqueiro Fundador em São Paulo.</span>{' '}
            Após o preenchimento, novos cadastros entram na lista de espera sem o treinamento exclusivo com Jota.
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

export default function ConviteChurrasqueiro() {
  return (
    <Suspense>
      <ConviteContent />
    </Suspense>
  )
}
