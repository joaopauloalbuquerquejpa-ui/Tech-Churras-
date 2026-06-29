const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const FF   = 'C:\\ffmpeg\\ffmpeg-master-latest-win64-gpl\\bin\\ffmpeg.exe'
const DIR  = 'c:\\Users\\DrButeko\\Videos\\bahari'
const OUT  = path.join(DIR, 'output')
const FONT = 'C\\:/Windows/Fonts/arialbd.ttf'

const VIDEO = path.join(DIR, 'GX010568.MP4')
const MUSIC = path.join(DIR, 'music_final.mp3')
const LOGO  = 'c:\\projetos\\tech-churras\\frontend\\public\\icons\\icon-1024.png'
const HOOK  = path.join(OUT, 'hook.mp4')
const MAIN  = path.join(OUT, 'main.mp4')
const FINAL = path.join(OUT, 'techchurras_acougue_v1.mp4')
const LIST  = path.join(OUT, 'list.txt')

fs.mkdirSync(OUT, { recursive: true })

function ff(label, cmd) {
  console.log(`\n▶ ${label}`)
  try {
    execSync(`"${FF}" -y ${cmd}`, { stdio: 'inherit', timeout: 600000 })
    console.log(`✓ ${label} concluído`)
  } catch(e) {
    console.error(`✗ Erro em: ${label}`)
    throw e
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. HOOK — 5s tela preta com texto impactante
// ─────────────────────────────────────────────────────────────────────────────
function buildHook() {
  // 3 linhas aparecem em cascata, cor laranja TC na última
  const t1 = `drawtext=fontfile='${FONT}':text='Ele saiu de Sao Paulo':fontsize=58:fontcolor=white:x=(w-text_w)/2:y=h*0.28:alpha='if(between(t\\,0.4\\,4.8)\\,min((t-0.4)/0.35\\,1)\\,0)':shadowcolor=black@0.9:shadowx=3:shadowy=3`
  const t2 = `drawtext=fontfile='${FONT}':text='foi ate Zanzibar na Africa':fontsize=52:fontcolor=white:x=(w-text_w)/2:y=h*0.40:alpha='if(between(t\\,1.1\\,4.8)\\,min((t-1.1)/0.35\\,1)\\,0)':shadowcolor=black@0.9:shadowx=3:shadowy=3`
  const t3 = `drawtext=fontfile='${FONT}':text='e voltou com algo que pode':fontsize=46:fontcolor=0xFFFFFF:x=(w-text_w)/2:y=h*0.53:alpha='if(between(t\\,1.8\\,4.8)\\,min((t-1.8)/0.35\\,1)\\,0)':shadowcolor=black@0.9:shadowx=2:shadowy=2`
  const t4 = `drawtext=fontfile='${FONT}':text='mudar o seu acougue':fontsize=54:fontcolor=0xFF8C00:x=(w-text_w)/2:y=h*0.63:alpha='if(between(t\\,2.3\\,4.8)\\,min((t-2.3)/0.4\\,1)\\,0)':shadowcolor=black@0.9:shadowx=3:shadowy=3`
  const flame = `drawtext=fontfile='${FONT}':text='🔥':fontsize=80:x=(w-text_w)/2:y=h*0.74:alpha='if(between(t\\,2.8\\,4.8)\\,min((t-2.8)/0.4\\,1)\\,0)'`
  const fade = `fade=t=out:st=4.3:d=0.7`

  ff('Hook (tela preta)', `-f lavfi -i "color=c=0x0a0a0a:s=1080x1920:r=30:d=5" -vf "${[t1,t2,t3,t4,flame,fade].join(',')}" -c:v libx264 -preset fast -crf 18 -an "${HOOK}"`)
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. MAIN — vídeo processado: crop 9:16 + cor + ruído + música + overlays + logo
// ─────────────────────────────────────────────────────────────────────────────
function buildMain() {
  // Vídeo original: 2704x2028 (4:3 GoPro)
  // Crop 9:16: width = 2028 * 9/16 = 1140, center x = (2704-1140)/2 = 782
  // Scale para 1080x1920

  // ── Audio chain ──────────────────────────────────────────────────────────
  const audioFC = [
    // Voz: remove ruído, corte frequências extremas, normaliza
    `[0:a]afftdn=nf=-20,highpass=f=100,lowpass=f=9000,loudnorm=I=-14:TP=-1.5:LRA=9[voice]`,
    // Música: volume baixo, fade in 2s, fade out 4s antes do fim
    `[1:a]volume=0.065,afade=t=in:st=0:d=2,afade=t=out:st=242:d=4[music]`,
    // Mix
    `[voice][music]amix=inputs=2:duration=first:dropout_transition=4[aout]`,
  ]

  // ── Video chain ───────────────────────────────────────────────────────────
  // 1. Crop vertical 9:16
  const crop = `crop=1140:2028:782:0`
  // 2. Scale para 1080x1920
  const scale = `scale=1080:1920:flags=lanczos`
  // 3. Sharpening (unsharp mask) — melhora nitidez GoPro
  const sharp = `unsharp=lx=5:ly=5:la=0.7:cx=3:cy=3:ca=0.0`
  // 4. Denoising leve — reduz grão do GoPro
  const denoise = `hqdn3d=luma_spatial=2.0:chroma_spatial=2.0:luma_tmp=3.0:chroma_tmp=3.0`
  // 5. Color grade quente — identidade Tech Churras laranja/âmbar
  const grade = `eq=brightness=0.03:contrast=1.12:saturation=1.28:gamma_r=1.08:gamma_b=0.92`
  // 6. Warm color mixer — puxa vermelho/laranja, reduz azul
  const color = `colorchannelmixer=rr=1.07:rg=0.01:rb=-0.01:gr=0.01:gg=0.97:gb=0.00:br=-0.04:bg=0.00:bb=0.90`
  // 7. Vinheta suave (foco no rosto)
  const vign = `vignette=angle=PI/5:mode=forward`
  // 8. Fade in
  const fadeIn = `fade=t=in:st=0:d=0.8`
  // 9. Fade out
  const fadeOut = `fade=t=out:st=244:d=2`

  // ── Overlays cronometrados ────────────────────────────────────────────────

  // Badge Zanzibar (aparece em 1s, some em 8s)
  const badgeZanzibar = `drawtext=fontfile='${FONT}':text='  🌍  Zanzibar\\, Africa  ':fontsize=34:fontcolor=white:box=1:boxcolor=0x1a3a5c@0.88:boxborderw=18:x=30:y=55:alpha='if(between(t\\,1.0\\,8.0)\\,if(lt(t\\,1.6)\\,(t-1.0)/0.6\\,if(gt(t\\,7.2)\\,(8.0-t)/0.8\\,1))\\,0)'`

  // Lower third — Jota (aparece em 3s, some em 9s)
  const lowerThird = `drawtext=fontfile='${FONT}':text='Jota  |  Fundador  Tech Churras':fontsize=30:fontcolor=0xFF8C00:box=1:boxcolor=black@0.82:boxborderw=14:x=30:y=h-200:alpha='if(between(t\\,3.0\\,9.0)\\,if(lt(t\\,3.6)\\,(t-3.0)/0.6\\,if(gt(t\\,8.2)\\,(9.0-t)/0.8\\,1))\\,0)'`

  // Badge Bahari (55s-68s) — quando ele provavelmente menciona
  const badgeBahari = `drawtext=fontfile='${FONT}':text='  🌊  Bahari of Brazil  ':fontsize=34:fontcolor=white:box=1:boxcolor=0x0a4a6e@0.88:boxborderw=18:x=30:y=55:alpha='if(between(t\\,55\\,68)\\,if(lt(t\\,55.8)\\,(t-55)/0.8\\,if(gt(t\\,67)\\,(68-t)/1.0\\,1))\\,0)'`

  // Stat box (100s-115s)
  const stat = `drawtext=fontfile='${FONT}':text='Churrasco movimenta':fontsize=30:fontcolor=white:box=1:boxcolor=0xFF8C00@0.90:boxborderw=14:x=(w-text_w)/2:y=h*0.12:alpha='if(between(t\\,100\\,115)\\,if(lt(t\\,101)\\,(t-100)/1.0\\,if(gt(t\\,114)\\,(115-t)/1.0\\,1))\\,0)'`
  const stat2 = `drawtext=fontfile='${FONT}':text='R\\$ 15 BILHOES por ano no Brasil':fontsize=34:fontcolor=0xFF8C00:fontfile='${FONT}':box=1:boxcolor=black@0.85:boxborderw=14:x=(w-text_w)/2:y=h*0.19:alpha='if(between(t\\,100.5\\,115)\\,if(lt(t\\,101.5)\\,(t-100.5)/1.0\\,if(gt(t\\,114)\\,(115-t)/1.0\\,1))\\,0)'`

  // Badge Tech Churras (130s-145s)
  const badgeTC = `drawtext=fontfile='${FONT}':text='  🔥  Tech Churras  ':fontsize=36:fontcolor=white:box=1:boxcolor=0xFF8C00@0.92:boxborderw=18:x=30:y=55:alpha='if(between(t\\,130\\,145)\\,if(lt(t\\,131)\\,(t-130)/1.0\\,if(gt(t\\,144)\\,(145-t)/1.0\\,1))\\,0)'`

  // CTA final (últimos 18s)
  const cta1 = `drawtext=fontfile='${FONT}':text='Quero ser parceiro Tech Churras':fontsize=36:fontcolor=white:box=1:boxcolor=0xFF8C00@0.92:boxborderw=16:x=(w-text_w)/2:y=h-220:alpha='if(gt(t\\,228)\\,min((t-228)/0.8\\,1)\\,0)'`
  const cta2 = `drawtext=fontfile='${FONT}':text='👆 Link na bio':fontsize=42:fontcolor=0xFF8C00:box=1:boxcolor=black@0.85:boxborderw=14:x=(w-text_w)/2:y=h-150:alpha='if(gt(t\\,229)\\,min((t-229)/0.8\\,1)\\,0)'`

  const videoFilters = [crop, scale, sharp, denoise, grade, color, vign,
    badgeZanzibar, lowerThird, badgeBahari, stat, stat2, badgeTC, cta1, cta2,
    fadeIn, fadeOut]

  // Logo overlay via filtergraph separado
  const logoW = 72, logoH = 72
  const filterComplex = [
    ...audioFC,
    `[0:v]${videoFilters.join(',')}[vmain]`,
    `[2:v]scale=${logoW}:${logoH},format=rgba,colorchannelmixer=aa=0.75[logo]`,
    `[vmain][logo]overlay=W-${logoW+20}:${20}[vout]`,
  ].join(';')

  ff('Vídeo principal (cor cinematic + áudio + overlays + logo)',
    `-i "${VIDEO}" -i "${MUSIC}" -i "${LOGO}" ` +
    `-filter_complex "${filterComplex}" ` +
    `-map "[vout]" -map "[aout]" ` +
    `-c:v libx264 -preset medium -crf 19 ` +
    `-c:a aac -b:a 192k -ar 44100 ` +
    `-r 30 -movflags +faststart ` +
    `"${MAIN}"`
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. CONCAT hook + main
// ─────────────────────────────────────────────────────────────────────────────
function concat() {
  fs.writeFileSync(LIST,
    `file '${HOOK.replace(/\\/g, '/')}'\nfile '${MAIN.replace(/\\/g, '/')}'`
  )
  ff('Montagem final (hook + vídeo)',
    `-f concat -safe 0 -i "${LIST}" -c copy "${FINAL}"`
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// RUN
// ─────────────────────────────────────────────────────────────────────────────
console.log('🎬 Tech Churras x Açougue — Produção do Vídeo')
console.log('='.repeat(50))
buildHook()
buildMain()
concat()
const mb = (fs.statSync(FINAL).size / 1024 / 1024).toFixed(1)
console.log(`\n✅ PRONTO: ${FINAL}`)
console.log(`   Tamanho : ${mb} MB`)
console.log(`   Formato : 1080x1920 — Reels / TikTok / Stories`)
console.log(`   Duração : ~4 min 10s (hook 5s + vídeo 4min05s)`)
