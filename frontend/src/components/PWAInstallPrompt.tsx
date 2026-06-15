'use client'
import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    setIsStandalone(standalone)
    if (standalone) return

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(ios)

    const dismissed = localStorage.getItem('pwa-prompt-dismissed')
    if (dismissed) return

    if (ios) {
      setTimeout(() => setShow(true), 3000)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShow(true), 2000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    localStorage.setItem('pwa-prompt-dismissed', '1')
    setShow(false)
  }

  async function install() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') localStorage.setItem('pwa-prompt-dismissed', '1')
    setShow(false)
    setDeferredPrompt(null)
  }

  if (!show || isStandalone) return null

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 animate-slideInFromBottom">
      <div className="bg-gray-900 border border-orange-500/30 rounded-2xl p-4 shadow-2xl shadow-black/60 flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-orange-500 flex items-center justify-center shrink-0 text-xl">
          🔥
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm mb-0.5">Instalar Tech Churras</p>
          {isIOS ? (
            <p className="text-xs text-gray-400 leading-relaxed">
              Toque em <span className="text-orange-400">Compartilhar</span> e depois{' '}
              <span className="text-orange-400">"Adicionar à Tela de Início"</span> para acesso rápido.
            </p>
          ) : (
            <p className="text-xs text-gray-400 leading-relaxed">
              Instale o app para acesso rápido com notificações de pedidos.
            </p>
          )}
          {!isIOS && (
            <button
              onClick={install}
              className="mt-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors"
            >
              Instalar agora
            </button>
          )}
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 text-gray-600 hover:text-gray-400 transition-colors p-0.5"
          aria-label="Fechar"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  )
}
