import type { Metadata } from 'next'
import ParaAcouguesClient from './ParaAcouguesClient'
import { API_URL } from '@/lib/api'

export const metadata: Metadata = {
  title: 'Parceria para Açougues em São Paulo — Tech Churras',
  description: 'Transforme seu açougue em um canal digital recorrente em São Paulo. QR code no balcão, pedidos no app, repasse semanal via PIX. Mensalidade R$ 369/mês + 7% de comissão.',
  keywords: ['açougue parceiro São Paulo', 'vender carne online SP', 'parceria açougue SP', 'Tech Churras açougue', 'açougue digital São Paulo', 'açougue QR code', 'açougue app delivery churrasco'],
  alternates: { canonical: '/para-acougues' },
  openGraph: {
    title: 'Seja parceiro açougue do Tech Churras em São Paulo',
    description: 'Coloque um QR code no seu balcão e venda pela plataforma. Seus clientes ganham desconto no primeiro pedido — você ganha recorrência digital.',
    type: 'website',
    images: [{ url: '/jota.jpg', width: 800, height: 800, alt: 'Tech Churras — Parceiro Açougue São Paulo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Seja parceiro açougue do Tech Churras',
    description: 'QR code no balcão + pedidos no app + repasse semanal via PIX.',
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Quanto custa a parceria da Tech Churras para açougues?',
      acceptedAnswer: { '@type': 'Answer', text: 'A mensalidade é de R$ 369/mês com 7% de comissão sobre cada pedido concluído. Açougues fundadores (os primeiros a entrar na plataforma) têm condições especiais e exclusivas.' },
    },
    {
      '@type': 'Question',
      name: 'Como funciona o QR code no balcão?',
      acceptedAnswer: { '@type': 'Answer', text: 'O açougue parceiro recebe um QR code personalizado para colocar no balcão. Quando o cliente escaneia, é direcionado para o catálogo do açougue no app Tech Churras, onde pode montar um kit de churrasco completo com churrasqueiro.' },
    },
    {
      '@type': 'Question',
      name: 'Quando o açougue recebe o pagamento dos pedidos?',
      acceptedAnswer: { '@type': 'Answer', text: 'Os repasses são realizados semanalmente via PIX, direto na conta do açougue, após dedução da comissão de 7% da plataforma.' },
    },
    {
      '@type': 'Question',
      name: 'A Tech Churras atende açougues em toda São Paulo?',
      acceptedAnswer: { '@type': 'Answer', text: 'Sim. A Tech Churras está expandindo a rede de açougues parceiros em toda São Paulo e Grande SP. Açougues de qualquer bairro podem se candidatar à parceria.' },
    },
    {
      '@type': 'Question',
      name: 'Preciso ter sistema de delivery para ser parceiro?',
      acceptedAnswer: { '@type': 'Answer', text: 'Não. A Tech Churras cuida de toda a logística de pedidos via app. O açougue só precisa preparar os cortes selecionados pelo cliente. A entrega é coordenada pela plataforma junto ao churrasqueiro.' },
    },
  ],
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
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <ParaAcouguesClient boutiqueCount={boutiqueCount} />
    </>
  )
}
