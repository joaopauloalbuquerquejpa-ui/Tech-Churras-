/**
 * Faz upload do vídeo horizontal 30s para o canal YouTube do Tech Churras.
 *
 * SETUP (única vez):
 *   1. Acesse: https://console.cloud.google.com/
 *   2. Crie projeto ou selecione existente
 *   3. Habilite "YouTube Data API v3" (APIs & Services → Library)
 *   4. Crie credencial OAuth 2.0 (APIs & Services → Credentials → Create Credentials → OAuth Client ID → Desktop app)
 *   5. Baixe o JSON e salve como: C:\Users\DrButeko\Videos\bahari\client_secret.json
 *
 * USO:
 *   cd C:\projetos\tech-churras\frontend\scripts
 *   npm install googleapis open   (única vez)
 *   node upload-youtube.js
 *
 *   → Abre o browser para login Google (uma vez)
 *   → Upload automático
 */

const fs   = require('fs')
const path = require('path')
const http = require('http')
const url  = require('url')

const { google } = require('googleapis')

// ─── Config ──────────────────────────────────────────────────────────────────
const CREDENTIALS_PATH = 'C:\\Users\\DrButeko\\Videos\\bahari\\client_secret.json'
const TOKEN_PATH       = 'C:\\Users\\DrButeko\\Videos\\bahari\\youtube_token.json'
const VIDEO_PATH       = 'C:\\Users\\DrButeko\\Videos\\bahari\\output\\cuts\\techchurras_30s_horizontal.mp4'

const VIDEO_METADATA = {
  title: 'Ele foi até Zanzibar na África e voltou com o futuro do seu açougue 🔥 | Tech Churras',
  description: `O churrasco movimenta R$ 15 bilhões por ano no Brasil — e o seu açougue ainda não tem presença no app?

Jota Albuquerque, fundador da Tech Churras, foi até Zanzibar na África para abrir o Bahari of Brazil e voltou com uma visão clara: o açougue que não digitaliza fica pra trás.

🔥 Tech Churras é o app que conecta churrasqueiros profissionais a açougues parceiros em São Paulo.

Seja parceiro: https://www.techchurras.com.br/para-acougues

#TechChurras #Acougue #Churrasco #SãoPaulo #Zanzibar #Açougue #NegócioDeChurrasco`,
  tags: [
    'Tech Churras', 'açougue', 'churrasco', 'São Paulo', 'Zanzibar',
    'parceiro açougue', 'app churrasco', 'negócio açougue', 'Jota Albuquerque',
    'Bahari of Brazil', 'churrasco SP', 'açougue digital'
  ],
  categoryId: '22',      // People & Blogs
  privacyStatus: 'public',
  madeForKids: false,
}

// ─── OAuth ───────────────────────────────────────────────────────────────────
const SCOPES = ['https://www.googleapis.com/auth/youtube.upload']

async function getAuthClient() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error(`\n❌ Arquivo de credenciais não encontrado: ${CREDENTIALS_PATH}`)
    console.error('   Siga os passos de SETUP no topo deste arquivo.\n')
    process.exit(1)
  }

  const creds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'))
  const { client_id, client_secret, redirect_uris } = creds.installed || creds.web
  const oauth2 = new google.auth.OAuth2(client_id, client_secret, 'http://localhost:8080')

  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'))
    oauth2.setCredentials(token)
    console.log('✓ Token salvo encontrado — sem necessidade de login.')
    return oauth2
  }

  // Gerar URL de autorização e abrir browser
  const authUrl = oauth2.generateAuthUrl({ access_type: 'offline', scope: SCOPES })
  console.log('\n🔐 Abrindo browser para autorização Google...')
  console.log(`   URL: ${authUrl}\n`)

  const { exec } = require('child_process')
  exec(`start "" "${authUrl}"`)  // abre no browser padrão do Windows

  // Servidor local para capturar o código de retorno
  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const params = new url.URL(req.url, 'http://localhost:8080').searchParams
      const code = params.get('code')
      if (code) {
        res.end('<h2>✅ Autorizado! Pode fechar esta aba.</h2>')
        server.close()
        resolve(code)
      } else {
        res.end('<h2>❌ Código não encontrado.</h2>')
        server.close()
        reject(new Error('Código OAuth não recebido'))
      }
    }).listen(8080, () => console.log('   Aguardando retorno do Google na porta 8080...'))
    setTimeout(() => { server.close(); reject(new Error('Timeout — 5 min sem resposta')) }, 300000)
  })

  const { tokens } = await oauth2.getToken(code)
  oauth2.setCredentials(tokens)
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2))
  console.log('✓ Token salvo em:', TOKEN_PATH)
  return oauth2
}

// ─── Upload ───────────────────────────────────────────────────────────────────
async function uploadVideo(auth) {
  if (!fs.existsSync(VIDEO_PATH)) {
    console.error(`\n❌ Vídeo não encontrado: ${VIDEO_PATH}`)
    process.exit(1)
  }

  const fileSize = fs.statSync(VIDEO_PATH).size
  const fileSizeMB = (fileSize / 1024 / 1024).toFixed(1)
  console.log(`\n📹 Iniciando upload: ${path.basename(VIDEO_PATH)} (${fileSizeMB} MB)`)

  const youtube = google.youtube({ version: 'v3', auth })

  const res = await youtube.videos.insert(
    {
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title:       VIDEO_METADATA.title,
          description: VIDEO_METADATA.description,
          tags:        VIDEO_METADATA.tags,
          categoryId:  VIDEO_METADATA.categoryId,
          defaultLanguage: 'pt',
          defaultAudioLanguage: 'pt',
        },
        status: {
          privacyStatus: VIDEO_METADATA.privacyStatus,
          madeForKids:   VIDEO_METADATA.madeForKids,
        },
      },
      media: {
        mimeType: 'video/mp4',
        body: fs.createReadStream(VIDEO_PATH),
      },
    },
    {
      onUploadProgress: (evt) => {
        const pct = Math.round((evt.bytesRead / fileSize) * 100)
        process.stdout.write(`\r  Upload: ${pct}% (${(evt.bytesRead / 1024 / 1024).toFixed(1)} / ${fileSizeMB} MB)`)
      },
    }
  )

  const videoId = res.data.id
  console.log(`\n\n✅ UPLOAD CONCLUÍDO!`)
  console.log(`   ID      : ${videoId}`)
  console.log(`   URL     : https://www.youtube.com/watch?v=${videoId}`)
  console.log(`   Título  : ${VIDEO_METADATA.title}`)
  console.log(`   Status  : ${VIDEO_METADATA.privacyStatus}`)
  console.log(`\n   → Agora use este ID no Google Ads para criar a campanha YouTube In-Stream.`)
  console.log(`   → ID do vídeo: ${videoId}`)
  return videoId
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🎬 Tech Churras — Upload YouTube')
  console.log('='.repeat(40))
  try {
    const auth = await getAuthClient()
    await uploadVideo(auth)
  } catch (err) {
    console.error('\n❌ Erro:', err.message)
    process.exit(1)
  }
}

main()
