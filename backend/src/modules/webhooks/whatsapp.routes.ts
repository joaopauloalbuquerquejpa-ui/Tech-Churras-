import { FastifyInstance } from 'fastify'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '../../config/prisma'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Você é a equipe da Tech Churras respondendo WhatsApp em nome de Jota Albuquerque.

SOBRE JOTA ALBUQUERQUE:
Jota Albuquerque é churrasqueiro profissional e fundador da Tech Churras. É sócio executivo do Bahari of Brazil — 500m² dentro do Ministério de TI e Inovação da Tanzânia, parceria PPP oficial com o Governo de Zanzibar. Assinou o cardápio de cortes nobres para uma experiência única no continente africano. De Zanzibar, está lançando a Tech Churras no Brasil porque acredita que o churrasco merece estrutura profissional.

SOBRE A TECH CHURRAS:
Plataforma que transforma açougues em hubs de eventos de churrasco em São Paulo.
- QR code no balcão do açougue → cliente escaneia → escolhe cortes + churrasqueiro → paga no celular
- Açougue recebe no Pix toda semana
- Igual ao iFood, mas para açougues

OFERTA DE LANÇAMENTO (06/07/2026):
- 60 dias 100% GRÁTIS para os primeiros açougues
- Depois: R$ 369/mês + 7% de comissão só quando vender
- Cancela quando quiser, sem multa
- R$ 200 de bônus por cada açougue indicado
- Landing page: techchurras.com.br/lancamento-acougue

FLUXO DA CONVERSA:
1. Entenda se é dono de açougue ou cliente final
2. Se açougue: apresente com entusiasmo — foque nos 60 dias grátis e na dor de perder cliente para o supermercado na sexta
3. Colete naturalmente: nome, nome do açougue, bairro em SP
4. Quando demonstrar interesse real: mande o link techchurras.com.br/lancamento-acougue e ofereça conectar com o Jota
5. Se for cliente final: direcione para techchurras.com.br

RESPOSTAS PARA OBJEÇÕES COMUNS:
- "não tenho tempo": 20 minutos para cadastrar, tudo pelo celular, igual iFood
- "quanto custa?": 60 dias grátis, depois R$ 369/mês, 1 pedido já paga o mês
- "não sei mexer com tecnologia": mais simples que o iFood, tem suporte direto
- "já tenho clientes fixos": esses clientes vão gastar mais comprando kit completo em vez de só o corte
- "vou pensar": os 60 dias grátis só valem para quem entrar antes de 06/07, vagas limitadas

ESTILO:
- Respostas CURTAS — máximo 3 parágrafos pequenos
- Tom caloroso e direto, nunca robótico
- Português brasileiro natural, pode usar alguns emojis (🔥 🥩)
- NUNCA diga que é IA ou bot — você é a equipe da Tech Churras
- Nunca invente informações que não estão aqui

QUALIFICAÇÃO DE LEAD:
Coloque exatamente "LEAD_QUALIFICADO: [nome] | [açougue] | [bairro]" na PRIMEIRA LINHA da resposta (será removido antes de enviar) quando:
- A pessoa confirmou que tem açougue em SP E demonstrou interesse (pediu mais info, perguntou o preço, pediu para falar com o Jota)

