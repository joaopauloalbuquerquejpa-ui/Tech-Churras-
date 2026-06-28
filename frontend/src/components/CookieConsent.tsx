'use client'

import { useEffect, useState } from 'react'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('cookie_consent')) {
      setVisible(true)
    }
  }, [])

  function accept() {
    localStorage.setItem('cookie_consent', 'accepted')
    window.dispatchEvent(new Event('cookie_consent_change'))
    setVisible(false)
  }

  function decline() {
    localStorage.setItem('cookie_consent', 'essential')
    window.dispatchEvent(new Event('cookie_consent_change'))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6 md:bottom-4 md:left-4 md:right-auto md:max-w-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 shadow-2xl">
        <p className="text-sm text-gray-300 mb-3">
          Usamos cookies para analytics e personalização. Veja nossa{' '}
          <a href="/politica-de-privacidade" className="underline text-orange-400">
            política de privacidade
          </a>
          .
        </p>
        <div className="flex gap-2">
          <button
            onClick={accept}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-xl py-2 px-3 transition-colors"
          >
            Aceitar
          </button>
          <button
            onClick={decline}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-xl py-2 px-3 transition-colors"
          >
            Só essenciais
          </button>
        </div>
      </div>
    </div>
  )
}
