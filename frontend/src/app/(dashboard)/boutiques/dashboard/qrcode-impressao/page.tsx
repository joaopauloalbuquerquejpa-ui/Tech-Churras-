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

export default function QRCodeImpressaoPage() {
  const [boutiqueName, setBoutiqueName] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const token = getToken()
        const [bRes, sRes] = await Promise.all([
          fetch(`${API_URL}/boutiques/my`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/boutiques/dashboard/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        if (bRes.ok) {
          const b = await bRes.json()
          setBoutiqueName(b.name ?? '')
        }
        if (sRes.ok) {
          const s = await sRes.json()
          setReferralCode(s.referralCode ?? '')
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const referralUrl = referralCode ? `${SITE_URL}/r/${referralCode}` : ''

  return (
    <div className="max-w-2xl mx-auto">
      {/* Toolbar — hidden on print */}
      <div className="print:hidden mb-6 flex items-center justify-between">
        <Link href="/boutiques/dashboard" className="text-sm text-gray-500 hover:text-gray-300">
          ← Voltar ao Dashboard
        </Link>
        <button
          onClick={() => window.print()}
          disabled={!referralUrl}
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2"
        >
          🖨️ Imprimir Placa
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-20 print:hidden">Carregando...</div>
      ) : !referralUrl ? (
        <div className="text-center text-gray-500 py-20 print:hidden">
          <p className="mb-2">Código de indicação não encontrado.</p>
          <p className="text-sm">Certifique-se de que seu açougue foi aprovado na plataforma.</p>
        </div>
      ) : (
        <>
          {/* Preview label — hidden on print */}
          <p className="print:hidden text-xs text-gray-600 text-center mb-4">
            Pré-visualização · Clique em "Imprimir Placa" para imprimir ou salvar como PDF
          </p>

          {/* ── PLACA ── (este bloco é o que aparece na impressão) */}
          <div
            id="placa-qr"
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
            {/* Glow decoration */}
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
                <p className="text-sm text-gray-400 mt-1">{boutiqueName}</p>
              )}
            </div>

            {/* Headline */}
            <div className="text-center">
              <p className="text-xl font-black text-white leading-tight">
                Escaneie e ganhe
              </p>
              <p
                className="text-4xl font-black leading-tight"
                style={{
                  background: 'linear-gradient(90deg, #c23616, #fbbf24)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                15% de desconto
              </p>
              <p className="text-lg font-semibold text-gray-300 mt-1">
                no seu primeiro churrasco!
              </p>
            </div>

            {/* QR code */}
            <div
              className="p-4 rounded-2xl"
              style={{ background: 'white', boxShadow: '0 0 30px rgba(194,54,22,0.3)' }}
            >
              <QRCodeSVG
                value={referralUrl}
                size={200}
                level="H"
                fgColor="#1c1714"
                bgColor="#ffffff"
              />
            </div>

            {/* URL */}
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">ou acesse diretamente:</p>
              <p className="text-sm font-mono font-bold text-orange-400 break-all">{referralUrl}</p>
            </div>

            {/* Divider */}
            <div className="w-full border-t border-orange-500/20" />

            {/* Rodapé */}
            <div className="flex items-center justify-between w-full text-xs text-gray-600">
              <span>Plataforma de churrascos profissionais</span>
              <span className="font-bold text-orange-500/70">🔥 techchurras.com.br</span>
            </div>
          </div>
        </>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          #placa-qr {
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
