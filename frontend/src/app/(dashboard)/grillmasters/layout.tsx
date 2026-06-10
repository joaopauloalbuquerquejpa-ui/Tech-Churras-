import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Churrasqueiros Profissionais',
  description: 'Encontre churrasqueiros profissionais chancelados para o seu evento. Avaliações reais, preços transparentes.',
  openGraph: {
    title: 'Churrasqueiros Profissionais — Tech Churras',
    description: 'Encontre churrasqueiros profissionais chancelados para o seu evento.',
  },
}

export default function GrillmastersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
