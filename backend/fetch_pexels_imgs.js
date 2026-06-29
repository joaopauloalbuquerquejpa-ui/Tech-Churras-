const https = require('https')
const PEXELS_KEY = 'IjKC0G0k7HcV4HEtI9dhpnzTnqKDp0lwFpqZioPQTjQgEO1NG2dXh8dw'

function fetchPexels(query, page = 1) {
  return new Promise((resolve) => {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&page=${page}`
    const req = https.get(url, { headers: { Authorization: PEXELS_KEY } }, (res) => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try {
          const r = JSON.parse(data)
          const photos = r.photos || []
          // return medium url of first unique photo
          resolve(photos.map(p => p.src.medium))
        } catch { resolve([]) }
      })
    })
    req.on('error', () => resolve([]))
  })
}

async function getImg(query, idx = 0, page = 1) {
  const urls = await fetchPexels(query, page)
  await new Promise(r => setTimeout(r, 300))
  return urls[idx] || urls[0] || null
}

async function main() {
  const imgs = {
    picanha:      await getImg('picanha grilled steak beef', 0),
    fraldinha:    await getImg('flank steak raw meat', 1),
    costela:      await getImg('beef ribs raw rack', 0),
    maminha:      await getImg('sirloin beef steak raw fresh', 2),
    alcatra:      await getImg('rump steak raw beef cut', 0),
    contrafile:   await getImg('new york strip steak raw', 1),
    linguica:     await getImg('sausage raw pork grill', 0),
    coracao_frango: await getImg('chicken heart raw skewer', 0),
    carvao:       await getImg('charcoal coal grill fire', 0),
    pao_alho:     await getImg('garlic bread toasted butter', 0),
    farofa:       await getImg('cassava flour dish food bowl', 0),
    vinagrete:    await getImg('tomato onion fresh salsa vinaigrette', 0),
    queijo_coalho: await getImg('grilled halloumi cheese', 0),
    fachada1:     await getImg('butcher shop meat store facade storefront', 0),
    fachada2:     await getImg('meat market deli shop', 1),
    fachada3:     await getImg('butchery shop exterior', 2),
    kit_churrasco: await getImg('bbq barbecue meat selection grill', 0),
  }

  console.log('=== IMAGENS REAIS DO PEXELS ===')
  for (const [k, v] of Object.entries(imgs)) {
    console.log(`${k.padEnd(20)}: ${v}`)
  }
  console.log('\nJSON:')
  console.log(JSON.stringify(imgs, null, 2))
}

main()
