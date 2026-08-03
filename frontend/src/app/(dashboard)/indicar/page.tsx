'use client'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'

export default function IndicarPage() {
  const { user } = useAuthStore()
  const [copied, setCopied] = useState(false)
  const [shareLink, setShareLink] = useState('')

  useEffect(() => {
    if (user?.id) {
      setShareLink(`https://www.techchurras.com.br/convite/${user.id}`)
    }
  }, [user])

  function copy() {
    if (!shareLink) return
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  function shareWhatsApp() {
    if (!shareLink) return
    const firstName = user?.name?.split(' ')[0] ?? 'eu'
    const msg = `🔥 ${firstName} te indica a Tech Churras!\n\nContratar churrasqueiro profissional ficou fácil:\n- Escolhe pelo app\n- Acompanha chegando ao vivo no mapa\n- Carnes premium do açougue parceiro\n\nUsa meu link e ganha 10% OFF no primeiro churrasco:\n${shareLink}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  function shareGeneric() {
    if (!shareLink) return
    if (navigator.share) {
      navigator.share({ title: 'Tech Churras', text: 'Contrate churrasqueiros profissionais com 10% OFF', url: shareLink })
    } else {
      copy()
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Indicar amigos</h1>
        <p className="text-gray-400 text-sm">Compartilhe seu link e seus amigos ganham 10% OFF no primeiro churrasco.</p>
      </div>

      {/* Hero card */}
      <div className="bg-gradient-to-br from-orange-500/20 to-orange-900/10 border border-orange-500/30 rounded-2xl p-7 mb-6 text-center">
        <p className="text-5xl mb-3">🎁</p>
        <h2 className="text-2xl font-black text-white mb-2">Seu amigo ganha 10% OFF</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Cada pessoa que usar seu link ganha 10% de desconto no primeiro churrasco.
          Quanto mais amigos, mais churrascos gostosos!
        </p>
      </div>

      {/* Link box */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-5">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">Seu link de indicação</p>
        <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 mb-4">
          <span className="flex-1 text-sm text-orange-300 font-mono truncate">{shareLink || 'Carregando...'}</span>
          <button
            onClick={copy}
            className="shrink-0 text-xs font-semibold text-white bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-colors"
          >
            {copied ? '✓ Copiado!' : 'Copiar'}
          </button>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={shareWhatsApp}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M11.9 2C6.458 2 2.015 6.443 2.015 11.885c0 1.778.468 3.51 1.36 5.034L2 22l5.225-1.372a9.86 9.86 0 004.675 1.187C17.342 21.815 22 17.385 22 11.9 22 6.458 17.342 2 11.9 2z"/>
            </svg>
            WhatsApp
          </button>
          <button
            onClick={shareGeneric}
            className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Compartilhar
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-5">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Como funciona</h3>
        <div className="space-y-4">
          {[
            { n: '1', title: 'Compartilhe seu link', desc: 'Envie para amigos, família ou grupos do WhatsApp.' },
            { n: '2', title: 'Amigo cria conta', desc: 'Ele se cadastra usando seu link e já fica com 10% OFF reservado.' },
            { n: '3', title: 'Primeiro churrasco com desconto', desc: 'No primeiro pedido, o desconto de 10% é aplicado automaticamente.' },
          ].map(s => (
            <div key={s.n} className="flex gap-3">
              <span className="w-7 h-7 rounded-full bg-orange-500 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{s.n}</span>
              <div>
                <p className="text-sm font-semibold text-white">{s.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tip */}
      <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4">
        <p className="text-xs text-orange-300 font-semibold mb-1">💡 Dica</p>
        <p className="text-xs text-gray-400 leading-relaxed">
          Compartilhe nos grupos de família, amigos e no trabalho! Cada churrasco indicado por você ajuda a comunidade de churrasqueiros parceiros a crescer.
        </p>
      </div>
    </div>
  )
}
