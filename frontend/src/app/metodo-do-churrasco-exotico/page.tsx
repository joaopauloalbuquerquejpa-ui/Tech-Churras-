import type { Metadata } from 'next'
import EbookClient from './EbookClient'

export const metadata: Metadata = {
  title: 'O Método do Churrasco Exótico — E-book do Jota Albuquerque',
  description: '10 receitas, 5 molhos e as especiarias de Zanzibar que o Churrasqueiro dos Famosos usa em eventos reais. Por R$ 19,90.',
  alternates: { canonical: '/metodo-do-churrasco-exotico' },
  openGraph: {
    title: 'O Método do Churrasco Exótico',
    description: 'Fogo brasileiro + especiarias de Zanzibar, num e-book só. 10 receitas, 5 molhos, técnica de fogo.',
    type: 'website',
  },
}

export default function EbookPage() {
  return <EbookClient />
}
