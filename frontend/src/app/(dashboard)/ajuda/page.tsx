'use client'
import { useState } from 'react'

const WHATSAPP = 'https://wa.me/5511999999999'

const FAQ: Record<string, { q: string; a: string }[]> = {
  Clientes: [
    {
      q: 'Como faço um pedido?',
      a: 'Acesse "Menu" no topo, clique em "Monte Seu Churrasco" e siga os 5 passos: escolha o Grillmaster, defina os detalhes do evento, selecione um açougue parceiro, escolha os cortes e confirme. Você será redirecionado para o pagamento ao final.',
    },
    {
      q: 'Quais formas de pagamento são aceitas?',
      a: 'Aceitamos cartão de crédito, débito e Pix, todos processados com segurança pelo Mercado Pago. O valor é cobrado no ato da confirmação do pedido.',
    },
    {
      q: 'Posso cancelar meu pedido?',
      a: 'Sim. Pedidos com status "Pendente" podem ser cancelados sem custo. Para pedidos já confirmados pelo Grillmaster, aplicamos uma multa de 30% para cancelamentos entre 24h e 48h antes do evento, e de 50% para cancelamentos com menos de 24h. Cancelamentos com mais de 48h de antecedência são gratuitos. Consulte nossa Política de Cancelamento para mais detalhes.',
    },
    {
      q: 'Como funciona o rastreamento do churrasqueiro?',
      a: 'Quando o Grillmaster estiver a caminho do seu evento, o status do pedido muda para "Churrasqueiro a caminho" e um mapa aparece automaticamente na página do pedido, mostrando a localização em tempo real. A distância até o local do evento também é exibida.',
    },
    {
      q: 'O que fazer se tiver algum problema durante o evento?',
      a: 'Use o chat interno na página do pedido para se comunicar diretamente com o Grillmaster. Se o problema não for resolvido, entre em contato com nosso suporte via WhatsApp — respondemos em até 1 hora em dias úteis.',
    },
    {
      q: 'Como avalio o churrasqueiro ou o açougue?',
      a: 'Após o evento ser marcado como concluído, um botão "Avaliar" aparece na página do pedido. Você pode dar de 1 a 5 estrelas para o Grillmaster e para o açougue, além de deixar um comentário. Avaliações ajudam outros clientes e reconhecem os melhores profissionais.',
    },
  ],
  Churrasqueiros: [
    {
      q: 'Como me cadastro na plataforma?',
      a: 'Clique em "Cadastrar" e selecione o tipo de conta "Churrasqueiro". Preencha seu perfil com bio, cidade, especialidades e preço por hora. Após o cadastro, sua conta passa por uma análise de aprovação pela equipe Tech Churras, que pode levar até 48h.',
    },
    {
      q: 'Como funciona o pagamento e repasse?',
      a: 'A plataforma retém 15% de comissão sobre o valor total do pedido. O repasse líquido (85%) é feito via Pix toda semana para a chave cadastrada no seu perfil. Você pode acompanhar seus repasses no painel do Grillmaster.',
    },
    {
      q: 'Posso recusar um pedido?',
      a: 'Sim. Pedidos no status "Pendente" podem ser ignorados — eles expiram automaticamente se não forem confirmados em até 24h. Uma taxa de recusa elevada pode afetar sua visibilidade na plataforma.',
    },
    {
      q: 'Como defino minha disponibilidade?',
      a: 'No painel do Grillmaster, acesse "Minha Agenda" para bloquear datas indisponíveis. Você também pode ativar ou desativar o modo "Disponível" a qualquer momento pelo botão na tela inicial do seu painel.',
    },
    {
      q: 'O que é o selo "Chancelado"?',
      a: 'O selo Chancelado é concedido pela Jota Grillmaster a profissionais que passaram pelo treinamento oficial da Tech Churras. Ele indica alto nível técnico e compromisso com a qualidade. Grillmasters chancelados aparecem em destaque nas buscas.',
    },
  ],
  Acougues: [
    {
      q: 'Como cadastro meus produtos?',
      a: 'No painel do Açougue, acesse "Produtos" e clique em "Novo Produto". Adicione nome, descrição, categoria (carne, tempero, carvão etc.), preço por unidade/kg e controle de estoque. Os produtos ficam disponíveis para seleção nos pedidos assim que publicados.',
    },
    {
      q: 'Como gerencio meu estoque?',
      a: 'Cada produto tem um campo de estoque disponível. Quando o Grillmaster retira os insumos, o estoque é atualizado automaticamente. Você pode também editar manualmente o estoque em tempo real pelo painel.',
    },
    {
      q: 'Quando recebo pelos pedidos?',
      a: 'O repasse para açougues parceiros é feito semanalmente via Pix, deduzida a comissão de 3% da plataforma. Os valores são consolidados toda segunda-feira referentes aos pedidos concluídos na semana anterior.',
    },
  ],
  Geral: [
    {
      q: 'Qual a comissão da plataforma?',
      a: 'A Tech Churras cobra 15% de comissão sobre o valor total dos serviços do Grillmaster e 3% sobre os produtos do açougue. Esses valores são automaticamente deduzidos no repasse semanal. Não há mensalidade para Grillmasters — apenas comissão por pedido realizado.',
    },
    {
      q: 'Como entro em contato com o suporte?',
      a: 'Nosso suporte está disponível via WhatsApp (botão abaixo) de segunda a sábado das 8h às 20h. Para assuntos relacionados a pedidos em andamento, prefira o chat interno da plataforma para agilizar o atendimento.',
    },
  ],
}

