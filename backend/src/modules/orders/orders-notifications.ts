import { sendWhatsApp } from '../push/push.service'

export async function sendWhatsAppConfirmation(
  phone: string,
  customerName: string,
  orderId: string,
  grillmasterName: string,
  eventDate: Date
) {
  const date = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(eventDate)
  const message = `🔥 Seu churrasco está confirmado! Olá ${customerName}, seu pedido #${orderId.slice(0, 8)} com ${grillmasterName} foi confirmado para ${date}. Acompanhe em: https://www.techchurras.com.br/orders/${orderId}`
  await sendWhatsApp(phone, message, 'confirmacao')
}
