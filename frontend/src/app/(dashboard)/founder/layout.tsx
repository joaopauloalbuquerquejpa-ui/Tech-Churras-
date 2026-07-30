import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Jota Albuquerque — Fundador da Tech Churras',
  description: 'Conheça Jota Albuquerque, fundador da Tech Churras. 13 anos de Jota BBQ Eventos, clientela triple-AAA em São Paulo e Rio de Janeiro, e a missão de transformar o churrasco brasileiro.',
  openGraph: {
    title: 'Jota Albuquerque — Fundador da Tech Churras',
    description: '13 anos de Jota BBQ Eventos. O fundador por trás da plataforma que conecta clientes, churrasqueiros e açougues parceiros.',
    images: [{ url: '/jota.jpg', width: 1200, height: 630, alt: 'Jota Albuquerque' }],
  },
}

export default function FounderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
