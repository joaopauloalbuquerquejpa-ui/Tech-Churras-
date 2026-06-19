import type { Metadata } from 'next'
import ParaAcouguesClient from './ParaAcouguesClient'
import { API_URL } from '@/lib/api'

export const metadata: Metadata = {
  title: 'Parceria para Açougues — Tech Churras',
  description: 'Transforme seu açougue em um canal digital recorrente. QR code no balcão, pedidos no app, repasse semanal via PIX. Mensalidade R$ 369/mês + 7% de comissão.',
  keywords: ['açougue parceiro', 'vender carne online', 'parceria açougue', 'Tech Churras açougue', 'açougue digital'],
  openGraph: {
    title: 'Seja parceiro açougue do Tech Churras',
    description: 'Coloque um QR code no seu balcão e venda pela plataforma. Seus clientes ganham 15% no primeiro pedido — você ganha recorrência.',
    type: 'website',
    images: [{ url: '/jota.jpg', width: 800, height: 800, alt: 'Tech Churras — Parceiro Açougue' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Seja parceiro açougue do Tech Churras',
    description: 'QR code no balcão + pedidos no app + repasse semanal via PIX.',
  },
}


async function getBoutiqueCount(): Promise<number> {
  try {
    const res = await fetch(API_URL + '/boutiques', { next: { revalidate: 3600 } })
    if (!res.ok) return 0
    const data = await res.json()
    const list = Array.isArray(data) ? data : (data.boutiques ?? [])
    return list.length
  } catch {
    return 0
  }
}

export default async function ParaAcouguesPage() {
  const boutiqueCount = await getBoutiqueCount()
  return <ParaAcouguesClient boutiqueCount={boutiqueCount} />
}