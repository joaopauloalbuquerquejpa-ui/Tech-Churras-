/**
 * Monta o vídeo final para captação de açougues/churrasqueiros.
 * Uso: node build-video.js
 *
 * Pipeline:
 * 1. Hook 4s (texto em tela preta)
 * 2. Vídeo principal com:
 *    - Ruído reduzido
 *    - Trilha de fundo -22dB
 *    - Cor quente (warm grade)
 *    - Crop vertical 9:16
 *    - Subtítulos animados
 *    - Overlays de texto cronometrados
 *    - Logo Tech Churras watermark
 *    - CTA final
 */

const { execSync, spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const FFMPEG  = 'C:\\ffmpeg\\ffmpeg-master-latest-win64-gpl\\bin\\ffmpeg.exe'
const VIDEO   = 'c:\\Users\\DrButeko\\Videos\\bahari\\GX010568.MP4'
const AUDIO   = 'c:\\Users\\DrButeko\\Videos\\bahari\\GX010568.wav'
const SRT     = 'c:\\Users\\DrButeko\\Videos\\bahari\\GX010568.srt'
const MUSIC   = 'c:\\Users\\DrButeko\\Videos\\bahari\\music_bg.mp3'
const LOGO    = 'c:\\projetos\\tech-churras\\frontend\\public\\icons\\icon-1024.png'
const OUT_DIR = 'c:\\Users\\DrButeko\\Videos\\bahari\\output'
const HOOK    = path.join(OUT_DIR, '01_hook.mp4')
const MAIN    = path.join(OUT_DIR, '02_main.mp4')
const FINAL   = path.join(OUT_DIR, 'techchurras_acougue_v1.mp4')

fs.mkdirSync(OUT_DIR, { recursive: true })

function run(label, args) {
  console.log(`\n▶ ${label}`)
  const result = execSync(`"${FFMPEG}" ${args} -y`, {
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 50 * 1024 * 1024
  })
  console.log(`✓ ${label}`)
}

// ─── Fonte disponível no Windows ────────────────────────────────────────────
const FONT = 'C\\:/Windows/Fonts/arialbd.ttf'  // Arial Bold

// ─── STEP 1: Hook — tela preta 4s com texto impactante ──────────────────────
function buildHook() {
  // Linha 1: aparece em 0.3s, some em 3.8s
  // Linha 2: aparece em 1.0s, some em 3.8s
  // Linha 3: aparece em 1.8s, some em 3.8s (laranja)
  const drawtext = [
    // Linha 1 - branca
    `drawtext=fontfile='${FONT}':text='Ele foi de São Paulo':fontsize=52:fontcolor=white:x=(w-text_w)/2:y=h*0.30:alpha='if(between(t,0.3,3.8),min((t-0.3)/0.3\\,1)\\,0)':shadowcolor=black:shadowx=2:shadowy=2`,
    // Linha 2 - branca
    `drawtext=fontfile='${FONT}':text='até Zanzibar na África':fontsize=52:fontcolor=white:x=(w-text_w)/2:y=h*0.42:alpha='if(between(t,1.0,3.8),min((t-1.0)/0.3\\,1)\\,0)':shadowcolor=black:shadowx=2:shadowy=2`,
    // Linha 3 - laranja Tech Churras
    `drawtext=fontfile='${FONT}':text='e voltou com uma revolução para o seu açougue 🔥':fontsize=44:fontcolor=0xFF8C00:x=(w-text_w)/2:y=h*0.56:alpha='if(between(t,1.8,3.8),min((t-1.8)/0.4\\,1)\\,0)':shadowcolor=black:shadowx=2:shadowy=2`,
  ].join(',')

  run('Hook (tela preta + texto)', [
    `-f lavfi -i color=c=black:s=1080x1920:r=30:d=4`,
    `-vf "${drawtext}"`,
    `-c:v libx264 -preset fast -crf 20 -an`,
    `"${HOOK}"`
  ].join(' '))
}

// ─── STEP 2: Vídeo principal processado ──────────────────────────────────────
function buildMain() {
  // Largura/altura do GoPro: 3840x2160 (4K) ou 1920x1080
  // Crop vertical 9:16: pega faixa central em x, full height
  // Para 4K (3840x2160): crop 1215x2160 centrado (ou ajuste para rosto)
  // Para 1080p (1920x1080): crop 607x1080 centrado
  // Vamos usar scale primeiro para 1080p depois crop

  // Audio chain: redução de ruído + normalização + mix com música
  // afftdn: AI noise reduction
  // loudnorm: normaliza voz para -14 LUFS (padrão Instagram)
  // amix: mistura com música em -22dB

  const audioFilter = [
    `[0:a]afftdn=nf=-25,highpass=f=120,lowpass=f=8000,loudnorm=I=-14:TP=-1:LRA=7[voice]`,
    `[1:a]volume=0.08,afade=t=in:d=1,afade=t=out:st=240:d=4[music]`,
    `[voice][music]amix=inputs=2:duration=first:dropout_transition=3[aout]`,
  ].join(';')

  // Video chain:
  // 1. scale para 1920x1080
  // 2. crop vertical 9:16 centrado no rosto (ligeiramente à esquerda do centro pois Jota está no centro-esquerda)
  // 3. color grade quente (laranja/âmbar — identidade Tech Churras)
  // 4. subtítulos do SRT
  // 5. overlays de texto cronometrados
  // 6. logo watermark
  // 7. fade in/out

  const srtPath = SRT.replace(/\\/g, '/').replace(/:/g, '\\:')
  const logoPath = LOGO.replace(/\\/g, '/').replace(/:/g, '\\:')

  const videoFilter = [
    // Scale 4K→1080p
    `scale=1920:1080:flags=lanczos`,
    // Crop vertical 9:16: 607x1080 (9/16 * 1080 ≈ 607), offset x para centralizar rosto
    `crop=607:1080:656:0`,
    // Scale para 1080x1920 (padrão Reels)
    `scale=1080:1920:flags=lanczos`,
    // Color grade quente: contraste, saturação, tom âmbar
    `eq=brightness=0.04:contrast=1.08:saturation=1.25:gamma=1.05`,
    `colorchannelmixer=rr=1.05:gg=0.97:bb=0.90`,
    // Vinheta suave nas bordas
    `vignette=PI/5`,
    // Subtítulos do Whisper (SRT)
    `subtitles='${srtPath}':force_style='FontName=Arial Bold,FontSize=22,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BackColour=&H80000000,Bold=1,Outline=2,Shadow=1,Alignment=2,MarginV=80'`,
    // ── Overlays cronometrados ──────────────────────────────────────────────
    // Tag Zanzibar (0s-6s)
    `drawtext=fontfile='${FONT}':text='🌍 Zanzibar\\, África':fontsize=36:fontcolor=white:box=1:boxcolor=0xFF8C00@0.85:boxborderw=12:x=30:y=60:alpha='if(between(t,0.5,6),min((t-0.5)/0.4\\,1)*if(gt(t\\,5.2)\\,(6-t)/0.8\\,1)\\,0)'`,
    // Tag Tech Churras (8s-14s)
    `drawtext=fontfile='${FONT}':text='Tech Churras':fontsize=34:fontcolor=0xFF8C00:box=1:boxcolor=black@0.80:boxborderw=10:x=30:y=60:alpha='if(between(t,8,14),min((t-8)/0.4\\,1)*if(gt(t\\,13.2)\\,(14-t)/0.8\\,1)\\,0)'`,
    // "Bahari of Brazil" (55s-65s)
    `drawtext=fontfile='${FONT}':text='🌊 Bahari of Brazil':fontsize=36:fontcolor=white:box=1:boxcolor=0x006994@0.85:boxborderw=12:x=30:y=60:alpha='if(between(t,55,65),min((t-55)/0.4\\,1)*if(gt(t\\,64)\\,(65-t)/0.8\\,1)\\,0)'`,
    // CTA final (últimos 20s)
    `drawtext=fontfile='${FONT}':text='👆 Link na bio — seja parceiro':fontsize=38:fontcolor=white:box=1:boxcolor=0xFF8C00@0.90:boxborderw=14:x=(w-text_w)/2:y=h-140:alpha='if(gt(t,226),min((t-226)/0.5\\,1)\\,0)'`,
    // Logo TC (canto superior direito, sempre visível)
    `movie='${logoPath}'[logo];[v][logo]overlay=W-80:20:format=auto,format=yuv420p[vout]`,
  ]

  // O último filtro usa overlay que muda a cadeia — separar
  const mainVideoFilter = videoFilter.slice(0, -1).join(',')
  const logoOverlay = videoFilter[videoFilter.length - 1]

  // Fade in 0.5s, fade out 1s no final
  const finalVideoFilter = `${mainVideoFilter},fade=t=in:d=0.5,fade=t=out:st=245:d=1.5[vtmp];${logoOverlay}`

  run('Vídeo principal (cor + áudio + subtítulos + overlays)', [
    `-i "${VIDEO}"`,
    `-i "${MUSIC}"`,
    `-filter_complex "${audioFilter};[0:v]${finalVideoFilter}"`,
    `-map "[vout]" -map "[aout]"`,
    `-c:v libx264 -preset medium -crf 20`,
    `-c:a aac -b:a 192k`,
    `-r 30 -movflags +faststart`,
    `"${MAIN}"`
  ].join(' '))
}

// ─── STEP 3: Concatena hook + vídeo principal ────────────────────────────────
function concat() {
  const list = path.join(OUT_DIR, 'concat.txt')
  fs.writeFileSync(list, `file '${HOOK.replace(/\\/g, '/')}'\nfile '${MAIN.replace(/\\/g, '/')}'`)

  run('Concatenando hook + vídeo', [
    `-f concat -safe 0 -i "${list}"`,
    `-c copy`,
    `"${FINAL}"`
  ].join(' '))
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🎬 Iniciando produção do vídeo Tech Churras x Açougue')
  console.log('='.repeat(55))

  if (!fs.existsSync(SRT)) {
    console.error('❌ SRT não encontrado. Whisper ainda transcrevendo?')
    process.exit(1)
  }
  if (!fs.existsSync(MUSIC)) {
    console.error('❌ Música não encontrada em:', MUSIC)
    process.exit(1)
  }

  buildHook()
  buildMain()
  concat()

  const size = (fs.statSync(FINAL).size / 1024 / 1024).toFixed(1)
  console.log(`\n✅ Vídeo final: ${FINAL}`)
  console.log(`   Tamanho: ${size} MB`)
  console.log(`   Formato: 1080x1920 (Reels/TikTok/Stories)`)
}

main().catch(err => { console.error('ERRO:', err.message); process.exit(1) })
