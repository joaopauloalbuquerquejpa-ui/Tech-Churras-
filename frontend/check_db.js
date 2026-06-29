const https = require('https')

const API = 'https://tech-churras-production.up.railway.app'

function apiReq(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const u = new URL(API + path)
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = 'Bearer ' + token
    if (data) headers['Content-Length'] = Buffer.byteLength(data)
    const req = https.request({ hostname: u.hostname, path: u.pathname, method, headers }, res => {
      let raw = ''
      res.on('data', d => raw += d)
      res.on('end', () => { try { resolve(JSON.parse(raw)) } catch { resolve(raw) } })
    })
    req.on('error', reject)
    if (data) req.write(data)
    req.end()
  })
}

;(async () => {
  const admin = await apiReq('POST', '/auth/login', {
    email: 'joaopauloalbuquerque.jpa@gmail.com',
    password: 'JotaAdmin@TechChurras2025!',
  })
  const tok = admin.token
  console.log('Admin logado\n')

  // Açougues
  const boutiques = await apiReq('GET', '/boutiques', null, tok)
  console.log(`=== AÇOUGUES (${boutiques.length}) ===`)
  boutiques.forEach(b => {
    console.log(`  ID: ${b.id}`)
    console.log(`  Nome: ${b.name} | ${b.city}/${b.state} | aprovado:${b.approved}`)
    console.log(`  Email: ${b.user?.email}`)
    console.log()
  })

  // GMs — tenta endpoints possíveis
  for (const path of ['/grillmasters', '/admin/grillmasters', '/grillmasters?limit=100']) {
    const res = await apiReq('GET', path, null, tok)
    if (Array.isArray(res)) {
      console.log(`\n=== GRILLMASTERS via ${path} (${res.length}) ===`)
      res.forEach(g => {
        console.log(`  ID: ${g.id}`)
        console.log(`  Nome: ${g.user?.name ?? g.name} | ${g.city ?? ''}/${g.state ?? ''} | aprovado:${g.approved}`)
        console.log(`  Email: ${g.user?.email}`)
        console.log()
      })
      break
    } else {
      console.log(`${path} →`, JSON.stringify(res).slice(0, 80))
    }
  }

  // Usuários
  const users = await apiReq('GET', '/admin/users', null, tok)
  if (Array.isArray(users)) {
    console.log(`\n=== USUÁRIOS (${users.length}) ===`)
    users.forEach(u => console.log(`  [${u.role}] ${u.name} | ${u.email} | id:${u.id}`))
  } else {
    console.log('\n/admin/users:', JSON.stringify(users).slice(0, 120))
  }
})()
