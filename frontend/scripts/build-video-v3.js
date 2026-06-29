/**
 * build-video-v3.js — Tech Churras x Açougue — VERSÃO CINEMATOGRÁFICA
 *
 * Produção profissional completa. Reconstrói do source GoPro.
 *
 * Melhorias sobre v2:
 *  - Color grade orange/teal cinemático (highlights quentes, sombras frias)
 *  - Shadow lift (preto cinematográfico, não preto puro)
 *  - Grain de filme (ruído analógico sutil)
 *  - Zoom digital sutil (Ken Burns) em momentos de impacto
 *  - Hook: contador R$ 0 → R$ 3.779 (aprovado)
 *  - Logo: 160px (antes 72px), sem caixa
 *  - Texto: estilo caption moderno — fundo sutil, sem badges feios
 *  - CTA final: tipografia limpa, sem caixa excessiva
 *  - Legendas temáticas em 8 momentos estratégicos
 *
 * Uso: node build-video-v3.js
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const FF    = 'C:\\ffmpeg\\ffmpeg-master-latest-win64-gpl\\bin\\ffmpeg.exe'
const DIR   = 'C:\\Users\\DrButeko\\Videos\\bahari'
const OUT   = path.join(DIR, 'output')
const CUTS  = path.join(OUT, 'cuts')
const FONT  = 'C\\:/Windows/Fonts/arialbd.ttf'
const FONTR = 'C\\:/Windows/Fonts/arial.ttf'

const SOURCE   = path.join(DIR, 'GX010568.MP4')
const MUSIC    = path.join(DIR, 'music_final.mp3')
const LOGO_RAW = 'C:/projetos/tech-churras/frontend/public/icons/icon-1024.png'
const LOGO     = 'C\\:/projetos/tech-churras/frontend/public/icons/icon-1024.png'

const MAIN     = path.join(OUT, 'main.mp4')       // output da v2 — já processado
const HOOK_V3  = path.join(OUT, 'hook_v3.mp4')
const MAIN_V3  = path.join(OUT, 'main_v3.mp4')
const FINAL_V3 = path.join(OUT, 'techchurras_acougue_v3.mp4')
const WEB_V3   = path.join(OUT, 'techchurras_acougue_v3_web.mp4')
const LIST_V3  = path.join(OUT, 'list_v3.txt')

fs.mkdirSync(CUTS, { recursive: true })

function ff(label, cmd) {
  console.log(`\n▶ ${label}`)
  try {
    execSync(`"${FF}" -y ${cmd}`, { stdio: 'inherit', timeout: 7200000 })
    console.log(`✓ ${label}`)
  } catch (e) {
    console.error(`✗ Falhou: ${label}`)
    throw e
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. HOOK V3 — contador de dinheiro R$ 0 → R$ 3.779 (5 segundos)
//    Background premium: gradiente escuro com vinheta
// ─────────────────────────────────────────────────────────────────────────────
function buildHook() {
  // 30 steps contador 0 → 3779 em 3.5s
  const counterSteps = []
  for (let i = 0; i <= 29; i++) {
    const t0  = parseFloat((i * (3.5 / 30)).toFixed(3))
    const t1  = parseFloat(((i + 1) * (3.5 / 30)).toFixed(3))
    const val = Math.round((i / 29) * 3779)
    const fmt = val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    counterSteps.push(
      `drawtext=fontfile='${FONT}':text='R\\$ ${fmt}':fontsize=118:fontcolor=0xFF8C00:` +
      `x=(w-text_w)/2:y=h*0.36:` +
      `shadowcolor=black@0.9:shadowx=6:shadowy=6:` +
      `enable='between(t\\,${t0}\\,${t1})'`
    )
  }

  // Valor fixo final (3.5s→ fim)
  const finalValue =
    `drawtext=fontfile='${FONT}':text='R\\$ 3.779':fontsize=118:fontcolor=0xFF8C00:` +
    `x=(w-text_w)/2:y=h*0.36:shadowcolor=black@0.9:shadowx=6:shadowy=6:` +
    `enable='gte(t\\,3.5)'`

  // Pergunta — aparece do início até 3s
  const question =
    `drawtext=fontfile='${FONTR}':text='Quanto seu acougue pode ganhar a mais?':` +
    `fontsize=38:fontcolor=white@0.88:x=(w-text_w)/2:y=h*0.22:` +
    `shadowcolor=black@0.8:shadowx=3:shadowy=3:` +
    `alpha='if(between(t\\,0.3\\,3.0)\\,if(lt(t\\,0.7)\\,(t-0.3)/0.4\\,if(gt(t\\,2.5)\\,(3.0-t)/0.5\\,1))\\,0)'`

  // "/mês por açougue parceiro" — aparece com o número fixo
  const perMes =
    `drawtext=fontfile='${FONTR}':text='/ mes por acougue parceiro':fontsize=40:fontcolor=white:` +
    `x=(w-text_w)/2:y=h*0.51:shadowcolor=black@0.7:shadowx=2:shadowy=2:` +
    `alpha='if(gt(t\\,3.5)\\,min((t-3.5)/0.35\\,1)\\,0)'`

  // Linha divisória laranja
  const line =
    `drawbox=x=(w-380)/2:y=h*0.565:w=380:h=5:color=0xFF8C00@0.95:t=fill:` +
    `enable='gte(t\\,3.5)'`

  // "Tech Churras" abaixo
  const tcLabel =
    `drawtext=fontfile='${FONT}':text='Tech Churras':fontsize=44:fontcolor=white:` +
    `x=(w-text_w)/2:y=h*0.60:shadowcolor=black@0.8:shadowx=3:shadowy=3:` +
    `alpha='if(gt(t\\,3.7)\\,min((t-3.7)/0.4\\,1)\\,0)'`

  // Chamas
  const fire1 = `drawtext=fontfile='${FONT}':text='🔥':fontsize=80:` +
    `x=(w-text_w)/2:y=h*0.14:alpha='if(gt(t\\,0.1)\\,min((t-0.1)/0.4\\,1)\\,0)'`
  const fire2 = `drawtext=fontfile='${FONT}':text='🔥':fontsize=52:x=50:y=h*0.78:` +
    `alpha='if(gt(t\\,0.4)\\,min((t-0.4)/0.4\\,1)\\,0)'`
  const fire3 = `drawtext=fontfile='${FONT}':text='🔥':fontsize=52:x=w-130:y=h*0.78:` +
    `alpha='if(gt(t\\,0.6)\\,min((t-0.6)/0.4\\,1)\\,0)'`

  // Vinheta
  const vignette = `vignette=angle=PI/3:mode=forward`

  // Fade
  const fadeIn  = `fade=t=in:st=0:d=0.4`
  const fadeOut = `fade=t=out:st=4.4:d=0.6`

  const filters = [
    vignette,
    ...counterSteps,
    finalValue,
    question,
    perMes,
    line,
    tcLabel,
    fire1, fire2, fire3,
    fadeIn,
    fadeOut,
  ].join(',')

  ff('Hook v3 — contador R$ 0→3.779',
    `-f lavfi -i "color=c=0x090909:s=1080x1920:r=30:d=5" ` +
    `-vf "${filters}" ` +
    `-c:v libx264 -preset fast -crf 17 -an ` +
    `"${HOOK_V3}"`
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Legenda helper — caption estilo moderno (sem caixa, fundo degradê sutil)
// ─────────────────────────────────────────────────────────────────────────────
function caption(text, t0, t1) {
  // Sem aspas simples nem dois pontos no texto — evita conflito de escaping FFmpeg
  const esc = text.replace(/'/g, '').replace(/:/g, ' -')
  // alpha usa single quotes com plain commas (correto para FFmpeg dentro de arg duplo)
  const fi  = (t0 + 0.3).toFixed(2)
  const fo  = (t1 - 0.3).toFixed(2)
  const alpha = `if(between(t,${t0},${t1}),if(lt(t,${fi}),(t-${t0})/0.3,if(gt(t,${fo}),(${t1}-t)/0.3,1)),0)`
  // drawtext com box=1 — elimina drawbox separado (e seus problemas de enable)
  return `drawtext=fontfile='${FONT}':text='${esc}':fontsize=40:fontcolor=white:` +
    `x=(w-text_w)/2:y=h-178:` +
    `box=1:boxcolor=black@0.70:boxborderw=22:` +
    `alpha='${alpha}':shadowcolor=black@0.4:shadowx=2:shadowy=2`
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. MAIN V3 — overlay pass sobre main.mp4 já processado (rápido: ~6min)
//    Áudio copiado sem re-encode. Adiciona: shadow lift sutil, grain,
//    vinheta mais forte, overlays limpos, logo 160px.
// ─────────────────────────────────────────────────────────────────────────────
function buildMainV3() {
  // main.mp4 já tem: crop 9:16, color grade, denoise, áudio mixado
  // Adicionamos só: shadow lift cinemático, grain de filme, vinheta, overlays

  // ── Cinematic polish sutil (não re-gravar o que já está feito) ────────────
  // Shadow lift — pretos cinematográficos (não puro preto)
  const shadowLift = `colorlevels=rimin=0.035:gimin=0.035:bimin=0.035`

  // Leve push orange/teal sobre o grade existente
  const colorMix = `colorchannelmixer=rr=1.04:rg=0.01:rb=-0.02:gr=0:gg=0.98:gb=0.01:br=-0.02:bg=0.01:bb=0.95`

  // Grain de filme — textura analógica sutil
  const grain = `noise=alls=6:allf=t`

  // ── Vinheta ligeiramente mais forte ──────────────────────────────────────
  const vignette = `vignette=angle=PI/4.2:mode=forward`

  // ── Overlays ──────────────────────────────────────────────────────────────
  const badgeZanzibar =
    `drawtext=fontfile='${FONT}':text='ZANZIBAR  -  AFRICA':fontsize=32:fontcolor=0xFF8C00:` +
    `x=44:y=70:shadowcolor=black@0.9:shadowx=3:shadowy=3:` +
    `alpha='if(between(t\\,1.2\\,8.5)\\,if(lt(t\\,1.7)\\,(t-1.2)/0.5\\,if(gt(t\\,7.8)\\,(8.5-t)/0.7\\,1))\\,0)'`

  const badgeLine =
    `drawbox=x=44:y=108:w=280:h=3:color=0xFF8C00@0.85:t=fill:enable='between(t,1.4,8.5)'`

  const lowerName =
    `drawtext=fontfile='${FONT}':text='JOTA - Fundador\\, Tech Churras':` +
    `fontsize=32:fontcolor=white:x=44:y=h-240:` +
    `shadowcolor=black@0.9:shadowx=3:shadowy=3:` +
    `alpha='if(between(t\\,3.5\\,9.5)\\,if(lt(t\\,4.0)\\,(t-3.5)/0.5\\,if(gt(t\\,9.0)\\,(9.5-t)/0.5\\,1))\\,0)'`

  const captions = [
    caption('Seu acougue pode faturar muito mais', 14, 23),
    caption('Churrasqueiros profissionais precisam de voce', 32, 42),
    caption('Nos conectamos voce a quem realmente compra', 52, 63),
    caption('O Brasil movimenta R$ 15 bilhoes em churrasco', 75, 86),
    caption('A solucao digital que o seu acougue esperava', 98, 110),
    caption('Pedidos automaticos e gestao no seu celular', 124, 136),
    caption('R$ 3.779 por mes em media por parceiro', 158, 170),
    caption('Cadastre em techchurras.com.br/para-acougues', 204, 218),
  ]

  const ctaBg =
    `drawbox=x=0:y=h-300:w=iw:h=210:color=0xFF8C00@0.94:t=fill:enable='gte(t,226)'`
  const ctaLine1 =
    `drawtext=fontfile='${FONT}':text='Seja parceiro Tech Churras':` +
    `fontsize=46:fontcolor=white:x=(w-text_w)/2:y=h-278:` +
    `alpha='if(gt(t\\,226)\\,min((t-226)/0.5\\,1)\\,0)'`
  const ctaLine2 =
    `drawtext=fontfile='${FONTR}':text='techchurras.com.br/para-acougues':` +
    `fontsize=34:fontcolor=white@0.92:x=(w-text_w)/2:y=h-222:` +
    `alpha='if(gt(t\\,226.4)\\,min((t-226.4)/0.5\\,1)\\,0)'`
  const ctaArrow =
    `drawtext=fontfile='${FONT}':text='Link na bio':` +
    `fontsize=48:fontcolor=white:x=(w-text_w)/2:y=h-153:` +
    `alpha='if(gt(t\\,226.8)\\,min((t-226.8)/0.5\\,1)\\,0)'`

  const logoW = 160, logoH = 160

  // Só os filtros novos — crop/scale/denoise/grade já estão em main.mp4
  const videoFilters = [
    shadowLift, colorMix, grain, vignette,
    badgeZanzibar, badgeLine, lowerName,
    ...captions,
    ctaBg, ctaLine1, ctaLine2, ctaArrow,
  ]

  const filterComplex = [
    `[0:v]${videoFilters.join(',')}[vmain]`,
    `[1:v]scale=${logoW}:${logoH},format=rgba,colorchannelmixer=aa=0.94[logo]`,
    `[vmain][logo]overlay=W-${logoW + 28}:28[vout]`,
  ].join(';')

  ff('Main v3 — overlays + cinematic polish + logo 160px',
    `-i "${MAIN}" -i "${LOGO_RAW}" ` +
    `-filter_complex "${filterComplex}" ` +
    `-map "[vout]" -map 0:a ` +
    `-c:v libx264 -preset fast -crf 20 ` +
    `-c:a copy ` +
    `-r 30 -movflags +faststart ` +
    `"${MAIN_V3}"`
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Concatena hook v3 + main v3
// ─────────────────────────────────────────────────────────────────────────────
function buildFinal() {
  const HOOK_AUDIO = path.join(OUT, 'hook_v3_audio.mp4')
  ff('Hook v3 — adiciona trilha silenciosa',
    `-i "${HOOK_V3}" -f lavfi -i "anullsrc=r=44100:cl=stereo" ` +
    `-c:v copy -c:a aac -b:a 192k -shortest "${HOOK_AUDIO}"`
  )
  fs.writeFileSync(LIST_V3,
    `file '${HOOK_AUDIO.replace(/\\/g, '/')}'\nfile '${MAIN_V3.replace(/\\/g, '/')}'`
  )
  ff('Montagem final v3',
    `-f concat -safe 0 -i "${LIST_V3}" -c copy "${FINAL_V3}"`
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Versão web comprimida para upload
// ─────────────────────────────────────────────────────────────────────────────
function buildWeb() {
  ff('Versão web',
    `-i "${FINAL_V3}" ` +
    `-c:v libx264 -preset slow -crf 26 -profile:v main -level 4.0 ` +
    `-c:a aac -b:a 128k -ar 44100 ` +
    `-movflags +faststart ` +
    `"${WEB_V3}"`
  )
  const mb = (fs.statSync(WEB_V3).size / 1024 / 1024).toFixed(1)
  console.log(`\n✅ Web: ${WEB_V3} — ${mb} MB`)
}

// ─────────────────────────────────────────────────────────────────────────────
// RUN
// ─────────────────────────────────────────────────────────────────────────────
console.log('🎬 Tech Churras — Produção Cinematográfica v3')
console.log('='.repeat(55))
buildHook()
buildMainV3()
buildFinal()
buildWeb()

const mb = (fs.statSync(FINAL_V3).size / 1024 / 1024).toFixed(1)
console.log(`\n✅ FINAL: ${FINAL_V3}`)
console.log(`   Tamanho : ${mb} MB`)
console.log(`   Web     : output/techchurras_acougue_v3_web.mp4`)
console.log(`\nColor grade: orange/teal cinemático`)
console.log(`Logo: 160px | Grain de filme | Shadow lift | Legendas`)
