import type { Metadata } from 'next'
import GaleriaClient from './GaleriaClient'

export const metadata: Metadata = {
  title: 'Galeria de Churrascos',
  description: 'Veja churrascos incriveis realizados por nossos churrasqueiros profissionais. Inspire-se e agende o seu.',
  openGraph: {
    title: 'Galeria de Churrascos — Tech Churras',
    description: 'Churrascos incriveis realizados pelos melhores churrasqueiros do Brasil.',
    images: [{ url: '/jota.jpg', width: 800, height: 800, alt: 'Galeria Tech Churras' }],
  },
}

export default function GaleriaPage() {
  return <GaleriaClient />
}
