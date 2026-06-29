/**
 * Gera 4 cortes otimizados para tráfego pago em todas as plataformas.
 * Fonte: main.mp4 (já processado: 9:16, color grade, voz+música)
 *
 * Saída:
 *   cuts/techchurras_15s_vertical.mp4   — Instagram/TikTok Stories & short ads
 *   cuts/techchurras_30s_vertical.mp4   — Meta Reels, TikTok, YouTube Shorts   ← formato principal
 *   cuts/techchurras_60s_vertical.mp4   — Meta Reels, TikTok (engajamento)
 *   cuts/techchurras_30s_horizontal.mp4 — YouTube pre-roll, Google Ads, Facebook Feed
 *
 * Uso: node build-video-cuts.js
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const FF    = 'C:\\ffmpeg\\ffmpeg-master-latest-win64-gpl\\bin\\ffmpeg.exe'
const DIR   = 'C:\\Users\\DrButeko\\Videos\\bahari'
const OUT   = path.join(DIR, 'output')
const CUTS  = path.join(OUT, 'cuts')
const FONT  = 'C\\:/Windows/Fonts/arialbd.ttf'

const MAIN   = path.join(OUT, 'main.mp4')          // 246s processado, 1080x1920, voz+música
const SOURCE = path.join(DIR, 'GX010568.MP4')      // fonte raw GoPro 2704x2028
const MUSIC  = path.join(DIR, 'music_final.mp3')
const LOGO_RAW = 'C:/projetos/tech-churras/frontend/public/icons/icon-1024.png'   // para -i flag
const LOGO   = 'C\\:/projetos/tech-churras/frontend/public/icons/icon-1024.png'    // para drawtext/filtro

fs.mkdirSync(CUTS, { recursive: true })

function ff(label, cmd) {
  console.log(`\n▶ ${label}`)
  try {
    execSync(`"${FF}" -y ${cmd}`, { stdio: 'inherit', timeout: 600000 })
    console.log(`✓ ${label}`)
  } catch (e) {
    console.error(`✗ Falhou: ${label}`)
    throw e
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CTA helper — overlay nos últimos segundos de cada corte
// startAt: segundo em que aparece | totalDuration: duração total do corte
// ─────────────────────────────────────────────────────────────────────────────
function ctaOverlays(startAt) {
  return [
    `drawtext=fontfile='${FONT}':text='🔥 Seu acougue no app do churrasco':fontsize=34:fontcolor=white:box=1:boxcolor=0xFF8C00@0.94:boxborderw=15:x=(w-text_w)/2:y=h-210:alpha='if(gt(t\\,${startAt})\\,min((t-${startAt})/0.5\\,1)\\,0)'`,
    `drawtext=fontfile='${FONT}':text='techchurras.com.br/para-acougues':fontsize=28:fontcolor=0xFF8C00:box=1:boxcolor=black@0.88:boxborderw=12:x=(w-text_w)/2:y=h-148:alpha='if(gt(t\\,${startAt + 0.4})\\,min((t-${startAt + 0.4})/0.5\\,1)\\,0)'`,
  ]
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. 15 SEGUNDOS VERTICAL — Instagram Stories, TikTok Short Ad
// Hook visual: Jota no Zanzibar (baked in main.mp4: badge 1-8s, lower-third 3-9s)
// CTA: aparece em 10s
// ─────────────────────────────────────────────────────────────────────────────
function build15s() {
  const cta = ctaOverlays(10).join(',')
  ff('15s vertical — Stories & Short Ads',
    `-i "${MAIN}" -t 15 ` +
    `-vf "${cta}" ` +
    `-af "afade=t=out:st=13:d=2" ` +
    `-c:v libx264 -preset fast -crf 19 ` +
    `-c:a aac -b:a 192k ` +
    `-r 30 -movflags +faststart ` +
    `"${path.join(CUTS, 'techchurras_15s_vertical.mp4')}"`
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. 30 SEGUNDOS VERTICAL — Meta Reels, TikTok, YouTube Shorts (formato principal)
// Hook: mesmo do main (badge Zanzibar 1-8s + lower-third 3-9s)
// CTA: aparece em 24s
// ─────────────────────────────────────────────────────────────────────────────
function build30sVertical() {
  const cta = ctaOverlays(24).join(',')
  ff('30s vertical — Meta Reels, TikTok, YouTube Shorts',
    `-i "${MAIN}" -t 30 ` +
    `-vf "${cta}" ` +
    `-af "afade=t=out:st=27:d=3" ` +
    `-c:v libx264 -preset fast -crf 19 ` +
    `-c:a aac -b:a 192k ` +
    `-r 30 -movflags +faststart ` +
    `"${path.join(CUTS, 'techchurras_30s_vertical.mp4')}"`
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. 60 SEGUNDOS VERTICAL — Meta Reels & TikTok (engajamento profundo)
// Os overlays já aparecem naturalmente: Zanzibar 1-8s, Lower-third 3-9s
// CTA: aparece em 53s
// ─────────────────────────────────────────────────────────────────────────────
function build60s() {
  const cta = ctaOverlays(53).join(',')
  ff('60s vertical — Meta Reels & TikTok engajamento',
    `-i "${MAIN}" -t 60 ` +
    `-vf "${cta}" ` +
    `-af "afade=t=out:st=57:d=3" ` +
    `-c:v libx264 -preset fast -crf 19 ` +
    `-c:a aac -b:a 192k ` +
    `-r 30 -movflags +faststart ` +
    `"${path.join(CUTS, 'techchurras_60s_vertical.mp4')}"`
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. 30 SEGUNDOS HORIZONTAL — YouTube pre-roll, Google Display, Facebook Feed
// Reprocessa do source 2704x2028: crop 16:9 → 1920x1080
// (2028 * 16/9 = 3605 → maior que 2704, então: crop altura = 2704 * 9/16 = 1521)
// ─────────────────────────────────────────────────────────────────────────────
function build30sHorizontal() {
  const crop   = `crop=2704:1521:0:254`                // crop central 16:9
  const scale  = `scale=1920:1080:flags=lanczos`
  const sharp  = `unsharp=lx=5:ly=5:la=0.6`
  const grade  = `eq=brightness=0.03:contrast=1.12:saturation=1.25:gamma_r=1.07:gamma_b=0.93`
  const color  = `colorchannelmixer=rr=1.06:rg=0.01:rb=-0.01:gr=0.01:gg=0.97:gb=0.00:br=-0.04:bg=0.00:bb=0.91`
  const vign   = `vignette=angle=PI/6:mode=forward`

  // Badge Zanzibar top-left (0.5-8s)
  const badge  = `drawtext=fontfile='${FONT}':text='  🌍  Zanzibar\\, Africa  ':fontsize=32:fontcolor=white:box=1:boxcolor=0x1a3a5c@0.88:boxborderw=16:x=30:y=40:alpha='if(between(t\\,0.5\\,8)\\,if(lt(t\\,1.2)\\,(t-0.5)/0.7\\,if(gt(t\\,7)\\,(8-t)/1.0\\,1))\\,0)'`

  // Lower-third (2-9s)
  const lower  = `drawtext=fontfile='${FONT}':text='Jota  |  Fundador  Tech Churras':fontsize=28:fontcolor=0xFF8C00:box=1:boxcolor=black@0.82:boxborderw=12:x=30:y=h-100:alpha='if(between(t\\,2\\,9)\\,if(lt(t\\,2.6)\\,(t-2)/0.6\\,if(gt(t\\,8)\\,(9-t)/1.0\\,1))\\,0)'`

  // Stat overlay (12-20s)
  const stat1  = `drawtext=fontfile='${FONT}':text='Churrasco move R\\$ 15 BILHOES por ano no Brasil':fontsize=34:fontcolor=0xFF8C00:box=1:boxcolor=black@0.88:boxborderw=14:x=(w-text_w)/2:y=h*0.08:alpha='if(between(t\\,12\\,21)\\,if(lt(t\\,13)\\,(t-12)/1.0\\,if(gt(t\\,20)\\,(21-t)/1.0\\,1))\\,0)'`

  // CTA final horizontal (23-30s)
  const ctaH1  = `drawtext=fontfile='${FONT}':text='Seja parceiro Tech Churras':fontsize=48:fontcolor=white:box=1:boxcolor=0xFF8C00@0.94:boxborderw=18:x=(w-text_w)/2:y=h*0.70:alpha='if(gt(t\\,23)\\,min((t-23)/0.6\\,1)\\,0)'`
  const ctaH2  = `drawtext=fontfile='${FONT}':text='techchurras.com.br/para-acougues':fontsize=36:fontcolor=0xFF8C00:box=1:boxcolor=black@0.85:boxborderw=14:x=(w-text_w)/2:y=h*0.82:alpha='if(gt(t\\,23.5)\\,min((t-23.5)/0.6\\,1)\\,0)'`

  const audioFC = [
    `[0:a]afftdn=nf=-20,highpass=f=100,lowpass=f=9000,loudnorm=I=-14:TP=-1.5:LRA=9[voice]`,
    `[1:a]volume=0.065,afade=t=in:st=0:d=2,afade=t=out:st=27:d=3[music]`,
    `[voice][music]amix=inputs=2:duration=first:dropout_transition=3[aout]`,
  ]

  const logoW = 56, logoH = 56
  const videoFilters = [crop, scale, sharp, grade, color, vign, badge, lower, stat1, ctaH1, ctaH2].join(',')
  const filterComplex = [
    ...audioFC,
    `[0:v]${videoFilters}[vmain]`,
    `[2:v]scale=${logoW}:${logoH},format=rgba,colorchannelmixer=aa=0.72[logo]`,
    `[vmain][logo]overlay=W-${logoW + 16}:16[vout]`,
  ].join(';')

  ff('30s horizontal — YouTube, Google Ads, Facebook Feed',
    `-i "${SOURCE}" -i "${MUSIC}" -i "${LOGO_RAW}" ` +
    `-t 30 ` +
    `-filter_complex "${filterComplex}" ` +
    `-map "[vout]" -map "[aout]" ` +
    `-c:v libx264 -preset medium -crf 19 ` +
    `-c:a aac -b:a 192k ` +
    `-r 30 -movflags +faststart ` +
    `"${path.join(CUTS, 'techchurras_30s_horizontal.mp4')}"`
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// RUN
// ─────────────────────────────────────────────────────────────────────────────
console.log('✂️  Tech Churras — Cortes para Tráfego Pago')
console.log('='.repeat(55))
console.log(`Fonte   : ${MAIN}`)
console.log(`Saída   : ${CUTS}`)
console.log('='.repeat(55))

build15s()
build30sVertical()
build60s()
build30sHorizontal()

console.log('\n✅ TODOS OS CORTES PRONTOS')
console.log(`📁 ${CUTS}\n`)
console.log('PLATAFORMAS:')
console.log('  📱 15s vertical  → Instagram Stories, TikTok Short Ad, Meta Stories Ad')
console.log('  📱 30s vertical  → Meta Reels Ad, TikTok In-Feed Ad, YouTube Shorts Ad')
console.log('  📱 60s vertical  → Meta Reels (engajamento), TikTok (Topview/Brand)')
console.log('  🖥️  30s horizontal → YouTube Pre-roll, Google Display, Facebook Feed Ad')
console.log('\nPRÓXIMOS PASSOS:')
console.log('  1. Revisar os cortes e confirmar no player')
console.log('  2. Subir no Meta Ads Manager → Conjunto de anúncios → Criativo')
console.log('  3. Subir no TikTok Ads Manager → Campaign → Creative')
console.log('  4. Subir no Google Ads → Campanhas de Vídeo → Assets')
console.log('  5. Usar URL: techchurras.com.br/para-acougues como destino')
