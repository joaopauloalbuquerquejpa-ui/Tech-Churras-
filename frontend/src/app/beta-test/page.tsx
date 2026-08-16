export const metadata = {
  title: 'Roteiro de Teste (Beta)',
  robots: 'noindex,nofollow',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-bold text-orange-400 uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Step({ n, text, tip }: { n: number; text: string; tip?: string }) {
  return (
    <div className="flex gap-3 mb-3">
      <span className="shrink-0 w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold flex items-center justify-center mt-0.5">
        {n}
      </span>
      <div>
        <p className="text-sm text-gray-200 leading-relaxed">{text}</p>
        {tip && (
          <p className="text-xs text-yellow-400 mt-1 bg-yellow-500/10 rounded px-2 py-1">{tip}</p>
        )}
      </div>
    </div>
  )
}

function CheckCard({ title, steps, tips }: { title: string; steps: string[]; tips?: Record<number, string> }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-5">
      <h3 className="font-semibold text-white mb-4 text-sm">{title}</h3>
      {steps.map((s, i) => (
        <Step key={i} n={i + 1} text={s} tip={tips?.[i + 1]} />
      ))}
      <div className="mt-4 space-y-2 border-t border-gray-800 pt-3">
        <label className="flex items-center gap-2 text-xs text-gray-400">
          <input type="checkbox" className="accent-orange-500" /> Funcionou como esperado
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-400">
          <input type="checkbox" className="accent-orange-500" /> Funcionou com problema
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-400">
          <input type="checkbox" className="accent-orange-500" /> Nao funcionou
        </label>
      </div>
    </div>
  )
}

