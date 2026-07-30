import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Uso — Tech Churras',
  description: 'Termos de Uso da plataforma Tech Churras. Leia sobre as regras de utilização, política de cancelamento, comissões e responsabilidades.',
  alternates: { canonical: '/termos-de-uso' },
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
      <p className="text-sm text-gray-500 mb-8">Última atualização: junho de 2026 · Versão 1.2</p>

      <P>
        Bem-vindo ao <strong className="text-white">Tech Churras</strong>. Ao se cadastrar ou utilizar nossa plataforma, você concorda com os presentes Termos de Uso. Leia atentamente antes de prosseguir. Em caso de dúvidas, entre em contato pelo e-mail <strong className="text-white">techchurras@gmail.com</strong>.
      </P>

      <H2>1. Definições</H2>
      <ul className="space-y-1 mb-4">
        <Li><strong className="text-white">Plataforma:</strong> o marketplace Tech Churras, disponível em techchurras.com.br e aplicativos associados.</Li>
        <Li><strong className="text-white">Usuário / Cliente:</strong> pessoa física que se cadastra para contratar serviços de churrasco.</Li>
        <Li><strong className="text-white">Churrasqueiro / Grillmaster:</strong> profissional autônomo certificado pela Tech Churras que presta serviços de churrasco via Plataforma.</Li>
        <Li><strong className="text-white">Açougue / Boutique Parceiro:</strong> estabelecimento comercial que fornece carnes e insumos através da Plataforma.</Li>
        <Li><strong className="text-white">Pedido:</strong> contrato de prestação de serviços firmado entre Cliente, Churrasqueiro e/ou Açougue com intermediação da Plataforma.</Li>
        <Li><strong className="text-white">Kit Perfeito:</strong> funcionalidade de planejamento automático de insumos via inteligência artificial.</Li>
      </ul>

      <H2>2. Aceitação dos Termos</H2>
      <P>
        Ao criar uma conta, o Usuário declara ter lido, compreendido e aceito integralmente estes Termos, bem como a Política de Privacidade disponível em techchurras.com.br/politica-de-privacidade. A utilização continuada da Plataforma implica aceite das versões vigentes dos documentos.
      </P>
      <P>
        Menores de 18 anos somente poderão utilizar a Plataforma com autorização expressa dos responsáveis legais.
      </P>

      <H2>3. Cadastro e Responsabilidades do Usuário</H2>
      <P>
        O Usuário deve fornecer informações verdadeiras, completas e atualizadas no cadastro. É responsabilidade exclusiva do Usuário manter a confidencialidade de suas credenciais de acesso. A Tech Churras não se responsabiliza por acessos não autorizados decorrentes de negligência do Usuário.
      </P>
      <P>
        É vedado ao Usuário cadastrar-se com dados falsos, utilizar a Plataforma para fins ilícitos, realizar condutas que prejudiquem outros usuários, parceiros ou a Plataforma, ou tentar burlar mecanismos de segurança e controle.
      </P>

      <H2>4. Funcionamento do Marketplace</H2>
      <P>
        A Tech Churras atua como intermediadora entre Clientes, Churrasqueiros e Açougues, não sendo parte direta na prestação dos serviços. A Plataforma disponibiliza a infraestrutura tecnológica para conexão entre as partes e processamento de pagamentos.
      </P>

      <H3>4.1 Pagamentos</H3>
      <P>
        Os pagamentos são processados de forma segura através de parceiros homologados (Mercado Pago). O valor cobrado ao Cliente inclui o custo do serviço do Churrasqueiro, os produtos do Açougue selecionado e demais itens escolhidos. Os repasses aos parceiros são realizados semanalmente, após dedução das taxas da Plataforma.
      </P>

      <H3>4.2 Taxas e Comissões</H3>
      <P>
        A Tech Churras retém <strong className="text-white">7% (sete por cento)</strong> do valor de cada pedido concluído como taxa de serviço da Plataforma, deduzida diretamente do repasse ao Churrasqueiro. Esta taxa cobre os custos operacionais, suporte, infraestrutura tecnológica e processamento de pagamentos.
      </P>
      <P>
        Sobre o valor total de cada pedido incide uma <strong className="text-white">taxa de serviço de 6% (seis por cento)</strong>, cobrada do Cliente e exibida de forma destacada no resumo do pedido antes da confirmação do pagamento. Esta taxa remunera a operação da Plataforma — coordenação entre churrasqueiro e açougue, acompanhamento ao vivo do evento, suporte e garantias da intermediação.
      </P>
      <P>
        Açougues parceiros estão sujeitos à mensalidade conforme o plano contratado (<strong className="text-white">R$ 369/mês</strong> para os 5 primeiros Açougues Parceiros Fundadores, com 3 meses de período gratuito, ou <strong className="text-white">R$ 497/mês</strong> no plano padrão a partir do 6º açougue), além de comissão de <strong className="text-white">10%</strong> sobre o valor das carnes vendidas via Plataforma.
      </P>

      <H3>4.3 Datas dos Eventos</H3>
      <P>
        Pedidos somente podem ser criados para datas presentes ou futuras. A Plataforma não permite o agendamento retroativo de eventos. Recomenda-se agendar com no mínimo 48 horas de antecedência para garantir a disponibilidade do Churrasqueiro e do Açougue parceiro.
      </P>

      <H2>5. Política de Cancelamento</H2>
      <P>O cancelamento de pedidos está sujeito às seguintes regras:</P>
      <ul className="space-y-2 mb-4">
        <Li>
          <strong className="text-white">Pedido pendente (aguardando confirmação):</strong> cancelamento gratuito a qualquer momento antes da confirmação pelo Churrasqueiro.
        </Li>
        <Li>
          <strong className="text-white">Pedido confirmado com mais de 48h de antecedência:</strong> cancelamento gratuito, com reembolso integral em até 5 dias úteis.
        </Li>
        <Li>
          <strong className="text-white">Pedido confirmado com 24h a 48h de antecedência:</strong> multa de <strong className="text-white">30%</strong> do valor total do pedido, retida a título de indenização pelo Churrasqueiro.
        </Li>
        <Li>
          <strong className="text-white">Pedido confirmado com menos de 24h de antecedência:</strong> multa de <strong className="text-white">50%</strong> do valor total do pedido.
        </Li>
        <Li>
          <strong className="text-white">Pedido em andamento ou concluído:</strong> cancelamento não permitido.
        </Li>
      </ul>
      <P>
        Em caso de cancelamento pelo Churrasqueiro ou pelo Açougue por razões não atribuíveis ao Cliente, o reembolso será integral. Reembolsos são processados em até 5 dias úteis.
      </P>

      <H2>6. Programa de Indicação e Pontos</H2>
      <P>
        A Plataforma oferece programas de indicação e acúmulo de pontos conforme regulamento específico disponível no aplicativo. A Tech Churras reserva-se o direito de alterar, suspender ou encerrar esses programas a qualquer momento, mediante aviso prévio de 15 dias.
      </P>
      <P>
        Açougues parceiros participam do Programa de Indicação e recebem bônus por cliente convertido, conforme condições descritas no dashboard do parceiro. Não há garantia de volume mínimo de indicações ou pedidos pela Plataforma.
      </P>

      <H2>7. Responsabilidades dos Churrasqueiros e Açougues Parceiros</H2>
      <P>
        Os Churrasqueiros e Açougues parceiros são profissionais e estabelecimentos autônomos, não sendo empregados ou prepostos da Tech Churras. Ao cadastrarem-se como parceiros, comprometem-se a:
      </P>
      <ul className="space-y-1 mb-4">
        <Li>Manter dados cadastrais, disponibilidade e preços atualizados na Plataforma.</Li>
        <Li>Prestar os serviços contratados com qualidade, pontualidade e higiene.</Li>
        <Li>Cumprir todas as normas sanitárias, fiscais e trabalhistas aplicáveis.</Li>
        <Li>Informar imediatamente a Plataforma sobre impossibilidades de cumprimento.</Li>
        <Li>Aceitar que avaliações recebidas sejam públicas na Plataforma.</Li>
        <Li>Manter avaliação mínima de 4,0 estrelas para permanência ativa na Plataforma.</Li>
      </ul>

      <H2>8. Avaliações e Conduta</H2>
      <P>
        Após a conclusão de um pedido, Clientes e Churrasqueiros podem avaliar mutuamente com notas de 1 a 5 estrelas e comentários. As avaliações devem ser honestas e baseadas na experiência real. É vedado publicar avaliações falsas, ofensivas, discriminatórias ou que violem a privacidade de terceiros.
      </P>
      <P>
        A Tech Churras reserva-se o direito de remover avaliações que violem estas diretrizes e de suspender ou excluir contas que abusem do sistema de avaliações.
      </P>

      <H2>9. Inteligência Artificial e Funcionalidades Automatizadas</H2>
      <P>
        A Plataforma utiliza sistemas de inteligência artificial (IA) para sugestão de kits de churrasco, recomendação de produtos e assistente de planejamento. As sugestões geradas pela IA têm caráter informativo e não constituem obrigação contratual. O Cliente é responsável pela decisão final sobre os itens do pedido.
      </P>
      <P>
        A Tech Churras não garante precisão absoluta nas estimativas de quantidade, preço ou disponibilidade geradas por IA, que podem variar conforme condições de mercado.
      </P>

      <H2>10. Propriedade Intelectual</H2>
      <P>
        Todo o conteúdo da Plataforma — incluindo marca, logotipo, design, código-fonte, textos e funcionalidades — é de propriedade exclusiva da Tech Churras ou de seus licenciadores. É proibida a reprodução, distribuição ou utilização comercial sem autorização prévia e expressa.
      </P>

      <H2>11. Limitação de Responsabilidade</H2>
      <P>
        A Tech Churras não se responsabiliza por danos diretos, indiretos ou consequentes decorrentes da conduta de Churrasqueiros ou Açougues parceiros, interrupções de serviço fora de seu controle, ou utilização inadequada da Plataforma pelo Usuário.
      </P>
      <P>
        A responsabilidade máxima da Tech Churras em qualquer hipótese fica limitada ao valor pago pelo Usuário no pedido em questão.
      </P>

      <H2>12. Rescisão</H2>
      <P>
        O Usuário pode encerrar sua conta a qualquer momento através das configurações do perfil, desde que não existam pedidos pendentes ou obrigações financeiras em aberto. A Tech Churras pode suspender ou encerrar contas que violem estes Termos, mediante notificação quando possível. Parceiros podem cancelar contratos mediante aviso prévio de 30 dias.
      </P>

      <H2>13. Alterações nos Termos</H2>
      <P>
        A Tech Churras pode atualizar estes Termos a qualquer momento. Alterações relevantes serão comunicadas por e-mail ou notificação na Plataforma com antecedência mínima de 15 dias. O uso continuado da Plataforma após o prazo configura aceite dos novos Termos.
      </P>

      <H2>14. Proteção de Dados (LGPD)</H2>
      <P>
        O tratamento de dados pessoais realizado pela Tech Churras está sujeito à Lei Geral de Proteção de Dados (Lei n.º 13.709/2018 — LGPD). Para informações completas sobre como coletamos, usamos e protegemos seus dados, consulte nossa Política de Privacidade.
      </P>

      <H2>15. Foro e Legislação Aplicável</H2>
      <P>
        Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca de São Paulo/SP para dirimir quaisquer controvérsias decorrentes deste instrumento, renunciando as partes a qualquer outro, por mais privilegiado que seja.
      </P>

      <div className="mt-12 pt-6 border-t border-gray-800 text-xs text-gray-600 space-y-1">
        <p>Tech Churras · CNPJ 67.830.186/0001-87</p>
        <p>São Paulo/SP · techchurras@gmail.com</p>
        <p>Versão 1.2 — Junho de 2026</p>
      </div>
    </article>
  )
}
