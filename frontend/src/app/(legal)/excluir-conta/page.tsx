import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Excluir minha conta — Tech Churras',
  description: 'Saiba como solicitar a exclusão da sua conta e dados pessoais na plataforma Tech Churras.',
  alternates: { canonical: '/excluir-conta' },
}

export default function ExcluirContaPage() {
  const EMAIL = 'contato@techchurras.com.br'
  const SUBJECT = 'Solicitação de exclusão de conta'
  const BODY = `Olá, equipe Tech Churras.

Solicito a exclusão completa da minha conta e de todos os meus dados pessoais armazenados na plataforma, conforme previsto na LGPD (Lei 13.709/2018).

Nome cadastrado:
E-mail cadastrado:

Atenciosamente.`

  const mailtoHref = `mailto:${EMAIL}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(BODY)}`

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">Excluir minha conta</h1>
      <p className="text-sm text-gray-500 mb-10">Última atualização: junho de 2026</p>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
        <p className="text-gray-300 text-sm leading-7">
          Você tem o direito de solicitar a exclusão da sua conta e de todos os seus dados pessoais
          da plataforma Tech Churras, conforme a{' '}
          <strong className="text-white">Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018)</strong>.
        </p>
      </div>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-800 pb-2">
          Como solicitar a exclusão
        </h2>
        <ol className="space-y-4">
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-black font-bold text-sm flex items-center justify-center">1</span>
            <div>
              <p className="text-white text-sm font-semibold">Envie um e-mail para a nossa equipe</p>
              <p className="text-gray-400 text-sm mt-1">
                Escreva para{' '}
                <a href={`mailto:${EMAIL}`} className="text-orange-400 hover:text-orange-300 underline">
                  {EMAIL}
                </a>{' '}
                com o assunto <strong className="text-gray-300">"Solicitação de exclusão de conta"</strong>.
              </p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-black font-bold text-sm flex items-center justify-center">2</span>
            <div>
              <p className="text-white text-sm font-semibold">Informe seus dados de cadastro</p>
              <p className="text-gray-400 text-sm mt-1">
                Inclua no e-mail o nome e o endereço de e-mail com os quais você se cadastrou na plataforma.
              </p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-black font-bold text-sm flex items-center justify-center">3</span>
            <div>
              <p className="text-white text-sm font-semibold">Aguarde a confirmação</p>
              <p className="text-gray-400 text-sm mt-1">
                Processamos todas as solicitações em até <strong className="text-white">30 dias corridos</strong>.
                Você receberá uma confirmação por e-mail quando a exclusão for concluída.
              </p>
            </div>
          </li>
        </ol>
      </section>

      <a
        href={mailtoHref}
        className="inline-flex items-center gap-3 bg-orange-500 hover:bg-orange-400 text-black font-bold px-6 py-4 rounded-xl transition-colors text-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="16" x="2" y="4" rx="2"/>
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
        </svg>
        Enviar solicitação por e-mail
      </a>

      <section className="mt-12">
        <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-800 pb-2">
          O que será excluído
        </h2>
        <ul className="space-y-2">
          {[
            'Conta de acesso (e-mail e senha)',
            'Dados de perfil (nome, telefone, endereço)',
            'Histórico de pedidos e eventos',
            'Avaliações e comentários feitos na plataforma',
            'Dados de pagamento associados à conta',
          ].map((item) => (
            <li key={item} className="flex items-start gap-3 text-gray-300 text-sm leading-7">
              <span className="text-orange-400 mt-1">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-800 pb-2">
          Dados que podem ser retidos
        </h2>
        <p className="text-gray-300 text-sm leading-7">
          Conforme exigência legal, alguns dados podem ser mantidos por prazo determinado mesmo após a exclusão
          da conta, como registros de transações financeiras (obrigação fiscal — até 5 anos) e
          logs de acesso (Marco Civil da Internet — até 6 meses).
        </p>
      </section>

      <div className="mt-12 pt-8 border-t border-gray-800 text-sm text-gray-500">
        Dúvidas?{' '}
        <Link href="/politica-de-privacidade" className="text-orange-400 hover:text-orange-300 underline">
          Leia nossa Política de Privacidade
        </Link>
        {' '}ou escreva para{' '}
        <a href={`mailto:${EMAIL}`} className="text-orange-400 hover:text-orange-300 underline">
          {EMAIL}
        </a>.
      </div>
    </div>
  )
}
