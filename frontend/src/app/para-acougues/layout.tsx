import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Para Açougues — Tech Churras',
  description: 'Açougues premium que participam da Tech Churras vendem para eventos sem sair do lugar. QR code no balcão, pedidos digitais, churrasqueiros parceiros.',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Tech Churras',
    title: 'Seu açougue dentro da maior plataforma de churrascos de SP',
    description: 'Venda cortes para eventos, converta clientes do balcão via QR code e tenha sua equipe de churrasqueiros. 3 frentes de faturamento.',
    images: [{ url: '/jota.jpg', width: 1200, height: 630, alt: 'Tech Churras — Para Açougues' }],
    url: 'https://www.techchurras.com.br/para-acougues',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Seu açougue dentro da maior plataforma de churrascos de SP',
    description: 'Venda cortes para eventos, converta clientes do balcão via QR code.',
    images: ['/jota.jpg'],
  },
}

export default function ParaAcouguesLayout({ children }: { children: React.ReactNode }) {
  return children
}
