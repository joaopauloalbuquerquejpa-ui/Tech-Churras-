'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { API_URL } from '@/lib/api'
import { Events } from '@/lib/analytics'

const EBOOK_PRICE = 19.9

const RECEITAS_PREVIEW = [
  'Picanha com Rub de Café e Cardamomo',
  'Mishkaki — Espetinho Tanzaniano na Brasa',
  'Costela no Assador de Cruz com Cardamomo e Gengibre',
  'Samaki wa Kupaka — Peixe ao Molho de Coco',
  'Cupim na Brasa com Manteiga de Especiarias',
]

const FAQ = [
  ['É PDF ou vídeo?', 'É um e-book em PDF de 24 páginas, com fotos reais de cada receita. Abre em qualquer celular, tablet ou computador — não precisa de aplicativo especial.'],
  ['Funciona em churrasqueira comum, ou só em fogo de chão?', 'Funciona na sua churrasqueira normal. As técnicas de assador de cruz e fogo aberto são mostradas como opção pra quem quiser ir além, mas a maioria das receitas é pensada pra churrasqueira de quintal, do jeito que você já tem em casa.'],
  ['Como eu recebo o e-book depois de comprar?', 'Na hora. Assim que o pagamento é aprovado, o link de download cai automaticamente no seu e-mail — não precisa esperar nem pedir nada.'],
  ['E se eu não gostar?', 'Você tem 7 dias de garantia. Se o método não fizer sentido pra você, é só chamar no WhatsApp que devolvemos seu dinheiro, sem burocracia.'],
  ['O cupom de R$50 tem pegadinha?', 'Nenhuma. É um cupom real (EBOOK50), enviado no mesmo e-mail do e-book, pra usar no seu primeiro churrasco contratado pela Tech Churras.'],
]

// Isola o useSearchParams num componente próprio, dentro de Suspense — sem
// isso, a página inteira perde SSR e vira "Carregando..." puro pro Google
// Ads e pra qualquer conexão lenta antes do JS hidratar (achado real na
// checagem final do criativo, antes de ativar mídia paga).
function StatusReader({ onStatus }: { onStatus: (status: string | null) => void }) {
  const searchParams = useSearchParams()
  const status = searchParams.get('status')
  useEffect(() => { onStatus(status) }, [status, onStatus])
  return null
}

