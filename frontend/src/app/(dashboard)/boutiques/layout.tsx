import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Acougues Parceiros',
  description: 'Acougues parceiros com os melhores cortes para o seu churrasco. Carnes selecionadas com entrega no evento.',
  openGraph: {
    title: 'Acougues Parceiros — Tech Churras',
    description: 'Acougues parceiros com os melhores cortes para o seu churrasco.',
  },
}

export default function BoutiquesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
