import { prisma } from '../../config/prisma'
import { geocodeAddress, haversineKm } from '../../utils/geo'
import { fetchWithTimeout } from '../../utils/http'
import { sendPushToUser, sendWhatsAppToAdmin } from '../push/push.service'
import type { Order } from '@prisma/client'

// Janela de espera de cada onda antes de escalar pra próxima.
// Eventos de churrasco são agendados com dias/semanas de antecedência —
// diferente de um Uber, não tem pressa de segundos, mas também não faz
// sentido deixar o cliente sem resposta por muito tempo.
const WAVE_TIMEOUT_HOURS: Record<number, number> = {
  1: 2,  // GM escolhido pelo cliente/IA — janela curta, é a primeira tentativa
  2: 6,  // amplia pra região inteira, filtrado por estilo/especialidade
  3: 12, // amplia pra região inteira, sem filtro de estilo
}
const MAX_WAVE = 3

// Heurística geográfica simples pra aproximar a "região de SP" de uma
// coordenada, relativa ao centro (Praça da Sé). Não é preciso por bairro,
// mas é o suficiente pra respeitar a região que o GM escolheu atender sem
// precisar de uma tabela de bairro→zona (que não existe hoje). Serve como
// filtro leve por cima do raio geográfico, que continua sendo a checagem
// principal de "está perto o suficiente".
const SP_CENTER = { lat: -23.5505, lng: -46.6333 }
function estimateSPRegion(lat: number, lng: number): string {
  const dLat = lat - SP_CENTER.lat // > 0 = norte, < 0 = sul
  const dLng = lng - SP_CENTER.lng // > 0 = leste, < 0 = oeste
  if (Math.abs(dLat) < 0.02 && Math.abs(dLng) < 0.02) return 'Centro'
  if (Math.abs(dLat) >= Math.abs(dLng)) return dLat > 0 ? 'Zona Norte' : 'Zona Sul'
  return dLng > 0 ? 'Zona Leste' : 'Zona Oeste'
}

async function sendWhatsAppMessage(phone: string, message: string, label: string) {
  const instance = process.env.ZAPI_INSTANCE
  const token = process.env.ZAPI_TOKEN
  if (!instance || !token) return
  const cleanPhone = phone.replace(/\D/g, '')
  try {
    const res = await fetchWithTimeout(
      `https://api.z-api.io/instances/${instance}/token/${token}/send-text`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: cleanPhone, message }) }
    )
    if (!res.ok) console.log(`[Dispatch WhatsApp] ${label} erro:`, res.status)
  } catch (err) {
    console.log(`[Dispatch WhatsApp] ${label} falha:`, err)
  }
}

// Busca Grillmasters elegíveis pra um pedido: aprovados, disponíveis, dentro
// do raio geográfico do endereço do evento, livres naquela data (sem bloqueio
// na agenda e sem outro pedido confirmado no mesmo dia), excluindo quem já
// foi chamado nesse pedido. Raio progressivo, mesmo padrão do /ai/kit-perfeito.
async function getEligibleGrillmasters(order: Order, opts: { excludeIds: string[]; styleFilter: boolean }) {
  const coords = await geocodeAddress(order.eventAddress)
  const dayStart = new Date(order.eventDate); dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(order.eventDate); dayEnd.setHours(23, 59, 59, 999)

  const [blockedIds, busyIds] = await Promise.all([
    prisma.grillmasterSchedule.findMany({
      where: { date: { gte: dayStart, lte: dayEnd }, available: false },
      select: { grillmasterId: true },
    }).then(rows => new Set(rows.map(r => r.grillmasterId))),
    prisma.order.findMany({
      where: { eventDate: { gte: dayStart, lte: dayEnd }, status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] }, grillmasterId: { not: null } },
      select: { grillmasterId: true },
    }).then(rows => new Set(rows.map(r => r.grillmasterId))),
  ])

  const all = await prisma.grillmaster.findMany({
    where: { approved: true, available: true, id: { notIn: opts.excludeIds } },
    include: { user: { select: { id: true, name: true, phone: true } } },
  })

  // unlimitedAvailability (equipe, não pessoa única) pula o check de agenda —
  // mesma regra já usada na criação do pedido.
  let candidates = all.filter(g => {
    if (blockedIds.has(g.id) && !g.unlimitedAvailability) return false
    if (busyIds.has(g.id) && !g.unlimitedAvailability) return false
    return true
  })

  // Geográfico: raio progressivo se conseguiu geocodificar; senão cai pra city/state.
  if (coords) {
    for (const radiusKm of [15, 40, 100]) {
      const inRadius = candidates.filter(g => g.latitude != null && g.longitude != null && haversineKm(coords.lat, coords.lng, g.latitude, g.longitude) <= radiusKm)
      if (inRadius.length > 0) { candidates = inRadius; break }
    }

    // Filtro leve por região declarada — só exclui quem marcou regiões
    // específicas e a região estimada do evento não está entre elas. Quem
    // ainda não configurou serviceRegions (maioria hoje) não é afetado.
    const eventRegion = estimateSPRegion(coords.lat, coords.lng)
    const byRegion = candidates.filter(g => g.serviceRegions.length === 0 || g.serviceRegions.includes(eventRegion))
    if (byRegion.length > 0) candidates = byRegion
  }

  if (opts.styleFilter && order.grillmasterId) {
    const original = await prisma.grillmaster.findUnique({ where: { id: order.grillmasterId } })
    const style = (original?.churrascoStyle || original?.specialties || '').toLowerCase().trim()
    if (style) {
      const filtered = candidates.filter(g => {
        const gStyle = `${g.churrascoStyle ?? ''} ${g.specialties ?? ''}`.toLowerCase()
        return gStyle.includes(style) || style.includes(gStyle)
      })
      if (filtered.length > 0) candidates = filtered
    }
  }

  return candidates
}

