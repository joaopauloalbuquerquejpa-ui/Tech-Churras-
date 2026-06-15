import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Seja churrasqueiro certificado Tech Churras',
  description: 'Transforme sua habilidade no churrasco em renda real. Receba pedidos, ganhe por evento e construa sua carteira de clientes com a Tech Churras.',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Tech Churras',
    title: 'Transforme churrasco em renda. Churrasqueiro certificado Tech Churras.',
    description: 'Receba pedidos, defina sua agenda, ganhe por evento. Plataforma completa para churrasqueiros profissionais em São Paulo.',
    images: [{ url: '/jota.jpg', width: 800, height: 800, alt: 'Tech Churras — Churrasqueiro Certificado' }],
    url: 'https://www.techchurras.com.br/convite-churrasqueiro',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Transforme churrasco em renda. Churrasqueiro certificado Tech Churras.',
    description: 'Receba pedidos, defina sua agenda, ganhe por evento.',
    images: ['/jota.jpg'],
  },
}

export default function ConviteChurrasqueiroLayout({ children }: { children: React.ReactNode }) {
  return children
}
