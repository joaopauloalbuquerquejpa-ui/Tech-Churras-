import type { Metadata } from 'next'
import ConviteAcougueClient from './ConviteAcougueClient'

export const metadata: Metadata = {
  title: 'Convite Açougue Fundador',
  description: 'Uma das 3 vagas de Parceiro Fundador da Tech Churras. Mensalidade zerada no início, badge permanente e acesso direto ao fundador.',
  alternates: { canonical: '/convite-acougue' },
  robots: { index: false, follow: true },
}

export default function ConviteAcouguePage() {
  return <ConviteAcougueClient />
}