async function notifyGrillmasterOfDispatch(gm: { id: string; user: { id: string; name: string; phone: string | null } }, order: Order) {
  const date = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(order.eventDate)
  sendPushToUser(gm.user.id, '🔥 Pedido disponível na sua região!', `Evento em ${date} — ${order.guestCount} convidados. Aceite antes que outro churrasqueiro pegue.`, '/grillmasters/dashboard').catch(e => console.error('[dispatch]', e?.message))
  if (gm.user.phone) {
    const firstName = gm.user.name.split(' ')[0]
    const msg = `🔥 *Pedido disponível — Tech Churras!*\n\nOlá ${firstName}! Tem um pedido de churrasco disponível na sua região.\n\n📅 Data: ${date}\n👥 ${order.guestCount} convidados\n📍 ${order.eventAddress}\n\nQuem aceitar primeiro fica com o evento:\nhttps://www.techchurras.com.br/grillmasters/dashboard`
    sendWhatsAppMessage(gm.user.phone, msg, 'dispatch-wave').catch(e => console.error('[dispatch]', e?.message))
  }
}

// Chamado logo após a criação do pedido. Onda 1: se já veio um GM escolhido
// (cliente ou IA), notifica só ele e espera aceite. Se não veio nenhum,
// já começa direto num despacho amplo pra região (sem filtro de estilo,
// não tem "escolha original" pra comparar).
export async function startDispatch(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) return

  if (order.grillmasterId) {
    const gm = await prisma.grillmaster.findUnique({ where: { id: order.grillmasterId }, include: { user: { select: { id: true, name: true, phone: true } } } })
    if (!gm) return
    await prisma.$transaction([
      prisma.orderDispatch.create({ data: { orderId, grillmasterId: gm.id, wave: 1 } }),
      prisma.order.update({ where: { id: orderId }, data: { dispatchWave: 1, dispatchDeadline: new Date(Date.now() + WAVE_TIMEOUT_HOURS[1] * 60 * 60 * 1000) } }),
    ])
    // Notificação de "novo pedido" pro GM já é disparada em orders.service.ts —
    // não duplica aqui, só registra o dispatch e o prazo.
    return
  }

  const eligible = await getEligibleGrillmasters(order, { excludeIds: [], styleFilter: false })
  if (eligible.length === 0) return
  await prisma.$transaction([
    prisma.orderDispatch.createMany({ data: eligible.map(g => ({ orderId, grillmasterId: g.id, wave: 1 })) }),
    prisma.order.update({ where: { id: orderId }, data: { dispatchWave: 1, dispatchDeadline: new Date(Date.now() + WAVE_TIMEOUT_HOURS[1] * 60 * 60 * 1000) } }),
  ])
  await Promise.all(eligible.map(g => notifyGrillmasterOfDispatch(g, order)))
}

// Primeiro que aceitar leva — update condicional atômico, sem lock explícito:
// só grava se ninguém aceitou ainda. Evita dois GMs "ganharem" o mesmo pedido
// em corrida, sem precisar de transação Serializable (mais pesada, desnecessária
// aqui porque é uma escrita condicional simples, não uma leitura-antes-escrita).
export async function acceptDispatch(userId: string, orderId: string) {
  const gm = await prisma.grillmaster.findUnique({ where: { userId } })
  if (!gm) throw new Error('Grillmaster não encontrado')

  const dispatch = await prisma.orderDispatch.findFirst({ where: { orderId, grillmasterId: gm.id, response: null } })
  if (!dispatch) throw new Error('Você não foi convidado para este pedido, ou ele já foi resolvido')

  const claim = await prisma.order.updateMany({
    where: { id: orderId, grillmasterAcceptedAt: null },
    data: { grillmasterId: gm.id, grillmasterAcceptedAt: new Date(), dispatchDeadline: null },
  })

  if (claim.count === 0) {
    await prisma.orderDispatch.update({ where: { id: dispatch.id }, data: { response: 'EXPIRED', respondedAt: new Date() } })
    throw new Error('Esse pedido já foi confirmado por outro churrasqueiro')
  }

  await prisma.$transaction([
    prisma.orderDispatch.update({ where: { id: dispatch.id }, data: { response: 'ACCEPTED', respondedAt: new Date() } }),
    prisma.orderDispatch.updateMany({ where: { orderId, response: null }, data: { response: 'EXPIRED', respondedAt: new Date() } }),
  ])

  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (order) {
    const date = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(order.eventDate)
    sendPushToUser(order.customerId, '✅ Churrasqueiro confirmado!', `Seu evento de ${date} já tem churrasqueiro confirmado.`, `/orders/${order.id}`).catch(e => console.error('[dispatch]', e?.message))
  }
  return order
}

