import type { Metadata } from 'next'
import ParaChurrasqueirosClient from './ParaChurrasqueirosClient'
import { API_URL } from '@/lib/api'

export const metadata: Metadata = {
  title: 'Seja Churrasqueiro Parceiro — Tech Churras',
  description: 'Transforme seu talento no churrasco em renda recorrente. Receba pedidos pelo app, gerencie sua agenda e receba 85% por PIX toda semana. Zero mensalidade.',
  keywords: ['churrasqueiro parceiro', 'trabalhar como churrasqueiro', 'grillmaster freelance', 'Tech Churras churrasqueiro', 'renda extra churrasco'],
  openGraph: {
    title: 'Seja Churrasqueiro Parceiro do Tech Churras',
    description: 'Zero mensalidade. Receba pedidos pelo app e ganhe 85% de cada evento diretamente no seu PIX toda semana.',
    type: 'website',
    images: [{ url: '/jota.jpg', width: 800, height: 800, alt: 'Tech Churras — Churrasqueiro Parceiro' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Seja Churrasqueiro Parceiro do Tech Churras',
    description: 'Zero mensalidade. 85% de cada pedido vai para você via PIX.',
  },
}


async function getGrillmasterCount(): Promise<number> {
  try {
    const res = await fetch(API_URL + '/grillmasters', { next: { revalidate: 3600 } })
    if (!res.ok) return 0
    const data = await res.json()
    const list = Array.isArray(data) ? data : (data.grillmasters ?? [])
    return list.length
  } catch {
    return 0
  }
}

export default async function ParaChurrasqueirosPage() {
  const grillmasterCount = await getGrillmasterCount()
  return <ParaChurrasqueirosClient grillmasterCount={grillmasterCount} />
}