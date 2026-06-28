import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Script de Abordagem — Equipe Tech Churras',
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
  const colors = {
    orange: 'bg-orange-500',
    yellow: 'bg-yellow-500',
    green:  'bg-green-500',
  }
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
      <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest mb-1">Falar:</p>
      <p className="text-gray-200 text-sm leading-relaxed italic">"{children}"</p>
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

export default function ScriptEquipe() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* HEADER */}
      <div className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-black text-white">Tech <span className="text-orange-500">Churras</span></p>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Script da equipe · uso interno</p>
          </div>
          <Tag color="gray">Confidencial</Tag>
        </div>
        {/* Navegação rápida */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {[
            { href: '#acougue', label: '🥩 Açougue' },
            { href: '#churrasqueiro', label: '👨‍🍳 Churrasqueiro' },
            { href: '#regras', label: '📋 Regras' },
          ].map(l => (
            <a key={l.href} href={l.href}
              className="shrink-0 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors">
              {l.label}
            </a>
          ))}
        </div>
      </div>

      <div className="px-5 py-6 space-y-10">

        {/* ═══════════════════════════════════════════
            SCRIPT 1 — AÇOUGUE
        ═══════════════════════════════════════════ */}
        <section id="acougue">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">🥩</span>
            <div>
              <p className="font-black text-white text-xl">Script — Açougue</p>
              <p className="text-xs text-gray-500">Visita presencial ao dono ou gerente</p>
            </div>
          </div>

          {/* Antes de entrar */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
            <Tag color="gray">Antes de entrar</Tag>
            <div className="mt-3 space-y-1.5 text-sm text-gray-400">
              <p>✓ Abrir <strong className="text-white">techchurras.com.br/pitch-acougue</strong> no celular</p>
              <p>✓ Tela no brilho máximo</p>
              <p>✓ Saber o nome do bairro e dos açougues concorrentes próximos</p>
              <p>✓ Confirmar que a vaga do bairro ainda está disponível</p>
            </div>
          </div>

          {/* Passo 1 */}
          <div className="mb-6">
            <Step n="1" label="Abertura — primeiros 30 segundos" />
            <Fala>
              Boa tarde! Meu nome é [seu nome], sou representante da Tech Churras — uma plataforma
              de churrasco que está lançando em São Paulo. Posso falar 5 minutos com o responsável?
              É uma oportunidade de parceria, sem custo nenhum pra vocês.
            </Fala>
            <Dica>
              Se disserem "o dono não está" — pergunte quando ele volta e peça o WhatsApp.
              Não deixe sem contato.
            </Dica>
          </div>

          {/* Passo 2 */}
          <div className="mb-6">
            <Step n="2" label="O gancho — falar antes de mostrar o celular" />
            <Fala>
              Deixa eu te explicar rápido o que é. A Tech Churras conecta clientes que querem
              fazer churrasco com churrasqueiros profissionais. Quando um cliente fecha o pedido
              no app, o churrasqueiro passa aqui no balcão e retira a carne. Vocês fornecem a
              carne, recebem via PIX toda sexta, e não mudam nada na operação de vocês.
              Sem entrega, sem logística, sem custo pra entrar.
            </Fala>
          </div>

          {/* Passo 3 */}
          <div className="mb-6">
            <Step n="3" label="Mostrar o celular" />
            <div className="bg-gray-900 border border-orange-500/20 rounded-xl p-4">
              <p className="text-xs text-orange-400 font-bold mb-2">MOSTRAR A TELA — rolar devagar enquanto fala</p>
              <div className="space-y-2 text-sm text-gray-300">
                <p>📱 Abrir <strong>techchurras.com.br/pitch-acougue</strong></p>
                <p>→ Mostrar os três números: R$0, 7%, PIX</p>
                <p>→ Rolar até "Como funciona" e explicar os 4 passos</p>
                <p>→ Mostrar a estimativa de renda (5 / 20 / 40 eventos)</p>
                <p>→ Mostrar o Pacote Fundador — enfatizar "só 1 por bairro"</p>
              </div>
            </div>
            <Dica>
              Não fique falando enquanto ele lê. Silêncio de 10 segundos enquanto a pessoa
              lê os números é normal — deixa ela processar.
            </Dica>
          </div>

          {/* Passo 4 */}
          <div className="mb-6">
            <Step n="4" label="A oferta — criar urgência real" />
            <Fala>
              A gente está fechando só um açougue por bairro em São Paulo. Os primeiros que
              fecharem entram como Parceiro Fundador — três meses sem mensalidade e destaque
              nas buscas por seis meses. Depois disso, quando o bairro de vocês fechar, a
              próxima oportunidade vai ser sem esse benefício. O seu concorrente aqui no bairro
              já sabe disso?
            </Fala>
            <Dica>
              A pergunta sobre o concorrente ativa o instinto competitivo. Não é manipulação —
              é verdade. Quem fechar primeiro leva a vaga.
            </Dica>
          </div>

          {/* Objeções */}
          <div className="mb-6">
            <Step n="5" label="Objeções mais comuns" color="yellow" />

            <Objecao
              pergunta="Não tenho tempo pra ficar olhando app"
              resposta="O app não precisa de atenção constante. O pedido chega, você separa a carne como faria para qualquer cliente, e o churrasqueiro retira. No início pode ser 1 ou 2 pedidos por semana — nada que mude sua rotina. Com o tempo, você decide se quer escalar."
            />
            <Objecao
              pergunta="7% de comissão é muito"
              resposta="É 7% sobre o que você vender a mais — receita que não existe hoje. Você não paga nada se não vier pedido nenhum. E nos três primeiros meses como Fundador, a mensalidade é zero. O risco financeiro é literalmente zero."
            />
            <Objecao
              pergunta="Nunca ouvi falar dessa plataforma"
              resposta="É porque está lançando agora. É exatamente por isso que vale entrar hoje — você pega a vaga do seu bairro antes de qualquer concorrente. Quem entrou na Ifood nos primeiros meses saiu na frente por anos."
            />
            <Objecao
              pergunta="Preciso pensar"
              resposta="Claro, faz sentido. Mas deixa eu te conectar direto com o Jota, o fundador — ele está em Zanzibar agora, criando um restaurante com o governo de lá, e responde pessoalmente no WhatsApp. Você tira qualquer dúvida com ele. Posso mandar o contato agora?"
            />
            <Objecao
              pergunta="Não faço nada sem falar com meu sócio / esposa / contador"
              resposta="Perfeito. Manda o link pra ele dar uma olhada agora mesmo — [abrir pitch-acougue e mandar o link]. E o Jota pode fazer uma call com vocês dois se precisar. Quando seria uma boa hora?"
            />
          </div>

          {/* Fechar */}
          <div className="mb-2">
            <Step n="6" label="Fechar — sempre sair com algo" color="green" />
            <div className="space-y-3">
              <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
                <p className="text-xs text-green-400 font-bold mb-2">Melhor cenário — fecha na hora:</p>
                <Fala>Posso te cadastrar agora direto pelo app? Leva menos de 5 minutos.</Fala>
                <p className="text-xs text-gray-500 mt-2">→ Abrir <strong className="text-white">techchurras.com.br/register?role=boutique</strong></p>
              </div>
              <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
                <p className="text-xs text-yellow-400 font-bold mb-2">Segundo melhor — sair com o WhatsApp:</p>
                <Fala>
                  Entendo. Deixa eu te mandar o link da proposta agora no seu WhatsApp — e o
                  contato do Jota. Se tiver alguma dúvida, é só chamar ele diretamente.
                  Qual seu número?
                </Fala>
                <p className="text-xs text-gray-500 mt-2">→ Mandar: link do pitch + número do Jota</p>
              </div>
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                <p className="text-xs text-red-400 font-bold mb-2">Nunca saia sem:</p>
                <p className="text-sm text-gray-400">Nome do responsável + WhatsApp. Sem contato = visita perdida.</p>
              </div>
            </div>
          </div>
        </section>

        <div className="border-t border-gray-800" />

        {/* ═══════════════════════════════════════════
            SCRIPT 2 — CHURRASQUEIRO
        ═══════════════════════════════════════════ */}
        <section id="churrasqueiro">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">👨‍🍳</span>
            <div>
              <p className="font-black text-white text-xl">Script — Churrasqueiro</p>
              <p className="text-xs text-gray-500">Abordagem presencial ou via indicação</p>
            </div>
          </div>

          {/* Antes de abordar */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
            <Tag color="gray">Antes de abordar</Tag>
            <div className="mt-3 space-y-1.5 text-sm text-gray-400">
              <p>✓ Abrir <strong className="text-white">techchurras.com.br/pitch-churrasqueiro</strong></p>
              <p>✓ Saber quantos eventos por mês ele faz hoje (pergunta cedo)</p>
              <p>✓ Confirmar que ainda há vagas de Churrasqueiro Fundador disponíveis</p>
            </div>
          </div>

          {/* Passo 1 */}
          <div className="mb-6">
            <Step n="1" label="Abertura" />
            <Fala>
              Oi, tudo bem? Você trabalha com churrasco profissional, né? Sou representante
              da Tech Churras — uma plataforma que está lançando em SP e conecta churrasqueiros
              profissionais com clientes. Tenho uma proposta sem custo nenhum, posso falar
              dois minutos?
            </Fala>
            <Dica>
              Churrasqueiro é diferente de açougue. Ele provavelmente já tem clientes por
              indicação e pode achar que não precisa de mais. O gancho certo é: renda
              recorrente sem depender de indicação.
            </Dica>
          </div>

          {/* Passo 2 */}
          <div className="mb-6">
            <Step n="2" label="O problema que você resolve" />
            <Fala>
              Deixa eu te perguntar uma coisa: nos meses que o movimento está fraco, você
              consegue encher a agenda só por indicação? A maioria dos churrasqueiros que
              a gente conversa fala que os pedidos são irregulares — às vezes cheio, às
              vezes vazio. A Tech Churras resolve isso. Você tem pedidos chegando direto
              no celular, na sua região, nos dias que você está disponível.
            </Fala>
          </div>

          {/* Passo 3 */}
          <div className="mb-6">
            <Step n="3" label="A proposta em 30 segundos" />
            <Fala>
              É assim: zero mensalidade. Você cria o perfil, define seu preço por hora e
              sua agenda. Quando aparecer um pedido na sua região, você recebe a notificação,
              aceita ou não. Se fizer o evento, recebe 93% do valor no PIX toda sexta. A
              gente fica com 7% só quando você realiza um evento — mês sem evento, zero custo.
            </Fala>
          </div>

          {/* Passo 4 — celular */}
          <div className="mb-6">
            <Step n="4" label="Mostrar o celular" />
            <div className="bg-gray-900 border border-yellow-500/20 rounded-xl p-4">
              <p className="text-xs text-yellow-400 font-bold mb-2">MOSTRAR A TELA — rolar devagar</p>
              <div className="space-y-2 text-sm text-gray-300">
                <p>📱 Abrir <strong>techchurras.com.br/pitch-churrasqueiro</strong></p>
                <p>→ Mostrar: R$0 mensalidade, 93% você recebe, PIX toda sexta</p>
                <p>→ Mostrar a tabela de ganhos (4 / 8 / 15 eventos)</p>
                <p>→ Mostrar o Chancelamento Jota — enfatizar o treinamento presencial</p>
                <p>→ Mostrar as 10 vagas de Churrasqueiro Fundador</p>
              </div>
            </div>
            <Dica>
              O chancelamento é o que diferencia de outros apps. Enfatize que não é "mais um
              aplicativo de freela" — é uma rede de profissionais certificados pelo Jota.
              Isso valoriza o trabalho dele.
            </Dica>
          </div>

          {/* Passo 5 — urgência */}
          <div className="mb-6">
            <Step n="5" label="A oferta — 10 vagas Fundador" />
            <Fala>
              Os primeiros dez churrasqueiros que entrarem em SP viram Churrasqueiro Fundador.
              Você tem treinamento presencial com o Jota — que tem 1.800 eventos feitos,
              já fez para Madonna, Lady Gaga, Neymar — badge permanente no app e prioridade
              máxima nas buscas por seis meses. Essas vagas estão acabando. Você seria um
              dos primeiros da plataforma em SP.
            </Fala>
          </div>

          {/* Objeções */}
          <div className="mb-6">
            <Step n="6" label="Objeções mais comuns" color="yellow" />

            <Objecao
              pergunta="Já tenho clientes suficientes por indicação"
              resposta="Ótimo — isso mostra que você tem qualidade. A diferença é que indicação é irregular. Com a plataforma, você escolhe quantos eventos quer pegar por mês e preenche os buracos na agenda nos dias que ficaria parado. Não substitui seus clientes atuais — complementa."
            />
            <Objecao
              pergunta="7% é caro"
              resposta="Compara com o custo de você mesmo ir buscar cliente — Instagram, panfleto, indicação que não vem todo mês. A plataforma manda o pedido pronto pra você. Os 7% pagam esse trabalho todo. E zero mensalidade — se não tiver pedido, você não paga nada."
            />
            <Objecao
              pergunta="Não quero depender de app"
              resposta="Não é dependência — é mais um canal. Você continua com seus clientes de sempre. O app só aparece nos dias que você marcou como disponível. Você está no controle."
            />
            <Objecao
              pergunta="Nunca ouvi falar do Jota Albuquerque"
              resposta="Procura ele agora — Jota Albuquerque churrasqueiro. [Abrir Google ou Instagram] Ele tem o Bahari of Brazil em Zanzibar, parceria com o governo de lá. É o churrasqueiro com maior credencial internacional do Brasil. O treinamento com ele agrega valor direto no seu perfil."
            />
            <Objecao
              pergunta="Deixa eu ver com calma"
              resposta="Claro. Mas as 10 vagas de Fundador são por ordem de chegada. Posso te conectar agora no WhatsApp com o Jota? Ele responde pessoalmente e você tira qualquer dúvida — sem compromisso."
            />
          </div>

          {/* Fechar */}
          <div>
            <Step n="7" label="Fechar" color="green" />
            <div className="space-y-3">
              <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
                <p className="text-xs text-green-400 font-bold mb-2">Melhor cenário — cadastro na hora:</p>
                <Fala>Posso criar seu perfil agora? Leva menos de 5 minutos e você já fica na fila das vagas Fundador.</Fala>
                <p className="text-xs text-gray-500 mt-2">→ Abrir <strong className="text-white">techchurras.com.br/register?role=grillmaster</strong></p>
              </div>
              <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
                <p className="text-xs text-yellow-400 font-bold mb-2">Segundo melhor — WhatsApp do Jota:</p>
                <Fala>
                  Deixa eu mandar o link da proposta e o contato do Jota no seu WhatsApp.
                  Ele responde hoje ainda. Qual seu número?
                </Fala>
              </div>
            </div>
          </div>
        </section>

        <div className="border-t border-gray-800" />

        {/* ═══════════════════════════════════════════
            REGRAS GERAIS
        ═══════════════════════════════════════════ */}
        <section id="regras">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">📋</span>
            <div>
              <p className="font-black text-white text-xl">Regras da equipe</p>
              <p className="text-xs text-gray-500">Leia antes da primeira visita</p>
            </div>
          </div>

          <div className="space-y-3">

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="font-bold text-white mb-3">✅ O que você pode prometer</p>
              <div className="space-y-1.5 text-sm text-gray-400">
                <p>• Zero custo de entrada</p>
                <p>• 3 meses grátis para Parceiro Fundador açougue</p>
                <p>• Treinamento presencial com Jota para Churrasqueiro Fundador</p>
                <p>• 7% de comissão só quando o evento é realizado</p>
                <p>• Repasse semanal via PIX toda sexta</p>
                <p>• 1 vaga de açougue por bairro</p>
                <p>• 10 vagas de Churrasqueiro Fundador no total em SP</p>
              </div>
            </div>

            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
              <p className="font-bold text-white mb-3">❌ O que você NÃO pode prometer</p>
              <div className="space-y-1.5 text-sm text-gray-400">
                <p>• Volume garantido de pedidos ("você vai ter X pedidos por mês")</p>
                <p>• Data exata de treinamento presencial com Jota</p>
                <p>• Funcionalidades que ainda não existem no app</p>
                <p>• Condições comerciais diferentes das descritas aqui</p>
                <p>• Prazos que o Jota não confirmou</p>
              </div>
              <p className="text-xs text-red-400 mt-3 font-semibold">
                Se não sabe a resposta → "Vou confirmar com o Jota e te aviso ainda hoje."
              </p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="font-bold text-white mb-3">📊 O que registrar depois de cada visita</p>
              <div className="space-y-1.5 text-sm text-gray-400">
                <p>• Nome do estabelecimento / pessoa</p>
                <p>• Bairro e cidade</p>
                <p>• WhatsApp do responsável</p>
                <p>• Resultado: fechou / interesse / sem interesse / voltar</p>
                <p>• Observação: principal objeção ou dúvida levantada</p>
              </div>
              <p className="text-xs text-gray-500 mt-3">Registrar no mesmo dia — memória falha.</p>
            </div>

            <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-5">
              <p className="font-bold text-white mb-3">💰 Comissão da equipe</p>
              <div className="space-y-3 text-sm mb-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-300 font-semibold">🥩 Açougue parceiro fechado</span>
                    <span className="font-black text-orange-400 text-base">R$ 300</span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500 pl-1">
                    <span>R$ 150 na assinatura</span>
                    <span>+</span>
                    <span>R$ 150 no 1º pagamento</span>
                  </div>
                </div>
                <div className="border-t border-gray-800 pt-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-300 font-semibold">👨‍🍳 Churrasqueiro onboarded</span>
                    <span className="font-black text-orange-400 text-base">R$ 50</span>
                  </div>
                  <p className="text-xs text-gray-500 pl-1">Pago após 30 dias ativo com perfil completo</p>
                </div>
              </div>
              <div className="bg-black/30 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-2 font-semibold">Simulação mensal:</p>
                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex justify-between"><span>5 açougues + 10 churrasqueiros</span><span className="text-green-400 font-bold">R$ 2.000</span></div>
                  <div className="flex justify-between"><span>8 açougues + 15 churrasqueiros</span><span className="text-green-400 font-bold">R$ 3.150</span></div>
                  <div className="flex justify-between"><span>12 açougues + 20 churrasqueiros</span><span className="text-green-400 font-bold">R$ 4.600</span></div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Contatos */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="font-bold text-white mb-3">📞 Contatos de suporte</p>
          <div className="space-y-2 text-sm text-gray-400">
            <p>🔥 Jota Albuquerque (fundador): <strong className="text-white">+55 11 97059-3650</strong></p>
            <p>🔗 Pitch açougue: <strong className="text-white">techchurras.com.br/pitch-acougue</strong></p>
            <p>🔗 Pitch churrasqueiro: <strong className="text-white">techchurras.com.br/pitch-churrasqueiro</strong></p>
            <p>🔗 Cadastro açougue: <strong className="text-white">techchurras.com.br/register?role=boutique</strong></p>
            <p>🔗 Cadastro churrasqueiro: <strong className="text-white">techchurras.com.br/register?role=grillmaster</strong></p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-700 pb-4">
          Tech Churras · Uso interno · Não compartilhar externamente
        </p>

      </div>
    </div>
  )
}