const CATEGORY_ICONS: Record<string, string> = {
  Clientes: '🧑‍🍳',
  Churrasqueiros: '🔥',
  Acougues: '🥩',
  Geral: '💬',
}

function AccordionItem({ q, a, open, onToggle }: {
  q: string; a: string; open: boolean; onToggle: () => void
}) {
  return (
    <div className="border-b border-gray-800 last:border-0">
      <button
        onClick={onToggle}
        className="w-full text-left py-4 px-0 flex items-center justify-between gap-4 group"
      >
        <span className="font-medium text-white group-hover:text-orange-400 transition-colors text-sm leading-relaxed">
          {q}
        </span>
        <span
          className={
            'shrink-0 w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 transition-transform duration-200 ' +
            (open ? 'rotate-180' : '')
          }
        >
          ▾
        </span>
      </button>
      {open && (
        <div className="pb-4 text-sm text-gray-400 leading-relaxed">
          {a}
        </div>
      )}
    </div>
  )
}

export default function AjudaPage() {
  const [activeTab, setActiveTab] = useState('Clientes')
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  const allItems = Object.entries(FAQ).flatMap(([cat, items]) =>
    items.map(item => ({ ...item, cat }))
  )

  const isSearching = search.trim().length > 1
  const filtered = isSearching
    ? allItems.filter(
        item =>
          item.q.toLowerCase().includes(search.toLowerCase()) ||
          item.a.toLowerCase().includes(search.toLowerCase())
      )
    : FAQ[activeTab]

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Central de Ajuda</h1>
        <p className="text-gray-500 text-sm">Encontre respostas para as dúvidas mais frequentes</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setOpenIndex(null) }}
          placeholder="Buscar pergunta..."
          className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-orange-500/50 transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tabs — only when not searching */}
      {!isSearching && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {Object.keys(FAQ).map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveTab(cat); setOpenIndex(null) }}
              className={
                'shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ' +
                (activeTab === cat
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-800')
              }
            >
              <span>{CATEGORY_ICONS[cat]}</span>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 px-6">
        {isSearching && filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">Nenhum resultado para "{search}"</p>
          </div>
        ) : isSearching ? (
          <>
            <p className="text-xs text-gray-500 py-3 border-b border-gray-800">
              {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} para "{search}"
            </p>
            {(filtered as { q: string; a: string; cat: string }[]).map((item, i) => (
              <div key={i}>
                <p className="text-xs text-orange-400/70 pt-3 pb-1">{CATEGORY_ICONS[item.cat]} {item.cat}</p>
                <AccordionItem
                  q={item.q}
                  a={item.a}
                  open={openIndex === i}
                  onToggle={() => setOpenIndex(openIndex === i ? null : i)}
                />
              </div>
            ))}
          </>
        ) : (
          FAQ[activeTab].map((item, i) => (
            <AccordionItem
              key={i}
              q={item.q}
              a={item.a}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))
        )}
      </div>

      {/* Contact card */}
      <div className="mt-8 bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-white">Não encontrou sua resposta?</p>
          <p className="text-sm text-gray-500 mt-0.5">Nossa equipe responde em até 1 hora nos dias úteis</p>
        </div>
        <a
          href={WHATSAPP}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.553 4.103 1.522 5.831L.05 23.5l5.83-1.48A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.89 0-3.659-.5-5.191-1.374l-.372-.22-3.855.98.998-3.76-.24-.387A9.957 9.957 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
          </svg>
          Falar no WhatsApp
        </a>
      </div>
    </div>
  )
}
