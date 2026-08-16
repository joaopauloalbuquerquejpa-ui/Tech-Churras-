export const metadata = {
  title: 'Política de Privacidade',
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold text-white mt-10 mb-3 border-b border-gray-800 pb-2">{children}</h2>
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-orange-400 mt-6 mb-2">{children}</h3>
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-300 text-sm leading-7 mb-3">{children}</p>
}
function Li({ children }: { children: React.ReactNode }) {
  return <li className="text-gray-300 text-sm leading-7 ml-5 list-disc">{children}</li>
}

export default function PoliticaDePrivacidadePage() {
  return (
    <article>
      <h1 className="text-3xl font-black text-white mb-1">Politica de Privacidade</h1>
      <p className="text-sm text-gray-500 mb-8">Ultima atualizacao: junho de 2026 | Conforme a Lei n. 13.709/2018 (LGPD)</p>

      <P>
        A <strong className="text-white">Tech Churras</strong> tem o compromisso de proteger a privacidade e os dados pessoais de seus usuarios, parceiros e visitantes. Esta Politica descreve como coletamos, usamos, armazenamos e compartilhamos seus dados, em conformidade com a Lei Geral de Protecao de Dados (LGPD).
      </P>

      <H2>1. Dados Coletados</H2>
      <H3>1.1 Dados fornecidos pelo usuario</H3>
      <ul className="space-y-1 mb-4">
        <Li><strong className="text-white">Identificacao:</strong> nome completo, endeco de e-mail, numero de telefone.</Li>
        <Li><strong className="text-white">Acesso:</strong> senha (armazenada com hash bcrypt, nunca em texto puro).</Li>
        <Li><strong className="text-white">Evento:</strong> endereco do evento, data, horario, numero de convidados.</Li>
        <Li><strong className="text-white">Pagamento:</strong> dados de pagamento processados por parceiros homologados (a Tech Churras nao armazena dados de cartao).</Li>
        <Li><strong className="text-white">Comunicacao:</strong> mensagens trocadas no chat da plataforma.</Li>
        <Li><strong className="text-white">Avaliacoes:</strong> notas e comentarios publicos sobre servicos recebidos.</Li>
      </ul>
      <H3>1.2 Dados coletados automaticamente</H3>
      <ul className="space-y-1 mb-4">
        <Li><strong className="text-white">Localizacao geografica:</strong> coordenadas GPS do Churrasqueiro, coletadas com consentimento expresso durante o deslocamento ao evento (funcionalidade de rastreamento em tempo real).</Li>
        <Li><strong className="text-white">Dados de uso:</strong> paginas acessadas, acoes realizadas, timestamps de interacao.</Li>
        <Li><strong className="text-white">Dispositivo:</strong> tipo de dispositivo, sistema operacional, endereco IP.</Li>
      </ul>

      <H2>2. Finalidade do Tratamento de Dados</H2>
      <P>Seus dados sao tratados exclusivamente para as seguintes finalidades:</P>
      <ul className="space-y-1 mb-4">
        <Li>Criacao e gerenciamento de conta na Plataforma.</Li>
        <Li>Intermediacao e processamento de pedidos de servicos de churrasco.</Li>
        <Li>Rastreamento em tempo real do deslocamento do Churrasqueiro ao local do evento.</Li>
        <Li>Comunicacao entre as partes envolvidas no pedido.</Li>
        <Li>Processamento de pagamentos e emissao de comprovantes.</Li>
        <Li>Calculo e exibicao de avaliacoes de parceiros.</Li>
        <Li>Envio de notificacoes sobre status do pedido (WhatsApp/e-mail).</Li>
        <Li>Cumprimento de obrigacoes legais e regulatorias.</Li>
        <Li>Melhoria continua da Plataforma e personalizacao da experiencia.</Li>
      </ul>
      <P>
        Base legal: execucao de contrato (Art. 7, V, LGPD), cumprimento de obrigacao legal (Art. 7, II), consentimento (Art. 7, I) e legitimo interesse (Art. 7, IX).
      </P>

      <H2>3. Compartilhamento de Dados e Terceiros</H2>
      <P>
        A Tech Churras compartilha seus dados <strong className="text-white">apenas quando necessario</strong> para a prestacao dos servicos ou por exigencia legal. Listamos abaixo todos os terceiros envolvidos:
      </P>
      <H3>3.1 Parceiros operacionais</H3>
      <ul className="space-y-1 mb-4">
        <Li><strong className="text-white">Churrasqueiros parceiros:</strong> recebem nome, telefone, endereco do evento e detalhes do pedido para execucao do servico contratado.</Li>
        <Li><strong className="text-white">Acougues parceiros:</strong> recebem os itens do pedido e endereco de entrega quando aplicavel.</Li>
        <Li><strong className="text-white">Mercado Pago (MercadoLibre S.A.):</strong> processador de pagamentos. Recebe os dados necessarios para autorizacao e antifraude das transacoes financeiras. A Tech Churras nao armazena dados de cartao de credito — estes ficam sob custodia exclusiva do Mercado Pago, sujeito a sua propria Politica de Privacidade.</Li>
        <Li><strong className="text-white">Z-API (Notificacoes WhatsApp):</strong> o numero de telefone e compartilhado para envio de notificacoes sobre status do pedido via WhatsApp, mediante consentimento do usuario.</Li>
        <Li><strong className="text-white">Anthropic (Claude AI):</strong> textos de descricao inseridos pelo usuario (bio de churrasqueiro, descricao de acougue) podem ser processados pela API da Anthropic para geracao de sugestoes com Inteligencia Artificial. Nenhum dado de identificacao pessoal sensivel e enviado nessa chamada.</Li>
        <Li><strong className="text-white">Autoridades:</strong> dados podem ser compartilhados com autoridades publicas mediante requisicao legal fundamentada.</Li>
      </ul>
      <H3>3.2 Ferramentas de analitica e marketing</H3>
      <P>Utilizamos as seguintes ferramentas para entender o uso da plataforma e melhorar nossos servicos:</P>
      <ul className="space-y-1 mb-4">
        <Li><strong className="text-white">Google Analytics 4 (Google LLC):</strong> coleta dados anonimizados de navegacao (paginas visitadas, origem do acesso, tempo de sessao). Dados processados nos EUA com clausulas contratuais padrao. Voce pode optar por nao participar em myaccount.google.com/data-and-privacy.</Li>
        <Li><strong className="text-white">Meta Pixel (Meta Platforms, Inc. — Facebook/Instagram):</strong> registra acoes realizadas na plataforma (visualizacoes de pagina, conversoes) para medicao de eficacia de anuncios. Dados processados conforme a Politica de Dados da Meta. Voce pode optar por nao participar nas configuracoes de anuncios do Facebook.</Li>
        <Li><strong className="text-white">TikTok Pixel (TikTok Inc.):</strong> utilizado para medicao de campanhas publicitarias no TikTok. Dados processados conforme a Politica de Privacidade do TikTok.</Li>
        <Li><strong className="text-white">Google Ads (Google LLC):</strong> utilizado para medicao de conversoes oriundas de anuncios no Google Search e Display.</Li>
      </ul>
      <P>
        Nao vendemos, alugamos ou cedemos seus dados pessoais a terceiros para fins comerciais proprios.
      </P>

      <H2>4. Armazenamento e Seguranca</H2>
      <P>
        Os dados sao armazenados em servidores seguros da <strong className="text-white">Supabase</strong> (PostgreSQL hospedado na AWS, regiao Europa Ocidental). Adotamos as seguintes medidas de seguranca:
      </P>
      <ul className="space-y-1 mb-4">
        <Li>Senhas armazenadas com hash bcrypt (fator 10).</Li>
        <Li>Comunicacoes criptografadas via HTTPS/TLS.</Li>
        <Li>Tokens de autenticacao JWT com expiracao de 7 dias.</Li>
        <Li>Acesso ao banco de dados restrito a servicos internos autenticados.</Li>
        <Li>Backups automaticos realizados pelo provedor de infraestrutura.</Li>
      </ul>

      <H2>5. Dados de Localizacao</H2>
      <P>
        A coleta de dados de localizacao GPS do Churrasqueiro ocorre <strong className="text-white">somente</strong> quando o status do pedido e "Churrasqueiro a caminho" e cessa automaticamente quando o status avanca. A coleta e baseada no consentimento expresso concedido pelo Churrasqueiro no momento do uso da funcionalidade no dispositivo movel.
      </P>
      <P>
        As coordenadas de localizacao sao armazenadas no registro do pedido e retidas pelo periodo de retenção descrito na secao 9. O cliente (usuario que fez o pedido) pode visualizar a posicao do Churrasqueiro em tempo real, exclusivamente para o pedido em andamento.
      </P>

      <H2>6. Direitos do Titular (LGPD)</H2>
      <P>Conforme a LGPD (Art. 18), voce tem os seguintes direitos em relacao aos seus dados pessoais:</P>
      <ul className="space-y-1 mb-4">
        <Li><strong className="text-white">Acesso:</strong> obter confirmacao da existencia e acesso aos seus dados tratados.</Li>
        <Li><strong className="text-white">Correcao:</strong> solicitar correcao de dados incompletos, inexatos ou desatualizados.</Li>
        <Li><strong className="text-white">Exclusao:</strong> solicitar a exclusao de dados desnecessarios ou tratados em desconformidade.</Li>
        <Li><strong className="text-white">Portabilidade:</strong> receber seus dados em formato estruturado e de leitura automatizada.</Li>
        <Li><strong className="text-white">Revogacao do consentimento:</strong> revogar consentimento a qualquer momento, sem prejuizo da licitude do tratamento anterior.</Li>
        <Li><strong className="text-white">Oposicao:</strong> opor-se ao tratamento realizado com fundamento em interesse legitimo.</Li>
        <Li><strong className="text-white">Informacao:</strong> obter informacoes sobre entidades com as quais seus dados foram compartilhados.</Li>
      </ul>
      <P>
        Para exercer seus direitos, entre em contato com nosso Encarregado de Dados (DPO) pelo e-mail <strong className="text-white">techchurras@gmail.com</strong>. Respondemos em ate 15 dias.
      </P>

      <H2>7. Cookies e Armazenamento Local</H2>
      <P>
        A Plataforma utiliza <strong className="text-white">localStorage</strong> do navegador para armazenar informacoes de sessao (token de autenticacao JWT), preferencias do carrinho e favoritos. Esses dados permanecem no dispositivo do usuario e nao sao transmitidos a terceiros.
      </P>
      <H3>7.1 Cookies proprios</H3>
      <P>Cookies estritamente necessarios para autenticacao e funcionamento da sessao. Sem eles, o login e o carrinho nao funcionam.</P>
      <H3>7.2 Cookies de analitica e publicidade (terceiros)</H3>
      <P>Utilizamos cookies de terceiros para analitica e medicao de marketing. Voce pode gerencia-los ou recusa-los nas configuracoes do seu navegador ou app:</P>
      <ul className="space-y-1 mb-4">
        <Li><strong className="text-white">Google Analytics 4</strong> (_ga, _ga_*) — analitica de uso anonimizada.</Li>
        <Li><strong className="text-white">Meta Pixel</strong> (_fbp, _fbc) — medicao de conversoes Facebook/Instagram.</Li>
        <Li><strong className="text-white">TikTok Pixel</strong> (ttclid, _ttp) — medicao de conversoes TikTok.</Li>
        <Li><strong className="text-white">Google Ads</strong> (_gcl_*) — medicao de conversoes Google.</Li>
      </ul>
      <P>
        No aplicativo movel (Android/iOS), nao utilizamos cookies de navegador. Os SDKs de analitica podem coletar o identificador de publicidade do dispositivo (GAID/IDFA), que voce pode redefinir ou desativar nas configuracoes do seu celular.
      </P>

      <H2>8. Retencao de Dados</H2>
      <P>
        Os dados pessoais sao retidos pelos seguintes periodos:
      </P>
      <ul className="space-y-1 mb-4">
        <Li><strong className="text-white">Dados cadastrais:</strong> enquanto a conta estiver ativa. Apos exclusao, ate 5 anos para cumprimento de obrigacoes legais.</Li>
        <Li><strong className="text-white">Dados de pedidos:</strong> 5 anos apos a conclusao ou cancelamento, conforme legislacao fiscal brasileira.</Li>
        <Li><strong className="text-white">Dados de localizacao:</strong> armazenados no pedido e retidos pelo mesmo periodo dos dados de pedidos (5 anos).</Li>
        <Li><strong className="text-white">Mensagens do chat:</strong> retidas pelo mesmo periodo do pedido associado.</Li>
        <Li><strong className="text-white">Logs de acesso:</strong> 6 meses, conforme Marco Civil da Internet (Lei 12.965/2014).</Li>
      </ul>

      <H2>9. Transferencia Internacional de Dados</H2>
      <P>
        Os dados sao armazenados em servidores localizados na Uniao Europeia (AWS eu-west-1), regiao que adota padroes de protecao de dados equivalentes ou superiores aos exigidos pela LGPD. O compartilhamento com parceiros de pagamento pode envolver transferencia internacional, sempre com garantias contratuais adequadas.
      </P>

      <H2>10. Contato — Encarregado de Dados (DPO)</H2>
      <P>
        Nosso Encarregado pelo Tratamento de Dados Pessoais (DPO) esta disponivel para esclarecer duvidas, receber reclamacoes e exercer seus direitos:
      </P>
      <div className="bg-gray-900 rounded-xl p-4 mb-4 text-sm text-gray-300 space-y-1">
        <p><strong className="text-white">Tech Churras</strong></p>
        <p>E-mail: <a href="mailto:techchurras@gmail.com" className="text-orange-400 hover:underline">techchurras@gmail.com</a></p>
        <p>Contato geral: <a href="mailto:techchurras@gmail.com" className="text-orange-400 hover:underline">techchurras@gmail.com</a></p>
        <p>Autoridade Nacional de Protecao de Dados (ANPD): <a href="https://www.gov.br/anpd" className="text-orange-400 hover:underline" target="_blank" rel="noopener noreferrer">www.gov.br/anpd</a></p>
      </div>

      <H2>11. Alteracoes nesta Politica</H2>
      <P>
        Esta Politica pode ser atualizada periodicamente. Notificaremos os usuarios sobre alteracoes relevantes por e-mail ou notificacao na Plataforma. A versao vigente estara sempre disponivel em <strong className="text-white">techchurras.com.br/politica-de-privacidade</strong>.
      </P>

      <div className="mt-12 pt-6 border-t border-gray-800 text-xs text-gray-600">
        Tech Churras — techchurras@gmail.com
      </div>
    </article>
  )
}
