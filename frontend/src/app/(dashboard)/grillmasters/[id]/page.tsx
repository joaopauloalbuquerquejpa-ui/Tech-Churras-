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

export default function GrillmasterPage() {
  return <GrillmasterProfile />
}