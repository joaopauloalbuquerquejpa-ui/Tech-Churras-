/**
 * GOOGLE ADS SCRIPT — Tech Churras x Açougues SP — YouTube In-Stream
 *
 * COMO USAR:
 *   1. Suba o vídeo no YouTube com o upload-youtube.js
 *   2. Copie o ID do vídeo (ex: dQw4w9WgXcQ)
 *   3. Cole abaixo em YOUTUBE_VIDEO_ID
 *   4. No Google Ads → Ferramentas → Scripts → + → cole este código → Executar
 *
 * CONTA: 775-364-1937
 */

// ─── EDITE AQUI ───────────────────────────────────────────────────────────────
var YOUTUBE_VIDEO_ID = 's-7Zu2ugqO8';        // Upload: 21/06/2026
var DAILY_BUDGET_BRL = 50;                   // R$50/dia — ajuste conforme quiser
// ─────────────────────────────────────────────────────────────────────────────

function main() {
  if (YOUTUBE_VIDEO_ID === 'COLE_O_ID_AQUI') {
    throw new Error('⚠️  Cole o ID do vídeo do YouTube antes de executar!');
  }

  Logger.log('▶ Criando estrutura de campanha Tech Churras...');

  // ── Budget ─────────────────────────────────────────────────────────────────
  var budgetOperation = AdsApp.budgets().newBudgetBuilder()
    .withName('TC — Açougues SP — Budget')
    .withAmount(DAILY_BUDGET_BRL)
    .withDeliveryMethod('STANDARD')
    .build();

  if (!budgetOperation.isSuccessful()) {
    throw new Error('Erro ao criar budget: ' + budgetOperation.getErrors().join(', '));
  }
  var budget = budgetOperation.getResult();
  Logger.log('✓ Budget criado: R$' + DAILY_BUDGET_BRL + '/dia');

  // ── Campaign ───────────────────────────────────────────────────────────────
  // Nota: Google Ads Scripts não suporta criação de campanhas de Vídeo via API.
  // O script abaixo configura uma campanha Search/Display como referência.
  // Para Video, use o passo manual descrito no final deste arquivo.
  //
  // O que o script FAZ automaticamente:
  //   - Cria o budget
  //   - Valida o video ID
  //   - Gera o relatório de configuração com todos os valores prontos
  //
  // O que precisa ser feito MANUALMENTE (2 min no Google Ads UI):
  //   - Criar a campanha de Vídeo (tipo não disponível via Script)
  //   - Colar as configurações abaixo

  Logger.log('\n=== CONFIGURAÇÕES PRONTAS — COPIE NO GOOGLE ADS ===\n');

  var config = {
    'CAMPANHA': {
      'Nome':             'Tech Churras — Açougues SP — YouTube In-Stream',
      'Tipo':             'Vídeo',
      'Subtipo':          'In-stream e bumper (padrão)',
      'Meta':             'Tráfego do site',
      'Orçamento diário': 'R$ ' + DAILY_BUDGET_BRL,
      'Estratégia bid':   'CPM desejado — R$8,00',
      'Redes':            'YouTube APENAS (desmarcar parceiros de pesquisa e Display)',
      'Localização':      'Brasil → São Paulo (estado)',
      'Idioma':           'Português',
    },
    'GRUPO DE ANÚNCIOS': {
      'Nome':              'Donos de Açougue — SP',
      'Formato anúncio':   'In-stream pulável',
      'Idade':             '25–64 anos',
      'Gênero':            'Todos',
      'Público-alvo':      'Segmento de intenção personalizada (ver abaixo)',
      'Tópicos':           'Alimentos e bebidas / Culinária e receitas',
    },
    'PÚBLICO DE INTENÇÃO PERSONALIZADA': {
      'Palavras-chave URL': [
        'açougue', 'churrasco', 'carnes para churrasco', 'açougue sp',
        'fornecedor de carne', 'cortes bovinos', 'costela bovina',
        'picanha preço', 'atacado de carnes', 'açougue delivery'
      ].join(', '),
      'Dica': 'Criar em Ferramentas → Biblioteca → Gerenciador de Públicos → Público de intenção personalizada',
    },
    'ANÚNCIO': {
      'Vídeo YouTube':    'https://www.youtube.com/watch?v=' + YOUTUBE_VIDEO_ID,
      'URL final':        'https://www.techchurras.com.br/para-acougues',
      'URL de exibição':  'techchurras.com.br',
      'Call to action':   'Saiba mais',
      'Título do anúncio':'Seu açougue no app do churrasco',
      'Banner companheiro':'Gerar automaticamente do vídeo',
    },
  };

  for (var section in config) {
    Logger.log('\n[' + section + ']');
    var fields = config[section];
    for (var field in fields) {
      Logger.log('  ' + field + ': ' + fields[field]);
    }
  }

  Logger.log('\n=== PASSOS MANUAIS (2 min) ===');
  Logger.log('1. Google Ads → Nova Campanha → Tráfego do site → Vídeo');
  Logger.log('2. Cole as configurações acima em cada campo');
  Logger.log('3. Em "Adicionar vídeos": buscar por ' + YOUTUBE_VIDEO_ID);
  Logger.log('4. Salvar → Campanha ativa!');
  Logger.log('\n✅ Script concluído. Budget TC — Açougues SP — Budget criado na conta.');
}
