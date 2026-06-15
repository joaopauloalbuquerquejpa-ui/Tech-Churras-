'use client'
import { useState } from 'react'

const SUPPORT_PHONE = '5511970593650'
const SUPPORT_MSG = 'Olá! Preciso de ajuda com o Tech Churras.'

export default function SupportButton() {
  const [open, setOpen] = useState(false)

  function openWhatsApp(msg: string) {
    window.open(`https://wa.me/${SUPPORT_PHONE}?text=${encodeURIComponent(msg)}`, '_blank')
    setOpen(false)
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 shadow-2xl w-64 animate-fadeInUp">
          <p className="text-sm font-bold text-white mb-1">Suporte Tech Churras</p>
          <p className="text-xs text-gray-400 mb-3">Respondemos em até 1h em dias úteis (8h–20h).</p>
          <div className="space-y-2">
            <button
              onClick={() => openWhatsApp('Olá! Tenho uma dúvida sobre um pedido em andamento.')}
              className="w-full text-left text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-2.5 rounded-xl transition-colors"
            >
              📦 Dúvida sobre pedido
            </button>
            <button
              onClick={() => openWhatsApp('Olá! Quero saber como contratar um churrasqueiro pelo Tech Churras.')}
              className="w-full text-left text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-2.5 rounded-xl transition-colors"
            >
              🔥 Como contratar um churrasqueiro
            </button>
            <button
              onClick={() => openWhatsApp('Olá! Tenho interesse em ser parceiro do Tech Churras.')}
              className="w-full text-left text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-2.5 rounded-xl transition-colors"
            >
              🤝 Quero ser parceiro
            </button>
            <button
              onClick={() => openWhatsApp(SUPPORT_MSG)}
              className="w-full text-left text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-2.5 rounded-xl transition-colors"
            >
              💬 Outro assunto
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-400 shadow-lg shadow-green-500/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        aria-label="Abrir suporte WhatsApp"
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M11.9 2C6.458 2 2.015 6.443 2.015 11.885c0 1.778.468 3.51 1.36 5.034L2 22l5.225-1.372a9.86 9.86 0 004.675 1.187C17.342 21.815 22 17.385 22 11.9 22 6.458 17.342 2 11.9 2z"/>
          </svg>
        )}
      </button>
    </div>
  )
}
