'use strict'
const https = require('https')
const fs = require('fs')

const KEY = process.env.ANTHROPIC_API_KEY
if (!KEY) { console.error('KEY nao encontrada'); process.exit(1) }

const body = JSON.stringify({
  model: 'claude-sonnet-4-6',
  max_tokens: 2500,
  system: 'Voce e o Grillmaster Inteligente. Responda SOMENTE com JSON puro, sem markdown. MAXIMO 8 itens, respostas curtas. Schema: {"intro":"max 25 palavras","totalKg":0,"estimatedCost":0,"items":[{"category":"CARNE|ACOMPANHAMENTO|SAL_TEMPERO|CARVAO|BEBIDA|OUTRO","name":"string","quantity":0,"unit":"kg|un|g|L","reason":"max 6 palavras","estimatedPrice":0,"priority":"essencial|recomendado|opcional"}],"tips":["max 10 palavras cada"],"pairing":"string","schedule":"max 20 palavras"}',
  messages: [{ role: 'user', content: 'Churrasco tradicional: 5 homens, 3 mulheres, 0 criancas, 4 horas. Maximo 8 itens.' }]
})

const opts = {
  hostname: 'api.anthropic.com', path: '/v1/messages', method: 'POST',
  headers: {
    'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body),
    'x-api-key': KEY, 'anthropic-version': '2023-06-01',
  },
}

console.log('Chamando claude-sonnet-4-6...')
const t0 = Date.now()

const req = https.request(opts, (res) => {
  let data = ''
  res.on('data', c => { data += c })
  res.on('end', () => {
    const elapsed = Date.now() - t0
    fs.writeFileSync('./ai_response.json', data, 'utf8')
    console.log('HTTP', res.statusCode, '| tempo:', elapsed + 'ms | bytes:', data.length)

    if (res.statusCode !== 200) { console.error('ERRO HTTP:', data.slice(0,200)); return }

    let msg
    try { msg = JSON.parse(data) } catch(e) { console.error('parse msg erro'); return }

    const raw = msg?.content?.[0]?.text || ''
    console.log('raw length:', raw.length, 'chars')
    console.log('raw[0:80]: ', raw.slice(0,80))
    console.log('raw[-80:]: ', raw.slice(-80))

    // extrai JSON — aceita com ou sem fences
    const cleaned = raw.replace(/^```json\s*/,'').replace(/\s*```$/,'').trim()
    let plan
    try { plan = JSON.parse(cleaned) } catch(e) {
      // tenta extrair só o objeto
      const m = raw.match(/(\{[\s\S]*\})/)
      try { plan = m ? JSON.parse(m[1]) : null } catch(e2) { plan = null }
    }

    if (!plan) { console.error('JSON parse falhou. raw salvo em ai_response.json'); return }

    console.log('')
    console.log('══════════════════════════════════════════════')
    console.log('✅ ASSISTENTE DE IA — PRODUCAO OK')
    console.log('══════════════════════════════════════════════')
    console.log('Modelo:   ', msg.model)
    console.log('Tokens:   ', msg.usage.input_tokens + ' in / ' + msg.usage.output_tokens + ' out')
    console.log('Tempo:    ', elapsed + 'ms')
    console.log('')
    console.log('intro:    ', plan.intro)
    console.log('totalKg:  ', plan.totalKg)
    console.log('custo:    ', 'R$' + (plan.estimatedCost||0))
    console.log('itens:    ', (plan.items||[]).length, 'items')
    ;(plan.items||[]).forEach(i => console.log('  -', i.priority, '|', i.name, i.quantity+i.unit, '~R$'+i.estimatedPrice))
    console.log('pairing:  ', plan.pairing)
    console.log('tip[0]:   ', (plan.tips||[])[0])
    console.log('')
    console.log('RESULTADO: APROVADO')
  })
})
req.on('error', e => console.error('ERRO:', e.message))
req.write(body)
req.end()
