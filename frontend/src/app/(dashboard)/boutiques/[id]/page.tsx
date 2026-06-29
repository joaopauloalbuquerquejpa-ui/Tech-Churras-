import type { Metadata } from 'next'
import BoutiqueProfile from './BoutiqueProfile'
import { API_URL } from '@/lib/api'


interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  try {
    const res = await fetch(`${API_URL}/boutiques/${id}`, { next: { revalidate: 600 } })
    if (!res.ok) throw new Error()
    const b = await res.json()
    const name: string = b?.name ?? 'Açougue'
    const city: string = b?.city ?? ''
    const state: string = b?.state ?? ''
    const rating: number = b?.rating ?? 0
    const logo: string | null = b?.logoUrl ?? b?.facadeUrl ?? null

    const title = `${name} — Açougue em ${city} | Tech Churras`
    const desc = `⭐ ${rating.toFixed(1)} | Açougue premium em ${city}, ${state}. Cortes selecionados para churrasco. Peça pelo app Tech Churras.`
    const img = logo ?? '/jota.jpg'

    return {
      title,
      description: desc,
      openGraph: {
        title,
        description: desc,
        type: 'website',
        images: [{ url: img, width: 1200, height: 630, alt: name }],
      },
      twitter: { card: 'summary_large_image', title, description: desc, images: [img] },
    }
  } catch {
    return {
      title: 'Açougue | Tech Churras',
      description: 'Açougues premium com cortes selecionados para seu churrasco.',
    }
  }
}

export default async function BoutiquePage({ params }: Props) {
  const { id } = await params
  let schema: object | null = null
  try {
    const res = await fetch(`${API_URL}/boutiques/${id}`, { next: { revalidate: 600 } })
    if (res.ok) {
      const b = await res.json()
      const name: string = b?.name ?? 'Açougue'
      const city: string = b?.city ?? 'São Paulo'
      const logo: string | null = b?.logoUrl ?? b?.facadeUrl ?? null
      schema = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://www.techchurras.com.br' },
              { '@type': 'ListItem', position: 2, name: 'Açougues', item: 'https://www.techchurras.com.br/boutiques' },
              { '@type': 'ListItem', position: 3, name, item: `https://www.techchurras.com.br/boutiques/${id}` },
            ],
          },
          {
            '@type': 'FoodEstablishment',
            name,
            image: logo ?? undefined,
            address: { '@type': 'PostalAddress', addressLocality: city, addressRegion: 'SP', addressCountry: 'BR' },
            servesCuisine: 'Churrasco Brasileiro',
            url: `https://www.techchurras.com.br/boutiques/${id}`,
          },
        ],
      }
    }
  } catch {}
  return (
    <>
      {schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />}
      <BoutiqueProfile />
    </>
  )
}