'use client'
import { useState } from 'react'
import Link from 'next/link'
import { API_URL } from '@/lib/api'

const PLAY_STORE_LINK = 'https://play.google.com/apps/internaltest/4701438334176936500'
const TOTAL_SLOTS = 100
const FILLED_SLOTS = 12

export default function AlphaPage() {
  const [name, setName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/alpha/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, whatsapp }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Erro ao cadastrar.')
      }
      setDone(true)
    } catch (err: any) {
      setError(err.message ?? 'Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const pct = Math.round((FILLED_SLOTS / TOTAL_SLOTS) * 100)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-gray-900 px-4 py-3 flex items-center justify-between max-w-5xl mx-auto">
        <Link href="/" className="font-black text-orange-400 text-lg">🔥 Tech Churras</Link>
        <a
          href={PLAY_STORE_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-1.5 rounded-full transition-colors"
        >
          Baixar Alpha
        </a>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 pt-16 pb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-1.5 text-sm text-green-400 font-semibold mb-6">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Alpha aberto — Android
        </div>
        <h1 className="text-5xl md:text-6xl font-black mb-5 leading-tight">
          Seja o primeiro a testar o{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
            app do churrasco
          </span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
          A Tech Churras conecta você a churrasqueiros profissionais certificados em São Paulo. Contrate, acompanhe ao vivo no mapa e avalie — tudo pelo celular.
        </p>

        {/* Progress */}
        <div className="inline-block bg-gray-900 border border-gray-800 rounded-2xl px-6 py-5 mb-10 w-full max-w-sm text-left">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Vagas de testador</span>
            <span className="text-sm font-bold text-orange-400">{FILLED_SLOTS}/{TOTAL_SLOTS}</span>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-2">{TOTAL_SLOTS - FILLED_SLOTS} vagas disponíveis</p>
        </div>

        {/* CTA principal */}
        <a
          href={PLAY_STORE_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-orange-500 hover:bg-orange-600 text-white font-black px-8 py-4 rounded-2xl text-lg transition-colors shadow-lg shadow-orange-500/20 mb-4"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.18 23.76c.31.17.66.22 1.02.14l11.75-6.79-2.61-2.61-10.16 9.26zM.49 1.29C.18 1.69 0 2.24 0 2.93v18.14c0 .69.18 1.24.49 1.64l.08.08 10.16-10.16v-.24L.57 1.21l-.08.08zM20.13 10.6l-2.9-1.68-2.93 2.93 2.93 2.93 2.91-1.68c.83-.48.83-1.26-.01-1.5zM4.2.1L15.95 6.89l-2.61 2.61L3.18.24C3.49.06 3.89.06 4.2.1z"/>
          </svg>
          Participar do Alpha — Google Play
        </a>
        <p className="text-xs text-gray-600">
          Abre direto no Play Store · Requer Android · Gratuito
        </p>
      </section>

      {/* O que é o Alpha */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          {[
            { icon: '🔥', title: 'Acesso antecipado', desc: 'Você usa o app antes do lançamento público em 06/07/2026 e molda o produto com seu feedback.' },
            { icon: '🥩', title: 'Churrasco profissional', desc: 'Contrate Grill Masters certificados com kit completo de cortes do açougue parceiro, tudo em 4 passos.' },
            { icon: '📍', title: 'GPS em tempo real', desc: 'Acompanhe o churrasqueiro saindo do açougue e chegando até você. ETA atualizado ao vivo.' },
          ].map(item => (
            <div key={item.title} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <span className="text-3xl mb-3 block">{item.icon}</span>
              <h3 className="font-bold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Como participar */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-10">
          <h2 className="text-2xl font-bold mb-6 text-center">Como participar em 2 passos</h2>
          <div className="space-y-5">
            {[
              {
                step: '1',
                title: 'Clique em "Participar do Alpha"',
                desc: 'Você será redirecionado para o Google Play. Clique em "Tornar-se testador" e instale o app.',
              },
              {
                step: '2',
                title: 'Deixe seu contato abaixo',
                desc: 'Cadastre seu nome e WhatsApp para receber atualizações e ser o primeiro a saber das novidades.',
              },
            ].map(item => (
              <div key={item.step} className="flex gap-4">
                <div className="shrink-0 w-9 h-9 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 font-black text-sm">
                  {item.step}
                </div>
                <div>
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="text-sm text-gray-400 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Formulário */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h2 className="text-xl font-bold mb-1">Cadastre seu interesse</h2>
          <p className="text-sm text-gray-500 mb-6">Te avisamos com antecedência quando houver atualização ou evento de teste.</p>

          {done ? (
            <div className="text-center py-4">
              <p className="text-4xl mb-3">🔥</p>
              <h3 className="text-xl font-bold text-green-400 mb-1">Cadastro confirmado!</h3>
              <p className="text-sm text-gray-400 mb-6">Você está na lista. Te avisamos pelo WhatsApp quando rolar novidades.</p>
              <a
                href={PLAY_STORE_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors"
              >
                Instalar o app agora
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Seu nome"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 placeholder-gray-600"
              />
              <input
                required
                type="tel"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                placeholder="WhatsApp (ex: 11999998888)"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 placeholder-gray-600"
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors text-base"
              >
                {loading ? 'Cadastrando...' : 'Quero ser testador alfa'}
              </button>
              <p className="text-xs text-gray-600 text-center">Sem spam. Apenas atualizações do app.</p>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-900 px-4 py-8 text-center text-xs text-gray-600">
        <p>© {new Date().getFullYear()} Tech Churras · Churrasqueiros profissionais em São Paulo</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link href="/termos-de-uso" className="hover:text-gray-400 transition-colors">Termos</Link>
          <Link href="/politica-de-privacidade" className="hover:text-gray-400 transition-colors">Privacidade</Link>
        </div>
      </footer>
    </div>
  )
}
