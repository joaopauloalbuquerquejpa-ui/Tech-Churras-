import type { Metadata } from 'next'
import EbookClient from './EbookClient'

export const metadata: Metadata = {
  title: 'O Método do Churrasco Exótico — E-book do Jota Albuquerque',
  description: '10 receitas, 5 molhos e as especiarias de Zanzibar que o fundador da Tech Churras usa em eventos reais. Por R$ 19,90.',
  alternates: { canonical: '/metodo-do-churrasco-exotico' },
  openGraph: {
    title: 'O Método do Churrasco Exótico',
    description: 'Fogo brasileiro + especiarias de Zanzibar, num e-book só. 10 receitas, 5 molhos, técnica de fogo.',
    type: 'website',
  },
}

const PAGE_URL = 'https://www.techchurras.com.br/metodo-do-churrasco-exotico'

// Só as perguntas que realmente estão na seção FAQ da página (EbookClient.tsx) —
// schema tem que espelhar o conteúdo visível, não pode divergir.
const FAQ_SCHEMA = [
  ['É PDF ou vídeo?', 'É um e-book em PDF de 24 páginas, com fotos reais de cada receita. Abre em qualquer celular, tablet ou computador — não precisa de aplicativo especial.'],
  ['Funciona em churrasqueira comum, ou só em fogo de chão?', 'Funciona na sua churrasqueira normal. As técnicas de assador de cruz e fogo aberto são mostradas como opção pra quem quiser ir além, mas a maioria das receitas é pensada pra churrasqueira de quintal, do jeito que você já tem em casa.'],
  ['Como eu recebo o e-book depois de comprar?', 'Na hora. Assim que o pagamento é aprovado, o link de download cai automaticamente no seu e-mail — não precisa esperar nem pedir nada.'],
  ['E se eu não gostar?', 'Você tem 7 dias de garantia. Se o método não fizer sentido pra você, é só chamar no WhatsApp que devolvemos seu dinheiro, sem burocracia.'],
  ['O cupom de R$50 tem pegadinha?', 'Nenhuma. É um cupom real (EBOOK50), enviado no mesmo e-mail do e-book, pra usar no seu primeiro churrasco contratado pela Tech Churras.'],
]

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Product',
      name: 'O Método do Churrasco Exótico',
      image: 'https://www.techchurras.com.br/ebook-capa-zanzibar.jpg',
      description: '10 receitas, 5 molhos e as especiarias de Zanzibar que o fundador da Tech Churras usa em eventos reais.',
      brand: { '@type': 'Brand', name: 'Tech Churras' },
      url: PAGE_URL,
      offers: {
        '@type': 'Offer',
        url: PAGE_URL,
        priceCurrency: 'BRL',
        price: '19.90',
        availability: 'https://schema.org/InStock',
      },
    },
    {
      '@type': 'Book',
      name: 'O Método do Churrasco Exótico',
      author: { '@type': 'Person', name: 'Jota Albuquerque', jobTitle: 'Churrasqueiro profissional' },
      inLanguage: 'pt-BR',
      bookFormat: 'https://schema.org/EBook',
      url: PAGE_URL,
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ_SCHEMA.map(([q, a]) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
  ],
}

export default function EbookPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <EbookClient />
    </>
  )
}
