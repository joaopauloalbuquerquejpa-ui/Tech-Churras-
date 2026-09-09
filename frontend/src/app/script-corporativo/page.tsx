import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Script de Prospecção B2B — Eventos Corporativos',
  robots: { index: false, follow: false },
}

function Tag({ children, color = 'orange' }: { children: React.ReactNode; color?: 'orange' | 'yellow' | 'green' | 'red' | 'gray' }) {
  const colors = {
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    green:  'bg-green-500/10  text-green-400  border-green-500/30',
    red:    'bg-red-500/10    text-red-400    border-red-500/30',
    gray:   'bg-gray-800      text-gray-400   border-gray-700',
  }
  return (
    <span className={`inline-block text-[10px] font-bold uppercase tracking-widest border px-2.5 py-0.5 rounded-full ${colors[color]}`}>
      {children}
    </span>
  )
}

function Step({ n, label, color = 'orange' }: { n: string; label: string; color?: 'orange' | 'yellow' | 'green' }) {
  const colors = { orange: 'bg-orange-500', yellow: 'bg-yellow-500', green: 'bg-green-500' }
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-7 h-7 rounded-full ${colors[color]} text-black text-xs font-black flex items-center justify-center shrink-0`}>
        {n}
      </div>
      <p className="font-black text-white text-base">{label}</p>
    </div>
  )
}

function Fala({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border-l-4 border-orange-500 rounded-r-xl px-4 py-3 my-3">
      <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest mb-1">Falar / Escrever:</p>
      <p className="text-gray-200 text-sm leading-relaxed italic whitespace-pre-line">"{children}"</p>
    </div>
  )
}

function Objecao({ pergunta, resposta }: { pergunta: string; resposta: string }) {
  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden mb-3">
      <div className="bg-red-500/5 border-b border-gray-800 px-4 py-2.5 flex items-start gap-2">
        <span className="text-red-400 text-xs mt-0.5 shrink-0">❌</span>
        <p className="text-red-300 text-sm font-medium italic">"{pergunta}"</p>
      </div>
      <div className="px-4 py-2.5 flex items-start gap-2">
        <span className="text-green-400 text-xs mt-0.5 shrink-0">✅</span>
        <p className="text-gray-300 text-sm leading-relaxed italic">"{resposta}"</p>
      </div>
    </div>
  )
}

function Dica({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 bg-yellow-500/5 border border-yellow-500/20 rounded-xl px-4 py-3 my-3">
      <span className="text-yellow-400 shrink-0">💡</span>
      <p className="text-yellow-200 text-xs leading-relaxed">{children}</p>
    </div>
  )
}

export default function ScriptCorporativo() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* HEADER */}
      <div className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-black text-white">Tech <span className="text-orange-500">Churras</span></p>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Prospecção B2B · uso interno</p>
          </div>
          <Tag color="gray">Confidencial</Tag>
        </div>
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {[
            { href: '#icp', label: '🎯 Quem procurar' },
            { href: '#onde', label: '🔎 Onde achar' },
            { href: '#linkedin', label: '💼 LinkedIn' },
            { href: '#email', label: '✉️ E-mail' },
            { href: '#objecoes', label: '📋 Objeções' },
          ].map(l => (
            <a key={l.href} href={l.href}
              className="shrink-0 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors">
              {l.label}
            </a>
          ))}
        </div>
      </div>

      <div className="px-5 py-6 space-y-10">

        {/* CONTEXTO */}
        <section>
          <div className="bg-gray-900 border border-orange-500/20 rounded-2xl p-5">
            <p className="text-sm text-gray-300 leading-relaxed">
              A Tech Churras não é só marketplace de churrasqueiro — é fornecedor de <strong className="text-white">evento
              corporativo completo</strong>. O ticket de empresa é maior que o de pessoa física, e empresa repete o pedido
              (confra, team building, lançamento, evento de cliente) várias vezes por ano. É o canal com maior potencial
              de receita recorrente da plataforma hoje.
            </p>
          </div>
        </section>

        {/* ICP */}
        <section id="icp">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">🎯</span>
            <div>
              <p className="font-black text-white text-xl">Quem procurar</p>
              <p className="text-xs text-gray-500">O perfil de empresa e de cargo que decide mais rápido</p>
            </div>
          </div>

          <div className="grid gap-3 mb-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-sm font-bold text-white mb-1">Porte da empresa</p>
              <p className="text-sm text-gray-400">50 a 500 funcionários, em São Paulo capital ou grande SP. Empresa pequena demais não tem orçamento de evento; grande demais tem processo de compra lento demais pra prospecção direta.</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-sm font-bold text-white mb-1">Setor com maior taxa de fechamento</p>
              <p className="text-sm text-gray-400">Tech/startups, escritórios de advocacia e consultoria, agências de marketing/publicidade — cultura de evento de equipe já é comum, decisão é mais rápida que indústria tradicional.</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-sm font-bold text-white mb-1">Cargo-alvo</p>
              <p className="text-sm text-gray-400">
                <strong className="text-orange-400">RH / People / Employee Experience</strong> — confraternização, team building.<br/>
                <strong className="text-orange-400">Facilities / Administrativo</strong> — quem fecha fornecedor de evento interno.<br/>
                <strong className="text-orange-400">Marketing / Eventos</strong> — lançamento de produto, evento de cliente.
              </p>
            </div>
          </div>
          <Dica>
            Setembro a outubro é o pico de decisão de confra de dezembro — priorize prospecção nesses meses, mas
            mantenha o pipeline rodando o ano todo pros outros tipos de evento.
          </Dica>
        </section>

        {/* ONDE ACHAR */}
        <section id="onde">
          <Step n="1" label="Onde encontrar contato" />
          <div className="space-y-2 text-sm text-gray-300">
            <p>📍 <strong>LinkedIn Sales Navigator</strong> — filtro de cargo (RH, People, Facilities, Eventos) + porte da empresa (51-500) + localização (São Paulo)</p>
            <p>📍 <strong>Grupos de RH</strong> no LinkedIn e Facebook (ex: comunidades de "RH Brasil", "People Analytics")</p>
            <p>📍 <strong>Coworkings corporativos</strong> — parceria de indicação com quem administra o espaço, eles sabem quais empresas-cliente estão planejando evento</p>
            <p>📍 <strong>Agências de evento corporativo</strong> que não têm churrasqueiro próprio — parceria de subcontratação</p>
          </div>
        </section>

        {/* LINKEDIN */}
        <section id="linkedin">
          <Step n="2" label="Abordagem via LinkedIn — mensagem direta" />
          <Fala>
            Oi [nome], tudo bem? Vi que você cuida de [RH / eventos / facilities] na [empresa]. Trabalho com a Tech
            Churras — a gente monta o churrasco corporativo completo (churrasqueiro profissional + carnes calculadas
            por pessoa + preço fechado) pra confraternização, team building ou qualquer evento de equipe. Faz sentido
            eu te mandar uma proposta rápida, sem compromisso?
          </Fala>
          <Dica>
            Mensagem curta converte mais no LinkedIn do que mensagem longa. Se responder "manda mais informação",
            aí sim envia o link de techchurras.com.br/churrasco-corporativo.
          </Dica>
        </section>

        {/* EMAIL */}
        <section id="email">
          <Step n="3" label="E-mail frio — se não tiver LinkedIn" />
          <Fala>
            Assunto: Churrasco corporativo pra [Empresa] — proposta em 24h{'\n\n'}
            Olá [nome],{'\n\n'}
            Sou da Tech Churras — resolvemos evento corporativo com churrasco completo: churrasqueiro profissional,
            carnes de açougue parceiro calculadas por pessoa, e preço fechado antes de você aprovar (sem susto de
            orçamento estourado nem carne acabando no meio do evento).{'\n\n'}
            Atendemos confraternização, team building, lançamento de produto e evento de cliente em São Paulo. Se
            fizer sentido, consigo te mandar uma proposta em até 24h — é só me dizer número de convidados e data
            aproximada.{'\n\n'}
            Abraço,{'\n'}[seu nome] — Tech Churras
          </Fala>
        </section>

        {/* OBJEÇÕES */}
        <section id="objecoes">
          <Step n="4" label="Objeções mais comuns" color="yellow" />

          <Objecao
            pergunta="Já temos fornecedor de evento"
            resposta="Sem problema — muita empresa usa a gente especificamente pra churrasco, mesmo já tendo fornecedor de buffet padrão pra outros formatos. Não precisa trocar de fornecedor geral, é só pro dia que fizer sentido churrasco."
          />
          <Objecao
            pergunta="Não temos orçamento agora / orçamento já fechado"
            resposta="Entendo. Posso te mandar a proposta mesmo assim, pra você ter em mãos quando o orçamento do próximo trimestre abrir? Assim já garante a data antes que fique disputada."
          />
          <Objecao
            pergunta="Precisamos de nota fiscal e contrato formal"
            resposta="Sem problema, emitimos nota fiscal e fazemos contrato formal de prestação de serviço — toda empresa que fecha com a gente precisa disso pra passar pelo financeiro."
          />
          <Objecao
            pergunta="É muito caro comparado a buffet tradicional"
            resposta="O preço fechado já inclui churrasqueiro profissional, carne calculada pra não faltar nem sobrar, e execução garantida — muita empresa troca de buffet genérico exatamente porque o churrasco vira o ponto alto do evento, não só comida de fundo."
          />
          <Objecao
            pergunta="Quem garante que vai dar certo no dia?"
            resposta="Rastreamento por GPS do churrasqueiro no dia, equipe de suporte acompanhando à distância, e política de reembolso se algo falhar. A gente assume a responsabilidade da execução, não só indica um prestador."
          />
        </section>

      </div>
    </div>
  )
}
