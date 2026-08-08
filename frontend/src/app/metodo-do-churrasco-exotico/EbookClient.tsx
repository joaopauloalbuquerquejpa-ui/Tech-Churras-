'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { API_URL } from '@/lib/api'

export default function EbookClient() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'page_view', { page_title: 'ebook_metodo_churrasco_exotico' })
    }
  }, [])

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/ebook/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao iniciar pagamento')
      window.location.href = data.checkout_url
    } catch (err: any) {
      setError(err.message || 'Não foi possível iniciar o pagamento. Tente novamente.')
      setLoading(false)
    }
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#241c16] text-[#f3e9d8] flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="text-4xl mb-4">🔥</div>
          <h1 className="text-2xl font-black mb-3">Pagamento confirmado!</h1>
          <p className="text-[#d9c9ac]">Seu e-book chega no e-mail em instantes, com o link de download e seu cupom de R$ 50 OFF pro primeiro churrasco na Tech Churras.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf3e6] text-[#2a2119]">
      {/* HERO */}
      <section className="relative py-24 px-4 text-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="/ebook-capa-zanzibar.jpg" alt="Pôr do sol em Zanzibar" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(15,10,8,.6) 0%, rgba(15,10,8,.62) 35%, rgba(15,10,8,.55) 55%, rgba(15,10,8,.95) 100%)' }} />
        </div>
        <div className="relative max-w-2xl mx-auto text-[#f3e9d8]">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#e07a2e] mb-5">Método completo com receitas, especiarias e técnica</p>
          <h1 className="font-serif text-4xl md:text-5xl font-black mb-5 leading-tight">O Método do<br />Churrasco Exótico</h1>
          <p className="text-lg italic text-[#d9c9ac] mb-8">Como impressionar qualquer pessoa com técnicas de fogo, sabores do Brasil e especiarias de Zanzibar</p>
          <p className="text-xs uppercase tracking-widest text-[#a89473] mb-10">Jota Albuquerque — O Churrasqueiro dos Famosos</p>
          <a href="#comprar" className="inline-block bg-[#c2530e] hover:bg-[#a3450c] text-white font-bold px-8 py-4 rounded-xl transition-colors">
            Quero o e-book — R$ 19,90
          </a>
        </div>
      </section>

      {/* O QUE TEM DENTRO */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="font-serif text-2xl md:text-3xl font-black text-center mb-10">O que tem dentro</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            ['10', 'receitas completas'],
            ['5', 'molhos e acompanhamentos'],
            ['8', 'especiarias de Zanzibar'],
            ['2', 'pratos típicos tanzanianos'],
          ].map(([n, label]) => (
            <div key={label} className="bg-white border border-[#e6d9c3] rounded-2xl p-5">
              <p className="text-3xl font-black text-[#c2530e]">{n}</p>
              <p className="text-sm text-[#6b5d4f] mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AUTOR */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-white border border-[#e6d9c3] rounded-2xl p-8 flex flex-col md:flex-row gap-6 items-center md:items-start">
          <img src="/ebook-autor-jota.jpg" alt="Jota Albuquerque" className="w-32 h-32 rounded-full object-cover shrink-0 shadow-lg" />
          <div>
            <h3 className="font-black text-lg mb-1">Jota Albuquerque</h3>
            <p className="text-xs font-bold text-[#c2530e] uppercase tracking-wide mb-3">O Churrasqueiro dos Famosos</p>
            <p className="text-sm text-[#6b5d4f] leading-relaxed">
              Mais de 13 anos de carreira, presença nos festivais Bárbaros e Let&apos;s Grill Festival, clientes como Madonna, Lady Gaga, Neymar Jr. e atletas de NBA/NFL. Cofundador do Bahari of Brazil, hub culinário em parceria oficial com o Governo de Zanzibar, na Tanzânia — onde aprendeu, de perto, as especiarias que estão nesse método. Também é fundador da Tech Churras.
            </p>
          </div>
        </div>
      </section>

      {/* CHECKOUT */}
      <section id="comprar" className="max-w-md mx-auto px-4 py-16">
        <div className="bg-[#241c16] text-[#f3e9d8] rounded-2xl p-8 text-center">
          <p className="text-sm text-[#a89473] mb-1">Acesso imediato após o pagamento</p>
          <p className="text-4xl font-black text-[#e07a2e] mb-1">R$ 19,90</p>
          <p className="text-xs text-[#a89473] mb-6">Pagamento único · Pix, cartão ou boleto</p>
          <form onSubmit={handleCheckout} className="space-y-3 text-left">
            <div>
              <label className="text-xs text-[#a89473] block mb-1">Seu nome</label>
              <input
                type="text" required value={name} onChange={e => setName(e.target.value)}
                className="w-full rounded-lg bg-[#332821] border border-[#4a3c30] px-4 py-3 text-sm text-white placeholder-[#6b5d4f] focus:outline-none focus:border-[#c2530e]"
                placeholder="Como podemos te chamar"
              />
            </div>
            <div>
              <label className="text-xs text-[#a89473] block mb-1">Seu e-mail</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full rounded-lg bg-[#332821] border border-[#4a3c30] px-4 py-3 text-sm text-white placeholder-[#6b5d4f] focus:outline-none focus:border-[#c2530e]"
                placeholder="Onde enviamos o e-book"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit" disabled={loading}
              className="w-full bg-[#c2530e] hover:bg-[#a3450c] disabled:opacity-60 text-white font-bold py-4 rounded-lg transition-colors"
            >
              {loading ? 'Preparando pagamento...' : 'Comprar agora — R$ 19,90'}
            </button>
          </form>
          <p className="text-xs text-[#6b5d4f] mt-4">🎁 Bônus: cupom de R$ 50 OFF no primeiro churrasco pela Tech Churras.</p>
        </div>
      </section>

      <footer className="text-center text-xs text-[#a89473] py-10">
        © 2026 Tech Churras · O Método do Churrasco Exótico
      </footer>
    </div>
  )
}