export default function BetaTestPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-5 py-4 sticky top-0 bg-gray-950 z-10">
        <p className="text-orange-500 font-black text-lg">Tech Churras</p>
        <p className="text-xs text-gray-500 -mt-0.5">Roteiro de Teste — Beta</p>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Aviso */}
        <div className="bg-orange-500/15 border border-orange-500/40 rounded-xl p-4 mb-8">
          <p className="text-orange-300 font-semibold text-sm mb-1">Voce e um testador beta!</p>
          <p className="text-orange-400/80 text-xs leading-relaxed">
            Este e um teste de produto real em desenvolvimento. Seus comentarios vao diretamente para a equipe.
            Nenhum pagamento real sera cobrado.
          </p>
        </div>

        {/* Cartao de teste */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-8">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Cartao de credito de teste</p>
          <p className="font-mono text-orange-400 text-base font-bold">5031 4332 1540 6351</p>
          <div className="flex gap-4 mt-1">
            <p className="text-xs text-gray-400">Validade: <span className="text-white">11/25</span></p>
            <p className="text-xs text-gray-400">CVV: <span className="text-white">123</span></p>
          </div>
          <p className="text-xs text-gray-600 mt-2">Ou escolha PIX e simule o pagamento na proxima tela.</p>
        </div>

        {/* PAPEL 1 - Cliente */}
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl px-5 py-3 mb-6">
          <p className="text-orange-300 font-bold text-sm">PAPEL 1 — Cliente</p>
          <p className="text-xs text-orange-400/80 mt-0.5">Voce quer contratar um churrasqueiro e comprar carnes para um evento.</p>
        </div>

        <Section title="1.1 Criar conta">
          <CheckCard
            title="Cadastro de cliente"
            steps={[
              'Acesse www.techchurras.com.br',
              'Clique em "Criar conta"',
              'Preencha nome, e-mail e senha (minimo 6 caracteres)',
              'Clique em "Criar conta"',
              'Voce deve ser redirecionado para o Dashboard',
            ]}
            tips={{ 5: 'Se aparecer "Email ja cadastrado", use um e-mail diferente — ex: seunome+teste@gmail.com' }}
          />
        </Section>

        <Section title="1.2 Tech Churras IA">
          <CheckCard
            title="Planejar evento com IA"
            steps={[
              'Clique em "Menu" no menu superior',
              'Clique em "Tech Churras IA" (icone robo)',
              'Escolha "Menu Tech Churras" e configure: 6 homens, 4 mulheres, 2 criancas, 4 horas',
              'Clique em "Planejar com Tech Churras IA"',
              'Verifique a lista de compras e as dicas do Grillmaster',
              'Role ate "Como e Feito" — confirme que aparecem descricoes dos pratos',
              'Repita com "Parrillada Tech Churras" e "Especialidade Jota Grillmaster"',
              'Confirme que cada menu traz itens diferentes e condizentes com o estilo',
            ]}
          />
        </Section>

        <Section title="1.3 Fazer um pedido">
          <CheckCard
            title="Criar pedido e pagar"
            steps={[
              'Clique em "Novo Pedido" no dashboard',
              'Escolha data, horario e endereco do evento',
              'Informe o numero de convidados',
              'Selecione um churrasqueiro disponivel',
              'Adicione itens de carne de um acougue parceiro (se disponivel)',
              'Aplique o cupom BEMVINDO10 (10% de desconto)',
              'Revise o resumo e clique em "Confirmar pedido"',
              'Selecione pagamento com o cartao de teste acima e finalize',
            ]}
          />
        </Section>

        <Section title="1.4 Avaliar o pedido">
          <CheckCard
            title="Avaliacao apos conclusao"
            steps={[
              'Quando o pedido estiver com status "Concluido", va ate o pedido',
              'Clique em "Avaliar"',
              'De nota de 1 a 5 estrelas e escreva um comentario',
              'Envie a avaliacao',
            ]}
          />
        </Section>

        {/* PAPEL 2 - Churrasqueiro */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-5 py-3 mb-6 mt-10">
          <p className="text-blue-300 font-bold text-sm">PAPEL 2 — Churrasqueiro</p>
          <p className="text-xs text-blue-400/80 mt-0.5">Use um e-mail diferente do papel 1.</p>
        </div>

        <Section title="2.1 Criar conta como churrasqueiro">
          <CheckCard
            title="Cadastro de churrasqueiro"
            steps={[
              'Acesse: www.techchurras.com.br/register?role=grillmaster',
              'Preencha nome, e-mail e senha',
              'Clique em "Criar conta"',
              'Voce deve ver o aviso "Cadastro de Churrasqueiro Parceiro"',
              'Gere e aceite o contrato de parceria quando solicitado',
            ]}
            tips={{ 2: 'Use um e-mail diferente do papel de cliente — ex: seunome+gm@gmail.com' }}
          />
        </Section>

        <Section title="2.2 Configurar perfil">
          <CheckCard
            title="Preencher dados do churrasqueiro"
            steps={[
              'No dashboard, acesse "Churrasqueiros" > "Meu perfil"',
              'Preencha: especialidades, preco por hora, foto e cidade',
              'Salve o perfil',
            ]}
          />
        </Section>

        <Section title="2.3 Receber e confirmar pedido">
          <CheckCard
            title="Gerenciar pedido"
            steps={[
              '(Peca a alguem fazendo o papel de Cliente para fazer um pedido para voce)',
              'Aguarde ou acesse "Pedidos" para ver o novo pedido',
              'Clique no pedido e em "Confirmar"',
              'Avance o status: Confirmado → A caminho → Em andamento → Concluido',
            ]}
          />
        </Section>

        {/* PAPEL 3 - Açougue */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-5 py-3 mb-6 mt-10">
          <p className="text-green-300 font-bold text-sm">PAPEL 3 — Acougue</p>
          <p className="text-xs text-green-400/80 mt-0.5">Use um terceiro e-mail diferente dos outros papeis.</p>
        </div>

        <Section title="3.1 Criar conta como acougue">
          <CheckCard
            title="Cadastro de acougue"
            steps={[
              'Acesse: www.techchurras.com.br/register?role=boutique',
              'Preencha nome, e-mail e senha',
              'Clique em "Criar conta"',
              'Voce deve ver o aviso "Cadastro de Acougue Parceiro"',
              'Gere e aceite o contrato de parceria quando solicitado',
            ]}
            tips={{ 2: 'Use um e-mail diferente — ex: seunome+acougue@gmail.com' }}
          />
        </Section>

        <Section title="3.2 Cadastrar o acougue">
          <CheckCard
            title="Configurar acougue parceiro"
            steps={[
              'Acesse "Acougues" > "Cadastrar acougue"',
              'Preencha nome, cidade, estado e descricao',
              'Salve',
            ]}
          />
        </Section>

        <Section title="3.3 Adicionar produtos">
          <CheckCard
            title="Cadastrar produtos no acougue"
            steps={[
              'No dashboard do acougue, va em "Produtos"',
              'Clique em "+ Adicionar produto" e cadastre: Nome: Picanha · Preco: R$ 89,90/kg',
              'Clique em "Adicionar por foto" e tire uma foto de um produto',
              'Confirme que a IA sugeriu nome, categoria e descricao automaticamente',
              'Revise e salve',
            ]}
          />
        </Section>

        <Section title="3.4 QR Code de indicacao">
          <CheckCard
            title="Testar link de indicacao"
            steps={[
              'No dashboard, localize o QR Code de indicacao',
              'Copie o link de indicacao',
              'Abra em aba anonima e crie uma nova conta de cliente',
              'Verifique se o desconto de 15% e aplicado em um pedido',
            ]}
          />
        </Section>

        {/* Feedback */}
        <div className="mt-10 mb-4">
          <h2 className="text-base font-bold text-white mb-4">Feedback Geral</h2>
          <div className="space-y-4">
            {[
              'O que foi mais facil de usar?',
              'O que foi mais dificil ou confuso?',
              'Alguma funcao que voce esperava mas nao encontrou?',
              'Como voce avaliaria o app de 1 a 10?',
              'Voce indicaria para amigos? Por que?',
            ].map((q, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-2">{i + 1}. {q}</p>
                <div className="w-full h-10 border border-gray-700 rounded-lg bg-gray-800" />
              </div>
            ))}
          </div>
        </div>

        {/* Como enviar */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mt-8 mb-10">
          <p className="font-semibold text-sm text-white mb-3">Como enviar seu feedback</p>
          <p className="text-sm text-gray-300 mb-1">
            Email: <a href="mailto:techchurras@gmail.com" className="text-orange-400 underline">techchurras@gmail.com</a>
          </p>
          <p className="text-sm text-gray-300">
            WhatsApp: <a href="https://wa.me/5511970593650" className="text-orange-400 underline">(11) 97059-3650</a>
          </p>
          <p className="text-xs text-gray-600 mt-3">Obrigado por ajudar a melhorar a Tech Churras!</p>
        </div>
      </main>
    </div>
  )
}
