/**
 * META ADS CAMPAIGN — Tech Churras x Açougues SP
 *
 * Objetivo: Atrair donos de açougue em SP para /para-acougues
 * Vídeo:    techchurras_60s_vertical.mp4 (9:16) — principal para Feed/Reels
 *           techchurras_30s_vertical.mp4 (9:16) — alternativa para Stories
 * Budget:   R$30/dia (escalar para R$80 após 7 dias com CPL < R$25)
 *
 * SETUP (20 min no Meta Business Manager):
 *   1. business.facebook.com → Criar campanha
 *   2. Copie as configurações abaixo exatamente
 *   3. Faça upload dos vídeos antes de criar os anúncios
 *
 * CONTA META: Vincule a conta do Tech Churras no Meta Business Suite
 */

// ─── CONFIGURAÇÕES DA CAMPANHA ────────────────────────────────────────────────
const CAMPAIGN = {
  nome: 'TC — Açougues SP — Captação Jul26',
  objetivo: 'LEAD_GENERATION',           // Formulário de lead nativo OU
  // objetivo: 'TRAFFIC',               // Tráfego → /para-acougues (prefira se a landing converte bem)
  orcamentoDiario: 30,                   // R$/dia
  dataInicio: '2026-07-07',             // Lançamento
  status: 'ACTIVE',
}

// ─── AD SET ───────────────────────────────────────────────────────────────────
const AD_SET = {
  nome: 'Donos Açougue SP — Broad',
  localizacao: 'São Paulo, São Paulo, Brasil',
  raioKm: 50,
  idadeMin: 28,
  idadeMax: 65,
  genero: 'TODOS',

  // Segmentação de interesses (escolha até 3)
  interesses: [
    'Açougue',
    'Churrasco',
    'Comércio varejista de carnes',
    'Empreendedorismo',
    'Alimentação e restaurantes',
  ],

  // Comportamentos
  comportamentos: [
    'Small business owners',
    'Business page admins',
  ],

  // Exclusões (evitar consumidores finais)
  exclusoes: [
    'Veganismo',
    'Vegetarianismo',
  ],

  placement: [
    'Facebook Feed',
    'Instagram Feed',
    'Instagram Reels',
    'Instagram Stories',
    'Facebook Reels',
  ],

  otimizacao: 'LINK_CLICKS',             // ou 'LEAD_GENERATION' se usar formulário nativo
  estrategiaBid: 'LOWEST_COST',         // Custo mínimo (Advantage+)
}

// ─── ANÚNCIO PRINCIPAL (60s Vertical — Feed) ─────────────────────────────────
const AD_PRINCIPAL = {
  nome: 'Video 60s — Zanzibar Hook',
  formato: 'VIDEO',
  arquivo: 'techchurras_60s_vertical.mp4',
  aspectRatio: '9:16',

  // Texto do anúncio (Primary Text — aparece acima do vídeo)
  primaryText: `Ele foi até Zanzibar na África, abriu um churrasco lá, e voltou com uma pergunta que não sai da cabeça:

Por que o seu açougue ainda não vende para churrasqueiros profissionais online?

O churrasco movimenta R$ 15 bilhões por ano no Brasil. O Grillmaster compra onde tem parceria digital. Se você não está na plataforma, ele compra no concorrente.

🔥 Tech Churras — Seu açougue, mais vendas, sem mudar sua rotina.`,

  // Headline (aparece no card de link, abaixo do vídeo)
  headline: 'Açougues parceiros faturam R$ 3.779/mês a mais',

  // Descrição (opcional, abaixo do headline)
  descricao: 'QR code no balcão + pedidos automáticos + repasse semanal via PIX.',

  // CTA
  callToAction: 'LEARN_MORE',            // "Saiba mais" → landing page
  urlDestino: 'https://www.techchurras.com.br/para-acougues',
  urlExibicao: 'techchurras.com.br',

  // UTM para rastrear no GA4
  utmParameters: 'utm_source=meta&utm_medium=paid_video&utm_campaign=acougues-sp-jul26&utm_content=zanzibar-60s',
}

// ─── ANÚNCIO VARIANTE (30s — Stories/Reels) ──────────────────────────────────
const AD_VARIANTE = {
  nome: 'Video 30s — Stories Reels',
  formato: 'VIDEO',
  arquivo: 'techchurras_30s_vertical.mp4',
  aspectRatio: '9:16',

  primaryText: `Seu açougue já está perdendo vendas para a concorrência digital?

Churrasqueiros profissionais em SP compram de açougues parceiros da plataforma. Sem app, você fica invisível.

Seja parceiro → techchurras.com.br/para-acougues`,

  headline: 'Seu açougue no app do churrasco',
  descricao: 'R$ 3.779/mês extras · QR code no balcão · Repasse semanal PIX',
  callToAction: 'LEARN_MORE',
  urlDestino: 'https://www.techchurras.com.br/para-acougues',
  utmParameters: 'utm_source=meta&utm_medium=paid_video&utm_campaign=acougues-sp-jul26&utm_content=zanzibar-30s',
}

