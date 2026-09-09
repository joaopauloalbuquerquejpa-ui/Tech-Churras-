/**
 * GOOGLE ADS — CAMPANHA DE PESQUISA — Confraternização de Fim de Ano
 *
 * Objetivo: capturar quem já está pesquisando fornecedor de confraternização
 * agora (set-out é a janela de decisão pra eventos de nov/dez, conforme copy
 * da própria landing). Intenção de busca alta — pessoa já decidida a comprar,
 * só escolhendo fornecedor.
 *
 * Landing page: https://www.techchurras.com.br/churrasco-corporativo
 * Conta Google Ads: 775-364-1937
 *
 * COMO USAR (15 min no Google Ads UI — Campanhas de Pesquisa não são
 * criáveis via Google Ads Scripts com todos os recursos abaixo, por isso
 * este arquivo é um briefing pra colar manualmente, igual ao padrão já
 * usado em meta-ads-campaign-setup.js):
 *   1. Google Ads → Campanha → Novo → Vendas ou Leads → Pesquisa
 *   2. Cole as configurações de cada seção abaixo
 *   3. Ligue extensões de sitelink e chamada antes de publicar
 */

// ─── CAMPANHA ───────────────────────────────────────────────────────────────
const CAMPAIGN = {
  nome: 'TC — Confraternização Fim de Ano — Pesquisa Dez26',
  tipo: 'Pesquisa (Search)',
  meta: 'Leads',
  redes: 'Somente Rede de Pesquisa (desmarcar Parceiros de Pesquisa e Display)',
  orcamentoDiario: 60, // R$/dia — sugestão de partida; ajuste comigo depois de ver CPL nos primeiros 3-4 dias
  estrategiaLance: 'Maximizar conversões (trocar para CPA alvo depois de ~15 conversões)',
  localizacao: 'São Paulo (capital) + raio de 40km',
  idioma: 'Português',
  programacao: 'Todos os dias, 07h-22h (fora disso, lead frio demora a responder)',
  urlFinal: 'https://www.techchurras.com.br/churrasco-corporativo',
}

// ─── GRUPOS DE ANÚNCIOS E PALAVRAS-CHAVE ────────────────────────────────────
// Frase e exata primeiro (intenção mais alta e mais barata por clique
// qualificado); ampla só depois de validar CPL, não desde o dia 1.
const AD_GROUPS = {
  'Confraternização de Fim de Ano': {
    palavrasChave: [
      '[confraternização de fim de ano empresa]',
      '"confraternização de fim de ano"',
      '"festa de confraternização empresarial"',
      '"confraternização empresa são paulo"',
      '"churrasco confraternização empresa"',
      '"buffet confraternização"',
    ],
  },
  'Churrasco Corporativo': {
    palavrasChave: [
      '[churrasco corporativo]',
      '"churrasco corporativo são paulo"',
      '"churrasco para empresa"',
      '"churrasqueiro para evento corporativo"',
      '"fornecedor de churrasco para empresa"',
    ],
  },
  'Evento Corporativo Genérico': {
    palavrasChave: [
      '"evento corporativo são paulo"',
      '"buffet evento corporativo"',
      '"team building churrasco"',
      '"fornecedor de eventos corporativos sp"',
    ],
  },
}

// ─── PALAVRAS-CHAVE NEGATIVAS (a nível de campanha) ─────────────────────────
// Sem isso o orçamento vaza pra quem procura emprego, receita ou equipamento
// — não é o comprador que a gente quer.
const NEGATIVE_KEYWORDS = [
  'vaga', 'emprego', 'trabalhar', 'currículo',
  'receita', 'como fazer', 'passo a passo',
  'curso', 'aula',
  'churrasqueira' /* produto, não serviço */, 'comprar churrasqueira',
  'grátis', 'gratuito',
  'infantil', 'aniversário infantil',
  'churrascaria' /* restaurante, buffet livre — público errado */,
]

// ─── ANÚNCIO — RESPONSIVO DE PESQUISA (RSA) ─────────────────────────────────
// Títulos ≤30 caracteres, descrições ≤90 — já contados, cole sem editar.
const AD = {
  urlFinal: 'https://www.techchurras.com.br/churrasco-corporativo',
  caminhoExibicao: 'techchurras.com.br/corporativo',
  titulos: [
    'Confraternização de Fim de Ano',      // 30
    'Churrasco Corporativo em SP',         // 27
    'Preço Fechado por Pessoa',            // 24
    'Churrasqueiro Profissional',          // 26
    'Proposta em Até 24h',                 // 19
    'Carne Calculada por Pessoa',          // 26
    'Evento Corporativo em SP',            // 24
    'Sem Susto no Orçamento',              // 22
    'Melhores Datas Esgotam Rápido',       // 29
    'Fale com a Tech Churras',             // 24
  ],
  descricoes: [
    'Churrasqueiro profissional, carne calculada por pessoa e preço fechado. Peça sua proposta.',
    'Confraternização de fim de ano sem estresse. Proposta fechada em até 24h, sem surpresa.',
    'Carnes de açougue premium calculadas por pessoa. Carne não acaba no meio da festa.',
    'Execução garantida: GPS no dia, suporte e reembolso se algo falhar. Peça já sua proposta.',
  ],
  cta: 'Peça uma proposta',
}

// ─── EXTENSÕES (ligar antes de publicar — sobem a taxa de clique de graça) ──
const EXTENSIONS = {
  sitelinks: [
    { texto: 'Como Funciona', url: '/churrasco-corporativo#proposta' },
    { texto: 'Fale no WhatsApp', url: 'https://wa.me/5511970593650?text=Quero%20um%20orçamento%20de%20churrasco%20corporativo' },
  ],
  chamada: { telefone: '+5511970593650', horario: '07h-22h, todos os dias' },
  frasesDestaque: ['Proposta em 24h', 'Sem Mensalidade', 'Execução Garantida', 'GPS no Dia do Evento'],
}

// ─── ACOMPANHAMENTO ──────────────────────────────────────────────────────────
// Depois de publicar: checar CPL (custo por lead) nos primeiros 3-4 dias antes
// de escalar orçamento. Cada lead cai em /public/corporate-lead e já dispara
// WhatsApp pro admin — não precisa de conversion tracking novo pra saber que
// chegou, mas VALE configurar conversão de "envio de formulário" no Google
// Ads (Tag Manager ou evento gtag) pra deixar o "Maximizar conversões"
// otimizando de verdade em vez de só cliques.
