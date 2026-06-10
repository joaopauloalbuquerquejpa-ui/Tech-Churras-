import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Jota Albuquerque — O Churrasqueiro dos Famosos',
  description: 'Conheça Jota Albuquerque, o churrasqueiro dos famosos e fundador do Tech Churras. Experiência e tradição no churrasco brasileiro.',
  openGraph: {
    title: 'Jota Albuquerque — O Churrasqueiro dos Famosos',
    description: 'Conheça Jota Albuquerque, o churrasqueiro dos famosos e fundador do Tech Churras.',
    images: [{ url: '/jota.jpg', width: 800, height: 800, alt: 'Jota Albuquerque' }],
  },
}

export default function FounderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
