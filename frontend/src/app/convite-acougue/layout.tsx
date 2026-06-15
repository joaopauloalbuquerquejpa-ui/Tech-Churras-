import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Seja parceiro Tech Churras — Açougue Premium',
  description: 'Seu açougue já tem os clientes. Falta o sistema. Venda cortes para eventos, converta balcão em pedidos digitais e cresça com 3 frentes de faturamento.',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Tech Churras',
    title: 'Seu açougue pode faturar 3x mais com churrascos',
    description: 'Clientes do app + balcão convertido em pedidos digitais + sua equipe de churrasqueiros. 3 frentes, 1 parceria.',
    images: [{ url: '/jota.jpg', width: 800, height: 800, alt: 'Tech Churras — Parceiro Açougue' }],
    url: 'https://www.techchurras.com.br/convite-acougue',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Seu açougue pode faturar 3x mais com churrascos',
    description: 'Clientes do app + balcão convertido em pedidos digitais + sua equipe de churrasqueiros.',
    images: ['/jota.jpg'],
  },
}

export default function ConviteAcougueLayout({ children }: { children: React.ReactNode }) {
  return children
}
