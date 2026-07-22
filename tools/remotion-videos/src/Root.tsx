import { Composition } from 'remotion'
import { ReviewVideo, reviewVideoSchema } from './ReviewVideo'

const FPS = 30
const DURATION_SECONDS = 6

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="ReviewVideo"
        component={ReviewVideo}
        durationInFrames={FPS * DURATION_SECONDS}
        fps={FPS}
        width={1080}
        height={1920} // 9:16 — Reels/Stories/TikTok
        schema={reviewVideoSchema}
        defaultProps={{
          clienteName: 'Marina S.',
          cidade: 'São Paulo',
          nota: 5,
          comentario: 'Churrasco impecável, carne no ponto e o churrasqueiro chegou no horário certinho!',
          grillmasterName: 'Team Jota',
        }}
      />
    </>
  )
}
