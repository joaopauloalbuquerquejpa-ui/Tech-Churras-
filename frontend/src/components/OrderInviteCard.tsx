'use client'
import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'

interface InviteCardProps {
  customerName: string
  eventDate: string
  guestCount: number
  eventAddress: string
  grillmasterName?: string
  grillmasterRating?: number
  items?: Array<{ name: string }>
  boutiqueName?: string
}

function CardContent({ data }: { data: InviteCardProps }) {
  const date = new Date(data.eventDate)
  const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const firstName = data.customerName.split(' ')[0]

  // endereço: mostra só cidade/bairro (última parte antes da vírgula ou tudo)
  const addressParts = data.eventAddress.split(',')
  const shortAddress = addressParts.length >= 2
    ? addressParts.slice(-2).join(',').trim()
    : data.eventAddress

  const topItems = (data.items ?? []).slice(0, 4)

  return (
    <div
      style={{
        width: 480,
        minHeight: 640,
        background: 'linear-gradient(160deg, #111111 0%, #1a1a1a 50%, #0f0f0f 100%)',
        fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
        color: '#ffffff',
        padding: '40px 36px',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Decoração de fundo */}
      <div style={{
        position: 'absolute', top: -60, right: -60,
        width: 240, height: 240,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(194,54,22,0.15) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', bottom: -40, left: -40,
        width: 180, height: 180,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(194,54,22,0.10) 0%, transparent 70%)',
      }} />

      {/* Barra laranja topo */}
      <div style={{ height: 4, background: 'linear-gradient(90deg, #c23616, #fb923c)', borderRadius: 2, marginBottom: 32 }} />

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, color: '#c23616', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
          Convite
        </div>
        <div style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.1, marginBottom: 6 }}>
          {firstName} está fazendo
        </div>
        <div style={{
          fontSize: 48, fontWeight: 900, lineHeight: 1,
          background: 'linear-gradient(90deg, #c23616, #fb923c)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          CHURRASCO!
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(194,54,22,0.25)', marginBottom: 24 }} />

      {/* Info grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
        <InfoRow icon="📅" label={dateStr} />
        <InfoRow icon="⏰" label={timeStr} />
        <InfoRow icon="👥" label={`${data.guestCount} convidados`} />
        <InfoRow icon="📍" label={shortAddress} />
      </div>

      {/* Grillmaster */}
      {data.grillmasterName && (
        <>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
              Churrasqueiro
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'linear-gradient(135deg, #c23616, #fb923c)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0,
              }}>
                👨‍🍳
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{data.grillmasterName}</div>
                {data.grillmasterRating != null && (
                  <div style={{ fontSize: 12, color: '#fbbf24', marginTop: 2 }}>
                    {'★'.repeat(Math.round(data.grillmasterRating))}{'☆'.repeat(5 - Math.round(data.grillmasterRating))}
                    {' '}{data.grillmasterRating.toFixed(1)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Cardápio */}
      {topItems.length > 0 && (
        <>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>
              Cardápio{data.boutiqueName ? ` — ${data.boutiqueName}` : ''}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {topItems.map((item, i) => (
                <div key={i} style={{
                  background: 'rgba(194,54,22,0.12)',
                  border: '1px solid rgba(194,54,22,0.25)',
                  borderRadius: 20,
                  padding: '5px 12px',
                  fontSize: 13,
                  color: '#fed7aa',
                  fontWeight: 600,
                }}>
                  🥩 {item.name}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <div style={{ height: 1, background: 'rgba(194,54,22,0.2)', marginBottom: 16 }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#c23616', letterSpacing: 0.5 }}>Tech Churras</div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>techchurras.com.br</div>
        </div>
        <div style={{
          fontSize: 10, color: '#374151',
          background: 'rgba(194,54,22,0.08)',
          border: '1px solid rgba(194,54,22,0.15)',
          borderRadius: 8, padding: '4px 8px',
          fontWeight: 600, letterSpacing: 0.5,
        }}>
          Profissional certificado
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 18, width: 24, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 15, color: '#e5e7eb', fontWeight: 500 }}>{label}</span>
    </div>
  )
}

export function OrderInviteCard({ data, onClose }: { data: InviteCardProps; onClose: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    if (!cardRef.current || downloading) return
    setDownloading(true)
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true })
      const a = document.createElement('a')
      a.download = 'convite-churrasco.png'
      a.href = dataUrl
      a.click()
    } catch {
      // silently fail — user can screenshot
    } finally {
      setDownloading(false)
    }
  }

  async function handleShare() {
    if (!cardRef.current) return
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true })
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], 'convite-churrasco.png', { type: 'image/png' })
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Meu churrasco na Tech Churras!' })
      } else {
        // fallback: download
        await handleDownload()
      }
    } catch {
      await handleDownload()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 max-h-[90vh] overflow-y-auto">
        {/* Card preview — scaled down on small screens */}
        <div style={{ transform: 'scale(0.75)', transformOrigin: 'top center', marginBottom: '-80px' }}>
          <div ref={cardRef}>
            <CardContent data={data} />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 w-full max-w-xs">
          <button
            onClick={handleShare}
            disabled={downloading}
            className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            Compartilhar
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {downloading ? '...' : 'Baixar'}
          </button>
        </div>

        <button
          onClick={onClose}
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors py-1"
        >
          Fechar
        </button>
      </div>
    </div>
  )
}