export async function declineDispatch(userId: string, orderId: string) {
  const gm = await prisma.grillmaster.findUnique({ where: { userId } })
  if (!gm) throw new Error('Grillmaster não encontrado')

  const dispatch = await prisma.orderDispatch.findFirst({ where: { orderId, grillmasterId: gm.id, response: null } })
  if (!dispatch) throw new Error('Você não foi convidado para este pedido, ou ele já foi resolvido')

  await prisma.orderDispatch.update({ where: { id: dispatch.id }, data: { response: 'DECLINED', respondedAt: new Date() } })

  // Se ninguém mais está pendente nessa onda, escala na hora em vez de esperar o timeout.
  const stillPending = await prisma.orderDispatch.count({ where: { orderId, response: null } })
  if (stillPending === 0) {
    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (order && !order.grillmasterAcceptedAt) await escalateOrder(order)
  }
}

async function escalateOrder(order: Order) {
  if (order.grillmasterAcceptedAt) return
  const nextWave = order.dispatchWave + 1

  if (nextWave > MAX_WAVE) {
    await prisma.order.update({ where: { id: order.id }, data: { dispatchDeadline: null } })
    const date = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(order.eventDate)
    sendWhatsAppToAdmin(`⚠️ *Pedido sem churrasqueiro!*\n\nPedido #${order.id.slice(0, 8)} (${date}, ${order.guestCount} convidados) esgotou todas as ondas de despacho sem ninguém aceitar. Precisa de intervenção manual.\n\nhttps://www.techchurras.com.br/admin`).catch(e => console.error('[dispatch]', e?.message))
    return
  }

  const alreadyDispatched = await prisma.orderDispatch.findMany({ where: { orderId: order.id }, select: { grillmasterId: true } })
  const excludeIds = alreadyDispatched.map(d => d.grillmasterId)
  const eligible = await getEligibleGrillmasters(order, { excludeIds, styleFilter: nextWave === 2 })

  if (eligible.length === 0) {
    // Nada elegível ainda nessa onda — tenta de novo na próxima passada do cron
    // avançando a onda mesmo assim, pra não travar em loop na mesma onda vazia.
    await prisma.order.update({ where: { id: order.id }, data: { dispatchWave: nextWave, dispatchDeadline: new Date(Date.now() + (WAVE_TIMEOUT_HOURS[nextWave] ?? 6) * 60 * 60 * 1000) } })
    return
  }

  await prisma.$transaction([
    prisma.orderDispatch.createMany({ data: eligible.map(g => ({ orderId: order.id, grillmasterId: g.id, wave: nextWave })) }),
    prisma.order.update({ where: { id: order.id }, data: { dispatchWave: nextWave, dispatchDeadline: new Date(Date.now() + WAVE_TIMEOUT_HOURS[nextWave] * 60 * 60 * 1000) } }),
  ])
  await Promise.all(eligible.map(g => notifyGrillmasterOfDispatch(g, order)))
}

// Chamado pelo cron a cada poucos minutos.
export async function processDispatchEscalations() {
  const due = await prisma.order.findMany({
    where: { grillmasterAcceptedAt: null, dispatchDeadline: { lte: new Date() }, status: { not: 'CANCELLED' } },
    take: 50,
  })
  for (const order of due) {
    await escalateOrder(order).catch(e => console.error('[dispatch] escalate falhou', order.id, e?.message))
  }
  return { processed: due.length }
}

export async function listPendingDispatchesForGrillmaster(userId: string) {
  const gm = await prisma.grillmaster.findUnique({ where: { userId } })
  if (!gm) return []
  const dispatches = await prisma.orderDispatch.findMany({
    where: { grillmasterId: gm.id, response: null },
    include: {
      order: {
        include: {
          items: { include: { product: true } },
          boutique: { select: { name: true, city: true } },
        },
      },
    },
    orderBy: { notifiedAt: 'desc' },
  })
  return dispatches
    .filter(d => !d.order.grillmasterAcceptedAt)
    .map(d => ({ dispatchId: d.id, wave: d.wave, notifiedAt: d.notifiedAt, order: d.order }))
}
