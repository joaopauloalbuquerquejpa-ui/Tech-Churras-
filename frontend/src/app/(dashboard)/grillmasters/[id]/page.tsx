import type { Metadata } from 'next'
import GrillmasterProfile from './GrillmasterProfile'
import { API_URL } from '@/lib/api'


interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  try {
    const res = await fetch(`${API_URL}/grillmasters/${id}`, { next: { revalidate: 600 } })
    if (!res.ok) throw new Error()
    const gm = await res.json()
    const name: string = gm?.user?.name ?? 'Churrasqueiro'
    const city: string = gm?.city ?? ''
    const state: string = gm?.state ?? ''
    const rating: number = gm?.rating ?? 0
    const price: number = gm?.pricePerHour ?? 0
    const photo: string | null = gm?.photoUrl ?? null

    const title = `${name} — Churrasqueiro em ${city} | Tech Churras`
    const desc = `⭐ ${rating.toFixed(1)} | R$ ${price.toFixed(0)}/h | Churrasqueiro profissional em ${city}, ${state}. Contrate pelo app Tech Churras.`
    const img = photo ?? '/jota.jpg'

    return {
      title,
      description: desc,
      openGraph: {
        title,
        description: desc,
        type: 'profile',
        images: [{ url: img, width: 800, height: 800, alt: name }],
      },
      twitter: { card: 'summary_large_image', title, description: desc, images: [img] },
    }
  } catch {
    return {
      title: 'Churrasqueiro | Tech Churras',
      description: 'Contrate churrasqueiros profissionais certificados. Churrasco de qualidade para o seu evento.',
    }
  }
}

export default async function GrillmasterPage({ params }: Props) {
  const { id } = await params
  let schema: object | null = null
  try {
    const res = await fetch(`${API_URL}/grillmasters/${id}`, { next: { revalidate: 600 } })
    if (res.ok) {
      const gm = await res.json()
      const name: string = gm?.user?.name ?? 'Churrasqueiro'
      const city: string = gm?.city ?? 'São Paulo'
      const price: number = gm?.pricePerHour ?? 0
      const photo: string | null = gm?.photoUrl ?? null
      schema = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://www.techchurras.com.br' },
              { '@type': 'ListItem', position: 2, name: 'Churrasqueiros', item: 'https://www.techchurras.com.br/grillmasters' },
              { '@type': 'ListItem', position: 3, name: name, item: `https://www.techchurras.com.br/grillmasters/${id}` },
            ],
          },
          {
            '@type': 'Service',
            name: `Grillmaster ${name} — Churrasco Profissional em ${city}`,
            provider: {
              '@type': 'Person',
              name,
              image: photo ?? undefined,
            },
            areaServed: { '@type': 'City', name: city },
            offers: {
              '@type': 'Offer',
              priceCurrency: 'BRL',
              price: price.toFixed(2),
              priceSpecification: { '@type': 'UnitPriceSpecification', price, priceCurrency: 'BRL', unitText: 'hora' },
            },
          },
        ],
      }
    }
  } catch {}
  return (
    <>
      {schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />}
      <GrillmasterProfile />
    </>
  )
}