FOLLOW-UP (quando a pessoa para de responder por mais de 1 mensagem):
Coloque "REENGAJAR" na primeira linha para indicar que é hora de uma mensagem mais direta sobre urgência do lançamento.`

const SUPPORT_SYSTEM = (name: string, ordersText: string) =>
  `Você é o suporte da Tech Churras, plataforma de churrascos em São Paulo. Responda em português brasileiro, tom caloroso e direto.\n\nCliente: ${name}\nPedidos recentes:\n${ordersText}\n\nResponda perguntas sobre status de pedido, data do evento, churrasqueiro, e açougue. Se não souber, diga que vai verificar com a equipe. Nunca invente informações. Máximo 3 frases por resposta.`

// ── Persistência de conversas no banco ──────────────────────────────────────

async function getConv(phone: string): Promise<{ messages: Anthropic.MessageParam[]; leadSaved: boolean }> {
  const row = await prisma.whatsappConversation.findUnique({ where: { phone } })
  if (!row) return { messages: [], leadSaved: false }
  return {
    messages: (row.messages as unknown as Anthropic.MessageParam[]) ?? [],
    leadSaved: row.leadSaved,
  }
}

async function saveConv(
  phone: string,
  type: 'boutique' | 'support',
  messages: Anthropic.MessageParam[],
  leadSaved = false,
): Promise<void> {
  const trimmed = messages.slice(type === 'support' ? -10 : -20)
  await prisma.whatsappConversation.upsert({
    where: { phone },
    update: { messages: trimmed as any, leadSaved, lastActivity: new Date() },
    create: { phone, type, messages: trimmed as any, leadSaved },
  })
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function findCustomerByPhone(phone: string) {
  const clean = phone.replace(/\D/g, '').replace(/^55/, '')
  return prisma.user.findFirst({
    where: {
      phone: { contains: clean },
      role: { in: ['CUSTOMER', 'GRILLMASTER'] },
    },
    select: {
      id: true, name: true, role: true,
      orders: {
        where: { status: { not: 'CANCELLED' } },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true, status: true, eventDate: true, guestCount: true, totalPrice: true,
          grillmaster: { include: { user: { select: { name: true } } } },
          boutique: { select: { name: true } },
        },
      },
    },
  })
}

const statusPtBR: Record<string, string> = {
  PENDING: 'Aguardando confirmação',
  CONFIRMED: 'Confirmado',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
}

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
    `🔥 *LEAD QUALIFICADO — AÇOUGUE SP*\n\n${leadInfo}\nTel: wa.me/55${phone.replace(/\D/g, '')}\n\n_Acesse o painel: techchurras.com.br/admin_`
  )
}

async function saveLead(phone: string, info: string): Promise<void> {
  const parts = info.split('|').map(s => s.trim())
  const name         = parts[0] || null
  const boutique     = parts[1] || null
  const neighborhood = parts[2] || null
  const followUpAt   = new Date(Date.now() + 48 * 60 * 60 * 1000)
  try {
    await prisma.lead.upsert({
      where: { phone },
      update: { name, boutique, neighborhood, status: 'qualified', followUpAt, followUpSent: false },
      create: { phone, name, boutique, neighborhood, status: 'qualified', source: 'whatsapp', followUpAt },
    })
  } catch (err: any) {
    console.error('[Lead] save error:', err?.message)
  }
}

async function markLeadContacted(phone: string): Promise<void> {
  try {
    await prisma.lead.upsert({
      where: { phone },
      update: { updatedAt: new Date() },
      create: { phone, status: 'new', source: 'whatsapp' },
    })
  } catch {}
}

// ── Routes ────────────────────────────────────────────────────────────────────

export async function whatsappWebhookRoutes(app: FastifyInstance) {
  app.post('/webhooks/whatsapp', {
    config: { rateLimit: { max: 120, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const { token } = request.query as { token?: string }
    if (!process.env.WEBHOOK_SECRET || token !== process.env.WEBHOOK_SECRET) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }

    const body = request.body as any

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

    const phone       = String(body.phone || '').trim()
    const userMessage = String(body.text.message || '').trim()
    if (!phone || !userMessage) return reply.send({ ok: true })

    // ── Rota de suporte: cliente cadastrado
    const customer = await findCustomerByPhone(phone).catch(() => null)
    if (customer) {
      const { messages } = await getConv(phone)
      const updated = [...messages, { role: 'user' as const, content: userMessage }]

      const ordersText = customer.orders.length > 0
        ? customer.orders.map(o => {
            const dateStr = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(o.eventDate)
            return `• Pedido ${o.id.slice(-6).toUpperCase()} — ${statusPtBR[o.status] ?? o.status} — ${dateStr} — ${o.guestCount} pessoas — GM: ${o.grillmaster?.user?.name ?? 'não definido'} — Açougue: ${o.boutique?.name ?? 'não definido'}`
          }).join('\n')
        : 'Nenhum pedido encontrado.'

      try {
        const aiResp = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          system: SUPPORT_SYSTEM(customer.name, ordersText),
          messages: updated,
        })
        const replyText = aiResp.content[0].type === 'text' ? aiResp.content[0].text.trim() : 'Oi! Pode me contar mais sobre o que você precisa? 🔥'
        await saveConv(phone, 'support', [...updated, { role: 'assistant', content: replyText }])
        await zapiSend(phone, replyText)
      } catch {
        await zapiSend(phone, 'Oi! Recebi sua mensagem. Já verifico aqui e te retorno! 🔥')
      }
      return reply.send({ ok: true })
    }

    // ── Rota de captação: lead B2B (açougue)
    markLeadContacted(phone).catch(() => {})
    prisma.lead.updateMany({
      where: { phone },
      data: { followUpAt: new Date(Date.now() + 48 * 60 * 60 * 1000), followUpSent: false },
    }).catch(() => {})

    const { messages, leadSaved } = await getConv(phone)
    const updated = [...messages, { role: 'user' as const, content: userMessage }]

    try {
      const aiResp = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: updated,
      })

      const rawText = aiResp.content[0].type === 'text' ? aiResp.content[0].text.trim() : ''
      let replyText = rawText
      let newLeadSaved = leadSaved

      if (rawText.startsWith('LEAD_QUALIFICADO:')) {
        const [leadLine, ...rest] = rawText.split('\n')
        replyText = rest.join('\n').trim()
        if (!leadSaved) {
          newLeadSaved = true
          const leadInfo = leadLine.replace('LEAD_QUALIFICADO:', '').trim()
          saveLead(phone, leadInfo).catch(() => {})
          notifyAdmin(leadInfo, phone).catch(() => {})
        }
      }

      await saveConv(phone, 'boutique', [...updated, { role: 'assistant', content: replyText }], newLeadSaved)
      await zapiSend(phone, replyText)
    } catch (err: any) {
      console.error('[WhatsApp AI] error:', err?.message)
      await zapiSend(phone, 'Oi! Recebi sua mensagem. Vou verificar aqui e já te retorno! 🔥')
    }

    return reply.send({ ok: true })
  })

  app.get('/webhooks/leads', async (request, reply) => {
    const { token } = request.query as { token?: string }
    if (token !== process.env.WEBHOOK_SECRET) return reply.status(401).send({ error: 'Unauthorized' })
    const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, take: 100 })
    return reply.send(leads)
  })
}

// ── Follow-up automático 48h — chamado pelo cron ─────────────────────────────
export async function sendFollowUps(): Promise<void> {
  const due = await prisma.lead.findMany({
    where: {
      status: { in: ['new', 'qualified'] },
      followUpAt: { lte: new Date() },
      followUpSent: false,
    },
  })

  for (const lead of due) {
    const msg = lead.status === 'qualified'
      ? `Oi${lead.name ? ` ${lead.name.split(' ')[0]}` : ''}! 👋\n\nPassando pra lembrar que o lançamento da Tech Churras é no dia *06/07* e as vagas de açougue fundador estão acabando.\n\nQuem entrar antes do lançamento garante *60 dias grátis* + suporte prioritário. Depois disso a condição muda.\n\nAinda faz sentido pra você? techchurras.com.br/lancamento-acougue`
      : `Oi! Vi que você entrou em contato com a Tech Churras. 🔥\n\nEstamos lançando em *13 dias* em São Paulo — QR code no balcão do açougue para vender carne + churrasqueiro pelo celular.\n\nSe tiver interesse em ser parceiro, me conta em qual bairro fica seu açougue? 🥩`

    await zapiSend(lead.phone, msg)
    await prisma.lead.update({
      where: { id: lead.id },
      data: { followUpSent: true, followUpAt: new Date(Date.now() + 72 * 60 * 60 * 1000) },
    })
  }

  if (due.length > 0) console.log(`[Follow-up] ${due.length} mensagens enviadas`)
}
