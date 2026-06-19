import type { Metadata } from 'next'
import Link from 'next/link'
import { API_URL } from '@/lib/api'


interface Referrer {
  id: string
  name: string
}

async function getReferrer(userId: string): Promise<Referrer | null> {
  try {
    const res = await fetch(`${API_URL}/ref/user/${userId}`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const referrer = await getReferrer(id)
  const name = referrer?.name?.split(' ')[0] ?? 'um amigo'
  return {
    title: `${name} te convidou para a Tech Churras!`,
    description: 'Contrate churrasqueiros profissionais certificados. Crie sua conta grátis e ganhe 10% OFF no primeiro churrasco.',
    openGraph: {
      title: `${name} te convidou para a Tech Churras!`,
      description: 'Churrasqueiros profissionais + carnes premium. Acompanhe ao vivo no mapa. 10% OFF no seu primeiro pedido.',
      type: 'website',
      images: [{ url: '/jota.jpg', width: 800, height: 800 }],
    },
  }
}

export default async function ConvitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const referrer = await getReferrer(id)
  const firstName = referrer?.name?.split(' ')[0] ?? 'Seu amigo'
  const registerUrl = `/register?convite=${id}`

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4">
      <div className="max-w-sm w-full">

        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-5xl mb-4">🔥</p>
          <p className="text-xs text-orange-400 font-bold tracking-widest uppercase mb-2">Você foi convidado por</p>
          <h1 className="text-3xl font-black mb-1">{firstName}</h1>
          {!referrer && (
            <p className="text-gray-500 text-sm mt-2">Link de convite</p>
          )}
        </div>

        {/* Offer */}
        <div className="bg-gradient-to-br from-orange-500/20 to-red-900/20 border border-orange-500/40 rounded-2xl p-7 mb-6 text-center">
          <p className="text-5xl font-black text-orange-400 mb-1">10% OFF</p>
          <p className="text-white font-bold text-lg mb-1">no seu primeiro churrasco</p>
          <p className="text-xs text-gray-400">Desconto automático — sem precisar de cupom</p>
        </div>

        {/* What is TC */}
        <div className="bg-gray-900 rounded-2xl p-5 mb-6 space-y-3">
          {[
            { icon: '🧑‍🍳', text: 'Churrasqueiros profissionais certificados' },
            { icon: '📍', text: 'Acompanhe chegando ao vivo no mapa' },
            { icon: '🥩', text: 'Carnes premium do açougue parceiro' },
            { icon: '💳', text: 'Pague com segurança pelo Mercado Pago' },
          ].map(b => (
            <div key={b.icon} className="flex items-center gap-3">
              <span className="text-lg shrink-0">{b.icon}</span>
              <p className="text-sm text-gray-300">{b.text}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link href={registerUrl}
          className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl text-base transition-colors mb-3">
          Criar conta e pegar 10% OFF
        </Link>
        <Link href="/login"
          className="block w-full text-center text-gray-500 hover:text-gray-300 text-sm py-2 transition-colors">
          Já tenho conta — entrar
        </Link>

        <p className="text-center text-xs text-gray-700 mt-5">
          🔥 a Tech Churras · Churrasqueiros profissionais
        </p>
      </div>
    </div>
  )
}