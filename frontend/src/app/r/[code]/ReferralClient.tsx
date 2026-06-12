'use client'
import Link from 'next/link'
import Image from 'next/image'

interface BoutiqueInfo {
  id: string; name: string; logoUrl: string | null; city: string; state: string
}

interface Props {
  code: string
  boutique: BoutiqueInfo | null
}

export default function ReferralClient({ code, boutique }: Props) {
  const registerUrl = '/register?ref=' + code

  if (!boutique) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <p className="text-5xl mb-4">🥩</p>
          <h1 className="text-2xl font-bold mb-2">Link inválido</h1>
          <p className="text-gray-400 text-sm mb-6">Este link de indicação não existe ou expirou.</p>
          <Link href="/register" className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors">
            Cadastrar sem indicação
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4">
      <div className="max-w-sm w-full">
        {/* Logo / boutique */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-2xl overflow-hidden bg-gray-800 flex items-center justify-center mb-4">
            {boutique.logoUrl ? (
              <Image src={boutique.logoUrl} alt={boutique.name} width={80} height={80} className="object-cover w-full h-full" />
            ) : (
              <span className="text-3xl">🥩</span>
            )}
          </div>
          <p className="text-xs text-orange-400 font-semibold tracking-widest uppercase mb-2">Você foi indicado por</p>
          <h1 className="text-2xl font-black">{boutique.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{boutique.city}, {boutique.state}</p>
        </div>

        {/* Offer card */}
        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/40 rounded-2xl p-6 mb-6 text-center">
          <p className="text-4xl font-black text-orange-400 mb-2">15% OFF</p>
          <p className="text-white font-semibold mb-1">no seu primeiro churrasco</p>
          <p className="text-xs text-gray-400">Cupom aplicado automaticamente no cadastro</p>
        </div>

        {/* Steps */}
        <div className="bg-gray-900 rounded-2xl p-5 mb-6 space-y-3">
          {[
            { n: '1', text: 'Crie sua conta grátis abaixo' },
            { n: '2', text: 'Escolha seu churrasqueiro preferido' },
            { n: '3', text: 'Garanta o desconto no primeiro pedido' },
          ].map(s => (
            <div key={s.n} className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-orange-500 text-white text-xs font-black flex items-center justify-center shrink-0">{s.n}</span>
              <p className="text-sm text-gray-300">{s.text}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link href={registerUrl} className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl text-base transition-colors mb-3">
          Cadastrar e pegar meu desconto
        </Link>
        <Link href="/login" className="block w-full text-center text-gray-500 hover:text-gray-400 text-sm py-2 transition-colors">
          Já tenho conta — entrar
        </Link>

        <p className="text-center text-xs text-gray-700 mt-4">
          Tech Churras · Açougues parceiros em todo Brasil
        </p>
      </div>
    </div>
  )
}
