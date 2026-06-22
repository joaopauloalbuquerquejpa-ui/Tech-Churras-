import { FastifyInstance } from 'fastify'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface Conversation {
  messages: Anthropic.MessageParam[]
  lastActivity: number
  notifiedAdmin: boolean
}

// Conversa em memória por número de telefone — TTL 24h
const conversations = new Map<string, Conversation>()

setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000
  for (const [phone, conv] of conversations) {
    if (conv.lastActivity < cutoff) conversations.delete(phone)
  }
}, 60 * 60 * 1000)

const SYSTEM_PROMPT = `Você é a assistente da Tech Churras, respondendo WhatsApp em nome de Jota Albuquerque.

SOBRE JOTA ALBUQUERQUE (o fundador):
Jota Albuquerque é churrasqueiro profissional e fundador da Tech Churras. Atualmente está em Zanzibar, na Tanzânia (África), onde é sócio e BBQ Master do Bahari of Brazil — um hub culinário criado em parceria oficial com o Governo de Zanzibar (Ministério de Comunicação, Tecnologia e Inovação). De lá, está lançando a Tech Churras no Brasil. Essa história de um brasileiro em Zanzibar lançando uma plataforma de churrasco no Brasil é um diferencial real e pode ser mencionada quando o lead perguntar sobre quem está por trás da Tech Churras ou quando precisar de credibilidade.

SOBRE A TECH CHURRAS:
Plataforma que conecta churrasqueiros certificados e açougues premium em São Paulo. Clientes contratam tudo pelo app — churrasqueiro + carnes — e acompanham ao vivo no mapa.

SEU FOCO AGORA:
Converter donos de açougue em São Paulo em Parceiros Fundadores.

MODELO DE PARCERIA AÇOUGUE:
- Mensalidade: R$ 369/mês
- Comissão: apenas 7% por pedido concluído
- O açougue ganha QR code personalizado para o balcão
- Cliente escaneia → monta kit → escolhe cortes do açougue → paga no app
- Repasse semanal via PIX, sem delivery próprio necessário
- Programa Parceiro Fundador: começa dia 06/07/2026, dura apenas 1 mês (até 06/08/2026)
- Apenas 1 Parceiro Fundador por região — vagas extremamente limitadas
- Parceiros Fundadores têm condição especial exclusiva — detalhes só com o Jota pessoalmente

FLUXO DA CONVERSA:
1. Entenda o que a pessoa quer (cliente ou açougue?)
2. Se açougue ou interessado em parceria: apresente com entusiasmo e clareza
3. Colete naturalmente: nome, nome do açougue e bairro em SP
4. Quando demonstrar interesse real: ofereça conectar com o Jota Albuquerque pessoalmente para fechar
5. Se for cliente final buscando churrasqueiro: direcione para techchurras.com.br

ESTILO:
- Respostas curtas e diretas — máximo 3 parágrafos
- Tom caloroso e humano, nunca robótico
- Português brasileiro natural
- Nunca diga que é IA ou assistente virtual — você é a equipe da Tech Churras
- Use emojis com moderação: 🔥 🥩 funcionam bem

QUANDO QUALIFICAR COMO LEAD:
Coloque "LEAD_QUALIFICADO: [nome] | [açougue] | [bairro/SP]" na PRIMEIRA LINHA da resposta (será removido antes de enviar) quando:
- A pessoa confirmou que tem açougue em SP E demonstrou interesse real
- Pediu para falar com o Jota Albuquerque ou perguntou como fechar parceria

Após essa linha, escreva a resposta normal ao cliente.`

async function zapiSend(phone: string, message: string): Promise<void> {
  const instance = process.env.ZAPI_INSTANCE
  const token = process.env.ZAPI_TOKEN
  if (!instance || !token) return
  try {
    const res = await fetch(
      `https://api.z-api.io/instances/${instance}/token/${token}/send-text`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.replace(/\D/g, ''), message }),
      }
    )
    if (!res.ok) console.error('[WhatsApp] Z-API error:', res.status)
  } catch (err: any) {
    console.error('[WhatsApp] send failed:', err?.message)
  }
}

async function notifyAdmin(leadInfo: string, phone: string): Promise<void> {
  const adminPhone = process.env.ADMIN_WHATSAPP_PHONE
  if (!adminPhone) return
  await zapiSend(
    adminPhone,
    `🔥 *LEAD — AÇOUGUE SP*\n\n${leadInfo}\nTel: wa.me/${phone.replace(/\D/g, '')}\n\n_Responsa para fechar parceria Fundador!_`
  )
}

export async function whatsappWebhookRoutes(app: FastifyInstance) {
  app.post('/webhooks/whatsapp', {
    config: { rateLimit: { max: 120, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    // Validação do token secreto passado pela Z-API
    const { token } = request.query as { token?: string }
    if (!process.env.WEBHOOK_SECRET || token !== process.env.WEBHOOK_SECRET) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }

    const body = request.body as any

    // Ignorar mensagens enviadas por nós, grupos, status e não-texto
    if (
      body.fromMe === true ||
      body.isGroup === true ||
      body.isStatusReply === true ||
      body.broadcast === true ||
      body.type !== 'ReceivedCallback' ||
      !body.text?.message
    ) {
      return reply.send({ ok: true })
    }

    const phone = String(body.phone || '').trim()
    const userMessage = String(body.text.message || '').trim()
    if (!phone || !userMessage) return reply.send({ ok: true })

    // Obter ou criar conversa
    const now = Date.now()
    if (!conversations.has(phone)) {
      conversations.set(phone, { messages: [], lastActivity: now, notifiedAdmin: false })
    }
    const conv = conversations.get(phone)!
    conv.lastActivity = now
    conv.messages.push({ role: 'user', content: userMessage })

    // Janela de contexto: últimas 20 mensagens (~10 trocas)
    if (conv.messages.length > 20) conv.messages = conv.messages.slice(-20)

    try {
      const aiResp = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: conv.messages,
      })

      const rawText = aiResp.content[0].type === 'text' ? aiResp.content[0].text.trim() : ''

      let replyText = rawText
      if (rawText.startsWith('LEAD_QUALIFICADO:')) {
        const [leadLine, ...rest] = rawText.split('\n')
        replyText = rest.join('\n').trim()
        if (!conv.notifiedAdmin) {
          conv.notifiedAdmin = true
          const leadInfo = leadLine.replace('LEAD_QUALIFICADO:', '').trim()
          notifyAdmin(leadInfo, phone).catch(() => {})
        }
      }

      conv.messages.push({ role: 'assistant', content: replyText })
      await zapiSend(phone, replyText)
    } catch (err: any) {
      console.error('[WhatsApp AI] error:', err?.message)
      // Fallback humano para não deixar cliente sem resposta
      await zapiSend(phone, 'Oi! Recebi sua mensagem. Vou verificar aqui e já te retorno! 🔥')
    }

    return reply.send({ ok: true })
  })
}
