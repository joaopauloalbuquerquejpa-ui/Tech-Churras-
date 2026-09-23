import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { API_URL } from '@/lib/api'

// QR code do balcão físico do açougue — cliente escaneia, cai direto no
// pedido já com esse açougue pré-selecionado (pedido/page.tsx já lê
// ?boutiqueId= e pula a tela de escolha). Propósito diferente de /r/[code]
// (indicação de cliente novo com desconto de cadastro) — aqui o cliente já
// está no balcão, quer montar o pedido agora, sem tela de cadastro no meio.

interface BoutiqueInfo {
  id: string; name: string
}

async function getBoutique(code: string): Promise<BoutiqueInfo | null> {
  try {
    const res = await fetch(API_URL + '/ref/' + code.toUpperCase(), { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params
  const boutique = await getBoutique(code)
  if (!boutique) return { title: 'Loja não encontrada — Tech Churras' }
  return { title: `Monte seu churrasco — ${boutique.name} — Tech Churras` }
}

export default async function LojaPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const boutique = await getBoutique(code)
  if (!boutique) notFound()
  redirect(`/pedido?boutiqueId=${boutique.id}`)
}
