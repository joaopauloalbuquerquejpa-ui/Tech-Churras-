import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from 'remotion'
import { z } from 'zod'

export const reviewVideoSchema = z.object({
  clienteName: z.string(),
  cidade: z.string(),
  nota: z.number().min(1).max(5),
  comentario: z.string(),
  grillmasterName: z.string(),
})

type Props = z.infer<typeof reviewVideoSchema>

const EMBER = '#f97316'
const INK = '#0a0a0a'

function Estrelas({ nota }: { nota: number }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
      {Array.from({ length: 5 }, (_, i) => {
        const delay = i * 4
        const scale = spring({ frame: frame - delay, fps, config: { damping: 10, stiffness: 160 } })
        const filled = i < nota
        return (
          <span
            key={i}
            style={{
              fontSize: 72,
              transform: `scale(${scale})`,
              color: filled ? EMBER : '#3a3a3a',
              textShadow: filled ? `0 0 24px ${EMBER}80` : 'none',
            }}
          >
            ★
          </span>
        )
      })}
    </div>
  )
}

export const ReviewVideo: React.FC<Props> = ({ clienteName, cidade, nota, comentario, grillmasterName }) => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()

  const logoOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' })
  const cardY = spring({ frame: frame - 20, fps, config: { damping: 14 }, durationInFrames: 25 })
  const commentOpacity = interpolate(frame, [45, 65], [0, 1], { extrapolateRight: 'clamp' })
  const outroOpacity = interpolate(
    frame,
    [durationInFrames - 20, durationInFrames - 5],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease) },
  )

  return (
    <AbsoluteFill style={{ backgroundColor: INK, fontFamily: 'Arial, sans-serif' }}>
      {/* Glow de fundo */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 20%, ${EMBER}33 0%, transparent 60%)`,
        }}
      />

      {/* Marca */}
      <div style={{ position: 'absolute', top: 90, width: '100%', textAlign: 'center', opacity: logoOpacity }}>
        <span style={{ fontSize: 44, fontWeight: 900, color: 'white' }}>
          Tech <span style={{ color: EMBER }}>Churras</span>
        </span>
      </div>

      {/* Card central */}
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div
          style={{
            transform: `translateY(${(1 - cardY) * 60}px)`,
            opacity: cardY,
            width: '82%',
            backgroundColor: '#141414',
            border: `1px solid ${EMBER}55`,
            borderRadius: 32,
            padding: '56px 40px',
            textAlign: 'center',
          }}
        >
          <Estrelas nota={nota} />

          <p
            style={{
              opacity: commentOpacity,
              color: 'white',
              fontSize: 40,
              lineHeight: 1.4,
              margin: '40px 0 0',
              fontStyle: 'italic',
            }}
          >
            &ldquo;{comentario}&rdquo;
          </p>

          <p style={{ opacity: commentOpacity, color: EMBER, fontSize: 32, fontWeight: 900, marginTop: 32 }}>
            {clienteName}
          </p>
          <p style={{ opacity: commentOpacity, color: '#999', fontSize: 26, marginTop: 4 }}>
            {cidade} · churrasco com {grillmasterName}
          </p>
        </div>
      </AbsoluteFill>

      {/* Outro */}
      <div
        style={{
          position: 'absolute',
          bottom: 100,
          width: '100%',
          textAlign: 'center',
          opacity: outroOpacity,
        }}
      >
        <p style={{ color: 'white', fontSize: 30, fontWeight: 700 }}>
          Seu churrasco também pode ser assim. 🔥
        </p>
        <p style={{ color: EMBER, fontSize: 26, fontWeight: 900, marginTop: 8 }}>
          techchurras.com.br
        </p>
      </div>
    </AbsoluteFill>
  )
}
