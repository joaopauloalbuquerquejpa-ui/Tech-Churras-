export const metadata = {
  title: 'Termos de Uso — Tech Churras',
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

export default function TermosDeUsoPage() {
  return (
    <article>
      <h1 className="text-3xl font-black text-white mb-1">Termos de Uso</h1>
      <p className="text-sm text-gray-500 mb-8">Ultima atualizacao: junho de 2026</p>

      <P>
        Bem-vindo ao <strong className="text-white">Tech Churras</strong>. Ao se cadastrar ou utilizar nossa plataforma, voce concorda com os presentes Termos de Uso. Leia atentamente antes de prosseguir.
      </P>

      <H2>1. Definicoes</H2>
      <ul className="space-y-1 mb-4">
        <Li><strong className="text-white">Plataforma:</strong> o marketplace Tech Churras, disponivel em techchurras.com.br e aplicativos associados.</Li>
        <Li><strong className="text-white">Usuario:</strong> qualquer pessoa fisica que se cadastra como cliente para contratar servicos.</Li>
        <Li><strong className="text-white">Churrasqueiro:</strong> profissional autonomo cadastrado como parceiro para prestar servicos de churrasco.</Li>
        <Li><strong className="text-white">Acougue / Boutique:</strong> estabelecimento comercial parceiro que fornece carnes e insumos atraves da plataforma.</Li>
        <Li><strong className="text-white">Pedido:</strong> contrato de prestacao de servicos firmado entre Usuario, Churrasqueiro e/ou Acougue com intermediacao da Plataforma.</Li>
      </ul>

      <H2>2. Aceitacao dos Termos</H2>
      <P>
        Ao criar uma conta, o Usuario declara ter lido, compreendido e aceito integralmente estes Termos, bem como a Politica de Privacidade. A utilizacao continuada da Plataforma implica aceite das versoes vigentes dos documentos.
      </P>

      <H2>3. Cadastro e Responsabilidades do Usuario</H2>
      <P>
        O Usuario deve fornecer informacoes verdadeiras, completas e atualizadas no cadastro. E responsabilidade exclusiva do Usuario manter a confidencialidade de suas credenciais de acesso. A Tech Churras nao se responsabiliza por acessos nao autorizados decorrentes de negligencia do Usuario.
      </P>
      <P>
        E vedado ao Usuario cadastrar-se com dados falsos, utilizar a Plataforma para fins ilicitos, ou realizar condutas que prejudiquem outros usuarios, parceiros ou a Plataforma.
      </P>

      <H2>4. Funcionamento do Marketplace</H2>
      <P>
        A Tech Churras atua exclusivamente como intermediadora entre Usuarios, Churrasqueiros e Acougues, nao sendo parte direta na prestacao dos servicos de churrasco ou fornecimento de carnes. A Plataforma disponibiliza a infraestrutura tecnologica para conexao entre as partes e processamento de pagamentos.
      </P>
      <H3>4.1 Pagamentos</H3>
      <P>
        Os pagamentos sao processados de forma segura atraves de parceiros homologados. O valor cobrado inclui o custo do servico do Churrasqueiro, os produtos do Acougue selecionado e a comissao da Plataforma. Os repasses aos parceiros sao realizados semanalmente, apos deducao da comissao.
      </P>
      <H3>4.2 Comissao</H3>
      <P>
        A Tech Churras cobra uma comissao de <strong className="text-white">15%</strong> sobre o valor total de cada pedido concluido. Essa comissao cobre os custos operacionais, suporte, infraestrutura tecnologica e processamento de pagamentos.
      </P>

      <H2>5. Politica de Cancelamento</H2>
      <P>
        O cancelamento de pedidos esta sujeito as seguintes regras:
      </P>
      <ul className="space-y-2 mb-4">
        <Li>
          <strong className="text-white">Pedido pendente (PENDING):</strong> cancelamento gratuito a qualquer momento antes da confirmacao.
        </Li>
        <Li>
          <strong className="text-white">Pedido confirmado com mais de 48h de antecedencia:</strong> cancelamento gratuito.
        </Li>
        <Li>
          <strong className="text-white">Pedido confirmado com 24h a 48h de antecedencia:</strong> multa de <strong className="text-white">30%</strong> do valor total do pedido.
        </Li>
        <Li>
          <strong className="text-white">Pedido confirmado com menos de 24h de antecedencia:</strong> multa de <strong className="text-white">50%</strong> do valor total do pedido.
        </Li>
        <Li>
          <strong className="text-white">Pedido em andamento ou concluido:</strong> cancelamento nao permitido.
        </Li>
      </ul>
      <P>
        Em caso de cancelamento pelo Churrasqueiro ou pelo Acougue, o Usuario sera integralmente reembolsado. Reembolsos sao processados em ate 5 dias uteis.
      </P>

      <H2>6. Responsabilidades dos Churrasqueiros e Acougues Parceiros</H2>
      <P>
        Os Churrasqueiros e Acougues parceiros sao profissionais e estabelecimentos autonomos, nao sendo empregados ou prepostos da Tech Churras. Ao cadastrarem-se como parceiros, comprometem-se a:
      </P>
      <ul className="space-y-1 mb-4">
        <Li>Manter dados cadastrais, disponibilidade e precos atualizados.</Li>
        <Li>Prestar os servicos contratados com qualidade, pontualidade e higiene.</Li>
        <Li>Cumprir todas as normas sanitarias, fiscais e trabalhistas aplicaveis.</Li>
        <Li>Informar imediatamente a Plataforma sobre impossibilidades de cumprimento.</Li>
        <Li>Aceitar que avaliacoes recebidas sejam publicas na Plataforma.</Li>
      </ul>

      <H2>7. Avaliacoes e Conduta</H2>
      <P>
        Apos a conclusao de um pedido, Usuarios e Churrasqueiros podem avaliar mutuamente com notas de 1 a 5 estrelas e comentarios. As avaliacoes devem ser honestas e baseadas na experiencia real. E vedado publicar avaliacoes falsas, ofensivas, discriminatorias ou que violem a privacidade de terceiros.
      </P>
      <P>
        A Tech Churras reserva-se o direito de remover avaliacoes que violem estas diretrizes e de suspender ou excluir contas que abusem do sistema de avaliacoes.
      </P>

      <H2>8. Propriedade Intelectual</H2>
      <P>
        Todo o conteudo da Plataforma — incluindo marca, logotipo, design, codigo-fonte, textos e funcionalidades — e de propriedade exclusiva da Tech Churras ou de seus licenciadores. E proibida a reproducao, distribuicao ou utilizacao comercial sem autorizacao previa e expressa.
      </P>

      <H2>9. Limitacao de Responsabilidade</H2>
      <P>
        A Tech Churras nao se responsabiliza por danos diretos, indiretos ou consequentes decorrentes da conduta de Churrasqueiros ou Acougues parceiros, interrupcoes de servico fora de seu controle, ou utilizacao inadequada da Plataforma pelo Usuario.
      </P>
      <P>
        A responsabilidade maxima da Tech Churras em qualquer hipotese fica limitada ao valor pago pelo Usuario no pedido em questao.
      </P>

      <H2>10. Rescisao</H2>
      <P>
        O Usuario pode encerrar sua conta a qualquer momento atraves das configuracoes do perfil. A Tech Churras pode suspender ou encerrar contas que violem estes Termos, mediante notificacao quando possivel.
      </P>

      <H2>11. Alteracoes nos Termos</H2>
      <P>
        A Tech Churras pode atualizar estes Termos a qualquer momento. Alteracoes relevantes serao comunicadas por email ou notificacao na Plataforma com antecedencia minima de 15 dias. O uso continuado da Plataforma apos o prazo configura aceite dos novos Termos.
      </P>

      <H2>12. Foro e Legislacao Aplicavel</H2>
      <P>
        Estes Termos sao regidos pelas leis da Republica Federativa do Brasil. Fica eleito o foro da comarca de Sao Paulo/SP para dirimir quaisquer controversias decorrentes deste instrumento, renunciando as partes a qualquer outro, por mais privilegiado que seja.
      </P>

      <div className="mt-12 pt-6 border-t border-gray-800 text-xs text-gray-600">
        Tech Churras — contato@techchurras.com.br
      </div>
    </article>
  )
}
