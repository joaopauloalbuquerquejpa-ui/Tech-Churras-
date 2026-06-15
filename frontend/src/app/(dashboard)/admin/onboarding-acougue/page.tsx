'use client'
import { useState } from 'react'

const LINK_CADASTRO = 'https://www.techchurras.com.br/register?role=BOUTIQUE'

const STEPS = [
  {
    fase: 'Antes da visita',
    cor: 'blue',
    items: [
      { label: 'Confirmar o nome do responsável e cargo', done: false },
      { label: 'Anotar o nome do açougue e endereço', done: false },
      { label: 'Levar celular carregado e com 4G', done: false },
      { label: 'Abrir o link de cadastro no celular: ' + LINK_CADASTRO, done: false },
      { label: 'Preparar o QR code da placa do balcão para mostrar como exemplo', done: false },
    ],
  },
  {
    fase: 'Abertura — primeiros 5 minutos',
    cor: 'orange',
    script: '"Você já teve clientes que compraram carne aqui pra fazer um churrasco grande? Com a Tech Churras, esses mesmos clientes fecham tudo pelo app — carne, churrasqueiro e acompanhamentos — e você continua vendendo normal, só que agora com pedidos que chegam automaticamente no seu celular."',
    items: [
      { label: 'Mostrar o app no celular (página inicial)', done: false },
      { label: 'Mostrar o fluxo do cliente criando um pedido', done: false },
      { label: 'Mostrar como o açougue recebe WhatsApp automático com o pedido', done: false },
    ],
  },
  {
    fase: 'As 3 frentes de faturamento',
    cor: 'orange',
    script: '"Você tem 3 formas de ganhar com a Tech Churras. Primeira: clientes que nunca vieram aqui passam a te encontrar pelo app. Segunda: clientes que já compram aqui no balcão você converte em pedido digital com um QR code — a gente imprime a placa para você colocar no caixa. Terceira, no futuro: se quiser, sua própria equipe de churrasqueiros atende eventos e aumenta seu faturamento ainda mais."',
    items: [
      { label: 'Mostrar a seção "3 Frentes" no dashboard do açougue', done: false },
      { label: 'Mostrar o QR code do balcão como exemplo', done: false },
      { label: 'Deixar ele escanear o QR e ver o fluxo na prática', done: false },
    ],
  },
  {
    fase: 'Cadastro na hora — abrir o app junto',
    cor: 'green',
    script: '"Vamos fazer o cadastro agora, leva 3 minutos. Você já começa aprovado."',
    items: [
      { label: 'Abrir link: ' + LINK_CADASTRO, done: false },
      { label: 'Preencher nome do responsável + email + telefone + senha', done: false },
      { label: 'Entrar no dashboard do açougue e mostrar o que verá', done: false },
      { label: 'Ajudar a cadastrar os 3 primeiros produtos (pelo menos 1 carne nobre + 1 acompanhamento)', done: false },
      { label: 'Tirar foto dos produtos com o celular e fazer upload', done: false },
      { label: 'Aprovar o açougue no painel admin agora mesmo', done: false },
      { label: 'Abrir a loja (toggle "Loja aberta")', done: false },
    ],
  },
  {
    fase: 'Placa do balcão',
    cor: 'green',
    script: '"A gente imprime uma placa personalizada pra você colocar no caixa. Qualquer cliente que chega aqui e vai fazer churrasco escaneia e fecha tudo pelo app. Você vende a carne e pode vender os acompanhamentos também."',
    items: [
      { label: 'Abrir /boutiques/dashboard/qrcode-eventos no celular do dono', done: false },
      { label: 'Mandar imprimir a placa ou deixar o link para ele imprimir', done: false },
      { label: 'Explicar onde posicionar (caixa, balcão principal, porta)', done: false },
    ],
  },
  {
    fase: 'Fechamento e próximos passos',
    cor: 'purple',
    script: '"Agora você já está na plataforma. Nosso sistema avisa você no WhatsApp quando chegar um pedido. Você separa os cortes, o churrasqueiro retira e o cliente paga pelo app. Simples assim."',
    items: [
      { label: 'Salvar o contato do responsável no WhatsApp', done: false },
      { label: 'Enviar o link do dashboard por WhatsApp para ele bookmarkar', done: false },
      { label: 'Combinar quando você volta para ver os primeiros resultados (15 dias)', done: false },
      { label: 'Tirar uma foto juntos para usar como case de sucesso depois', done: false },
    ],
  },
]

