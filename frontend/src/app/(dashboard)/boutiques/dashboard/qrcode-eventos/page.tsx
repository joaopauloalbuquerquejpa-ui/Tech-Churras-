'use client'
import { API_URL } from '@/lib/api'
import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import Link from 'next/link'

const SITE_URL = 'https://www.techchurras.com.br'

function getToken() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
}

export default function QRCodeEventosPage() {
  const [boutiqueName, setBoutiqueName] = useState('')
  const [boutiqueId, setBoutiqueId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const token = getToken()
        const res = await fetch(`${API_URL}/boutiques/my`, { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) {
          const b = await res.json()
          setBoutiqueName(b.name ?? '')
          setBoutiqueId(b.id ?? '')
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const balcaoUrl = boutiqueId
    ? `${SITE_URL}/pedido?boutiqueId=${boutiqueId}&utm_source=qr_balcao`
    : ''

  return (
    <div className="max-w-2xl mx-auto">
      <div className="print:hidden mb-6 flex items-center justify-between">
        <Link href="/boutiques/dashboard" className="text-sm text-gray-500 hover:text-gray-300">
          ← Voltar ao Dashboard
        </Link>
        <button
          onClick={() => window.print()}
          disabled={!balcaoUrl}
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2"
        >
          🖨️ Imprimir Placa
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-20 print:hidden">Carregando...</div>
      ) : !balcaoUrl ? (
        <div className="text-center text-gray-500 py-20 print:hidden">
          <p className="mb-2">Açougue não encontrado.</p>
          <p className="text-sm">Certifique-se de que seu açougue foi aprovado na plataforma.</p>
        </div>
      ) : (
        <>
          <p className="print:hidden text-xs text-gray-600 text-center mb-4">
            Pré-visualização · Clique em "Imprimir Placa" para imprimir ou salvar como PDF
          </p>

          {/* ── PLACA ── */}
          <div
            id="placa-eventos"
            className="
              relative overflow-hidden rounded-3xl
              bg-[#1c1714] text-white
              border-4 border-orange-500
              p-8 flex flex-col items-center gap-6
              print:rounded-none print:border-0 print:shadow-none
            "
            style={{
              background: 'linear-gradient(145deg, #1c1714 0%, #1a0a00 50%, #1c1714 100%)',
              boxShadow: '0 0 60px rgba(194,54,22,0.25), inset 0 0 60px rgba(194,54,22,0.04)',
            }}
          >
            {/* Glow */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] pointer-events-none"
              style={{ background: 'radial-gradient(ellipse, rgba(194,54,22,0.18) 0%, transparent 70%)' }}
            />

            {/* Logo */}
            <div className="relative text-center">
              <p className="text-3xl font-black tracking-tight">
                Tech <span className="text-orange-500">Churras</span>
              </p>
              {boutiqueName && (
                <p className="text-sm text-gray-400 mt-1">Parceiro oficial · {boutiqueName}</p>
              )}
            </div>

            {/* Headline */}
            <div className="text-center space-y-1">
              <p className="text-lg font-semibold text-gray-300">Você vai fazer churrasco?</p>
              <p
                className="text-4xl font-black leading-tight"
                style={{
                  background: 'linear-gradient(90deg, #c23616, #fbbf24)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Monte aqui mesmo!
              </p>
              <p className="text-base font-semibold text-gray-300">
                Churrasqueiro profissional + carne separada em um app
              </p>
            </div>

            {/* QR */}
            <div
              className="p-4 rounded-2xl"
              style={{ background: 'white', boxShadow: '0 0 30px rgba(194,54,22,0.3)' }}
            >
              <QRCodeSVG
                value={balcaoUrl}
                size={200}
                level="H"
                fgColor="#1c1714"
                bgColor="#ffffff"
              />
            </div>

            {/* Benefícios rápidos */}
            <div className="grid grid-cols-3 gap-3 w-full text-center">
              {[
                { icon: '👨‍🍳', texto: 'Churrasqueiro certificado' },
                { icon: '🥩', texto: 'Carne já separada aqui' },
                { icon: '🌿', texto: 'Acompanhamentos prontos' },
              ].map(b => (
                <div key={b.texto} className="bg-white/5 border border-orange-500/20 rounded-xl p-2.5">
                  <p className="text-xl mb-1">{b.icon}</p>
                  <p className="text-xs text-gray-300 leading-tight">{b.texto}</p>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="w-full border-t border-orange-500/20" />

            {/* Footer */}
            <div className="flex items-center justify-between w-full text-xs text-gray-600">
              <span>Plataforma de churrascos profissionais</span>
              <span className="font-bold text-orange-500/70">🔥 techchurras.com.br</span>
            </div>
          </div>
        </>
      )}

      <style>{`
        @media print {
          body { background: white !important; }
          #placa-eventos {
            width: 100vw !important;
            min-height: 100vh !important;
            margin: 0 !important;
            padding: 48px !important;
            border-radius: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 32px !important;
          }
        }
      `}</style>
    </div>
  )
}
