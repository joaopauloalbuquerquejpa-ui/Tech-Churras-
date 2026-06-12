import type { Metadata } from 'next'
import ReferralClient from './ReferralClient'

const BASE = 'https://tech-churras-production.up.railway.app'

interface BoutiqueInfo {
  id: string; name: string; logoUrl: string | null; city: string; state: string
}

async function getBoutique(code: string): Promise<BoutiqueInfo | null> {
  try {
    const res = await fetch(BASE + '/ref/' + code.toUpperCase(), { next: { revalidate: 300 } })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params
  const boutique = await getBoutique(code)
  if (!boutique) return { title: 'Indicação — Tech Churras' }
  return {
    title: `Indicação de ${boutique.name} — Tech Churras`,
    description: `Você foi indicado por ${boutique.name}! Cadastre-se e ganhe 15% de desconto no seu primeiro churrasco.`,
  }
}

export default async function ReferralPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const boutique = await getBoutique(code)
  return <ReferralClient code={code} boutique={boutique} />
}
