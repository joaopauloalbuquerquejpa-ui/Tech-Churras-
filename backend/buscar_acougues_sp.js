'use strict'
/**
 * Busca açougues em São Paulo via Google Places API e exporta CSV para disparo WhatsApp.
 *
 * PRÉ-REQUISITO: Google Maps API key com Places API habilitada
 *   1. Acesse: console.cloud.google.com
 *   2. Crie um projeto → Habilite "Places API (New)"
 *   3. Crie uma API Key → cole abaixo ou passe como: GOOGLE_API_KEY=xxx node buscar_acougues_sp.js
 *
 * Tier gratuito: 200 USD/mês (~100 buscas de detalhe)
 *
 * Saída: acougues_sp.csv (nome, endereço, telefone, bairro)
 */

const fs = require('fs')

const API_KEY = process.env.GOOGLE_API_KEY || 'COLE_SUA_CHAVE_AQUI'

if (API_KEY === 'COLE_SUA_CHAVE_AQUI') {
  console.error('❌ Configure GOOGLE_API_KEY antes de rodar.')
  console.error('   Exemplo: GOOGLE_API_KEY=AIzaSy... node buscar_acougues_sp.js')
  process.exit(1)
}

// Bairros de SP com alta densidade de comércio local
const BAIRROS = [
  'Pinheiros São Paulo',
  'Vila Madalena São Paulo',
  'Mooca São Paulo',
  'Lapa São Paulo',
  'Santana São Paulo',
  'Tatuapé São Paulo',
  'Perdizes São Paulo',
  'Ipiranga São Paulo',
  'Santo André São Paulo',
  'Osasco São Paulo',
  'Guarulhos São Paulo',
  'Itaquera São Paulo',
  'Campo Belo São Paulo',
  'Brooklin São Paulo',
  'Vila Prudente São Paulo',
]

async function searchPlaces(query, nextPageToken = null) {
  const base = 'https://maps.googleapis.com/maps/api/place/textsearch/json'
  const params = new URLSearchParams({
    query: `açougue ${query}`,
    key: API_KEY,
    language: 'pt-BR',
  })
  if (nextPageToken) params.set('pagetoken', nextPageToken)

  const res = await fetch(`${base}?${params}`)
  return res.json()
}

async function getPlaceDetails(placeId) {
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_phone_number,formatted_address,vicinity&key=${API_KEY}&language=pt-BR`
  )
  return res.json()
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function extractBairro(address) {
  if (!address) return ''
  const parts = address.split(',')
  return parts.length >= 2 ? parts[parts.length - 3]?.trim() || '' : ''
}

function formatPhone(phone) {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('55')) return digits
  if (digits.startsWith('0')) return '55' + digits.slice(1)
  return '55' + digits
}

;(async () => {
  console.log('\n🥩 Buscando açougues em SP...\n')

  const todos = new Map() // placeId → dados
  let totalBuscas = 0

  for (const bairro of BAIRROS) {
    process.stdout.write(`  ${bairro}... `)
    try {
      const result = await searchPlaces(bairro)
      const places = result.results || []
      places.forEach(p => { if (!todos.has(p.place_id)) todos.set(p.place_id, p) })
      console.log(`${places.length} encontrados (total: ${todos.size})`)
      totalBuscas++
      await sleep(200)
    } catch (e) {
      console.log(`❌ ${e.message}`)
    }
  }

  console.log(`\n📞 Buscando telefones de ${todos.size} açougues...\n`)

  const linhas = [['nome', 'telefone', 'whatsapp', 'endereco', 'bairro']]
  let comTelefone = 0

  const placeIds = [...todos.keys()]
  for (let i = 0; i < placeIds.length; i++) {
    const id = placeIds[i]
    process.stdout.write(`  [${i + 1}/${placeIds.length}] `)
    try {
      const detail = await getPlaceDetails(id)
      const place = detail.result || {}
      const telefone = place.formatted_phone_number || ''
      const nome = place.name || todos.get(id)?.name || ''
      const endereco = place.formatted_address || place.vicinity || ''
      const bairro = extractBairro(endereco)
      const whatsapp = formatPhone(telefone)

      if (telefone) {
        comTelefone++
        linhas.push([nome, telefone, whatsapp, endereco, bairro])
        console.log(`✅ ${nome} — ${telefone}`)
      } else {
        console.log(`— ${nome} (sem telefone)`)
      }

      await sleep(100)
    } catch (e) {
      console.log(`❌ ${e.message}`)
    }
  }

  const csv = linhas.map(l => l.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  fs.writeFileSync('acougues_sp.csv', csv, 'utf8')

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`✅ ${comTelefone} açougues com telefone exportados → acougues_sp.csv`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\nPróximo passo:')
  console.log('  1. Abra acougues_sp.csv')
  console.log('  2. Filtre os que têm WhatsApp (coluna "whatsapp" não vazia)')
  console.log('  3. Dispare máx 50/dia para não bloquear o número\n')

})().catch(e => { console.error('\n❌ Erro fatal:', e.message); process.exit(1) })
