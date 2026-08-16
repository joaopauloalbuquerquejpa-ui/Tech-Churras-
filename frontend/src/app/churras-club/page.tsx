import type { Metadata } from 'next'
import ChurrasClubClient from './ChurrasClubClient'

export const metadata: Metadata = {
  title: 'Churras Club — Assinatura para quem faz churrasco todo mês',
  description: 'R$49/mês: 5% de desconto em todo pedido, churrasqueiro prioritário e suporte VIP. Em fase de lançamento — entre na lista de espera.',
  alternates: { canonical: '/churras-club' },
  openGraph: {
    title: 'Churras Club — Tech Churras',
    description: '5% de desconto em todo pedido, prioridade e suporte VIP para quem faz churrasco todo mês.',
    type: 'website',
  },
}

export default function ChurrasClubPage() {
  return <ChurrasClubClient />
}