// ─── FORMULÁRIO DE LEAD NATIVO (alternativa ao tráfego) ──────────────────────
const LEAD_FORM = {
  nome: 'TC Açougues — Lead Form Jul26',
  titulo: 'Seja parceiro da Tech Churras',
  subtitulo: 'Preencha para receber a proposta completa. Sem compromisso.',
  campos: [
    { tipo: 'FULL_NAME', obrigatorio: true },
    { tipo: 'PHONE', obrigatorio: true },
    { tipo: 'EMAIL', obrigatorio: false },
    { custom: 'Nome do seu açougue', obrigatorio: true },
    { custom: 'Cidade', obrigatorio: true },
  ],
  mensagemConfirmacao: 'Recebemos seu interesse! Nosso time entrará em contato em até 24h via WhatsApp. 🔥',
  linkPrivacidade: 'https://www.techchurras.com.br/politica-de-privacidade',

  // WEBHOOK para integração automática no WhatsApp
  // Configure em: Meta Business → Lead Ads Testing Tool → CRM Integration
  webhookNote: 'Integrar via Zapier: Meta Lead Ads → WhatsApp (Z-API) para contato imediato',
}

// ─── REGRAS DE OTIMIZAÇÃO AUTOMÁTICA ─────────────────────────────────────────
const REGRAS = [
  {
    condicao: 'CPL > R$ 40 por 3 dias seguidos',
    acao: 'Pausar Ad Set e criar novo com interesses mais restritos (só "Açougue" + "Comércio varejista")',
  },
  {
    condicao: 'CPL < R$ 20 por 3 dias seguidos',
    acao: 'Aumentar budget 20%/semana até R$ 150/dia',
  },
  {
    condicao: 'CTR < 1.5% após 3 dias',
    acao: 'Trocar Primary Text — testar versão mais direta com dor: "Você já perdeu cliente para o açougue digital do bairro?"',
  },
  {
    condicao: 'Frequency > 4 após 14 dias',
    acao: 'Criar novo criativo (imagem estática com número R$3.779) e rodar em paralelo',
  },
]

// ─── PIXEL E CONVERSÕES ───────────────────────────────────────────────────────
const PIXEL = {
  nota: 'Pixel do Meta já deve estar instalado via variável NEXT_PUBLIC_META_PIXEL_ID no Vercel',
  eventos: [
    { nome: 'Lead', disparo: 'Clique em "Quero ser parceiro" ou envio do formulário nativo' },
    { nome: 'ViewContent', disparo: 'Carregamento da página /para-acougues (automático)' },
    { nome: 'Contact', disparo: 'Clique em "Falar no WhatsApp"' },
  ],
  conversaoPrincipal: 'Lead',
}

// ─── LOOKALIKE AUDIENCES (escala futura) ─────────────────────────────────────
const LOOKALIKE = {
  nota: 'Criar após 50+ leads coletados',
  fonte: 'Lista de emails de açougues que já demonstraram interesse (CRM)',
  pais: 'Brasil',
  tamanho: '1%',                         // 1% = mais similar, menor alcance
  expansao: '2-3% após 30 dias com custo estável',
}

// ─── GUIA DE IMPLEMENTAÇÃO (passo a passo) ───────────────────────────────────
console.log(`
╔══════════════════════════════════════════════════════════════════╗
║     META ADS — TECH CHURRAS — AÇOUGUES SP — SETUP GUIDE         ║
╚══════════════════════════════════════════════════════════════════╝

PASSO 1 — Upload dos vídeos
   → Meta Business Suite → Biblioteca de Mídia
   → Subir: techchurras_60s_vertical.mp4
   → Subir: techchurras_30s_vertical.mp4
   → Aguardar processamento (5-10 min)

PASSO 2 — Criar campanha
   → business.facebook.com → Criar campanha
   → Objetivo: Geração de Leads (ou Tráfego)
   → Nome: "${CAMPAIGN.nome}"
   → Budget: R$ ${CAMPAIGN.orcamentoDiario}/dia
   → Data início: ${CAMPAIGN.dataInicio}

PASSO 3 — Configurar Ad Set
   → Nome: "${AD_SET.nome}"
   → Localização: ${AD_SET.localizacao} (+${AD_SET.raioKm}km)
   → Idade: ${AD_SET.idadeMin}-${AD_SET.idadeMax}
   → Interesses: ${AD_SET.interesses.slice(0, 3).join(', ')}
   → Placements: Feed, Reels e Stories (Instagram + Facebook)
   → Otimização: Custo mínimo (Advantage+)

PASSO 4 — Criar anúncios
   → Anúncio 1 (principal):
     Video: techchurras_60s_vertical.mp4
     Headline: "${AD_PRINCIPAL.headline}"
     CTA: Saiba mais → ${AD_PRINCIPAL.urlDestino}?${AD_PRINCIPAL.utmParameters}

   → Anúncio 2 (variante para Stories):
     Video: techchurras_30s_vertical.mp4
     Headline: "${AD_VARIANTE.headline}"
     CTA: Saiba mais → ${AD_VARIANTE.urlDestino}?${AD_VARIANTE.utmParameters}

PASSO 5 — Verificar pixel
   → Meta Pixel Helper (extensão Chrome)
   → Abrir techchurras.com.br/para-acougues
   → Confirmar: ViewContent disparando

PASSO 6 — Publicar e monitorar
   → Aguardar aprovação (normalmente < 1h)
   → Primeiras 48h: não mexer (algoritmo em learning phase)
   → Dia 3: revisar CPL e ajustar conforme regras acima

YOUTUBE VIDEO ID (para referência cruzada Google Ads):
   → s-7Zu2ugqO8
   → https://www.youtube.com/watch?v=s-7Zu2ugqO8

KPIs esperados (semana 1):
   → CPM: R$ 15-25
   → CTR: 1.5-3.5%
   → CPL: R$ 20-40
   → Leads/dia: 1-3 com R$30/dia
`)