export default function EbookClient() {
  const [status, setStatus] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    Events.viewContent('metodo-do-churrasco-exotico')
  }, [])

  useEffect(() => {
    if (status === 'success') {
      Events.ebookPurchase(EBOOK_PRICE)
    }
  }, [status])

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
      Events.ebookCheckoutStarted(EBOOK_PRICE)
      window.location.href = data.checkout_url
    } catch (err: any) {
      setError(err.message || 'Não foi possível iniciar o pagamento. Tente novamente.')
      setLoading(false)
    }
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#241c16] text-[#f3e9d8] flex items-center justify-center px-4">
        <Suspense fallback={null}><StatusReader onStatus={setStatus} /></Suspense>
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
      <Suspense fallback={null}><StatusReader onStatus={setStatus} /></Suspense>
      {/* HERO */}
      <section className="relative py-24 px-4 text-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="/ebook-capa-zanzibar.jpg" alt="Pôr do sol em Zanzibar" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(15,10,8,.6) 0%, rgba(15,10,8,.62) 35%, rgba(15,10,8,.55) 55%, rgba(15,10,8,.95) 100%)' }} />
        </div>
        <div className="relative max-w-2xl mx-auto text-[#f3e9d8]">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#e07a2e] mb-5">O churrasqueiro de Madonna, Neymar Jr. e NBA/NFL</p>
          <h1 className="font-serif text-4xl md:text-5xl font-black mb-5 leading-tight">O Método do<br />Churrasco Exótico</h1>
          <p className="text-lg italic text-[#d9c9ac] mb-8">Como impressionar qualquer pessoa com técnicas de fogo, sabores do Brasil e especiarias de Zanzibar</p>
          <p className="text-xs uppercase tracking-widest text-[#a89473] mb-10">Jota Albuquerque — O Churrasqueiro dos Famosos</p>
          <a href="#comprar" className="inline-block bg-[#c2530e] hover:bg-[#a3450c] text-white font-bold px-8 py-4 rounded-xl transition-colors">
            Quero o e-book — R$ 19,90
          </a>
          <p className="text-xs text-[#a89473] mt-4">🔒 Compra segura · Garantia de 7 dias</p>
        </div>
      </section>

      {/* PROVA EM VÍDEO */}
      <section className="max-w-md mx-auto px-4 py-12">
        <p className="text-center text-xs font-bold uppercase tracking-wide text-[#c2530e] mb-4">Não é só conversa — é registro real</p>
        <div className="rounded-2xl overflow-hidden border border-[#e6d9c3] shadow-lg">
          <video src="/ebook-jota-eventos.mp4" className="w-full aspect-[9/16] object-cover bg-black" autoPlay loop muted playsInline controls />
        </div>
        <p className="text-center text-xs text-[#6b5d4f] mt-3">Jota grelhando ao vivo nos shows de Guilherme &amp; Benuto e Mc Daniel, e churrasco para o MC Ryan SP</p>
      </section>

      {/* O QUE TEM DENTRO */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="font-serif text-2xl md:text-3xl font-black text-center mb-10">O que tem dentro</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-10">
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
        <div className="bg-white border border-[#e6d9c3] rounded-2xl p-6">
          <p className="text-xs font-bold uppercase tracking-wide text-[#c2530e] mb-4">Algumas receitas de dentro do e-book</p>
          <ul className="space-y-2">
            {RECEITAS_PREVIEW.map(r => (
              <li key={r} className="text-sm text-[#2a2119] flex items-start gap-2">
                <span className="text-[#c2530e] mt-0.5">🔥</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* COMPARAÇÃO DE VALOR */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-[#241c16] text-[#f3e9d8] rounded-2xl p-8 text-center">
          <p className="text-sm text-[#d9c9ac] mb-2">Um jantar fora pra experimentar algo diferente custa R$150 ou mais.</p>
          <p className="font-serif text-2xl font-black mb-2">Esse método é R$ 19,90 — e fica pra sempre com você.</p>
          <p className="text-sm text-[#a89473]">10 receitas, 5 molhos e a técnica de um churrasqueiro que cozinhou pra Madonna e Neymar Jr., por menos que o preço de uma pizza.</p>
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
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl overflow-hidden border border-[#e6d9c3]">
            <img src="/ebook-jota-neymar.jpg" alt="Jota Albuquerque e equipe Jota BBQ Eventos com Neymar Jr. em evento real" className="w-full h-full object-cover" />
            <p className="text-xs text-[#6b5d4f] text-center py-2 bg-white">Jota e a equipe da Jota BBQ Eventos servindo Neymar Jr.</p>
          </div>
          <div className="rounded-2xl overflow-hidden border border-[#e6d9c3]">
            <img src="/ebook-bahari-fachada.jpg" alt="Fachada do Bahari of Brazil em Zanzibar, Tanzânia" className="w-full h-full object-cover" />
            <p className="text-xs text-[#6b5d4f] text-center py-2 bg-white">O Bahari of Brazil, em Zanzibar — parceria oficial com o Governo</p>
          </div>
        </div>
        <div className="text-center mt-8">
          <a href="#comprar" className="inline-block bg-[#c2530e] hover:bg-[#a3450c] text-white font-bold px-8 py-4 rounded-xl transition-colors">
            Quero o método do Jota — R$ 19,90
          </a>
        </div>
      </section>

      {/* GARANTIA */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="border-2 border-[#c2530e] rounded-2xl p-8 text-center bg-white">
          <div className="text-4xl mb-3">🛡️</div>
          <h3 className="font-serif text-xl font-black mb-2">Garantia de 7 dias</h3>
          <p className="text-sm text-[#6b5d4f] max-w-lg mx-auto">Se você abrir o e-book e sentir que não é pra você, é só chamar no WhatsApp dentro de 7 dias que devolvemos cada centavo. Sem pergunta, sem burocracia.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="font-serif text-2xl md:text-3xl font-black text-center mb-10">Perguntas frequentes</h2>
        <div className="space-y-3">
          {FAQ.map(([q, a], i) => (
            <div key={q} className="bg-white border border-[#e6d9c3] rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left font-bold text-sm"
              >
                <span>{q}</span>
                <span className={`text-[#c2530e] text-lg transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-sm text-[#6b5d4f] leading-relaxed border-t border-[#e6d9c3] pt-3">{a}</div>
              )}
            </div>
          ))}
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
          <div className="flex items-center justify-center gap-3 mt-4 text-[#6b5d4f] text-xs">
            <span>🔒 Pagamento seguro</span>
            <span>·</span>
            <span>🛡️ Garantia 7 dias</span>
            <span>·</span>
            <span>⚡ Acesso imediato</span>
          </div>
          <p className="text-xs text-[#6b5d4f] mt-4">🎁 Bônus: cupom de R$ 50 OFF no primeiro churrasco pela Tech Churras.</p>
        </div>
      </section>

      <footer className="text-center text-xs text-[#a89473] py-10">
        © 2026 Tech Churras · O Método do Churrasco Exótico
      </footer>
    </div>
  )
}
