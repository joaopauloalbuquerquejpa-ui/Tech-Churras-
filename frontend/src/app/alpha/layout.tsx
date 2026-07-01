import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Alpha Test — Tech Churras',
  description: 'Seja dos primeiros a testar o app de churrasqueiros profissionais de São Paulo. Instale grátis no Android.',
  openGraph: {
    title: 'Testa o app da Tech Churras antes de todo mundo 🔥',
    description: 'Churrasqueiro profissional no celular. Contrate, acompanhe ao vivo, avalie. Teste grátis no Android agora.',
    images: [{ url: '/jota.jpg', width: 1200, height: 630, alt: 'Tech Churras — Alpha Test' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Testa o app da Tech Churras antes de todo mundo 🔥',
    description: 'Churrasqueiro profissional no celular. Contrate, acompanhe ao vivo, avalie.',
    images: ['/jota.jpg'],
  },
}

export default function AlphaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
