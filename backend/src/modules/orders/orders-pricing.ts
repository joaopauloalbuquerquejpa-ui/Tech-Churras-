import { prisma } from '../../config/prisma'
import { sendWhatsAppToAdmin } from '../push/push.service'

// Taxa de serviço cobrada do cliente sobre o subtotal (após desconto).
// Receita 100% da plataforma — não entra no repasse de GM nem açougue.
export const SERVICE_FEE_RATE = 0.06

// Preço padrão da plataforma pra quem prepara acompanhamentos (arroz, farofa,
// vinagrete, maionese, salada, chimichurri) — por convidado. Fixo, não
// configurável por açougue/GM, pra evitar o problema que já derrubou o
// gmAccompaniments antigo (preço vindo do cliente sem backing no servidor).
export const SIDE_DISH_RATE_ACOUGUE = 18.50
export const SIDE_DISH_RATE_GRILLMASTER = 25.00

interface OrderFraudCheck {
  guestCount: number
  totalPrice: number
  eventDate: Date
  eventAddress?: string | null
  boutiqueId?: string | null
}

export async function detectSuspiciousOrder(order: OrderFraudCheck, customerId: string): Promise<void> {
  const flags: string[] = []

  const pricePerGuest = order.guestCount > 0 ? order.totalPrice / order.guestCount : 0
  if (order.totalPrice > 0 && pricePerGuest < 15) {
    flags.push(`Preço/convidado muito baixo: R$${pricePerGuest.toFixed(2)}/pessoa`)
  }

  const hoursUntilEvent = (new Date(order.eventDate).getTime() - Date.now()) / (1000 * 60 * 60)
  if (hoursUntilEvent < 6) {
    flags.push(`Evento em menos de 6h (${hoursUntilEvent.toFixed(1)}h)`)
  }

  const addressLower = (order.eventAddress ?? '').toLowerCase()
  const spKeywords = ['são paulo', 'sp', 'sao paulo', 'guarulhos', 'osasco', 'santo andré', 'campinas', 'abc', 'mauá', 'diadema', 'carapicuíba']
  if (addressLower.length > 10 && !spKeywords.some(k => addressLower.includes(k))) {
    flags.push(`Endereço fora da área SP: "${order.eventAddress?.slice(0, 60)}"`)
  }

  if (order.guestCount > 100 && !order.boutiqueId) {
    flags.push(`${order.guestCount} convidados sem açougue parceiro selecionado`)
  }

  if (flags.length >= 2) {
    const customer = await prisma.user.findUnique({ where: { id: customerId }, select: { name: true, phone: true } }).catch(() => null)
    const eventFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(order.eventDate))
    sendWhatsAppToAdmin(
      `⚠️ *Pedido suspeito — Tech Churras* (${flags.length} flags)\n\n` +
      flags.map(f => `• ${f}`).join('\n') + '\n\n' +
      `👤 ${customer?.name ?? 'Desconhecido'} | ${customer?.phone ?? 'sem tel'}\n` +
      `💰 R$ ${order.totalPrice.toFixed(2)} | ${order.guestCount} pessoas\n` +
      `📅 ${eventFmt}\n\n` +
      `👉 techchurras.com.br/admin`
    ).catch(() => {})
  }
}