const COR: Record<string, string> = {
  blue:   'border-blue-500/40 bg-blue-500/10',
  orange: 'border-orange-500/40 bg-orange-500/10',
  green:  'border-green-500/40 bg-green-500/10',
  purple: 'border-purple-500/40 bg-purple-500/10',
}
const BADGE: Record<string, string> = {
  blue:   'bg-blue-500/20 text-blue-400',
  orange: 'bg-orange-500/20 text-orange-400',
  green:  'bg-green-500/20 text-green-400',
  purple: 'bg-purple-500/20 text-purple-400',
}

export default function OnboardingAcouguePage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  function toggle(key: string) {
    setChecked(p => ({ ...p, [key]: !p[key] }))
  }

  const totalItems = STEPS.reduce((acc, s) => acc + s.items.length, 0)
  const totalDone = Object.values(checked).filter(Boolean).length
  const pct = Math.round((totalDone / totalItems) * 100)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">🥩 Roteiro — Onboarding Presencial do Açougue</h1>
        <p className="text-gray-400 text-sm mt-1">Siga essa ordem durante a visita. Marque cada item conforme avança.</p>
      </div>

      {/* Progresso */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Progresso da visita</span>
          <span className="font-bold text-orange-400">{totalDone}/{totalItems} itens</span>
        </div>
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 rounded-full transition-all duration-500"
            style={{ width: pct + '%' }}
          />
        </div>
        {pct === 100 && (
          <p className="text-green-400 text-sm font-bold mt-2 text-center">🏆 Onboarding concluído! Tire a foto e celebre.</p>
        )}
      </div>

      {/* Link rápido */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex items-center gap-3">
        <span className="text-2xl">🔗</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 mb-0.5">Link de cadastro para compartilhar</p>
          <p className="text-orange-400 text-sm font-mono truncate">{LINK_CADASTRO}</p>
        </div>
        <button
          onClick={() => navigator.clipboard?.writeText(LINK_CADASTRO)}
          className="shrink-0 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg"
        >
          Copiar
        </button>
      </div>

      {/* Steps */}
      {STEPS.map((step, si) => (
        <div key={si} className={`border rounded-2xl p-5 ${COR[step.cor]}`}>
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${BADGE[step.cor]}`}>
              {si + 1}
            </span>
            <h2 className="font-bold text-white">{step.fase}</h2>
            <span className="ml-auto text-xs text-gray-500">
              {step.items.filter((_, ii) => checked[`${si}-${ii}`]).length}/{step.items.length}
            </span>
          </div>

          {step.script && (
            <div className="bg-black/30 border border-gray-700/50 rounded-xl px-4 py-3 mb-3">
              <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">Script — fale exatamente assim:</p>
              <p className="text-sm text-gray-200 italic leading-relaxed">{step.script}</p>
            </div>
          )}

          <div className="space-y-2">
            {step.items.map((item, ii) => {
              const key = `${si}-${ii}`
              const done = !!checked[key]
              return (
                <label key={ii} className={`flex items-start gap-3 cursor-pointer rounded-xl px-3 py-2.5 transition-colors ${done ? 'bg-green-500/10' : 'bg-black/20 hover:bg-black/30'}`}>
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={() => toggle(key)}
                    className="accent-orange-500 mt-0.5 shrink-0 w-4 h-4"
                  />
                  <span className={`text-sm leading-snug ${done ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                    {item.label}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      ))}

      {/* Dicas finais */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h3 className="font-semibold text-white mb-3">💡 Dicas para a visita</h3>
        <ul className="space-y-2 text-sm text-gray-400">
          <li>• <strong className="text-white">Não venda demais antes de mostrar.</strong> Coloque o app na mão do dono e deixe ele interagir.</li>
          <li>• <strong className="text-white">Foque nos primeiros 2 produtos.</strong> Não precisa cadastrar tudo na hora — o que importa é ele ver o pedido funcionando.</li>
          <li>• <strong className="text-white">WhatsApp é o argumento mais forte.</strong> Mostre na hora que o celular dele recebe a notificação quando um pedido chega.</li>
          <li>• <strong className="text-white">Se ele perguntar de preço:</strong> "Você não paga nada para entrar. A Tech Churras recebe comissão só quando você vende. Se não vender, não paga nada."</li>
          <li>• <strong className="text-white">Duração ideal:</strong> 30-45 minutos. Se passar de 1 hora, foque no cadastro e marque uma segunda visita para os produtos.</li>
        </ul>
      </div>

      <p className="text-center text-xs text-gray-600 pb-8">Tech Churras — Roteiro interno · não compartilhar com parceiros</p>
    </div>
  )
}
