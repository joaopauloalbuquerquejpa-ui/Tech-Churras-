import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Jota Albuquerque — Fundador da Tech Churras',
  description: 'Conheça Jota Albuquerque, fundador da Tech Churras. 13+ anos de experiência, 500+ eventos e a missão de transformar o churrasco brasileiro.',
  openGraph: {
    title: 'Jota Albuquerque — Fundador da Tech Churras',
    description: 'O visionário por trás da maior plataforma de churrasqueiros profissionais do Brasil.',
    images: [{ url: '/jota.jpg', width: 1200, height: 630, alt: 'Jota Albuquerque' }],
  },
}

export default function FounderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
