import type { Metadata } from 'next'
import BoutiqueProfile from './BoutiqueProfile'

const BASE = 'https://tech-churras-production.up.railway.app'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  try {
    const res = await fetch(`${BASE}/boutiques/${id}`, { next: { revalidate: 600 } })
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
        images: [{ url: img, width: 800, height: 800, alt: name }],
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

export default function BoutiquePage() {
  return <BoutiqueProfile />
}
